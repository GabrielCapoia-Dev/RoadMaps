import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard.js';
import { RoadmapPageDto, RoadmapQuery } from './roadmap.dto.js';
import { RoadmapsService } from './roadmaps.service.js';
class CategoryDto {
  @ApiProperty() name!: string;
  @ApiProperty() roadmaps!: number;
}
@Public()
@ApiTags('explore')
@Controller('explore')
export class ExploreController {
  constructor(@Inject(RoadmapsService) private readonly service: RoadmapsService) {}
  @Get('roadmaps')
  @ApiOkResponse({ type: RoadmapPageDto })
  list(@Query() q: RoadmapQuery) {
    return this.service.explore(q);
  }
  @Get('categories')
  @ApiOkResponse({ type: [CategoryDto] })
  categories() {
    return this.service.categories();
  }
}
