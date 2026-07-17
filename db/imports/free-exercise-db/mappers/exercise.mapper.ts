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
    equipmentCode: mapEquipmentCode(source.equipment),

    primaryMuscleCodes: source.primaryMuscles
      .map(mapMuscleCode)
      .filter((code): code is MuscleCode => code !== null),

    secondaryMuscleCodes: source.secondaryMuscles
      .map(mapMuscleCode)
      .filter((code): code is MuscleCode => code !== null),

    difficultyLevel: mapDifficultyLevel(source.level),

    origin: ExerciseOrigin.SYSTEM,
    status: ExerciseStatus.ACTIVE,

    sourceCategory: source.category,
    sourceLevel: source.level,
    sourceEquipment: source.equipment,
    sourcePrimaryMuscles: source.primaryMuscles,
    sourceSecondaryMuscles: source.secondaryMuscles,

    imagePaths: source.images,
  };
}

function mapInstructions(instructions: string[]): string[] | null {
  const normalizedInstructions = instructions
    .map((instruction) => instruction.trim())
    .filter((instruction) => instruction.length > 0);

  return normalizedInstructions.length > 0 ? normalizedInstructions : null;
}

const DIFFICULTY_LEVEL_MAP: Record<string, DifficultyLevel> = {
  beginner: DifficultyLevel.BEGINNER,
  intermediate: DifficultyLevel.INTERMEDIATE,
  expert: DifficultyLevel.ADVANCED,
  advanced: DifficultyLevel.ADVANCED,
};

function mapDifficultyLevel(level: string): DifficultyLevel | null {
  return DIFFICULTY_LEVEL_MAP[normalizeValue(level)] ?? null;
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
  return EXERCISE_CATEGORY_CODE_MAP[normalizeValue(category)] ?? null;
}

const EQUIPMENT_CODE_MAP = {
  bands: 'resistance-band',
  barbell: 'barbell',
  'body only': 'body-only',
  cable: 'cable',
  dumbbell: 'dumbbell',
  'exercise ball': 'exercise-ball',
  'e-z curl bar': 'ez-curl-bar',
  'foam roll': 'foam-roller',
  kettlebells: 'kettlebell',
  machine: 'machine',
  'medicine ball': 'medicine-ball',
  none: null,
  other: 'other',
} as const;

type EquipmentCode = Exclude<
  (typeof EQUIPMENT_CODE_MAP)[keyof typeof EQUIPMENT_CODE_MAP],
  null
>;

export function isSupportedEquipmentValue(equipment: string | null): boolean {
  if (equipment === null) {
    return true;
  }

  return Object.hasOwn(EQUIPMENT_CODE_MAP, normalizeValue(equipment));
}

function mapEquipmentCode(equipment: string | null): EquipmentCode | null {
  if (equipment === null) {
    return null;
  }

  const normalizedEquipment = normalizeValue(equipment);

  if (!Object.hasOwn(EQUIPMENT_CODE_MAP, normalizedEquipment)) {
    return null;
  }

  return EQUIPMENT_CODE_MAP[
    normalizedEquipment as keyof typeof EQUIPMENT_CODE_MAP
  ];
}

const MUSCLE_CODE_MAP = {
  abdominals: 'abdominals',
  abductors: 'abductors',
  adductors: 'adductors',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  forearms: 'forearms',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'lats',
  'lower back': 'lower-back',
  'middle back': 'middle-back',
  neck: 'neck',
  quadriceps: 'quadriceps',
  shoulders: 'shoulders',
  traps: 'traps',
  triceps: 'triceps',
} as const;

type MuscleCode = (typeof MUSCLE_CODE_MAP)[keyof typeof MUSCLE_CODE_MAP];

export function mapMuscleCode(muscle: string): MuscleCode | null {
  return MUSCLE_CODE_MAP[normalizeValue(muscle)] ?? null;
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}
