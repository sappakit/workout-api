import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FreeExerciseDbExercise } from '../types/free-exercise-db.types';

export async function loadFreeExerciseDbDataset(
  filePath?: string,
): Promise<FreeExerciseDbExercise[]> {
  const resolvedPath = filePath
    ? resolve(filePath)
    : resolve(
        process.cwd(),
        'third-party/free-exercise-db/dist/exercises.json',
      );

  const fileContent = await readFile(resolvedPath, 'utf8');

  let parsedData: unknown;

  try {
    parsedData = JSON.parse(fileContent);
  } catch {
    throw new Error(
      `Free Exercise DB file contains invalid JSON: ${resolvedPath}`,
    );
  }

  if (!Array.isArray(parsedData)) {
    throw new Error(
      `Free Exercise DB dataset must be a JSON array: ${resolvedPath}`,
    );
  }

  return parsedData.map((item, index) => parseExercise(item, index));
}

function parseExercise(value: unknown, index: number): FreeExerciseDbExercise {
  if (!isRecord(value)) {
    throw new Error(`Exercise at index ${index} is not an object.`);
  }

  return {
    id: getRequiredString(value, 'id', index),
    name: getRequiredString(value, 'name', index),

    force: getNullableString(value.force, 'force', index),
    level: getRequiredString(value, 'level', index),
    mechanic: getNullableString(value.mechanic, 'mechanic', index),
    equipment: getNullableString(value.equipment, 'equipment', index),

    primaryMuscles: getStringArray(
      value.primaryMuscles,
      'primaryMuscles',
      index,
    ),
    secondaryMuscles: getStringArray(
      value.secondaryMuscles,
      'secondaryMuscles',
      index,
    ),

    instructions: getStringArray(value.instructions, 'instructions', index),
    category: getRequiredString(value, 'category', index),
    images: getStringArray(value.images, 'images', index),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRequiredString(
  object: Record<string, unknown>,
  key: string,
  index: number,
): string {
  const value = object[key];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Exercise at index ${index} has invalid "${key}".`);
  }

  return value.trim();
}

function getNullableString(
  value: unknown,
  fieldName: string,
  index: number,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`Exercise at index ${index} has invalid "${fieldName}".`);
  }

  const normalizedValue = value.trim();

  return normalizedValue || null;
}

function getStringArray(
  value: unknown,
  fieldName: string,
  index: number,
): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Exercise at index ${index} has invalid "${fieldName}".`);
  }

  if (!value.every((item) => typeof item === 'string')) {
    throw new Error(
      `Exercise at index ${index} contains a non-string value in "${fieldName}".`,
    );
  }

  return value.map((item) => item.trim()).filter((item) => item.length > 0);
}
