import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  isSupportedEquipmentValue,
  mapMuscleCode,
} from '../mappers/exercise.mapper';
import { FreeExerciseDbExercise } from '../types/free-exercise-db.types';
import {
  DatasetAnalysis,
  DatasetInspectionReport,
  ExerciseImageInspectionResult,
  ExerciseMetadataImportRecord,
} from '../types/import-result.types';

// Analyze the raw Free Exercise DB dataset.
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

// Build the inspection report and count unsupported source values.
export function buildInspectionReport(
  exercises: ExerciseMetadataImportRecord[],
  analysis: DatasetAnalysis,
  imageInspection: ExerciseImageInspectionResult,
): DatasetInspectionReport {
  return {
    generatedAt: new Date().toISOString(),

    analysis,

    images: imageInspection,

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

// Count how many times each value appears and sort the result by key.
function countValues(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }

  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)),
  );
}
