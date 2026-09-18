import { ExerciseMedia } from 'db/entities/workout/exercise/exercise-media.entity';
import {
  getNullableString,
  getRequiredString,
  isRecord,
} from 'db/utils/parsing/json-value.util';
import { writeJsonReport } from 'db/utils/reports/write-json-report.util';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ExerciseMediaType } from 'src/workout/enums/workout.enum';

const DEFAULT_MEDIA_MANIFEST_PATH =
  'db/imports/free-exercise-db/dev-tools/reports/result/exercise-media-manifest.json';

export type ExerciseMediaManifestItem = {
  sourceKey: string;
  sourceExternalId: string;
  mediaType: ExerciseMediaType;
  url: string;
  publicId: string | null;
  sourcePath: string | null;
  contentHash: string | null;
  displayOrder: number;
  isPrimary: boolean;
  createdBy: string;
  updatedBy: string;
};

export type ExerciseMediaManifest = {
  generatedAt: string;
  mediaCount: number;
  items: ExerciseMediaManifestItem[];
};

// Convert exercise_media rows into portable manifest records.
export function mapExerciseMediaManifestItems(
  mediaRows: ExerciseMedia[],
): ExerciseMediaManifestItem[] {
  return mediaRows.map((media) => mapExerciseMediaManifestItem(media));
}

// Build the complete portable exercise media manifest.
export function buildExerciseMediaManifest(
  items: ExerciseMediaManifestItem[],
): ExerciseMediaManifest {
  return {
    generatedAt: new Date().toISOString(),
    mediaCount: items.length,
    items,
  };
}

// Write the exercise media manifest to disk.
export async function writeExerciseMediaManifest(
  manifest: ExerciseMediaManifest,
  filePath?: string,
): Promise<string> {
  return writeJsonReport(manifest, DEFAULT_MEDIA_MANIFEST_PATH, filePath);
}

// Load and validate an exercise media manifest.
export async function loadExerciseMediaManifest(
  filePath?: string,
): Promise<ExerciseMediaManifest> {
  const resolvedPath = filePath
    ? resolve(filePath)
    : resolve(process.cwd(), DEFAULT_MEDIA_MANIFEST_PATH);

  const fileContent = await readFile(resolvedPath, 'utf8');

  let parsedData: unknown;

  try {
    parsedData = JSON.parse(fileContent);
  } catch {
    throw new Error(
      `Exercise media manifest contains invalid JSON: ${resolvedPath}`,
    );
  }

  const manifest = parseExerciseMediaManifest(parsedData);

  validateExerciseMediaManifest(manifest, resolvedPath);

  return manifest;
}

// Build the stable identity used to reference an exercise across databases.
export function getExerciseSourceIdentityKey(
  sourceKey: string,
  sourceExternalId: string,
): string {
  return `${sourceKey}:${sourceExternalId}`;
}

// Convert one exercise_media row into a portable manifest record.
function mapExerciseMediaManifestItem(
  media: ExerciseMedia,
): ExerciseMediaManifestItem {
  const exercise = media.exercise;

  if (!exercise) {
    throw new Error(`Exercise media "${media.id}" has no exercise relation.`);
  }

  if (!exercise.source) {
    throw new Error(`Exercise "${exercise.id}" has no exercise source.`);
  }

  if (!exercise.source_external_id) {
    throw new Error(`Exercise "${exercise.id}" has no source external ID.`);
  }

  return {
    sourceKey: exercise.source.key,
    sourceExternalId: exercise.source_external_id,
    mediaType: media.media_type,
    url: media.url,
    publicId: media.public_id,
    sourcePath: media.source_path,
    contentHash: media.content_hash,
    displayOrder: media.display_order,
    isPrimary: media.is_primary,
    createdBy: media.created_by,
    updatedBy: media.updated_by,
  };
}

// Parse and validate the top-level exercise media manifest structure.
function parseExerciseMediaManifest(value: unknown): ExerciseMediaManifest {
  if (!isRecord(value)) {
    throw new Error('Exercise media manifest must be an object.');
  }

  const generatedAt = getRequiredString(
    value,
    'generatedAt',
    'Exercise media manifest',
  );

  if (
    typeof value.mediaCount !== 'number' ||
    !Number.isInteger(value.mediaCount) ||
    value.mediaCount < 0
  ) {
    throw new Error('Exercise media manifest has invalid "mediaCount".');
  }

  if (!Array.isArray(value.items)) {
    throw new Error('Exercise media manifest "items" must be an array.');
  }

  return {
    generatedAt,
    mediaCount: value.mediaCount,
    items: value.items.map((item, index) =>
      parseExerciseMediaManifestItem(item, index),
    ),
  };
}

// Parse one exercise media manifest item.
function parseExerciseMediaManifestItem(
  value: unknown,
  index: number,
): ExerciseMediaManifestItem {
  const context = `Exercise media manifest item at index ${index}`;

  if (!isRecord(value)) {
    throw new Error(`${context} is not an object.`);
  }

  const sourceKey = getRequiredString(value, 'sourceKey', context);

  const sourceExternalId = getRequiredString(
    value,
    'sourceExternalId',
    context,
  );

  const mediaType = parseExerciseMediaType(value.mediaType, context);

  const url = getRequiredString(value, 'url', context);

  const publicId = getNullableString(value.publicId, 'publicId', context);

  const sourcePath = getNullableString(value.sourcePath, 'sourcePath', context);

  const contentHash = getNullableString(
    value.contentHash,
    'contentHash',
    context,
  );

  if (
    typeof value.displayOrder !== 'number' ||
    !Number.isInteger(value.displayOrder) ||
    value.displayOrder < 0
  ) {
    throw new Error(`${context} has invalid "displayOrder".`);
  }

  if (typeof value.isPrimary !== 'boolean') {
    throw new Error(`${context} has invalid "isPrimary".`);
  }

  const createdBy = getRequiredString(value, 'createdBy', context);

  const updatedBy = getRequiredString(value, 'updatedBy', context);

  return {
    sourceKey,
    sourceExternalId,
    mediaType,
    url,
    publicId,
    sourcePath,
    contentHash,
    displayOrder: value.displayOrder,
    isPrimary: value.isPrimary,
    createdBy,
    updatedBy,
  };
}

// Validate manifest metadata and portable media identities.
function validateExerciseMediaManifest(
  manifest: ExerciseMediaManifest,
  source: string,
): void {
  if (manifest.mediaCount !== manifest.items.length) {
    throw new Error(
      [
        `Exercise media manifest count does not match items in ${source}.`,
        `Expected ${manifest.mediaCount}, found ${manifest.items.length}.`,
      ].join(' '),
    );
  }

  const seenKeys = new Set<string>();
  const duplicateKeys = new Set<string>();

  for (const item of manifest.items) {
    const exerciseKey = getExerciseSourceIdentityKey(
      item.sourceKey,
      item.sourceExternalId,
    );

    const mediaKey = `${exerciseKey}:${item.displayOrder}`;

    if (seenKeys.has(mediaKey)) {
      duplicateKeys.add(mediaKey);
    }

    seenKeys.add(mediaKey);
  }

  if (duplicateKeys.size === 0) {
    return;
  }

  throw new Error(
    [
      `${duplicateKeys.size} duplicate exercise media identities were found in ${source}.`,
      `Duplicate identities: ${[...duplicateKeys].sort().join(', ')}`,
    ].join(' '),
  );
}

// Parse a supported exercise media type.
function parseExerciseMediaType(
  value: unknown,
  context: string,
): ExerciseMediaType {
  if (
    typeof value !== 'string' ||
    !Object.values(ExerciseMediaType).includes(value as ExerciseMediaType)
  ) {
    throw new Error(`${context} has invalid "mediaType".`);
  }

  return value as ExerciseMediaType;
}
