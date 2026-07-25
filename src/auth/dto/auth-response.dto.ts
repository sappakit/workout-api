import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class AuthUserProfileDto {
  @Expose({ name: 'first_name' })
  @ApiProperty({
    example: 'Joe',
    type: String,
    nullable: true,
  })
  firstName: string | null;

  @Expose({ name: 'last_name' })
  @ApiProperty({
    example: 'Doe',
    type: String,
    nullable: true,
  })
  lastName: string | null;

  @Expose({ name: 'image_url' })
  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    type: String,
    nullable: true,
  })
  imageUrl: string | null;
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
  @ApiProperty({
    type: AuthUserProfileDto,
    nullable: true,
  })
  profile: AuthUserProfileDto | null;

  @Expose()
  @Type(() => AuthRoleDto)
  @ApiProperty({ type: AuthRoleDto })
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
  @ApiProperty({ type: AuthUserDto })
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
