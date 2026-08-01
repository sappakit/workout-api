import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsDefined,
  IsEnum,
  IsInt,
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
  @ValidateIf((_dto, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({
    type: Number,
    nullable: true,
  })
  reps: number | null;

  @ValidateIf((_dto, value) => value !== null)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiProperty({
    type: Number,
    nullable: true,
  })
  weight: number | null;

  @ValidateIf((_dto, value) => value !== null)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiProperty({
    type: Number,
    nullable: true,
  })
  distance: number | null;

  @ValidateIf((_dto, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Set duration in seconds.',
  })
  duration: number | null;
}

class SaveWorkoutExerciseSetDto extends WorkoutSetValueDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({
    type: Number,
    nullable: true,
  })
  id?: number | null;

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
  @Min(1)
  @ApiPropertyOptional({
    type: Number,
    nullable: true,
  })
  id?: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty()
  orderIndex: number;

  @ValidateIf((_dto, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Rest time in seconds.',
  })
  restTime: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
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
  @MaxLength(100)
  @ApiProperty()
  name: string;

  @ValidateIf((_dto, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({
    type: Number,
    nullable: true,
  })
  workoutFocusTypeId: number | null;

  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @ApiProperty({ type: [Number] })
  targetMuscles: number[];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({
    description: 'Estimated workout duration in seconds.',
  })
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
  @Min(1)
  @ApiPropertyOptional({
    type: Number,
    nullable: true,
  })
  id?: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty()
  setNumber: number;

  @ValidateIf((_dto, value) => value !== null)
  @IsDateString()
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  performedAt: string | null;

  @ValidateIf((_dto, value) => value !== null)
  @IsDateString()
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  completedAt: string | null;
}

export class FinishWorkoutSessionExerciseDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({
    type: Number,
    nullable: true,
  })
  id?: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty()
  exerciseId: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty()
  orderIndex: number;

  @ValidateIf((_dto, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Rest time in seconds.',
  })
  restTime: number | null;

  @ValidateIf((_dto, value) => value !== null)
  @IsDateString()
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  completedAt: string | null;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => FinishWorkoutSessionSetDto)
  @ApiProperty({ type: [FinishWorkoutSessionSetDto] })
  sets: FinishWorkoutSessionSetDto[];
}

export class FinishWorkoutSessionDto {
  @IsDateString()
  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  endedAt: string;

  @ValidateIf((_dto, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Total workout duration in seconds.',
  })
  totalDuration: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({
    description: 'Total paused duration in seconds.',
  })
  totalPausedDuration: number;

  @ValidateIf((_dto, value) => value !== null)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiProperty({
    type: Number,
    nullable: true,
  })
  caloriesBurned: number | null;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => FinishWorkoutSessionExerciseDto)
  @ApiProperty({ type: [FinishWorkoutSessionExerciseDto] })
  sessionExercises: FinishWorkoutSessionExerciseDto[];
}

export class UpdateWorkoutScheduleWorkoutDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 1 })
  workoutId: number;
}

export class UpdateWorkoutWeeklyPlanDayDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  @ApiProperty({
    example: 1,
    description: 'ISO weekday: 1 = Monday, 7 = Sunday.',
  })
  dayOfWeek: number;

  @IsEnum(WorkoutWeeklyPlanDayType)
  @ApiProperty({
    enum: WorkoutWeeklyPlanDayType,
    example: WorkoutWeeklyPlanDayType.WORKOUT,
  })
  dayType: WorkoutWeeklyPlanDayType;

  @ValidateIf((dto) => dto.dayType === WorkoutWeeklyPlanDayType.WORKOUT)
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 1,
    description:
      'Required when dayType is WORKOUT. Omitted or ignored for REST and UNASSIGNED.',
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
