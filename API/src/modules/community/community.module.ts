import { Module } from '@nestjs/common';
import { RoadmapsModule } from '../roadmaps/roadmaps.module.js';
import { CommunityController } from './community.controller.js';
import { CommunityRepository } from './community.repository.js';
import { CommunityService } from './community.service.js';
@Module({
  imports: [RoadmapsModule],
  controllers: [CommunityController],
  providers: [CommunityRepository, CommunityService],
})
export class CommunityModule {}
