import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class GetWorkoutScheduleQueryDto {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Date in YYYY-MM-DD format',
    example: '2026-05-04',
  })
  date?: string;
}
