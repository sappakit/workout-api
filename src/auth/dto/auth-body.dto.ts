import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

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

export type CreateUserInput = RegisterDto & {
  roleCode: string;
};

export class RefreshDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Refresh token returned from login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'Email address of the account requesting a password reset',
    example: 'john@example.com',
  })
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Password reset token from the reset email link',
    example: 'a3f5c9e8b1...',
  })
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @ApiProperty({
    description: 'New password for the account',
    example: 'NewPassword123!',
    minLength: 8,
  })
  password: string;
}

export class VerifyResetPasswordTokenDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Password reset token from the reset email link',
    example: 'a3f5c9e8b1...',
  })
  token: string;
}

export class ChangeMyPasswordDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Current account password',
    example: 'OldPassword123!',
  })
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @ApiProperty({
    description: 'New account password',
    example: 'NewPassword123!',
    minLength: 8,
  })
  newPassword: string;
}
