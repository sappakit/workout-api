import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class AuthUserProfileDto {
  @Expose({ name: 'first_name' })
  @ApiProperty({ example: 'Joe' })
  firstName: string;

  @Expose({ name: 'last_name' })
  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @Expose({ name: 'image_url' })
  @ApiProperty()
  imageUrl: string;
}

export class AuthRoleDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  code: string;

  @Expose()
  @ApiProperty()
  name: string;
}

export class AuthUserDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  username: string;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @Type(() => AuthUserProfileDto)
  @ApiProperty()
  profile: AuthUserProfileDto;

  @Expose()
  @Type(() => AuthRoleDto)
  @ApiProperty()
  role: AuthRoleDto;
}

export class LoginResponseDto {
  @Expose()
  @ApiProperty()
  accessToken: string;

  @Expose()
  @ApiProperty()
  refreshToken: string;

  @Expose()
  @Type(() => AuthUserDto)
  @ApiProperty({ type: () => AuthUserDto })
  user: AuthUserDto;
}

export class TokenPairResponseDto {
  @Expose()
  @ApiProperty()
  accessToken: string;

  @Expose()
  @ApiProperty()
  refreshToken: string;
}
