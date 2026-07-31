import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  DifficultyLevel,
  EquipmentCategory,
  ExerciseMediaType,
  ExerciseMuscleRole,
  ExerciseOrigin,
  ExerciseStatus,
} from 'src/workout/enums/workout.enum';

export class MuscleDto {
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

export class ExerciseCategoryDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  code: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty({
    type: String,
    nullable: true,
  })
  description: string | null;

  @Expose({ name: 'display_order' })
  @ApiProperty()
  displayOrder: number;

  @Expose({ name: 'is_active' })
  @ApiProperty()
  isActive: boolean;
}

export class EquipmentDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  code: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty({ enum: EquipmentCategory })
  category: EquipmentCategory;
}

class ExerciseMuscleItemDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty({ enum: ExerciseMuscleRole })
  role: ExerciseMuscleRole;

  @Expose()
  @Type(() => MuscleDto)
  @ApiPropertyOptional({ type: MuscleDto })
  muscle?: MuscleDto;
}

class ExerciseEquipmentDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @Type(() => EquipmentDto)
  @ApiPropertyOptional({ type: EquipmentDto })
  equipment?: EquipmentDto;
}

class ExerciseSourceDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  key: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose({ name: 'source_url' })
  @ApiProperty()
  sourceUrl: string;

  @Expose({ name: 'license_name' })
  @ApiProperty({
    type: String,
    nullable: true,
  })
  licenseName: string | null;

  @Expose({ name: 'license_url' })
  @ApiProperty({
    type: String,
    nullable: true,
  })
  licenseUrl: string | null;

  @Expose({ name: 'attribution_text' })
  @ApiProperty({
    type: String,
    nullable: true,
  })
  attributionText: string | null;

  @Expose({ name: 'source_version' })
  @ApiProperty({
    type: String,
    nullable: true,
  })
  sourceVersion: string | null;

  @Expose({ name: 'source_commit_hash' })
  @ApiProperty({
    type: String,
    nullable: true,
  })
  sourceCommitHash: string | null;

  @Expose({ name: 'imported_at' })
  @Type(() => Date)
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  importedAt: Date | null;
}

class ExerciseMediaDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose({ name: 'media_type' })
  @ApiProperty({ enum: ExerciseMediaType })
  mediaType: ExerciseMediaType;

  @Expose()
  @ApiProperty()
  url: string;

  @Expose({ name: 'public_id' })
  @ApiProperty({
    type: String,
    nullable: true,
  })
  publicId: string | null;

  @Expose({ name: 'source_path' })
  @ApiProperty({
    type: String,
    nullable: true,
  })
  sourcePath: string | null;

  @Expose({ name: 'display_order' })
  @ApiProperty()
  displayOrder: number;

  @Expose({ name: 'is_primary' })
  @ApiProperty()
  isPrimary: boolean;

  @Expose()
  @Type(() => ExerciseSourceDto)
  @ApiPropertyOptional({
    type: ExerciseSourceDto,
    nullable: true,
  })
  source?: ExerciseSourceDto | null;
}

class ExerciseConfigDto {
  @Expose({ name: 'default_calories_burned' })
  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Default calories burned per set for strength exercises or per minute for cardio exercises.',
  })
  defaultCaloriesBurned: number | null;

  @Expose({ name: 'default_duration' })
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Default exercise duration in seconds.',
  })
  defaultDuration: number | null;

  @Expose({ name: 'default_rest_time' })
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Default rest time in seconds.',
  })
  defaultRestTime: number | null;

  @Expose({ name: 'default_reps_range' })
  @ApiProperty({
    type: String,
    nullable: true,
    example: '8-12',
  })
  defaultRepsRange: string | null;

  @Expose({ name: 'default_sets' })
  @ApiProperty({
    type: Number,
    nullable: true,
  })
  defaultSets: number | null;
}

export class ExerciseDto extends ExerciseConfigDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty({ enum: ExerciseOrigin })
  origin: ExerciseOrigin;

  @Expose()
  @ApiProperty({ enum: ExerciseStatus })
  status: ExerciseStatus;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty({
    type: String,
    nullable: true,
  })
  description: string | null;

  @Expose()
  @Type(() => ExerciseCategoryDto)
  @ApiPropertyOptional({ type: ExerciseCategoryDto })
  category?: ExerciseCategoryDto;

  @Expose({ name: 'difficulty_level' })
  @ApiProperty({
    enum: DifficultyLevel,
    nullable: true,
  })
  difficultyLevel: DifficultyLevel | null;

  @Expose({ name: 'demo_link' })
  @ApiProperty({
    type: String,
    nullable: true,
  })
  demoLink: string | null;

  @Expose({ name: 'how_to_perform' })
  @ApiProperty({
    type: [String],
    nullable: true,
  })
  howToPerform: string[] | null;

  @Expose({ name: 'source_external_id' })
  @ApiProperty({
    type: String,
    nullable: true,
  })
  sourceExternalId: string | null;

  @Expose()
  @Type(() => ExerciseSourceDto)
  @ApiPropertyOptional({
    type: ExerciseSourceDto,
    nullable: true,
  })
  source?: ExerciseSourceDto | null;

  @Expose()
  @Type(() => ExerciseMediaDto)
  @ApiPropertyOptional({
    type: [ExerciseMediaDto],
  })
  media?: ExerciseMediaDto[];

  @Expose()
  @Type(() => ExerciseMuscleItemDto)
  @ApiPropertyOptional({
    type: [ExerciseMuscleItemDto],
  })
  muscles?: ExerciseMuscleItemDto[];

  @Expose({ name: 'equipment_links' })
  @Type(() => ExerciseEquipmentDto)
  @ApiPropertyOptional({
    type: [ExerciseEquipmentDto],
  })
  equipmentLinks?: ExerciseEquipmentDto[];
}

class WorkoutSetPerformanceDto {
  @Expose({ name: 'set_number' })
  @ApiProperty()
  setNumber: number;

  @Expose()
  @ApiProperty({
    type: Number,
    nullable: true,
  })
  weight: number | null;

  @Expose()
  @ApiProperty({
    type: Number,
    nullable: true,
  })
  reps: number | null;

  @Expose()
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

export class ExercisePerformanceSummaryDto {
  @Expose()
  @Type(() => WorkoutSetPerformanceDto)
  @ApiProperty({ type: [WorkoutSetPerformanceDto] })
  previousSets: WorkoutSetPerformanceDto[];

  @Expose()
  @Type(() => WorkoutSetPerformanceDto)
  @ApiProperty({ type: [WorkoutSetPerformanceDto] })
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
