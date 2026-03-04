import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  DifficultyLevel,
  EquipmentCategory,
  ExerciseType,
  WorkoutScheduleStatus,
} from '../enums/workout.enum';

export class MuscleResponseDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  name: string;
}

class EquipmentDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  category: EquipmentCategory;
}

class ExerciseMuscleItemDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @Type(() => MuscleResponseDto)
  @ApiProperty({ type: () => MuscleResponseDto })
  muscle: MuscleResponseDto;
}

export class ExerciseEquipmentDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @Type(() => EquipmentDto)
  @ApiProperty({ type: () => EquipmentDto })
  equipment: EquipmentDto;
}

export class ExerciseResponseDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  description: string;

  @Expose({ name: 'exercise_type' })
  @ApiProperty()
  exerciseType: ExerciseType;

  @Expose({ name: 'difficulty_level' })
  @ApiProperty()
  difficultyLevel: DifficultyLevel;

  @Expose({ name: 'default_calories_burned' })
  @ApiProperty()
  defaultCaloriesBurned: number;

  @Expose({ name: 'default_duration' })
  @ApiProperty()
  defaultDuration: number;

  @Expose({ name: 'default_rest_time' })
  @ApiProperty()
  defaultRestTime: number;

  @Expose({ name: 'default_reps_range' })
  @ApiProperty()
  defaultRepsRange: string;

  @Expose({ name: 'default_sets' })
  @ApiProperty()
  defaultSets: number;

  @Expose({ name: 'demo_link' })
  @ApiProperty()
  demoLink: string;

  @Expose({ name: 'how_to_perform' })
  @ApiProperty()
  howToPerform: string;

  @Expose()
  @Type(() => ExerciseMuscleItemDto)
  @ApiProperty({ type: () => [ExerciseMuscleItemDto] })
  muscles: ExerciseMuscleItemDto[];

  @Expose({ name: 'equipment_links' })
  @Type(() => ExerciseEquipmentDto)
  @ApiProperty({ type: () => [ExerciseEquipmentDto] })
  equipmentLinks: ExerciseEquipmentDto[];
}

export class EquipmentResponseDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  category: EquipmentCategory;
}

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
  @Type(() => ExerciseResponseDto)
  @ApiProperty({ type: () => ExerciseResponseDto })
  exercise: ExerciseResponseDto;
}

class WorkoutMuscleItemDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @Type(() => MuscleResponseDto)
  @ApiProperty({ type: () => MuscleResponseDto })
  muscle: MuscleResponseDto;
}

class workoutFocusTypeDto {
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

export class WorkoutResponseDto {
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
  @Type(() => workoutFocusTypeDto)
  @ApiProperty({ type: () => workoutFocusTypeDto })
  workoutFocusType: workoutFocusTypeDto;
}

export class WorkoutScheduleResponseDto {
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
  @Type(() => WorkoutResponseDto)
  @ApiProperty({ type: () => WorkoutResponseDto })
  workout: WorkoutResponseDto;
}
