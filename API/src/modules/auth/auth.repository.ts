import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Database } from '../../infrastructure/database/database.js';

export interface Account {
  id: string;
  email: string;
  password_hash: string;
  verified_at: Date | null;
}
@Injectable()
export class AuthRepository {
  constructor(@Inject(Database) private readonly db: Database) {}
  async register(email: string, name: string, passwordHash: string): Promise<Account | undefined> {
    return (
      await this.db.query<Account>(
        'INSERT INTO users(id,email,name,password_hash) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING RETURNING id,email,password_hash,verified_at',
        [randomUUID(), email, name, passwordHash],
      )
    )[0];
  }
  async byEmail(email: string): Promise<Account | undefined> {
    return (
      await this.db.query<Account>(
        'SELECT id,email,password_hash,verified_at FROM users WHERE email=$1',
        [email],
      )
    )[0];
  }
  async verification(userId: string, hash: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.db.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [userId], tx);
      await this.db.query('DELETE FROM email_verifications WHERE user_id=$1', [userId], tx);
      await this.db.query(
        "INSERT INTO email_verifications(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 minutes')",
        [hash, userId],
        tx,
      );
    });
  }
  async verify(hash: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const [candidate] = await this.db.query<{ user_id: string }>(
        'SELECT user_id FROM email_verifications WHERE token_hash=$1',
        [hash],
        tx,
      );
      if (!candidate) return false;
      await this.db.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [candidate.user_id], tx);
      const [token] = await this.db.query<{ user_id: string }>(
        'DELETE FROM email_verifications WHERE token_hash=$1 AND expires_at>now() RETURNING user_id',
        [hash],
        tx,
      );
      if (!token) return false;
      await this.db.query(
        'UPDATE users SET verified_at=COALESCE(verified_at,now()) WHERE id=$1',
        [token.user_id],
        tx,
      );
      return true;
    });
  }
  async session(userId: string, hash: string, expires: Date): Promise<void> {
    await this.db.query('DELETE FROM sessions WHERE expires_at<=now() AND user_id=$1', [userId]);
    await this.db.query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)', [
      hash,
      userId,
      expires,
    ]);
  }
  async authenticate(hash: string): Promise<{ id: string } | undefined> {
    return (
      await this.db.query<{ id: string }>(
        'SELECT u.id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.verified_at IS NOT NULL',
        [hash],
      )
    )[0];
  }
  async logout(hash: string): Promise<void> {
    await this.db.query('DELETE FROM sessions WHERE token_hash=$1', [hash]);
  }
}
