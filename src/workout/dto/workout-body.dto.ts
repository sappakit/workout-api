import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { WorkoutWeeklyPlanDayType } from '../enums/workout.enum';

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

export class UpdateWorkoutWeeklyPlanDayDto {
  @IsInt()
  @Min(1)
  @Max(7)
  @ApiProperty({
    example: 1,
    description: '1 = Monday, 7 = Sunday',
  })
  dayOfWeek: number;

  @IsEnum(WorkoutWeeklyPlanDayType)
  @ApiProperty({
    enum: WorkoutWeeklyPlanDayType,
    example: WorkoutWeeklyPlanDayType.WORKOUT,
  })
  dayType: WorkoutWeeklyPlanDayType;

  @ValidateIf((dto) => dto.dayType === WorkoutWeeklyPlanDayType.WORKOUT)
  @IsNotEmpty()
  @IsInt()
  @ApiPropertyOptional({
    example: 1,
    nullable: true,
    description:
      'Required when dayType is WORKOUT. Ignored for REST/UNASSIGNED.',
  })
  workoutId?: number | null;
}

export class UpdateWorkoutWeeklyPlanDto {
  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => UpdateWorkoutWeeklyPlanDayDto)
  @ApiProperty({
    type: [UpdateWorkoutWeeklyPlanDayDto],
  })
  days: UpdateWorkoutWeeklyPlanDayDto[];
}
