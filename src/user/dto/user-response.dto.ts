import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class UserProfileDto {
  @Expose({ name: 'first_name' })
  @ApiProperty({
    example: 'Joe',
    nullable: true,
    type: String,
  })
  firstName: string | null;

  @Expose({ name: 'last_name' })
  @ApiProperty({
    example: 'Doe',
    nullable: true,
    type: String,
  })
  lastName: string | null;

  @Expose({ name: 'phone_number' })
  @ApiProperty({
    example: '0812345678',
    nullable: true,
    type: String,
  })
  phoneNumber: string | null;

  @Expose({ name: 'image_url' })
  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    nullable: true,
    type: String,
  })
  imageUrl: string | null;
}

export class UserDto {
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
  @Type(() => UserProfileDto)
  @ApiPropertyOptional({
    type: UserProfileDto,
    nullable: true,
  })
  profile?: UserProfileDto | null;
}
