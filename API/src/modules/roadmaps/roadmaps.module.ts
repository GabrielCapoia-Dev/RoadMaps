import { Module } from '@nestjs/common';
import { ExploreController } from './explore.controller.js';
import { RoadmapsController } from './roadmaps.controller.js';
import { RoadmapsRepository } from './roadmaps.repository.js';
import { RoadmapsService } from './roadmaps.service.js';
import { SharePreviewController } from './share-preview.js';
@Module({
  controllers: [RoadmapsController, ExploreController, SharePreviewController],
  providers: [RoadmapsRepository, RoadmapsService],
  exports: [RoadmapsService],
})
export class RoadmapsModule {}
