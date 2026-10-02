import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Transaction } from '../../infrastructure/database/database.js';
import type {
  CreateRoadmapDto,
  GraphDto,
  MemberDto,
  MyRoadmapsQuery,
  RoadmapQuery,
  SaveGraphDto,
  UpdateRoadmapDto,
  VisibilityDto,
} from './roadmap.dto.js';
import { type Roadmap, RoadmapsRepository } from './roadmaps.repository.js';

export type Access = 'read' | 'comment' | 'edit' | 'owner';
@Injectable()
export class RoadmapsService {
  constructor(@Inject(RoadmapsRepository) private readonly repo: RoadmapsRepository) {}
  create(userId: string, dto: CreateRoadmapDto) {
    return this.repo.create(userId, dto);
  }
  mine(userId: string, q: MyRoadmapsQuery) {
    return this.repo.mine(userId, q);
  }
  explore(q: RoadmapQuery) {
    return this.repo.explore(q);
  }
  categories() {
    return this.repo.categories();
  }
  async get(id: string, userId?: string) {
    return this.authorize(id, userId, 'read');
  }
  // All mutations lock the roadmap before checking membership. Membership revocation,
  // visibility changes, graph saves and study/social writes use the same lock order.
  withAccess<T>(
    id: string,
    userId: string,
    access: Access,
    work: (roadmap: Roadmap, tx: Transaction) => Promise<T>,
  ): Promise<T> {
    return this.repo.transaction(async (tx) =>
      work(await this.authorize(id, userId, access, tx), tx),
    );
  }
  private async authorize(
    id: string,
    userId: string | undefined,
    access: Access,
    tx?: Transaction,
  ): Promise<Roadmap> {
    const roadmap = await this.repo.get(id, tx);
    if (!roadmap) throw new NotFoundException('Roadmap não encontrado.');
    const role =
      roadmap.ownerId === userId
        ? 'owner'
        : userId
          ? await this.repo.role(id, userId, tx)
          : undefined;
    if (!role && roadmap.visibility !== 'public')
      throw new NotFoundException('Roadmap não encontrado.');
    const allowed =
      access === 'read' ||
      role === 'owner' ||
      (access === 'edit' && role === 'editor') ||
      (access === 'comment' &&
        (role === 'editor' || role === 'commenter' || (!role && roadmap.visibility === 'public')));
    if (!allowed) throw new ForbiddenException('Você não possui permissão para esta ação.');
    return roadmap;
  }
  private revision(roadmap: Roadmap, expected: number) {
    if (roadmap.revision !== expected)
      throw new ConflictException('O roadmap foi alterado. Recarregue antes de salvar.');
  }
  update(id: string, userId: string, dto: UpdateRoadmapDto) {
    return this.withAccess(id, userId, 'edit', async (roadmap, tx) => {
      this.revision(roadmap, dto.expectedRevision);
      return this.repo.update(id, dto, tx);
    });
  }
  saveGraph(id: string, userId: string, dto: SaveGraphDto) {
    this.validateGraph(dto.graph);
    return this.withAccess(id, userId, 'edit', async (roadmap, tx) => {
      this.revision(roadmap, dto.expectedRevision);
      return this.repo.saveGraph(id, dto.graph, tx);
    });
  }
  private validateGraph(graph: GraphDto) {
    const nodes = new Set(graph.nodes.map((n) => n.id));
    const edges = new Set(graph.edges.map((e) => e.id));
    if (nodes.size !== graph.nodes.length || edges.size !== graph.edges.length)
      throw new BadRequestException('Identificadores duplicados no grafo.');
    for (const edge of graph.edges) {
      if (!nodes.has(edge.source) || !nodes.has(edge.target))
        throw new BadRequestException('Conexão referencia um nó inexistente.');
      if (edge.source === edge.target)
        throw new BadRequestException('Um nó não pode conectar-se a si mesmo.');
    }
  }
  visibility(id: string, userId: string, dto: VisibilityDto) {
    return this.withAccess(id, userId, 'owner', async (roadmap, tx) => {
      this.revision(roadmap, dto.expectedRevision);
      return this.repo.visibility(id, dto.visibility, tx);
    });
  }
  remove(id: string, userId: string) {
    return this.withAccess(id, userId, 'owner', (_r, tx) => this.repo.remove(id, tx));
  }
  members(id: string, userId: string) {
    return this.withAccess(id, userId, 'edit', (_r, tx) => this.repo.members(id, tx));
  }
  addMember(id: string, userId: string, dto: MemberDto) {
    return this.withAccess(id, userId, 'owner', async (roadmap, tx) => {
      if (dto.userId === roadmap.ownerId)
        throw new BadRequestException('O proprietário não pode receber outro papel.');
      if (!(await this.repo.addMember(id, dto.userId, dto.role, tx)))
        throw new NotFoundException('Usuário confirmado não encontrado.');
      return this.repo.members(id, tx);
    });
  }
  removeMember(id: string, userId: string, memberId: string) {
    return this.withAccess(id, userId, 'owner', async (roadmap, tx) => {
      if (memberId.toLowerCase() === roadmap.ownerId)
        throw new BadRequestException('Não é possível remover o proprietário.');
      await this.repo.removeMember(id, memberId, tx);
    });
  }
}
