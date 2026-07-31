import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  ExerciseDto,
  exercisePerformanceByExerciseIdSchema,
  ExercisePerformanceSummaryDto,
  MuscleDto,
} from 'src/exercise/dto/exercise-response.dto';
import {
  WorkoutCurrentMode,
  WorkoutProgressOverviewType,
  WorkoutScheduleStatus,
  WorkoutSessionStatus,
  WorkoutWeeklyPlanDayType,
} from '../enums/workout.enum';

class WorkoutSetValueDto {
  @Expose()
  @ApiProperty({
    type: Number,
    nullable: true,
  })
  reps: number | null;

  @Expose()
  @Transform(({ value }) => (value != null ? Number(value) : null))
  @ApiProperty({
    type: Number,
    nullable: true,
  })
  weight: number | null;

  @Expose()
  @Transform(({ value }) => (value != null ? Number(value) : null))
  @ApiProperty({
    type: Number,
    nullable: true,
  })
  distance: number | null;

  @Expose()
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Set duration in seconds.',
  })
  duration: number | null;
}

class WorkoutExerciseSetDto extends WorkoutSetValueDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose({ name: 'set_number' })
  @ApiProperty()
  setNumber: number;
}

class WorkoutExerciseDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose({ name: 'order_index' })
  @ApiProperty()
  orderIndex: number;

  @Expose({ name: 'rest_time' })
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Rest time after the exercise in seconds.',
  })
  restTime: number | null;

  @Expose()
  @Type(() => ExerciseDto)
  @ApiPropertyOptional({ type: ExerciseDto })
  exercise?: ExerciseDto;

  @Expose()
  @Type(() => WorkoutExerciseSetDto)
  @ApiPropertyOptional({ type: [WorkoutExerciseSetDto] })
  sets?: WorkoutExerciseSetDto[];
}

class WorkoutMuscleDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @Type(() => MuscleDto)
  @ApiPropertyOptional({ type: MuscleDto })
  muscle?: MuscleDto;
}

export class WorkoutFocusTypeDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  code: string;

  @Expose()
  @ApiProperty()
  name: string;
}

export class WorkoutDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose({ name: 'image_url' })
  @ApiProperty({
    type: String,
    nullable: true,
  })
  imageUrl: string | null;

  @Expose()
  @ApiProperty({
    type: String,
    nullable: true,
  })
  description: string | null;

  @Expose()
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Estimated workout duration in seconds.',
  })
  duration: number | null;

  @Expose({ name: 'workout_exercises' })
  @Type(() => WorkoutExerciseDto)
  @ApiPropertyOptional({ type: [WorkoutExerciseDto] })
  workoutExercises?: WorkoutExerciseDto[];

  @Expose()
  @Type(() => WorkoutMuscleDto)
  @ApiPropertyOptional({ type: [WorkoutMuscleDto] })
  muscles?: WorkoutMuscleDto[];

  @Expose({ name: 'workout_focus_type' })
  @Type(() => WorkoutFocusTypeDto)
  @ApiPropertyOptional({
    type: WorkoutFocusTypeDto,
    nullable: true,
  })
  workoutFocusType?: WorkoutFocusTypeDto | null;
}

export class WorkoutScheduleDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose({ name: 'scheduled_date' })
  @ApiProperty({
    type: String,
    format: 'date',
    example: '2026-07-25',
  })
  scheduledDate: string;

  @Expose()
  @ApiProperty({ enum: WorkoutScheduleStatus })
  status: WorkoutScheduleStatus;

  @Expose()
  @Type(() => WorkoutDto)
  @ApiPropertyOptional({ type: WorkoutDto })
  workout?: WorkoutDto;
}

class WorkoutSessionExerciseSetDto extends WorkoutSetValueDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose({ name: 'set_number' })
  @ApiProperty()
  setNumber: number;

  @Expose({ name: 'performed_at' })
  @Type(() => Date)
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  performedAt: Date | null;

  @Expose({ name: 'completed_at' })
  @Type(() => Date)
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  completedAt: Date | null;
}

class WorkoutSessionExerciseDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose({ name: 'order_index' })
  @ApiProperty()
  orderIndex: number;

  @Expose({ name: 'rest_time' })
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Rest time after the exercise in seconds.',
  })
  restTime: number | null;

  @Expose({ name: 'completed_at' })
  @Type(() => Date)
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  completedAt: Date | null;

  @Expose()
  @Type(() => ExerciseDto)
  @ApiPropertyOptional({ type: ExerciseDto })
  exercise?: ExerciseDto;

  @Expose()
  @Type(() => WorkoutSessionExerciseSetDto)
  @ApiPropertyOptional({ type: [WorkoutSessionExerciseSetDto] })
  sets?: WorkoutSessionExerciseSetDto[];
}

export class WorkoutSessionDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty({ enum: WorkoutSessionStatus })
  status: WorkoutSessionStatus;

  @Expose({ name: 'started_at' })
  @Type(() => Date)
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  startedAt: Date | null;

  @Expose({ name: 'paused_at' })
  @Type(() => Date)
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  pausedAt: Date | null;

  @Expose({ name: 'ended_at' })
  @Type(() => Date)
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  endedAt: Date | null;

  @Expose({ name: 'total_paused_duration' })
  @ApiProperty({
    description: 'Total paused duration in seconds.',
  })
  totalPausedDuration: number;

  @Expose({ name: 'total_duration' })
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Total workout duration in seconds.',
  })
  totalDuration: number | null;

  @Expose({ name: 'calories_burned' })
  @ApiProperty({
    type: Number,
    nullable: true,
  })
  caloriesBurned: number | null;

  @Expose()
  @Type(() => WorkoutDto)
  @ApiPropertyOptional({
    type: WorkoutDto,
    nullable: true,
  })
  workout?: WorkoutDto | null;

  @Expose({ name: 'session_exercises' })
  @Type(() => WorkoutSessionExerciseDto)
  @ApiPropertyOptional({ type: [WorkoutSessionExerciseDto] })
  sessionExercises?: WorkoutSessionExerciseDto[];
}

export class WorkoutCurrentDto {
  @Expose()
  @ApiProperty({ enum: WorkoutCurrentMode })
  mode: WorkoutCurrentMode;

  @Expose()
  @Type(() => WorkoutSessionDto)
  @ApiProperty({
    type: WorkoutSessionDto,
    nullable: true,
  })
  session: WorkoutSessionDto | null;

  @Expose()
  @Type(() => WorkoutScheduleDto)
  @ApiProperty({
    type: WorkoutScheduleDto,
    nullable: true,
  })
  schedule: WorkoutScheduleDto | null;

  @Expose()
  @ApiProperty(exercisePerformanceByExerciseIdSchema)
  performanceByExerciseId: Record<number, ExercisePerformanceSummaryDto>;

  @Expose()
  @ApiProperty()
  hasCompletedWorkoutToday: boolean;
}

class WorkoutProgressSummaryDto {
  @Expose()
  @ApiProperty()
  workoutsCompleted: number;

  @Expose()
  @ApiProperty()
  totalVolumeKg: number;

  @Expose()
  @ApiProperty()
  completedSets: number;

  @Expose()
  @ApiProperty()
  totalReps: number;

  @Expose()
  @ApiProperty({
    description: 'Total completed workout duration in seconds.',
  })
  totalDurationSeconds: number;
}

class WorkoutProgressVolumeTrendDto {
  @Expose()
  @ApiProperty({ example: 'Mon' })
  label: string;

  @Expose()
  @ApiProperty()
  volumeKg: number;
}

class WorkoutProgressBestPerformanceDto {
  @Expose()
  @ApiProperty()
  exerciseId: number;

  @Expose()
  @ApiProperty()
  exerciseName: string;

  @Expose()
  @ApiProperty({
    type: String,
    nullable: true,
  })
  exerciseImageUrl: string | null;

  @Expose()
  @ApiProperty()
  bestWeightKg: number;

  @Expose()
  @ApiProperty()
  bestSetVolumeKg: number;

  @Expose()
  @ApiProperty({ example: '60 kg x 10 reps' })
  bestSetLabel: string;

  @Expose()
  @Type(() => Date)
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  completedAt: Date | null;

  @Expose()
  @Type(() => Date)
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  setCompletedAt: Date | null;
}

export class WorkoutProgressOverviewDto {
  @Expose()
  @ApiProperty({ enum: WorkoutProgressOverviewType })
  type: WorkoutProgressOverviewType;

  @Expose()
  @Type(() => Date)
  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  startDate: Date;

  @Expose()
  @Type(() => Date)
  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  endDate: Date;

  @Expose()
  @Type(() => WorkoutProgressSummaryDto)
  @ApiProperty({ type: WorkoutProgressSummaryDto })
  summary: WorkoutProgressSummaryDto;

  @Expose()
  @Type(() => WorkoutProgressVolumeTrendDto)
  @ApiProperty({ type: [WorkoutProgressVolumeTrendDto] })
  volumeTrend: WorkoutProgressVolumeTrendDto[];

  @Expose()
  @Type(() => WorkoutProgressBestPerformanceDto)
  @ApiProperty({ type: [WorkoutProgressBestPerformanceDto] })
  bestPerformances: WorkoutProgressBestPerformanceDto[];
}

export class WorkoutTodayOverviewDto {
  @Expose()
  @ApiProperty({ enum: WorkoutWeeklyPlanDayType })
  todayPlanType: WorkoutWeeklyPlanDayType;

  @Expose()
  @Type(() => WorkoutScheduleDto)
  @ApiProperty({
    type: WorkoutScheduleDto,
    nullable: true,
  })
  schedule: WorkoutScheduleDto | null;

  @Expose()
  @ApiProperty()
  hasCompletedWorkoutToday: boolean;
}

export class WorkoutWeeklyPlanDayDto {
  @Expose()
  @ApiProperty({
    type: Number,
    nullable: true,
  })
  id: number | null;

  @Expose({ name: 'day_of_week' })
  @ApiProperty({
    example: 1,
    description: 'ISO weekday: 1 = Monday, 7 = Sunday.',
  })
  dayOfWeek: number;

  @Expose({ name: 'day_type' })
  @ApiProperty({
    enum: WorkoutWeeklyPlanDayType,
    example: WorkoutWeeklyPlanDayType.WORKOUT,
  })
  dayType: WorkoutWeeklyPlanDayType;

  @Expose()
  @Type(() => WorkoutDto)
  @ApiProperty({
    type: WorkoutDto,
    nullable: true,
  })
  workout: WorkoutDto | null;
}

export class WorkoutWeeklyPlanDto {
  @Expose()
  @Type(() => WorkoutWeeklyPlanDayDto)
  @ApiProperty({ type: [WorkoutWeeklyPlanDayDto] })
  days: WorkoutWeeklyPlanDayDto[];
}
