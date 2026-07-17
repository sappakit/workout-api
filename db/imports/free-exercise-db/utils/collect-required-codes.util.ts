import { ExerciseMetadataImportRecord } from '../types/import-result.types';

// Collect every unique category code required by the dataset.
export function getRequiredCategoryCodes(
  exercises: ExerciseMetadataImportRecord[],
): Set<string> {
  return new Set(
    exercises
      .map((exercise) => exercise.categoryCode)
      .filter((code): code is string => code !== null),
  );
}

// Collect every unique equipment code required by the dataset.
export function getRequiredEquipmentCodes(
  exercises: ExerciseMetadataImportRecord[],
): Set<string> {
  return new Set(
    exercises
      .map((exercise) => exercise.equipmentCode)
      .filter((code): code is string => code !== null),
  );
}

// Collect every unique primary and secondary muscle code.
export function getRequiredMuscleCodes(
  exercises: ExerciseMetadataImportRecord[],
): Set<string> {
  return new Set(
    exercises.flatMap((exercise) => [
      ...exercise.primaryMuscleCodes,
      ...exercise.secondaryMuscleCodes,
    ]),
  );
}
