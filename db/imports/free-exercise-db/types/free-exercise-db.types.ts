import { ExerciseCategory } from 'db/entities/workout/exercise/exercise-category.entity';
import { ExerciseSource } from 'db/entities/workout/exercise/exercise-source.entity';
import { ExerciseTrackingType } from 'db/entities/workout/exercise/exercise-tracking-type.entity';
import { Equipment } from 'db/entities/workout/shared/equipment.entity';
import { Muscle } from 'db/entities/workout/shared/muscles.entity';
import { ExerciseMetadataImportRecord } from './import-result.types';

export const FREE_EXERCISE_DB_IMPORT_TASKS = [
  'inspect',
  'metadata',
  'tracking-types',
  'images',
] as const;

export type FreeExerciseDbImportTask =
  (typeof FREE_EXERCISE_DB_IMPORT_TASKS)[number];

export type FreeExerciseDbExercise = {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
};

export type FreeExerciseDbImportOptions = {
  filePath?: string;
  reportPath?: string;
  trackingTypeMappingPath?: string;
};

export type FreeExerciseDbReferences = {
  source: ExerciseSource;
  categoriesByCode: Map<string, ExerciseCategory>;
  equipmentByCode: Map<string, Equipment>;
  musclesByCode: Map<string, Muscle>;
};

export type FreeExerciseDbTrackingTypeMappingRecord = {
  id: string;
  trackingType: string;
};

export type FreeExerciseDbTrackingTypeReferences = {
  source: ExerciseSource;
  trackingTypesByCode: Map<string, ExerciseTrackingType>;
};

export type PersistFreeExerciseDbInput = {
  records: ExerciseMetadataImportRecord[];
  references: FreeExerciseDbReferences;
};

export type PersistFreeExerciseDbResult = {
  exerciseCount: number;
  equipmentLinkCount: number;
  muscleLinkCount: number;
};

export type PersistFreeExerciseDbTrackingTypesInput = {
  records: FreeExerciseDbTrackingTypeMappingRecord[];
  references: FreeExerciseDbTrackingTypeReferences;
};

export type PersistFreeExerciseDbTrackingTypesResult = {
  exerciseCount: number;
};
