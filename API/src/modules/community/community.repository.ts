import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Database, type Transaction } from '../../infrastructure/database/database.js';
import type { PageQuery } from '../../common/dto/page.dto.js';
import type { CommentDto, CommentInputDto } from './community.dto.js';
const fields =
  'c.id,c.author_id AS "authorId",u.name AS "authorName",c.parent_id AS "parentId",c.body,c.created_at AS "createdAt"';
@Injectable()
export class CommunityRepository {
  constructor(@Inject(Database) private readonly db: Database) {}
  async comment(id: string, commentId: string, tx: Transaction) {
    return (
      await this.db.query<CommentDto>(
        `SELECT ${fields} FROM comments c JOIN users u ON u.id=c.author_id WHERE c.roadmap_id=$1 AND c.id=$2`,
        [id, commentId],
        tx,
      )
    )[0];
  }
  async addComment(id: string, userId: string, dto: CommentInputDto, tx: Transaction) {
    const commentId = randomUUID();
    await this.db.query(
      'INSERT INTO comments(id,roadmap_id,author_id,parent_id,body) VALUES($1,$2,$3,$4,$5)',
      [commentId, id, userId, dto.parentId, dto.body.trim()],
      tx,
    );
    return (await this.comment(id, commentId, tx))!;
  }
  async comments(id: string, q: PageQuery) {
    const items = await this.db.query<CommentDto>(
      `SELECT ${fields} FROM comments c JOIN users u ON u.id=c.author_id WHERE c.roadmap_id=$1 ORDER BY c.created_at,c.id LIMIT $2 OFFSET $3`,
      [id, q.limit + 1, q.offset],
    );
    return {
      items: items.slice(0, q.limit),
      page: q.page,
      limit: q.limit,
      hasMore: items.length > q.limit,
    };
  }
  async removeComment(id: string, commentId: string, tx: Transaction) {
    await this.db.query('DELETE FROM comments WHERE roadmap_id=$1 AND id=$2', [id, commentId], tx);
  }
  async react(id: string, userId: string, kind: string, tx: Transaction) {
    await this.db.query(
      'INSERT INTO roadmap_reactions(roadmap_id,user_id,kind) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',
      [id, userId, kind],
      tx,
    );
  }
  async unreact(id: string, userId: string, kind: string, tx: Transaction) {
    await this.db.query(
      'DELETE FROM roadmap_reactions WHERE roadmap_id=$1 AND user_id=$2 AND kind=$3',
      [id, userId, kind],
      tx,
    );
  }
  async reactions(id: string, userId?: string) {
    const [counts] = await this.db.query<{ likes: number; followers: number }>(
      "SELECT count(*) FILTER(WHERE kind='like')::int AS likes,count(*) FILTER(WHERE kind='follow')::int AS followers FROM roadmap_reactions WHERE roadmap_id=$1",
      [id],
    );
    const mine = userId
      ? await this.db.query<{ kind: string }>(
          'SELECT kind FROM roadmap_reactions WHERE roadmap_id=$1 AND user_id=$2 ORDER BY kind',
          [id, userId],
        )
      : [];
    return {
      likes: counts?.likes ?? 0,
      followers: counts?.followers ?? 0,
      mine: mine.map((x) => x.kind),
    };
  }
}
