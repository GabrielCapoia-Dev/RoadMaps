import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';
import { MailService } from './mail.service.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthService,
    MailService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
