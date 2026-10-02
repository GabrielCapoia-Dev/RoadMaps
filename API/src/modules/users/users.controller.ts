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
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PageQuery } from '../../common/dto/page.dto.js';
import { CurrentUser, type Principal, Public } from '../auth/auth.guard.js';
import { MeDto, PeoplePageDto, ProfileDto, UpdateProfileDto } from './users.dto.js';
import { UsersService } from './users.service.js';
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(@Inject(UsersService) private readonly service: UsersService) {}
  @Get('me')
  @ApiOkResponse({ type: MeDto })
  me(@CurrentUser() user: Principal) {
    return this.service.me(user.id);
  }
  @Patch('me')
  @ApiOkResponse({ type: MeDto })
  update(@CurrentUser() user: Principal, @Body() dto: UpdateProfileDto) {
    return this.service.update(user.id, dto);
  }
  @Put('me/onboarding')
  @ApiOkResponse({ type: MeDto })
  complete(@CurrentUser() user: Principal) {
    return this.service.complete(user.id);
  }
  @Public()
  @Get()
  @ApiOkResponse({ type: PeoplePageDto })
  @ApiOperation({ security: [{}, { bearer: [] }] })
  people(@Query() q: PageQuery) {
    return this.service.people(q);
  }
  @Public()
  @Get(':id')
  @ApiOkResponse({ type: ProfileDto })
  @ApiOperation({ security: [{}, { bearer: [] }] })
  profile(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.profile(id);
  }
  @Put(':id/follow')
  @HttpCode(204)
  follow(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: Principal,
  ) {
    return this.service.follow(user.id, id);
  }
  @Delete(':id/follow')
  @HttpCode(204)
  unfollow(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: Principal,
  ) {
    return this.service.unfollow(user.id, id);
  }
}
