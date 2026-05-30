import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsInt, IsOptional } from 'class-validator';
import { ToNumberArray } from 'src/common/decorators/transform.decorator';
import { PagingDto } from 'src/common/dto/request.dto';

export class GetWorkoutScheduleQueryDto {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Date in YYYY-MM-DD format',
    example: '2026-01-01',
  })
  date?: string;
}

export class WorkoutQueryDto extends PagingDto {
  @IsOptional()
  @ToNumberArray()
  @IsArray()
  @IsInt({ each: true })
  @ApiPropertyOptional({
    type: Number,
    isArray: true,
    description: 'Filter by workout focus type IDs.',
    example: [1, 2, 3],
  })
  focusTypeIds?: number[];

  @IsOptional()
  @ToNumberArray()
  @IsArray()
  @IsInt({ each: true })
  @ApiPropertyOptional({
    type: Number,
    isArray: true,
    description: 'Filter by muscle IDs.',
    example: [1, 2, 3],
  })
  muscleIds?: number[];
}
