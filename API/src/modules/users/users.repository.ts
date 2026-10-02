import { Inject, Injectable } from '@nestjs/common';
import { Database } from '../../infrastructure/database/database.js';
import type { PageQuery } from '../../common/dto/page.dto.js';
import type { MeDto, ProfileDto, UpdateProfileDto } from './users.dto.js';

const profile = `u.id,u.name,u.bio,u.created_at AS "createdAt",(SELECT count(*)::int FROM user_follows f WHERE f.followed_id=u.id) AS followers,(SELECT count(*)::int FROM user_follows f WHERE f.follower_id=u.id) AS following,(SELECT count(*)::int FROM roadmaps r WHERE r.owner_id=u.id AND r.visibility='public') AS "publicRoadmaps"`;
@Injectable()
export class UsersRepository {
  constructor(@Inject(Database) private readonly db: Database) {}
  async me(id: string) {
    return (
      await this.db.query<MeDto>(
        'SELECT id,name,email,bio,verified_at AS "verifiedAt",onboarding_completed_at AS "onboardingCompletedAt" FROM users WHERE id=$1',
        [id],
      )
    )[0];
  }
  async update(id: string, dto: UpdateProfileDto) {
    await this.db.query(
      'UPDATE users SET name=COALESCE($2,name),bio=COALESCE($3,bio) WHERE id=$1',
      [id, dto.name?.trim(), dto.bio],
    );
    return this.me(id);
  }
  async complete(id: string) {
    await this.db.query(
      'UPDATE users SET onboarding_completed_at=COALESCE(onboarding_completed_at,now()) WHERE id=$1',
      [id],
    );
    return this.me(id);
  }
  async profile(id: string) {
    return (
      await this.db.query<ProfileDto>(
        `SELECT ${profile} FROM users u WHERE u.id=$1 AND u.verified_at IS NOT NULL`,
        [id],
      )
    )[0];
  }
  async people(q: PageQuery) {
    const items = await this.db.query<ProfileDto>(
      `SELECT ${profile} FROM users u WHERE u.verified_at IS NOT NULL AND ($1::text IS NULL OR u.name ILIKE '%' || $1 || '%') ORDER BY u.name,u.id LIMIT $2 OFFSET $3`,
      [q.q, q.limit + 1, q.offset],
    );
    return {
      items: items.slice(0, q.limit),
      page: q.page,
      limit: q.limit,
      hasMore: items.length > q.limit,
    };
  }
  async follow(from: string, to: string) {
    await this.db.query(
      'INSERT INTO user_follows(follower_id,followed_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
      [from, to],
    );
  }
  async unfollow(from: string, to: string) {
    await this.db.query('DELETE FROM user_follows WHERE follower_id=$1 AND followed_id=$2', [
      from,
      to,
    ]);
  }
}
