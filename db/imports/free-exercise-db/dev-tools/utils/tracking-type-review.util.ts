import {
  getNullableString,
  getOptionalString,
  getRequiredString,
  isRecord,
} from 'db/utils/parsing/json-value.util';
import { writeJsonReport } from 'db/utils/reports/write-json-report.util';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FreeExerciseDbExercise } from '../../types/free-exercise-db.types';

const DEFAULT_TRACKING_TYPE_INITIAL_INPUT_REPORT_PATH =
  'db/imports/free-exercise-db/dev-tools/reports/input/tracking-type-initial-input.json';

const DEFAULT_TRACKING_TYPE_INITIAL_RESULT_PATH =
  'db/imports/free-exercise-db/dev-tools/reports/result/tracking-type-initial-result.json';

const DEFAULT_TRACKING_TYPE_REVIEW_INPUT_REPORT_PATH =
  'db/imports/free-exercise-db/dev-tools/reports/input/tracking-type-review-input.json';

const DEFAULT_TRACKING_TYPE_REVIEW_RESULT_PATH =
  'db/imports/free-exercise-db/dev-tools/reports/result/tracking-type-review-result.json';

const DEFAULT_TRACKING_TYPE_FINAL_REPORT_PATH =
  'db/imports/free-exercise-db/data/exercise-tracking-types.json';

type FreeExerciseDbTrackingTypeInput = Pick<
  FreeExerciseDbExercise,
  'id' | 'name' | 'category' | 'equipment'
>;

type FreeExerciseDbTrackingTypeConfidence = 'high' | 'medium' | 'low';

type FreeExerciseDbTrackingTypeReviewRecord = {
  id: string;
  trackingType: string | null;
  confidence: FreeExerciseDbTrackingTypeConfidence;
  suggestedNewType?: string;
  note?: string;
};

type FreeExerciseDbTrackingTypeFinalRecord = {
  id: string;
  trackingType: string;
};

type FreeExerciseDbTrackingTypeReviewInput = Pick<
  FreeExerciseDbExercise,
  | 'id'
  | 'name'
  | 'category'
  | 'equipment'
  | 'force'
  | 'mechanic'
  | 'instructions'
>;

// Extract fields needed for the initial classification pass.
export function extractTrackingTypeInputs(
  exercises: FreeExerciseDbExercise[],
): FreeExerciseDbTrackingTypeInput[] {
  return exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    equipment: exercise.equipment,
  }));
}

// Write the initial classification input.
export async function writeTrackingTypeInputReport(
  inputs: FreeExerciseDbTrackingTypeInput[],
  filePath?: string,
): Promise<string> {
  return writeJsonReport(
    inputs,
    DEFAULT_TRACKING_TYPE_INITIAL_INPUT_REPORT_PATH,
    filePath,
  );
}

// Load the initial classification result.
export async function loadTrackingTypeInitialResult(
  filePath?: string,
): Promise<FreeExerciseDbTrackingTypeReviewRecord[]> {
  const resolvedPath = filePath
    ? resolve(filePath)
    : resolve(process.cwd(), DEFAULT_TRACKING_TYPE_INITIAL_RESULT_PATH);

  return loadTrackingTypeReviewRecords(resolvedPath);
}

// Load the detailed review result.
export async function loadTrackingTypeReviewResult(
  filePath?: string,
): Promise<FreeExerciseDbTrackingTypeReviewRecord[]> {
  const resolvedPath = filePath
    ? resolve(filePath)
    : resolve(process.cwd(), DEFAULT_TRACKING_TYPE_REVIEW_RESULT_PATH);

  return loadTrackingTypeReviewRecords(resolvedPath);
}

// Return exercises that still need detailed review.
export function extractTrackingTypeReviewIds(
  records: FreeExerciseDbTrackingTypeReviewRecord[],
): string[] {
  return records
    .filter((record) => record.confidence !== 'high')
    .map((record) => record.id);
}

// Extract richer fields for the detailed review pass.
export function extractTrackingTypeReviewInputs(
  exercises: FreeExerciseDbExercise[],
  reviewIds: string[],
): FreeExerciseDbTrackingTypeReviewInput[] {
  const reviewIdSet = new Set(reviewIds);

  const reviewExercises = exercises.filter((exercise) =>
    reviewIdSet.has(exercise.id),
  );

  const foundIdSet = new Set(reviewExercises.map((exercise) => exercise.id));

  const missingIds = reviewIds.filter((id) => !foundIdSet.has(id));

  if (missingIds.length > 0) {
    throw new Error(
      [
        `${missingIds.length} tracking-type review exercises were not found in the source dataset.`,
        `Missing IDs: ${missingIds.join(', ')}`,
      ].join(' '),
    );
  }

  return reviewExercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    equipment: exercise.equipment,
    force: exercise.force,
    mechanic: exercise.mechanic,
    instructions: exercise.instructions,
  }));
}

// Write detailed input for the review pass.
export async function writeTrackingTypeReviewInputReport(
  inputs: FreeExerciseDbTrackingTypeReviewInput[],
  filePath?: string,
): Promise<string> {
  return writeJsonReport(
    inputs,
    DEFAULT_TRACKING_TYPE_REVIEW_INPUT_REPORT_PATH,
    filePath,
  );
}

// Merge the detailed review result over the initial classification.
export function mergeTrackingTypeRecords(
  initialRecords: FreeExerciseDbTrackingTypeReviewRecord[],
  reviewRecords: FreeExerciseDbTrackingTypeReviewRecord[],
): FreeExerciseDbTrackingTypeFinalRecord[] {
  validateUniqueReviewRecordIds(initialRecords, 'initial result');

  validateUniqueReviewRecordIds(reviewRecords, 'review result');

  const initialIdSet = new Set(initialRecords.map((record) => record.id));

  const missingIds = reviewRecords
    .map((record) => record.id)
    .filter((id) => !initialIdSet.has(id));

  if (missingIds.length > 0) {
    throw new Error(
      [
        `${missingIds.length} tracking-type review records were not found in the initial result.`,
        `Missing IDs: ${missingIds.join(', ')}`,
      ].join(' '),
    );
  }

  const reviewById = new Map(
    reviewRecords.map((record) => [record.id, record]),
  );

  const mergedRecords = initialRecords.map(
    (initialRecord) => reviewById.get(initialRecord.id) ?? initialRecord,
  );

  return mergedRecords.map((record) => {
    if (!record.trackingType) {
      throw new Error(
        `Exercise "${record.id}" does not have a resolved tracking type.`,
      );
    }

    return {
      id: record.id,
      trackingType: record.trackingType,
    };
  });
}

// Write the canonical tracking-type mapping.
export async function writeTrackingTypeFinalReport(
  records: FreeExerciseDbTrackingTypeFinalRecord[],
  filePath?: string,
): Promise<string> {
  return writeJsonReport(
    records,
    DEFAULT_TRACKING_TYPE_FINAL_REPORT_PATH,
    filePath,
  );
}

// Load and validate a tracking-type review file.
async function loadTrackingTypeReviewRecords(
  resolvedPath: string,
): Promise<FreeExerciseDbTrackingTypeReviewRecord[]> {
  const fileContent = await readFile(resolvedPath, 'utf8');

  let parsedData: unknown;

  try {
    parsedData = JSON.parse(fileContent);
  } catch {
    throw new Error(
      `Tracking-type review file contains invalid JSON: ${resolvedPath}`,
    );
  }

  if (!Array.isArray(parsedData)) {
    throw new Error(
      `Tracking-type review file must be a JSON array: ${resolvedPath}`,
    );
  }

  const records = parsedData.map((item, index) =>
    parseTrackingTypeReviewRecord(item, index),
  );

  validateUniqueReviewRecordIds(records, resolvedPath);

  return records;
}

// Ensure each review file contains unique exercise IDs.
function validateUniqueReviewRecordIds(
  records: FreeExerciseDbTrackingTypeReviewRecord[],
  source: string,
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
      `${duplicateIds.size} duplicate exercise IDs were found in ${source}.`,
      `Duplicate IDs: ${[...duplicateIds].sort().join(', ')}`,
    ].join(' '),
  );
}

function parseTrackingTypeReviewRecord(
  value: unknown,
  index: number,
): FreeExerciseDbTrackingTypeReviewRecord {
  const context = `Tracking-type review record at index ${index}`;

  if (!isRecord(value)) {
    throw new Error(`${context} is not an object.`);
  }

  const id = getRequiredString(value, 'id', context);

  const trackingType = getNullableString(
    value.trackingType,
    'trackingType',
    context,
  );

  const confidence = parseTrackingTypeConfidence(value.confidence, context);

  const suggestedNewType = getOptionalString(
    value.suggestedNewType,
    'suggestedNewType',
    context,
  );

  const note = getOptionalString(value.note, 'note', context);

  return {
    id,
    trackingType,
    confidence,
    suggestedNewType,
    note,
  };
}

function parseTrackingTypeConfidence(
  value: unknown,
  context: string,
): FreeExerciseDbTrackingTypeConfidence {
  if (value !== 'high' && value !== 'medium' && value !== 'low') {
    throw new Error(`${context} has invalid "confidence".`);
  }

  return value;
}
