import { ApiProperty } from '@nestjs/swagger';
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
} from '../enums/workout.enum';

class WorkoutSetValueDto {
  @Expose()
  @ApiProperty()
  reps: number;

  @Expose()
  @Transform(({ value }) => (value != null ? Number(value) : null))
  @ApiProperty()
  weight: number;

  @Expose()
  @Transform(({ value }) => (value != null ? Number(value) : null))
  @ApiProperty()
  distance: number;

  @Expose()
  @ApiProperty()
  duration: number;
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
  @ApiProperty()
  restTime: number;

  @Expose()
  @Type(() => ExerciseDto)
  @ApiProperty({ type: () => ExerciseDto })
  exercise: ExerciseDto;

  @Expose()
  @Type(() => WorkoutExerciseSetDto)
  @ApiProperty({ type: () => [WorkoutExerciseSetDto] })
  sets: WorkoutExerciseSetDto[];
}

class WorkoutMuscleIDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @Type(() => MuscleDto)
  @ApiProperty({ type: () => MuscleDto })
  muscle: MuscleDto;
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
  @ApiProperty()
  imageUrl: string;

  @Expose()
  @ApiProperty()
  description: string;

  @Expose()
  @ApiProperty()
  duration: number;

  @Expose({ name: 'workout_exercises' })
  @Type(() => WorkoutExerciseDto)
  @ApiProperty({ type: () => [WorkoutExerciseDto] })
  workoutExercises: WorkoutExerciseDto[];

  @Expose()
  @Type(() => WorkoutMuscleIDto)
  @ApiProperty({ type: () => [WorkoutMuscleIDto] })
  muscles: WorkoutMuscleIDto[];

  @Expose({ name: 'workout_focus_type' })
  @Type(() => WorkoutFocusTypeDto)
  @ApiProperty({ type: () => WorkoutFocusTypeDto })
  workoutFocusType: WorkoutFocusTypeDto;
}

export class WorkoutScheduleDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose({ name: 'scheduled_date' })
  @ApiProperty()
  scheduledDate: Date;

  @Expose()
  @ApiProperty({ enum: WorkoutScheduleStatus })
  status: WorkoutScheduleStatus;

  @Expose()
  @Type(() => WorkoutDto)
  @ApiProperty({ type: () => WorkoutDto })
  workout: WorkoutDto;
}

class WorkoutSessionExerciseSetDto extends WorkoutSetValueDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose({ name: 'set_number' })
  @ApiProperty()
  setNumber: number;

  @Expose({ name: 'performed_at' })
  @ApiProperty()
  performedAt: Date;

  @Expose({ name: 'completed_at' })
  @ApiProperty()
  completedAt: Date;
}

class WorkoutSessionExerciseDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose({ name: 'order_index' })
  @ApiProperty()
  orderIndex: number;

  @Expose({ name: 'rest_time' })
  @ApiProperty()
  restTime: number;

  @Expose({ name: 'completed_at' })
  @ApiProperty()
  completedAt: Date;

  @Expose()
  @Type(() => ExerciseDto)
  @ApiProperty({ type: () => ExerciseDto })
  exercise: ExerciseDto;

  @Expose()
  @Type(() => WorkoutSessionExerciseSetDto)
  @ApiProperty({ type: () => [WorkoutSessionExerciseSetDto] })
  sets: WorkoutSessionExerciseSetDto[];
}

export class WorkoutSessionDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  status: string;

  @Expose({ name: 'started_at' })
  @ApiProperty()
  startedAt: Date;

  @Expose({ name: 'paused_at' })
  @ApiProperty()
  pausedAt: Date;

  @Expose({ name: 'ended_at' })
  @ApiProperty()
  endedAt: Date;

  @Expose({ name: 'total_paused_duration' })
  @ApiProperty()
  totalPausedDuration: number;

  @Expose({ name: 'total_duration' })
  @ApiProperty()
  totalDuration: number;

  @Expose({ name: 'calories_burned' })
  @ApiProperty()
  caloriesBurned: number;

  @Expose({ name: 'workout' })
  @Type(() => WorkoutDto)
  @ApiProperty({ type: () => WorkoutDto })
  workout: WorkoutDto;

  @Expose({ name: 'session_exercises' })
  @Type(() => WorkoutSessionExerciseDto)
  @ApiProperty({ type: () => [WorkoutSessionExerciseDto] })
  sessionExercises: WorkoutSessionExerciseDto[];
}

export class WorkoutCurrentDto {
  @Expose()
  @ApiProperty({ enum: WorkoutCurrentMode })
  mode: WorkoutCurrentMode;

  @Expose()
  @Type(() => WorkoutSessionDto)
  @ApiProperty({ type: () => WorkoutSessionDto })
  session: WorkoutSessionDto | null;

  @Expose()
  @Type(() => WorkoutScheduleDto)
  @ApiProperty({ type: () => WorkoutScheduleDto })
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
  @ApiProperty()
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
  @ApiProperty({ nullable: true })
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
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  completedAt: Date | null;

  @Expose()
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  setCompletedAt: Date | null;
}

export class WorkoutProgressOverviewDto {
  @Expose()
  @ApiProperty()
  type: WorkoutProgressOverviewType;

  @Expose()
  @ApiProperty()
  startDate: Date;

  @Expose()
  @ApiProperty()
  endDate: Date;

  @Expose()
  @Type(() => WorkoutProgressSummaryDto)
  @ApiProperty({ type: () => WorkoutProgressSummaryDto })
  summary: WorkoutProgressSummaryDto;

  @Expose()
  @Type(() => WorkoutProgressVolumeTrendDto)
  @ApiProperty({ type: () => [WorkoutProgressVolumeTrendDto] })
  volumeTrend: WorkoutProgressVolumeTrendDto[];

  @Expose()
  @Type(() => WorkoutProgressBestPerformanceDto)
  @ApiProperty({ type: () => [WorkoutProgressBestPerformanceDto] })
  bestPerformances: WorkoutProgressBestPerformanceDto[];
}
