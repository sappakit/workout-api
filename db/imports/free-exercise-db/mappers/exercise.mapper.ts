import {
  DifficultyLevel,
  ExerciseOrigin,
  ExerciseStatus,
} from 'src/workout/enums/workout.enum';
import { FreeExerciseDbExercise } from '../types/free-exercise-db.types';
import { ExerciseMetadataImportRecord } from '../types/import-result.types';

export function mapFreeExerciseDbExercise(
  source: FreeExerciseDbExercise,
): ExerciseMetadataImportRecord {
  return {
    sourceExternalId: source.id,

    name: source.name.trim(),
    description: null,
    howToPerform: mapInstructions(source.instructions),

    categoryCode: mapExerciseCategoryCode(source.category),
    difficultyLevel: mapDifficultyLevel(source.level),

    origin: ExerciseOrigin.SYSTEM,
    status: ExerciseStatus.ACTIVE,

    sourceCategory: source.category,
    sourceLevel: source.level,
    sourceEquipment: source.equipment,

    primaryMuscles: source.primaryMuscles,
    secondaryMuscles: source.secondaryMuscles,

    imagePaths: source.images,
  };
}

function mapInstructions(instructions: string[]): string[] | null {
  const normalizedInstructions = instructions
    .map((instruction) => instruction.trim())
    .filter((instruction) => instruction.length > 0);

  if (normalizedInstructions.length === 0) {
    return null;
  }

  return normalizedInstructions;
}

const DIFFICULTY_LEVEL_MAP: Record<string, DifficultyLevel> = {
  beginner: DifficultyLevel.BEGINNER,
  intermediate: DifficultyLevel.INTERMEDIATE,
  expert: DifficultyLevel.ADVANCED,
  advanced: DifficultyLevel.ADVANCED,
};

function mapDifficultyLevel(level: string): DifficultyLevel | null {
  const normalizedLevel = level.trim().toLowerCase();

  return DIFFICULTY_LEVEL_MAP[normalizedLevel] ?? null;
}

const EXERCISE_CATEGORY_CODES = [
  'cardio',
  'olympic-weightlifting',
  'plyometrics',
  'powerlifting',
  'strength',
  'stretching',
  'strongman',
] as const;

type ExerciseCategoryCode = (typeof EXERCISE_CATEGORY_CODES)[number];

const EXERCISE_CATEGORY_CODE_MAP: Record<string, ExerciseCategoryCode> = {
  cardio: 'cardio',
  'olympic weightlifting': 'olympic-weightlifting',
  plyometrics: 'plyometrics',
  powerlifting: 'powerlifting',
  strength: 'strength',
  stretching: 'stretching',
  strongman: 'strongman',
};

function mapExerciseCategoryCode(
  category: string,
): ExerciseCategoryCode | null {
  const normalizedCategory = category.trim().toLowerCase();

  return EXERCISE_CATEGORY_CODE_MAP[normalizedCategory] ?? null;
}
