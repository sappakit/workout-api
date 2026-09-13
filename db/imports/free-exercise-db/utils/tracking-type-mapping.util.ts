import { getRequiredString, isRecord } from 'db/utils/parsing/json-value.util';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FreeExerciseDbTrackingTypeMappingRecord } from '../types/free-exercise-db.types';

const DEFAULT_TRACKING_TYPE_MAPPING_PATH =
  'db/imports/free-exercise-db/data/exercise-tracking-types.json';

// Load and validate the canonical tracking-type mapping.
export async function loadTrackingTypeMapping(
  filePath?: string,
): Promise<FreeExerciseDbTrackingTypeMappingRecord[]> {
  const resolvedPath = filePath
    ? resolve(filePath)
    : resolve(process.cwd(), DEFAULT_TRACKING_TYPE_MAPPING_PATH);

  const fileContent = await readFile(resolvedPath, 'utf8');

  let parsedData: unknown;

  try {
    parsedData = JSON.parse(fileContent);
  } catch {
    throw new Error(
      `Tracking-type mapping contains invalid JSON: ${resolvedPath}`,
    );
  }

  if (!Array.isArray(parsedData)) {
    throw new Error(
      `Tracking-type mapping must be a JSON array: ${resolvedPath}`,
    );
  }

  const records = parsedData.map((item, index) =>
    parseTrackingTypeMappingRecord(item, index),
  );

  if (records.length === 0) {
    throw new Error(
      'Tracking-type mapping must contain at least one exercise.',
    );
  }

  validateDuplicateTrackingTypeMappingIds(records);

  return records;
}

// Return every unique tracking-type code required by the mapping.
export function getRequiredTrackingTypeCodes(
  records: FreeExerciseDbTrackingTypeMappingRecord[],
): Set<string> {
  return new Set(records.map((record) => record.trackingType));
}

// Ensure each source exercise ID appears only once in the mapping.
function validateDuplicateTrackingTypeMappingIds(
  records: FreeExerciseDbTrackingTypeMappingRecord[],
): void {
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();

  for (const record of records) {
    if (seenIds.has(record.id)) {
      duplicateIds.add(record.id);
    }

    seenIds.add(record.id);
  }

  if (duplicateIds.size === 0) {
    return;
  }

  throw new Error(
    [
      `${duplicateIds.size} duplicate exercise IDs were found in the tracking-type mapping.`,
      `Duplicate IDs: ${[...duplicateIds].sort().join(', ')}`,
    ].join(' '),
  );
}

function parseTrackingTypeMappingRecord(
  value: unknown,
  index: number,
): FreeExerciseDbTrackingTypeMappingRecord {
  const context = `Tracking-type mapping record at index ${index}`;

  if (!isRecord(value)) {
    throw new Error(`${context} is not an object.`);
  }

  return {
    id: getRequiredString(value, 'id', context),
    trackingType: getRequiredString(value, 'trackingType', context),
  };
}
