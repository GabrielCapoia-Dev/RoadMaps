import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
export class SetProgressDto {
  @ApiProperty({ enum: ['not_started', 'in_progress', 'completed'] })
  @IsIn(['not_started', 'in_progress', 'completed'])
  status!: 'not_started' | 'in_progress' | 'completed';
}
export class NodeProgressDto extends SetProgressDto {
  @ApiProperty() nodeId!: string;
  @ApiProperty() required!: boolean;
}
export class ProgressDto {
  @ApiProperty() roadmapId!: string;
  @ApiProperty() revision!: number;
  @ApiProperty({ description: 'Nós obrigatórios; se nenhum for obrigatório, todos os nós.' })
  total!: number;
  @ApiProperty() completed!: number;
  @ApiProperty() inProgress!: number;
  @ApiProperty() remaining!: number;
  @ApiProperty({ minimum: 0, maximum: 100 }) percent!: number;
  @ApiProperty({ type: [NodeProgressDto] }) nodes!: NodeProgressDto[];
}
