import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RoadmapsService } from '../roadmaps/roadmaps.service.js';
import type { Roadmap } from '../roadmaps/roadmaps.repository.js';
import type { Transaction } from '../../infrastructure/database/database.js';
import type { SetProgressDto } from './progress.dto.js';
import { ProgressRepository } from './progress.repository.js';
@Injectable()
export class ProgressService {
  constructor(
    @Inject(RoadmapsService) private readonly roadmaps: RoadmapsService,
    @Inject(ProgressRepository) private readonly repo: ProgressRepository,
  ) {}
  get(id: string, userId: string) {
    return this.roadmaps.withAccess(id, userId, 'read', (roadmap, tx) =>
      this.summary(roadmap, userId, tx),
    );
  }
  set(id: string, userId: string, nodeId: string, dto: SetProgressDto) {
    nodeId = nodeId.toLowerCase();
    return this.roadmaps.withAccess(id, userId, 'read', async (roadmap, tx) => {
      if (!roadmap.graph.nodes.some((n) => n.id === nodeId))
        throw new NotFoundException('Nó não encontrado.');
      await this.repo.set(id, userId, nodeId, dto.status, tx);
      return this.summary(roadmap, userId, tx);
    });
  }
  private async summary(roadmap: Roadmap, userId: string, tx: Transaction) {
    const states = new Map(
      (await this.repo.list(roadmap.id, userId, tx)).map((n) => [n.nodeId, n.status]),
    );
    const nodes = roadmap.graph.nodes.map((n) => ({
      nodeId: n.id,
      required: n.required,
      status: states.get(n.id) ?? 'not_started',
    }));
    const required = nodes.filter((n) => n.required);
    const counted = required.length ? required : nodes;
    const completed = counted.filter((n) => n.status === 'completed').length;
    return {
      roadmapId: roadmap.id,
      revision: roadmap.revision,
      total: counted.length,
      completed,
      inProgress: counted.filter((n) => n.status === 'in_progress').length,
      remaining: counted.length - completed,
      percent: counted.length ? Math.round((completed / counted.length) * 100) : 0,
      nodes,
    };
  }
}
