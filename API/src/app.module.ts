import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './infrastructure/database/database.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { RoadmapsModule } from './modules/roadmaps/roadmaps.module.js';
import { ProgressModule } from './modules/progress/progress.module.js';
import { CommunityModule } from './modules/community/community.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { envFilePaths, validateEnvironment } from './config/environment.js';
import { HealthModule } from './infrastructure/health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: envFilePaths,
      validate: validateEnvironment,
    }),
    HealthModule,
    DatabaseModule,
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 120 }]),
    AuthModule,
    UsersModule,
    RoadmapsModule,
    ProgressModule,
    CommunityModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    ThrottlerGuard,
    { provide: APP_GUARD, useExisting: ThrottlerGuard },
  ],
})
export class AppModule {}
