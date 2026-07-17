import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  isSupportedEquipmentValue,
  mapMuscleCode,
} from '../mappers/exercise.mapper';
import {
  DatasetInspectionReport,
  ExerciseMetadataImportRecord,
} from '../types/import-result.types';
import { countValues } from './analyze-dataset.util';

// Build the inspection report and count unsupported source values.
export function buildInspectionReport(
  exercises: ExerciseMetadataImportRecord[],
  analysis: DatasetInspectionReport['analysis'],
): DatasetInspectionReport {
  return {
    generatedAt: new Date().toISOString(),
    analysis,
    unmapped: {
      categories: countValues(
        exercises
          .filter((exercise) => exercise.categoryCode === null)
          .map((exercise) => exercise.sourceCategory),
      ),

      levels: countValues(
        exercises
          .filter((exercise) => exercise.difficultyLevel === null)
          .map((exercise) => exercise.sourceLevel),
      ),

      equipment: countValues(
        exercises
          .filter(
            (exercise) => !isSupportedEquipmentValue(exercise.sourceEquipment),
          )
          .map((exercise) => exercise.sourceEquipment ?? 'null'),
      ),

      primaryMuscles: countValues(
        exercises.flatMap((exercise) =>
          exercise.sourcePrimaryMuscles.filter(
            (muscle) => mapMuscleCode(muscle) === null,
          ),
        ),
      ),

      secondaryMuscles: countValues(
        exercises.flatMap((exercise) =>
          exercise.sourceSecondaryMuscles.filter(
            (muscle) => mapMuscleCode(muscle) === null,
          ),
        ),
      ),
    },
  };
}

// Write the inspection report to disk and return the resolved file path.
export async function writeImportReport(
  report: DatasetInspectionReport,
  filePath?: string,
): Promise<string> {
  const resolvedPath = filePath
    ? resolve(filePath)
    : resolve(
        process.cwd(),
        'db/imports/free-exercise-db/reports/dataset-analysis.json',
      );

  await mkdir(dirname(resolvedPath), {
    recursive: true,
  });

  await writeFile(resolvedPath, JSON.stringify(report, null, 2), 'utf8');

  return resolvedPath;
}
