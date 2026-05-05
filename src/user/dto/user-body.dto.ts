import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMyProfileDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @ApiProperty({ example: 'Joe' })
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  @ApiProperty({ example: 'joe@example.com' })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @ApiPropertyOptional({ example: '08112345678' })
  phoneNumber?: string;
}
