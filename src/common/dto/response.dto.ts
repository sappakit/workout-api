import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SuccessMessageDto {
  @Expose()
  @ApiProperty({
    example: 'Registration successful',
  })
  message: string;
}
