import {
  Equipment,
  ExerciseCategory,
  ExerciseSource,
  Muscle,
} from 'db/entities/workout';
import { ExerciseMetadataImportRecord } from './import-result.types';

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
  dryRun?: boolean;
};

export type FreeExerciseDbReferences = {
  source: ExerciseSource;
  categoriesByCode: Map<string, ExerciseCategory>;
  equipmentByCode: Map<string, Equipment>;
  musclesByCode: Map<string, Muscle>;
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
