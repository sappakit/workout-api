import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  WorkoutCurrentMode,
  WorkoutProgressOverviewType,
  WorkoutScheduleStatus,
} from '../enums/workout.enum';
import { ExerciseDto, MuscleDto } from 'src/exercise/dto/exercise-response.dto';

class PlannedWorkoutExerciseConfigDto {
  @Expose({ name: 'planned_sets' })
  @ApiProperty()
  plannedSets: number;

  @Expose({ name: 'planned_reps_range' })
  @ApiProperty()
  plannedRepsRange: string;

  @Expose({ name: 'planned_weight' })
  @Transform(({ value }) => (value != null ? Number(value) : null)) // Convert to number
  @ApiProperty()
  plannedWeight: number;

  @Expose({ name: 'planned_rest_time' })
  @ApiProperty()
  plannedRestTime: number;

  @Expose({ name: 'planned_duration' })
  @ApiProperty()
  plannedDuration: number;

  @Expose({ name: 'planned_distance' })
  @Transform(({ value }) => (value != null ? Number(value) : null))
  @ApiProperty()
  plannedDistance: number;
}

export class WorkoutExerciseItemDto extends PlannedWorkoutExerciseConfigDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose({ name: 'order_index' })
  @ApiProperty()
  orderIndex: number;

  @Expose()
  @Type(() => ExerciseDto)
  @ApiProperty({ type: () => ExerciseDto })
  exercise: ExerciseDto;
}

class WorkoutMuscleItemDto {
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

  @Expose()
  @ApiProperty()
  description: string;

  @Expose()
  @ApiProperty()
  duration: number;

  @Expose({ name: 'workout_exercises' })
  @Type(() => WorkoutExerciseItemDto)
  @ApiProperty({ type: () => [WorkoutExerciseItemDto] })
  workoutExercises: WorkoutExerciseItemDto[];

  @Expose()
  @Type(() => WorkoutMuscleItemDto)
  @ApiProperty({ type: () => [WorkoutMuscleItemDto] })
  muscles: WorkoutMuscleItemDto[];

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

class WorkoutSessionExerciseSetDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose({ name: 'set_number' })
  @ApiProperty()
  setNumber: number;

  @Expose()
  @ApiProperty()
  reps: number;

  @Expose()
  @ApiProperty()
  weight: number;

  @Expose()
  @ApiProperty()
  distance: number;

  @Expose()
  @ApiProperty()
  duration: number;

  @Expose({ name: 'performed_at' })
  @ApiProperty()
  performedAt: Date;

  @Expose({ name: 'completed_at' })
  @ApiProperty()
  completedAt: Date;
}

class WorkoutSessionExerciseDto extends PlannedWorkoutExerciseConfigDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose({ name: 'order_index' })
  @ApiProperty()
  orderIndex: number;

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
  exerciseName: string;

  @Expose()
  @ApiProperty()
  bestWeightKg: number;

  @Expose()
  @ApiProperty()
  bestSetVolumeKg: number;

  @Expose()
  @ApiProperty({ example: '60 kg x 10 reps' })
  bestSetLabel: string;
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
