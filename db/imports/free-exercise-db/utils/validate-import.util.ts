import {
  isSupportedEquipmentValue,
  mapMuscleCode,
} from '../mappers/exercise.mapper';
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

// Ensure source exercise IDs are unique before performing any upserts.
export function validateNoDuplicateSourceIds(duplicateIds: string[]): void {
  if (duplicateIds.length === 0) {
    return;
  }

  throw new Error(
    `Duplicate source exercise IDs found: ${duplicateIds.join(', ')}`,
  );
}

// Ensure every source value has a supported app mapping.
export function validateMappedValues(
  exercises: ExerciseMetadataImportRecord[],
): void {
  validateCategories(exercises);
  validateDifficultyLevels(exercises);
  validateEquipment(exercises);
  validateMuscles(exercises);
}

// Ensure every required mapped code has a corresponding database record.
export function validateRequiredCodesExist<Entity>(
  resourceName: string,
  requiredCodes: Set<string>,
  recordsByCode: Map<string, Entity>,
  seedName: string,
): void {
  const missingCodes = [...requiredCodes].filter(
    (code) => !recordsByCode.has(code),
  );

  if (missingCodes.length === 0) {
    return;
  }

  throw new Error(
    [
      `Mapped ${resourceName} are missing from the database.`,
      `Missing codes: ${missingCodes.join(', ')}.`,
      `Run the ${seedName} seed before running the importer.`,
    ].join(' '),
  );
}

// Ensure every source category has a category-code mapping.
function validateCategories(exercises: ExerciseMetadataImportRecord[]): void {
  const unsupportedCategories = [
    ...new Set(
      exercises
        .filter((exercise) => exercise.categoryCode === null)
        .map((exercise) => exercise.sourceCategory),
    ),
  ];

  if (unsupportedCategories.length === 0) {
    return;
  }

  throw new Error(
    `Unsupported source categories found: ${unsupportedCategories.join(', ')}`,
  );
}

// Ensure every source difficulty level has an enum mapping.
function validateDifficultyLevels(
  exercises: ExerciseMetadataImportRecord[],
): void {
  const unsupportedLevels = [
    ...new Set(
      exercises
        .filter((exercise) => exercise.difficultyLevel === null)
        .map((exercise) => exercise.sourceLevel),
    ),
  ];

  if (unsupportedLevels.length === 0) {
    return;
  }

  throw new Error(
    `Unsupported source difficulty levels found: ${unsupportedLevels.join(', ')}`,
  );
}

// Ensure every equipment value is recognized, including intentional null mappings.
function validateEquipment(exercises: ExerciseMetadataImportRecord[]): void {
  const unsupportedEquipment = [
    ...new Set(
      exercises
        .filter(
          (exercise) => !isSupportedEquipmentValue(exercise.sourceEquipment),
        )
        .map((exercise) => exercise.sourceEquipment ?? 'null'),
    ),
  ];

  if (unsupportedEquipment.length === 0) {
    return;
  }

  throw new Error(
    `Unsupported source equipment values found: ${unsupportedEquipment.join(', ')}`,
  );
}

// Ensure every primary and secondary muscle has a muscle-code mapping.
function validateMuscles(exercises: ExerciseMetadataImportRecord[]): void {
  const unsupportedMuscles = [
    ...new Set(
      exercises.flatMap((exercise) => [
        ...exercise.sourcePrimaryMuscles.filter(
          (muscle) => mapMuscleCode(muscle) === null,
        ),
        ...exercise.sourceSecondaryMuscles.filter(
          (muscle) => mapMuscleCode(muscle) === null,
        ),
      ]),
    ),
  ];

  if (unsupportedMuscles.length === 0) {
    return;
  }

  throw new Error(
    `Unsupported source muscle values found: ${unsupportedMuscles.join(', ')}`,
  );
}
