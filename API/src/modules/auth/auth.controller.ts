import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import {
  EmailDto,
  LoginDto,
  MessageDto,
  RegisterDto,
  SessionDto,
  VerifyEmailDto,
} from './auth.dto.js';
import { CurrentUser, type Principal, Public } from './auth.guard.js';

@ApiTags('auth')
@Throttle({ default: { limit: 8, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly service: AuthService) {}
  @Public()
  @Post('register')
  @HttpCode(200)
  @ApiOkResponse({ type: MessageDto })
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }
  @Public()
  @Post('resend-verification')
  @HttpCode(200)
  @ApiOkResponse({ type: MessageDto })
  resend(@Body() dto: EmailDto) {
    return this.service.resend(dto.email);
  }
  @Public()
  @Post('verify-email')
  @HttpCode(200)
  @ApiOkResponse({ type: MessageDto })
  verify(@Body() dto: VerifyEmailDto) {
    return this.service.verify(dto.token);
  }
  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ type: SessionDto })
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(204)
  logout(@CurrentUser() user: Principal) {
    return this.service.logout(user.sessionHash);
  }
}
