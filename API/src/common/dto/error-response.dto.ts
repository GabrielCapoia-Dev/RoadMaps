import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 500 })
  statusCode!: number;

  @ApiProperty({ example: 'Internal Server Error' })
  error!: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Internal Server Error',
  })
  message!: string | string[];

  @ApiProperty({ example: '/api/v1/health' })
  path!: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-10-01T12:00:00.000Z' })
  timestamp!: string;
}
