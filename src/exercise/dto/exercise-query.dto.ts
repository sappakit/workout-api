import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional } from 'class-validator';
import { ToNumberArray } from 'src/common/decorators/transform.decorator';
import { PagingDto } from 'src/common/dto/request.dto';

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

export class ExerciseQueryDto extends PagingDto {
  @IsOptional()
  @ToNumberArray()
  @IsArray()
  @IsInt({ each: true })
  @ApiPropertyOptional({
    type: Number,
    isArray: true,
    description: 'Filter by exercise category IDs.',
    example: [1, 2],
  })
  categoryIds?: number[];

  @IsOptional()
  @ToNumberArray()
  @IsArray()
  @IsInt({ each: true })
  @ApiPropertyOptional({
    type: Number,
    isArray: true,
    description: 'Filter by target muscle IDs.',
    example: [1, 2, 3],
  })
  muscleIds?: number[];
}
