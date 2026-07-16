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

function mapDifficultyLevel(level: string): DifficultyLevel | null {
  switch (level.toLowerCase()) {
    case 'beginner':
      return DifficultyLevel.BEGINNER;

    case 'intermediate':
      return DifficultyLevel.INTERMEDIATE;

    case 'expert':
    case 'advanced':
      return DifficultyLevel.ADVANCED;

    default:
      return null;
  }
}
