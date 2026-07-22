import { access } from 'node:fs/promises';
import {
  ExerciseImageImportRecord,
  ExerciseImageInspectionResult,
} from '../types/import-result.types';

export async function inspectExerciseImages(
  records: ExerciseImageImportRecord[],
): Promise<ExerciseImageInspectionResult> {
  const exercisesWithoutImages = records
    .filter((record) => record.images.length === 0)
    .map((record) => record.sourceExternalId);

  const missingFiles: ExerciseImageInspectionResult['missingFiles'] = [];

  for (const record of records) {
    for (const image of record.images) {
      const exists = await fileExists(image.absolutePath);

      if (!exists) {
        missingFiles.push({
          sourceExternalId: record.sourceExternalId,
          sourcePath: image.sourcePath,
          absolutePath: image.absolutePath,
        });
      }
    }
  }

  return {
    totalExercises: records.length,

    totalImages: records.reduce(
      (total, record) => total + record.images.length,
      0,
    ),

    exercisesWithoutImages,

    missingFiles,
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
