import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsOptional } from 'class-validator';
import {
  ToNumberArray,
  ToStringArray,
} from 'src/common/decorators/transform.decorator';
import { PagingDto } from 'src/common/dto/request.dto';
import { ExerciseType } from 'src/workout/enums/workout.enum';

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
  @ToStringArray()
  @IsArray()
  @IsEnum(ExerciseType, { each: true })
  @ApiPropertyOptional({
    enum: ExerciseType,
    isArray: true,
    description: 'Filter by exercise types.',
    example: [ExerciseType.STRENGTH, ExerciseType.CARDIO],
  })
  exerciseTypes?: ExerciseType[];

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
