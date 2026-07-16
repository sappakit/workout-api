import { FreeExerciseDbExercise } from '../types/free-exercise-db.types';
import { DatasetAnalysis } from '../types/import-result.types';

export function analyzeFreeExerciseDbDataset(
  exercises: FreeExerciseDbExercise[],
): DatasetAnalysis {
  const idCounts = countValues(exercises.map((exercise) => exercise.id));

  const duplicateIds = Object.entries(idCounts)
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
    .sort();

  return {
    totalExercises: exercises.length,
    duplicateIds,

    categories: countValues(exercises.map((exercise) => exercise.category)),

    levels: countValues(exercises.map((exercise) => exercise.level)),

    equipment: countValues(
      exercises.map((exercise) => exercise.equipment ?? 'none'),
    ),

    forceTypes: countValues(
      exercises.map((exercise) => exercise.force ?? 'none'),
    ),

    mechanics: countValues(
      exercises.map((exercise) => exercise.mechanic ?? 'none'),
    ),

    primaryMuscles: countValues(
      exercises.flatMap((exercise) => exercise.primaryMuscles),
    ),

    secondaryMuscles: countValues(
      exercises.flatMap((exercise) => exercise.secondaryMuscles),
    ),

    missingInstructions: exercises.filter(
      (exercise) => exercise.instructions.length === 0,
    ).length,

    missingImages: exercises.filter((exercise) => exercise.images.length === 0)
      .length,
  };
}

export function countValues(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }

  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)),
  );
}
