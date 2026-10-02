import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PageQuery } from '../../common/dto/page.dto.js';
import { RoadmapsService } from '../roadmaps/roadmaps.service.js';
import type { CommentInputDto } from './community.dto.js';
import { CommunityRepository } from './community.repository.js';
@Injectable()
export class CommunityService {
  constructor(
    @Inject(RoadmapsService) private readonly roadmaps: RoadmapsService,
    @Inject(CommunityRepository) private readonly repo: CommunityRepository,
  ) {}
  async comments(id: string, userId: string | undefined, q: PageQuery) {
    await this.roadmaps.get(id, userId);
    return this.repo.comments(id, q);
  }
  addComment(id: string, userId: string, dto: CommentInputDto) {
    return this.roadmaps.withAccess(id, userId, 'comment', async (_roadmap, tx) => {
      if (dto.parentId) {
        const parent = await this.repo.comment(id, dto.parentId, tx);
        if (!parent) throw new BadRequestException('Comentário pai não pertence a este roadmap.');
        if (parent.parentId)
          throw new BadRequestException(
            'Responda ao comentário principal; a discussão possui um nível de respostas.',
          );
      }
      return this.repo.addComment(id, userId, dto, tx);
    });
  }
  removeComment(id: string, userId: string, commentId: string) {
    return this.roadmaps.withAccess(id, userId, 'read', async (roadmap, tx) => {
      const comment = await this.repo.comment(id, commentId, tx);
      if (!comment) throw new NotFoundException('Comentário não encontrado.');
      if (roadmap.ownerId !== userId && comment.authorId !== userId) throw new ForbiddenException();
      await this.repo.removeComment(id, commentId, tx);
    });
  }
  react(id: string, userId: string, kind: string) {
    return this.roadmaps.withAccess(id, userId, 'read', (_r, tx) =>
      this.repo.react(id, userId, kind, tx),
    );
  }
  unreact(id: string, userId: string, kind: string) {
    return this.roadmaps.withAccess(id, userId, 'read', (_r, tx) =>
      this.repo.unreact(id, userId, kind, tx),
    );
  }
  async reactions(id: string, userId?: string) {
    await this.roadmaps.get(id, userId);
    return this.repo.reactions(id, userId);
  }
}
