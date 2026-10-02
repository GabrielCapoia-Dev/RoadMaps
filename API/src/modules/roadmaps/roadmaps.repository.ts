import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Database, type Transaction } from '../../infrastructure/database/database.js';
import type {
  CreateRoadmapDto,
  GraphDto,
  MyRoadmapsQuery,
  RoadmapQuery,
  RoadmapResponseDto,
  RoadmapSummaryDto,
  UpdateRoadmapDto,
} from './roadmap.dto.js';

export type Roadmap = RoadmapResponseDto;
const fields = `r.id, r.owner_id AS "ownerId", u.name AS "authorName", r.title, r.description, r.category, r.tags, r.visibility, r.revision, r.published_at AS "publishedAt", r.created_at AS "createdAt", r.updated_at AS "updatedAt"`;
const summary = `${fields},jsonb_array_length(r.graph->'nodes') AS "nodeCount", (SELECT count(*)::int FROM roadmap_reactions x WHERE x.roadmap_id=r.id AND x.kind='like') AS likes, (SELECT count(*)::int FROM roadmap_reactions x WHERE x.roadmap_id=r.id AND x.kind='follow') AS followers`;
@Injectable()
export class RoadmapsRepository {
  constructor(@Inject(Database) private readonly db: Database) {}
  transaction<T>(work: (tx: Transaction) => Promise<T>) {
    return this.db.transaction(work);
  }
  async get(id: string, tx?: Transaction): Promise<Roadmap | undefined> {
    return (
      await this.db.query<Roadmap>(
        `SELECT ${fields},r.graph FROM roadmaps r JOIN users u ON u.id=r.owner_id WHERE r.id=$1 ${tx ? 'FOR UPDATE OF r' : ''}`,
        [id],
        tx,
      )
    )[0];
  }
  async role(id: string, userId: string, tx?: Transaction): Promise<string | undefined> {
    return (
      await this.db.query<{ role: string }>(
        'SELECT role FROM roadmap_members WHERE roadmap_id=$1 AND user_id=$2',
        [id, userId],
        tx,
      )
    )[0]?.role;
  }
  async create(ownerId: string, dto: CreateRoadmapDto): Promise<Roadmap> {
    const id = randomUUID();
    await this.db.query(
      'INSERT INTO roadmaps(id,owner_id,title,description,category,tags) VALUES($1,$2,$3,$4,$5,$6)',
      [id, ownerId, dto.title.trim(), dto.description, dto.category.trim(), dto.tags],
    );
    return (await this.get(id))!;
  }
  async update(id: string, dto: UpdateRoadmapDto, tx: Transaction): Promise<Roadmap> {
    await this.db.query(
      'UPDATE roadmaps SET title=COALESCE($2,title),description=COALESCE($3,description),category=COALESCE($4,category),tags=COALESCE($5,tags),revision=revision+1,updated_at=now() WHERE id=$1',
      [id, dto.title?.trim(), dto.description, dto.category?.trim(), dto.tags],
      tx,
    );
    return (await this.get(id, tx))!;
  }
  async saveGraph(id: string, graph: GraphDto, tx: Transaction): Promise<Roadmap> {
    await this.db.query(
      'UPDATE roadmaps SET graph=$2::jsonb,revision=revision+1,updated_at=now() WHERE id=$1',
      [id, JSON.stringify(graph)],
      tx,
    );
    await this.db.query(
      'DELETE FROM node_progress WHERE roadmap_id=$1 AND NOT (node_id=ANY($2::uuid[]))',
      [id, graph.nodes.map((n) => n.id)],
      tx,
    );
    return (await this.get(id, tx))!;
  }
  async visibility(id: string, visibility: string, tx: Transaction): Promise<Roadmap> {
    await this.db.query(
      "UPDATE roadmaps SET visibility=$2, published_at=CASE WHEN $2='public' THEN COALESCE(published_at,now()) ELSE NULL END,revision=revision+1,updated_at=now() WHERE id=$1",
      [id, visibility],
      tx,
    );
    return (await this.get(id, tx))!;
  }
  async remove(id: string, tx: Transaction): Promise<void> {
    await this.db.query('DELETE FROM roadmaps WHERE id=$1', [id], tx);
  }
  async addMember(id: string, userId: string, role: string, tx: Transaction): Promise<boolean> {
    return (
      (
        await this.db.query(
          'INSERT INTO roadmap_members(roadmap_id,user_id,role) SELECT $1,id,$3 FROM users WHERE id=$2 AND verified_at IS NOT NULL ON CONFLICT(roadmap_id,user_id) DO UPDATE SET role=EXCLUDED.role RETURNING user_id',
          [id, userId, role],
          tx,
        )
      ).length > 0
    );
  }
  async removeMember(id: string, userId: string, tx: Transaction): Promise<void> {
    await this.db.query(
      'DELETE FROM roadmap_members WHERE roadmap_id=$1 AND user_id=$2',
      [id, userId],
      tx,
    );
  }
  members(id: string, tx: Transaction) {
    return this.db.query<{ userId: string; name: string; role: string }>(
      `SELECT u.id AS "userId",u.name,'owner' AS role FROM roadmaps r JOIN users u ON u.id=r.owner_id WHERE r.id=$1 UNION ALL SELECT u.id AS "userId",u.name,m.role FROM roadmap_members m JOIN users u ON u.id=m.user_id WHERE m.roadmap_id=$1`,
      [id],
      tx,
    );
  }
  async explore(q: RoadmapQuery) {
    const order =
      q.sort === 'popular'
        ? 'likes DESC,followers DESC,'
        : q.sort === 'trending'
          ? `(SELECT count(*) FROM roadmap_reactions x WHERE x.roadmap_id=r.id AND x.kind IN ('like','follow') AND x.created_at>now()-interval '7 days') DESC,`
          : '';
    const items = await this.db.query<RoadmapSummaryDto>(
      `SELECT ${summary} FROM roadmaps r JOIN users u ON u.id=r.owner_id WHERE r.visibility='public' AND ($1::text IS NULL OR to_tsvector('simple',r.title || ' ' || r.description) @@ plainto_tsquery('simple',$1) OR jsonb_to_tsvector('simple',r.graph,'["string"]'::jsonb) @@ plainto_tsquery('simple',$1)) AND ($2::text IS NULL OR r.category=$2) AND ($3::text IS NULL OR $3=ANY(r.tags)) AND ($4::uuid IS NULL OR r.owner_id=$4) ORDER BY ${order} r.published_at DESC,r.id LIMIT $5 OFFSET $6`,
      [q.q || null, q.category, q.tag, q.authorId, q.limit + 1, q.offset],
    );
    return this.page(items, q);
  }
  async mine(userId: string, q: MyRoadmapsQuery) {
    const items = await this.db.query<RoadmapSummaryDto>(
      `SELECT ${summary} FROM roadmaps r JOIN users u ON u.id=r.owner_id WHERE (r.owner_id=$1 OR EXISTS(SELECT 1 FROM roadmap_members m WHERE m.roadmap_id=r.id AND m.user_id=$1) OR (r.visibility='public' AND $2 IN ('favorite','follow'))) AND (($2='all') OR ($2='owned' AND r.owner_id=$1) OR ($2='shared' AND r.owner_id<>$1) OR ($2 IN ('favorite','follow') AND EXISTS(SELECT 1 FROM roadmap_reactions x WHERE x.roadmap_id=r.id AND x.user_id=$1 AND x.kind=$2))) AND ($3::text IS NULL OR r.title ILIKE '%' || $3 || '%') ORDER BY r.updated_at DESC,r.id LIMIT $4 OFFSET $5`,
      [userId, q.filter, q.q, q.limit + 1, q.offset],
    );
    return this.page(items, q);
  }
  categories() {
    return this.db.query<{ name: string; roadmaps: number }>(
      "SELECT category AS name,count(*)::int AS roadmaps FROM roadmaps WHERE visibility='public' GROUP BY category ORDER BY category",
    );
  }
  private page(items: RoadmapSummaryDto[], q: { page: number; limit: number }) {
    return {
      items: items.slice(0, q.limit),
      page: q.page,
      limit: q.limit,
      hasMore: items.length > q.limit,
    };
  }
}
