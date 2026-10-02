import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, OptionalUser, type Principal, Public } from '../auth/auth.guard.js';
import { PageQuery } from '../../common/dto/page.dto.js';
import {
  CommentDto,
  CommentInputDto,
  CommentPageDto,
  ReactionParams,
  ReactionSummaryDto,
} from './community.dto.js';
import { CommunityService } from './community.service.js';
@ApiTags('community')
@ApiBearerAuth()
@Controller('roadmaps/:id')
export class CommunityController {
  constructor(@Inject(CommunityService) private readonly service: CommunityService) {}
  @Public()
  @Get('comments')
  @ApiOkResponse({ type: CommentPageDto })
  @ApiOperation({ security: [{}, { bearer: [] }] })
  comments(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() q: PageQuery,
    @OptionalUser() user?: Principal,
  ) {
    return this.service.comments(id, user?.id, q);
  }
  @Post('comments')
  @ApiCreatedResponse({ type: CommentDto })
  add(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CommentInputDto,
    @CurrentUser() user: Principal,
  ) {
    return this.service.addComment(id, user.id, dto);
  }
  @Delete('comments/:commentId')
  @HttpCode(204)
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('commentId', new ParseUUIDPipe({ version: '4' })) commentId: string,
    @CurrentUser() user: Principal,
  ) {
    return this.service.removeComment(id, user.id, commentId);
  }
  @Public()
  @Get('reactions')
  @ApiOkResponse({ type: ReactionSummaryDto })
  @ApiOperation({ security: [{}, { bearer: [] }] })
  reactions(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @OptionalUser() user?: Principal,
  ) {
    return this.service.reactions(id, user?.id);
  }
  @Put('reactions/:kind')
  @HttpCode(204)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'kind', enum: ['like', 'favorite', 'follow'] })
  react(@Param() p: ReactionParams, @CurrentUser() user: Principal) {
    return this.service.react(p.id, user.id, p.kind);
  }
  @Delete('reactions/:kind')
  @HttpCode(204)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'kind', enum: ['like', 'favorite', 'follow'] })
  unreact(@Param() p: ReactionParams, @CurrentUser() user: Principal) {
    return this.service.unreact(p.id, user.id, p.kind);
  }
}
