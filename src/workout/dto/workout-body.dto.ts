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
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

class WorkoutSetValueDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional()
  reps: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  weight: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  distance: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional()
  duration: number | null;
}

class SaveWorkoutExerciseSetDto extends WorkoutSetValueDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiPropertyOptional()
  id: number | null;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty()
  setNumber: number;
}

export class SaveWorkoutExerciseDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiPropertyOptional()
  id: number | null;

  @IsNotEmpty()
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
  restTime: number | null;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  exerciseId: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SaveWorkoutExerciseSetDto)
  @ApiProperty({ type: [SaveWorkoutExerciseSetDto] })
  sets: SaveWorkoutExerciseSetDto[];
}

export class SaveWorkoutDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty()
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiPropertyOptional()
  workoutFocusTypeId: number | null;

  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @ApiProperty({ type: [Number] })
  targetMuscles: number[];

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty()
  duration: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SaveWorkoutExerciseDto)
  @ApiProperty({ type: [SaveWorkoutExerciseDto] })
  workoutExercises: SaveWorkoutExerciseDto[];
}

export class FinishWorkoutSessionSetDto extends WorkoutSetValueDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiPropertyOptional()
  id: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiPropertyOptional()
  workoutExerciseSetId: number | null;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty()
  setNumber: number;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  performedAt: string | null;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  completedAt: string | null;
}

export class FinishWorkoutSessionExerciseDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiPropertyOptional()
  id: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiPropertyOptional()
  workoutExerciseId: number | null;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  exerciseId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty()
  orderIndex: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional()
  restTime: number | null;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  completedAt: string | null;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => FinishWorkoutSessionSetDto)
  @ApiProperty({ type: [FinishWorkoutSessionSetDto] })
  sets: FinishWorkoutSessionSetDto[];
}

export class FinishWorkoutSessionDto {
  @IsNotEmpty()
  @IsDateString()
  @ApiProperty()
  endedAt: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional()
  totalDuration: number | null;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty()
  totalPausedDuration: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  caloriesBurned: number | null;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => FinishWorkoutSessionExerciseDto)
  @ApiProperty({ type: [FinishWorkoutSessionExerciseDto] })
  sessionExercises: FinishWorkoutSessionExerciseDto[];
}

export class UpdateWorkoutScheduleWorkoutDto {
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({ example: 1 })
  workoutId: number;
}
