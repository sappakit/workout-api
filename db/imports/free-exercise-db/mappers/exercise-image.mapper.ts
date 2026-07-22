import { resolve } from 'node:path';
import { FreeExerciseDbExercise } from '../types/free-exercise-db.types';
import { ExerciseImageImportRecord } from '../types/import-result.types';

const DEFAULT_IMAGE_ROOT = resolve(
  process.cwd(),
  'third-party/free-exercise-db/exercises',
);

export function mapFreeExerciseDbImages(
  exercise: FreeExerciseDbExercise,
  imageRoot = DEFAULT_IMAGE_ROOT,
): ExerciseImageImportRecord {
  return {
    sourceExternalId: exercise.id,

    images: exercise.images.map((sourcePath, displayOrder) => ({
      sourcePath,
      absolutePath: resolve(imageRoot, sourcePath),
      displayOrder,
      isPrimary: displayOrder === 0,
    })),
  };
}
