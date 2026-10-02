import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';

export class EmailDto {
  @ApiProperty({ example: 'pessoa@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
export class LoginDto extends EmailDto {
  @ApiProperty({ minLength: 12, maxLength: 128, format: 'password' })
  @IsString()
  @Length(12, 128)
  password!: string;
}
export class RegisterDto extends LoginDto {
  @ApiProperty({ example: 'Ana Silva', maxLength: 80 })
  @IsString()
  @Length(2, 80)
  @Matches(/\S/)
  name!: string;
}
export class VerifyEmailDto {
  @ApiProperty({ description: 'Token recebido por e-mail; uso único e validade de 30 minutos.' })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  token!: string;
}
export class MessageDto {
  @ApiProperty() message!: string;
}
export class SessionDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ example: 'Bearer' }) tokenType!: string;
  @ApiProperty({ format: 'date-time' }) expiresAt!: string;
}
