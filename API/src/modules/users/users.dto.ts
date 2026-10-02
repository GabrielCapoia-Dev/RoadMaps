import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Length, Matches, MaxLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @Length(2, 80)
  @Matches(/\S/)
  name?: string;
  @ApiPropertyOptional()
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(1000)
  bio?: string;
}
export class ProfileDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() bio!: string;
  @ApiProperty() followers!: number;
  @ApiProperty() following!: number;
  @ApiProperty() publicRoadmaps!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
}
export class MeDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
  @ApiProperty() bio!: string;
  @ApiProperty({ format: 'date-time' }) verifiedAt!: Date;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  onboardingCompletedAt!: Date | null;
}
export class PeoplePageDto {
  @ApiProperty({ type: [ProfileDto] }) items!: ProfileDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() hasMore!: boolean;
}
