import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { WorkoutScheduleStatus } from '../enums/workout.enum';
import { ExerciseDto, MuscleDto } from 'src/exercise/dto/exercise-response.dto';

class WorkoutExerciseItemDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose({ name: 'order_index' })
  @ApiProperty()
  orderIndex: number;

  @Expose({ name: 'planned_sets' })
  @ApiProperty()
  plannedSets: number;

  @Expose({ name: 'planned_reps_range' })
  @ApiProperty()
  plannedRepsRange: string;

  @Expose({ name: 'planned_weight' })
  @Transform(({ value }) => (value ? Number(value) : null)) // Convert to number
  @ApiProperty()
  plannedWeight: number;

  @Expose({ name: 'planned_rest_time' })
  @ApiProperty()
  plannedRestTime: number;

  @Expose({ name: 'planned_duration' })
  @ApiProperty()
  plannedDuration: number;

  @Expose({ name: 'planned_distance' })
  @ApiProperty()
  plannedDistance: number;

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
