import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'john_doe' })
  identifier: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @ApiProperty({ minLength: 8, example: 'pass1234' })
  password: string;
}

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'john_doe' })
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @ApiProperty({ minLength: 8, example: 'pass1234' })
  password: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'John' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;
}
