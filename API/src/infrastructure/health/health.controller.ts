import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../modules/auth/auth.guard.js';
import { Database } from '../database/database.js';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import { HealthResponseDto } from './health-response.dto.js';

@ApiTags('infrastructure')
@Public()
@SkipThrottle()
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(@Inject(Database) private readonly db: Database) {}
  @Get('ready')
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiOperation({ summary: 'Verifica acesso ao banco e tabela de migrações' })
  async ready(): Promise<HealthResponseDto> {
    try {
      await this.db.ready();
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Banco indisponível.');
    }
  }
  @Get()
  @ApiOperation({
    summary: 'Confirma que o processo HTTP está respondendo',
    description: 'Liveness somente; não verifica dependências externas.',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  getHealth(): HealthResponseDto {
    return { status: 'ok' };
  }
}
