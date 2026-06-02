import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional } from 'class-validator';
import { ToNumberArray } from 'src/common/decorators/transform.decorator';

export class GetExercisesPerformanceQueryDto {
  @IsOptional()
  @ToNumberArray()
  @IsArray()
  @IsInt({ each: true })
  @ApiPropertyOptional({
    type: Number,
    isArray: true,
    description: 'Exercise IDs to fetch performance summaries for.',
    example: [1, 2, 3],
  })
  exerciseIds?: number[];
}
