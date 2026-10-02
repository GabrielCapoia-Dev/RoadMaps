import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PageQuery } from '../../common/dto/page.dto.js';

export class ResourceDto {
  @ApiProperty() @IsString() @Length(1, 200) label!: string;
  @ApiProperty()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  url!: string;
}
export class PositionDto {
  @ApiProperty() @IsNumber() @Min(-100000) @Max(100000) x!: number;
  @ApiProperty() @IsNumber() @Min(-100000) @Max(100000) y!: number;
}
export class NodeDto {
  @ApiProperty({ format: 'uuid' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsUUID('4')
  id!: string;
  @ApiProperty({ example: 'module', description: 'Tipo extensível, sem enum fechado.' })
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{0,39}$/)
  type!: string;
  @ApiProperty() @IsString() @Length(1, 160) @Matches(/\S/) title!: string;
  @ApiPropertyOptional({ default: '' }) @IsString() @MaxLength(10000) description = '';
  @ApiPropertyOptional({ default: true }) @IsBoolean() required = true;
  @ApiProperty({ type: PositionDto })
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => PositionDto)
  position!: PositionDto;
  @ApiPropertyOptional({ example: '#2563EB' })
  @IsOptional()
  @Matches(/^#[a-fA-F0-9]{6}$/)
  color?: string;
  @ApiPropertyOptional({ example: 'rounded' })
  @IsOptional()
  @IsString()
  @Length(1, 40)
  shape?: string;
  @ApiPropertyOptional({ type: [ResourceDto] })
  @IsArray()
  @ArrayMaxSize(30)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => ResourceDto)
  resources: ResourceDto[] = [];
}
export class EdgeDto {
  @ApiProperty({ format: 'uuid' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsUUID('4')
  id!: string;
  @ApiProperty({ format: 'uuid' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsUUID('4')
  source!: string;
  @ApiProperty({ format: 'uuid' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsUUID('4')
  target!: string;
  @ApiPropertyOptional({ default: 'path' }) @IsString() @Matches(/^[a-z][a-z0-9_-]{0,39}$/) type =
    'path';
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) label?: string;
  @ApiPropertyOptional() @IsOptional() @Matches(/^#[a-fA-F0-9]{6}$/) color?: string;
}
export class GraphDto {
  @ApiProperty({ type: [NodeDto], maxItems: 1000 })
  @IsArray()
  @ArrayMaxSize(1000)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => NodeDto)
  nodes!: NodeDto[];
  @ApiProperty({ type: [EdgeDto], maxItems: 3000 })
  @IsArray()
  @ArrayMaxSize(3000)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => EdgeDto)
  edges!: EdgeDto[];
}
export class RevisionDto {
  @ApiProperty({ minimum: 1, description: 'Revisão atual; divergências retornam 409.' })
  @IsInt()
  @Min(1)
  expectedRevision!: number;
}
export class SaveGraphDto extends RevisionDto {
  @ApiProperty({ type: GraphDto })
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => GraphDto)
  graph!: GraphDto;
}
export class CreateRoadmapDto {
  @ApiProperty() @IsString() @Length(1, 160) @Matches(/\S/) title!: string;
  @ApiPropertyOptional({ default: '' }) @IsString() @MaxLength(10000) description = '';
  @ApiPropertyOptional({ default: 'Geral' }) @IsString() @Length(1, 60) @Matches(/\S/) category =
    'Geral';
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @ArrayMaxSize(12)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 40, { each: true })
  @Matches(/\S/, { each: true })
  tags: string[] = [];
}
export class UpdateRoadmapDto {
  @ApiPropertyOptional()
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined)
  @IsString()
  @Length(1, 160)
  @Matches(/\S/)
  title?: string;
  @ApiPropertyOptional()
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined)
  @IsString()
  @MaxLength(10000)
  description?: string;
  @ApiPropertyOptional()
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined)
  @IsString()
  @Length(1, 60)
  @Matches(/\S/)
  category?: string;
  @ApiPropertyOptional({ type: [String] })
  @ValidateIf((_o: unknown, v: unknown) => v !== undefined)
  @IsArray()
  @ArrayMaxSize(12)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 40, { each: true })
  @Matches(/\S/, { each: true })
  tags?: string[];
  @ApiProperty() @IsInt() @Min(1) expectedRevision!: number;
}
export class VisibilityDto extends RevisionDto {
  @ApiProperty({ enum: ['private', 'public'] }) @IsIn(['private', 'public']) visibility!:
    'private' | 'public';
}
export class MemberDto {
  @ApiProperty({ format: 'uuid' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsUUID('4')
  userId!: string;
  @ApiProperty({ enum: ['editor', 'commenter', 'viewer'] })
  @IsIn(['editor', 'commenter', 'viewer'])
  role!: 'editor' | 'commenter' | 'viewer';
}
export class RoadmapQuery extends PageQuery {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) tag?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID('4') authorId?: string;
  @ApiPropertyOptional({ enum: ['newest', 'popular', 'trending'], default: 'newest' })
  @IsIn(['newest', 'popular', 'trending'])
  sort: 'newest' | 'popular' | 'trending' = 'newest';
}
export class MyRoadmapsQuery extends PageQuery {
  @ApiPropertyOptional({ enum: ['all', 'owned', 'shared', 'favorite', 'follow'], default: 'all' })
  @IsIn(['all', 'owned', 'shared', 'favorite', 'follow'])
  filter = 'all';
}
export class RoadmapResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) ownerId!: string;
  @ApiProperty() authorName!: string;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty() category!: string;
  @ApiProperty({ type: [String] }) tags!: string[];
  @ApiProperty({ enum: ['private', 'public'] }) visibility!: string;
  @ApiProperty() revision!: number;
  @ApiProperty({ type: GraphDto }) graph!: GraphDto;
  @ApiProperty({ format: 'date-time', nullable: true, type: String }) publishedAt!: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}
export class RoadmapSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() ownerId!: string;
  @ApiProperty() authorName!: string;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty() category!: string;
  @ApiProperty({ type: [String] }) tags!: string[];
  @ApiProperty() visibility!: string;
  @ApiProperty() revision!: number;
  @ApiProperty() nodeCount!: number;
  @ApiProperty() likes!: number;
  @ApiProperty() followers!: number;
  @ApiProperty({ format: 'date-time', nullable: true, type: String }) publishedAt!: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}
export class RoadmapPageDto {
  @ApiProperty({ type: [RoadmapSummaryDto] }) items!: RoadmapSummaryDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty({ description: 'Indica se existe outra página, sem contagem global cara.' })
  hasMore!: boolean;
}
export class CollaboratorDto {
  @ApiProperty() userId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: ['owner', 'editor', 'commenter', 'viewer'] }) role!: string;
}
