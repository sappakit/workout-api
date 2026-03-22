import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  MaxLength,
  IsNumber,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateWorkoutExerciseDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiPropertyOptional()
  id: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty()
  orderIndex: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional()
  plannedSets: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiPropertyOptional()
  plannedRepsRange: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  plannedWeight: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional()
  plannedRestTime: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional()
  plannedDuration: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  plannedDistance: number | null;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  exerciseId: number;
}

export class UpdateWorkoutDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty()
  name: string;

  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  workoutFocusTypeId: number;

  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @ApiProperty({ type: [Number] })
  targetMuscles: number[];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty()
  duration: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpdateWorkoutExerciseDto)
  @ApiProperty({ type: [UpdateWorkoutExerciseDto] })
  workoutExercises: UpdateWorkoutExerciseDto[];
}
