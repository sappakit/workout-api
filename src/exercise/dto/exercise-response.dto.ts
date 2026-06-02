import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  DifficultyLevel,
  EquipmentCategory,
  ExerciseType,
} from 'src/workout/enums/workout.enum';

export class MuscleDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  name: string;
}

export class EquipmentDto {
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
  @Type(() => MuscleDto)
  @ApiProperty({ type: () => MuscleDto })
  muscle: MuscleDto;
}

class ExerciseEquipmentDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @Type(() => EquipmentDto)
  @ApiProperty({ type: () => EquipmentDto })
  equipment: EquipmentDto;
}

export class ExerciseDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  description: string;

  @Expose({ name: 'image_url' })
  @ApiProperty()
  imageUrl: string;

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

class WorkoutSetPerformanceDto {
  @Expose()
  @ApiProperty()
  setNumber: number;

  @Expose()
  @ApiProperty({ nullable: true })
  weight: number | null;

  @Expose()
  @ApiProperty({ nullable: true })
  reps: number | null;

  @Expose()
  @ApiProperty({ nullable: true })
  distance: number | null;

  @Expose()
  @ApiProperty({ nullable: true })
  duration: number | null;
}

export class ExercisePerformanceSummaryDto {
  @Expose()
  @Type(() => WorkoutSetPerformanceDto)
  @ApiProperty({ type: () => [WorkoutSetPerformanceDto] })
  previousSets: WorkoutSetPerformanceDto[];

  @Expose()
  @Type(() => WorkoutSetPerformanceDto)
  @ApiProperty({ type: () => [WorkoutSetPerformanceDto] })
  bestSets: WorkoutSetPerformanceDto[];
}

export const exercisePerformanceByExerciseIdSchema = {
  type: 'object',
  additionalProperties: {
    $ref: getSchemaPath(ExercisePerformanceSummaryDto),
  },
  example: {
    1: {
      previousSets: [
        {
          setNumber: 1,
          weight: 80,
          reps: 10,
          distance: null,
          duration: null,
        },
      ],
      bestSets: [
        {
          setNumber: 1,
          weight: 100,
          reps: 8,
          distance: null,
          duration: null,
        },
      ],
    },
    2: {
      previousSets: [
        {
          setNumber: 1,
          weight: null,
          reps: null,
          distance: 5,
          duration: 1800,
        },
      ],
      bestSets: [
        {
          setNumber: 1,
          weight: null,
          reps: null,
          distance: 10,
          duration: 3600,
        },
      ],
    },
  },
} as const;

export class ExercisePerformanceByExerciseIdDto {
  @Expose()
  @ApiProperty(exercisePerformanceByExerciseIdSchema)
  data: Record<number, ExercisePerformanceSummaryDto>;
}
