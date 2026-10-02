import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
export class CommentInputDto {
  @ApiProperty() @IsString() @Length(1, 4000) @Matches(/\S/) body!: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID('4') parentId?: string;
}
export class ReactionParams {
  @IsUUID('4') id!: string;
  @IsIn(['like', 'favorite', 'follow']) kind!: 'like' | 'favorite' | 'follow';
}
export class CommentDto {
  @ApiProperty() id!: string;
  @ApiProperty() authorId!: string;
  @ApiProperty() authorName!: string;
  @ApiProperty({ nullable: true, type: String }) parentId!: string | null;
  @ApiProperty() body!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
}
export class CommentPageDto {
  @ApiProperty({ type: [CommentDto] }) items!: CommentDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() hasMore!: boolean;
}
export class ReactionSummaryDto {
  @ApiProperty() likes!: number;
  @ApiProperty() followers!: number;
  @ApiProperty({ description: 'Somente as reações do usuário autenticado.', type: [String] })
  mine!: string[];
}
