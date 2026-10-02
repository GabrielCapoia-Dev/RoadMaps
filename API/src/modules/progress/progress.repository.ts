import { Inject, Injectable } from '@nestjs/common';
import { Database, type Transaction } from '../../infrastructure/database/database.js';
import type { SetProgressDto } from './progress.dto.js';
@Injectable()
export class ProgressRepository {
  constructor(@Inject(Database) private readonly db: Database) {}
  list(id: string, userId: string, tx: Transaction) {
    return this.db.query<{ nodeId: string; status: SetProgressDto['status'] }>(
      'SELECT node_id AS "nodeId",status FROM node_progress WHERE roadmap_id=$1 AND user_id=$2',
      [id, userId],
      tx,
    );
  }
  async set(id: string, userId: string, nodeId: string, status: string, tx: Transaction) {
    await this.db.query(
      'INSERT INTO node_progress(roadmap_id,user_id,node_id,status) VALUES($1,$2,$3,$4) ON CONFLICT(roadmap_id,user_id,node_id) DO UPDATE SET status=EXCLUDED.status,updated_at=now()',
      [id, userId, nodeId, status],
      tx,
    );
  }
}
