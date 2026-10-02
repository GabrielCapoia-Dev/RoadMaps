import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, OptionalUser, type Principal, Public } from '../auth/auth.guard.js';
import {
  CollaboratorDto,
  CreateRoadmapDto,
  MemberDto,
  MyRoadmapsQuery,
  RoadmapPageDto,
  RoadmapResponseDto,
  SaveGraphDto,
  UpdateRoadmapDto,
  VisibilityDto,
} from './roadmap.dto.js';
import { RoadmapsService } from './roadmaps.service.js';

@ApiTags('roadmaps')
@ApiBearerAuth()
@Controller('roadmaps')
export class RoadmapsController {
  constructor(@Inject(RoadmapsService) private readonly service: RoadmapsService) {}
  @Post()
  @ApiCreatedResponse({ type: RoadmapResponseDto })
  create(@CurrentUser() user: Principal, @Body() dto: CreateRoadmapDto) {
    return this.service.create(user.id, dto);
  }
  @Get()
  @ApiOkResponse({ type: RoadmapPageDto })
  mine(@CurrentUser() user: Principal, @Query() q: MyRoadmapsQuery) {
    return this.service.mine(user.id, q);
  }
  @Public()
  @Get(':id')
  @ApiOkResponse({ type: RoadmapResponseDto })
  @ApiOperation({ security: [{}, { bearer: [] }] })
  get(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @OptionalUser() user?: Principal,
  ) {
    return this.service.get(id, user?.id);
  }
  @Patch(':id')
  @ApiOkResponse({ type: RoadmapResponseDto })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: Principal,
    @Body() dto: UpdateRoadmapDto,
  ) {
    return this.service.update(id, user.id, dto);
  }
  @Put(':id/graph')
  @ApiOkResponse({ type: RoadmapResponseDto })
  graph(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: Principal,
    @Body() dto: SaveGraphDto,
  ) {
    return this.service.saveGraph(id, user.id, dto);
  }
  @Put(':id/visibility')
  @ApiOkResponse({ type: RoadmapResponseDto })
  visibility(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: Principal,
    @Body() dto: VisibilityDto,
  ) {
    return this.service.visibility(id, user.id, dto);
  }
  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: Principal,
  ) {
    return this.service.remove(id, user.id);
  }
  @Get(':id/members')
  @ApiOkResponse({ type: [CollaboratorDto] })
  members(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: Principal,
  ) {
    return this.service.members(id, user.id);
  }
  @Put(':id/members')
  @ApiOkResponse({ type: [CollaboratorDto] })
  member(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: Principal,
    @Body() dto: MemberDto,
  ) {
    return this.service.addMember(id, user.id, dto);
  }
  @Delete(':id/members/:userId')
  @HttpCode(204)
  removeMember(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) memberId: string,
    @CurrentUser() user: Principal,
  ) {
    return this.service.removeMember(id, user.id, memberId);
  }
}
