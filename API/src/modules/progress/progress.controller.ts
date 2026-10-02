import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type Principal } from '../auth/auth.guard.js';
import { ProgressDto, SetProgressDto } from './progress.dto.js';
import { ProgressService } from './progress.service.js';
@ApiTags('progress')
@ApiBearerAuth()
@Controller('roadmaps/:id/progress')
export class ProgressController {
  constructor(@Inject(ProgressService) private readonly service: ProgressService) {}
  @Get('me')
  @ApiOkResponse({ type: ProgressDto })
  get(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: Principal,
  ) {
    return this.service.get(id, user.id);
  }
  @Put('me/nodes/:nodeId')
  @ApiOkResponse({ type: ProgressDto })
  set(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('nodeId', new ParseUUIDPipe({ version: '4' })) nodeId: string,
    @CurrentUser() user: Principal,
    @Body() dto: SetProgressDto,
  ) {
    return this.service.set(id, user.id, nodeId, dto);
  }
}
