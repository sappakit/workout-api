import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class UserProfileDto {
  @Expose({ name: 'first_name' })
  @ApiProperty({ example: 'Joe' })
  firstName: string;

  @Expose({ name: 'last_name' })
  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @Expose({ name: 'phone_number' })
  @ApiProperty()
  phoneNumber: string;

  @Expose({ name: 'image_url' })
  @ApiProperty()
  imageUrl: string;
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
  @ApiProperty({ type: UserProfileDto })
  profile: UserProfileDto;
}
