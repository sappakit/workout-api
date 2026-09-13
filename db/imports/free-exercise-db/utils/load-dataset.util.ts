import {
  getNullableString,
  getRequiredString,
  isRecord,
} from 'db/utils/parsing/json-value.util';
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
  const context = `Exercise at index ${index}`;

  if (!isRecord(value)) {
    throw new Error(`${context} is not an object.`);
  }

  return {
    id: getRequiredString(value, 'id', context),
    name: getRequiredString(value, 'name', context),

    force: getNullableString(value.force, 'force', context),
    level: getRequiredString(value, 'level', context),
    mechanic: getNullableString(value.mechanic, 'mechanic', context),
    equipment: getNullableString(value.equipment, 'equipment', context),

    primaryMuscles: getStringArray(
      value.primaryMuscles,
      'primaryMuscles',
      context,
    ),

    secondaryMuscles: getStringArray(
      value.secondaryMuscles,
      'secondaryMuscles',
      context,
    ),

    instructions: getStringArray(value.instructions, 'instructions', context),

    category: getRequiredString(value, 'category', context),

    images: getStringArray(value.images, 'images', context),
  };
}

function getStringArray(
  value: unknown,
  fieldName: string,
  context: string,
): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${context} has invalid "${fieldName}".`);
  }

  if (!value.every((item) => typeof item === 'string')) {
    throw new Error(
      `${context} contains a non-string value in "${fieldName}".`,
    );
  }

  return value.map((item) => item.trim()).filter((item) => item.length > 0);
}
