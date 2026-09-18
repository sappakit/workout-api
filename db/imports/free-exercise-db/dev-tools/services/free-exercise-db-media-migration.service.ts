import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExerciseMedia } from 'db/entities/workout/exercise/exercise-media.entity';
import { ExerciseSource } from 'db/entities/workout/exercise/exercise-source.entity';
import { Exercise } from 'db/entities/workout/exercise/exercises.entity';
import { DataSource, DeepPartial, In, Repository } from 'typeorm';
import { chunkArray } from '../../utils/persistence.util';
import {
  buildExerciseMediaManifest,
  ExerciseMediaManifestItem,
  getExerciseSourceIdentityKey,
  loadExerciseMediaManifest,
  mapExerciseMediaManifestItems,
  writeExerciseMediaManifest,
} from '../utils/exercise-media-migration.util';

const FREE_EXERCISE_DB_SOURCE_KEY = 'free-exercise-db';
const MIGRATION_CHUNK_SIZE = 250;

@Injectable()
export class FreeExerciseDbMediaMigrationService {
  private readonly logger = new Logger(
    FreeExerciseDbMediaMigrationService.name,
  );

  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(ExerciseSource)
    private readonly exerciseSourceRepo: Repository<ExerciseSource>,

    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,

    @InjectRepository(ExerciseMedia)
    private readonly exerciseMediaRepo: Repository<ExerciseMedia>,
  ) {}

  // Export Free Exercise DB media into a portable JSON manifest.
  async exportMediaManifest({
    outputPath,
  }: {
    outputPath?: string;
  } = {}): Promise<string> {
    this.logger.log('Loading Free Exercise DB exercise media');

    const mediaRows = await this.exerciseMediaRepo.find({
      where: {
        exercise: {
          source: {
            key: FREE_EXERCISE_DB_SOURCE_KEY,
          },
        },
      },
      relations: {
        exercise: {
          source: true,
        },
      },
      order: {
        exercise: {
          id: 'ASC',
        },
        display_order: 'ASC',
      },
    });

    const items = mapExerciseMediaManifestItems(mediaRows);
    const manifest = buildExerciseMediaManifest(items);

    const savedPath = await writeExerciseMediaManifest(manifest, outputPath);

    this.logger.log(`Exported ${items.length} exercise media records`);

    this.logger.log(`Exercise media manifest written to: ${savedPath}`);

    return savedPath;
  }

  // Prepare and upsert exercise media from the portable manifest.
  async importMedia({
    filePath,
  }: {
    filePath?: string;
  } = {}): Promise<number> {
    const mediaRows = await this.prepareMediaImport({
      filePath,
    });

    if (mediaRows.length === 0) {
      this.logger.warn('No exercise media rows were available for import');

      return 0;
    }

    const mediaCount = await this.persistMediaRows(mediaRows);

    this.logger.log(`Upserted ${mediaCount} exercise media rows`);

    return mediaCount;
  }

  // Load, validate, resolve and map the media manifest without writing to the database.
  async prepareMediaImport({
    filePath,
  }: {
    filePath?: string;
  } = {}): Promise<ExerciseMedia[]> {
    this.logger.log('Loading exercise media manifest');

    const manifest = await loadExerciseMediaManifest(filePath);

    this.logger.log(`Loaded ${manifest.items.length} exercise media records`);

    if (manifest.items.length === 0) {
      this.logger.warn('Exercise media manifest contains no records');

      return [];
    }

    const sourcesByKey = await this.loadExerciseSources(manifest.items);

    const exercisesByIdentity = await this.loadExercises(
      manifest.items,
      sourcesByKey,
    );

    const mediaRows = this.createMediaRows(manifest.items, exercisesByIdentity);

    this.logger.log(`Prepared ${mediaRows.length} exercise media rows`);

    return mediaRows;
  }

  // Load and validate all exercise sources referenced by the manifest.
  private async loadExerciseSources(
    items: ExerciseMediaManifestItem[],
  ): Promise<Map<string, ExerciseSource>> {
    const sourceKeys = [...new Set(items.map((item) => item.sourceKey))];

    const sources = await this.exerciseSourceRepo.find({
      where: {
        key: In(sourceKeys),
      },
    });

    const sourcesByKey = new Map(sources.map((source) => [source.key, source]));

    const missingSourceKeys = sourceKeys.filter(
      (sourceKey) => !sourcesByKey.has(sourceKey),
    );

    if (missingSourceKeys.length > 0) {
      throw new Error(
        [
          `${missingSourceKeys.length} exercise sources referenced by the media manifest were not found.`,
          `Missing sources: ${missingSourceKeys.sort().join(', ')}`,
        ].join(' '),
      );
    }

    return sourcesByKey;
  }

  // Load and validate all exercises referenced by the manifest.
  private async loadExercises(
    items: ExerciseMediaManifestItem[],
    sourcesByKey: Map<string, ExerciseSource>,
  ): Promise<Map<string, Exercise>> {
    const expectedExerciseKeys = new Set(
      items.map((item) =>
        getExerciseSourceIdentityKey(item.sourceKey, item.sourceExternalId),
      ),
    );

    const sourceIds = [...sourcesByKey.values()].map((source) => source.id);

    const sourceExternalIds = [
      ...new Set(items.map((item) => item.sourceExternalId)),
    ];

    const exercises = await this.exerciseRepo.find({
      where: {
        source: {
          id: In(sourceIds),
        },
        source_external_id: In(sourceExternalIds),
      },
      relations: {
        source: true,
      },
    });

    const exercisesByIdentity = new Map<string, Exercise>();

    for (const exercise of exercises) {
      if (!exercise.source || !exercise.source_external_id) {
        continue;
      }

      const identityKey = getExerciseSourceIdentityKey(
        exercise.source.key,
        exercise.source_external_id,
      );

      exercisesByIdentity.set(identityKey, exercise);
    }

    const missingReferences = [...expectedExerciseKeys].filter(
      (identityKey) => !exercisesByIdentity.has(identityKey),
    );

    if (missingReferences.length > 0) {
      throw new Error(
        [
          `${missingReferences.length} exercises referenced by the media manifest were not found.`,
          `Missing exercises: ${missingReferences.sort().join(', ')}`,
        ].join(' '),
      );
    }

    return exercisesByIdentity;
  }

  // Convert validated manifest records into ExerciseMedia entities.
  private createMediaRows(
    items: ExerciseMediaManifestItem[],
    exercisesByIdentity: Map<string, Exercise>,
  ): ExerciseMedia[] {
    return items.map((item) => {
      const exerciseIdentity = getExerciseSourceIdentityKey(
        item.sourceKey,
        item.sourceExternalId,
      );

      const exercise = exercisesByIdentity.get(exerciseIdentity);

      if (!exercise) {
        throw new Error(`Prepared exercise not found: ${exerciseIdentity}`);
      }

      if (!exercise.source) {
        throw new Error(`Prepared exercise has no source: ${exerciseIdentity}`);
      }

      const payload = {
        exercise,
        source: exercise.source,

        media_type: item.mediaType,

        url: item.url,
        public_id: item.publicId,
        source_path: item.sourcePath,
        content_hash: item.contentHash,

        display_order: item.displayOrder,
        is_primary: item.isPrimary,

        created_by: item.createdBy,
        updated_by: item.updatedBy,
      } satisfies DeepPartial<ExerciseMedia>;

      return this.exerciseMediaRepo.create(payload);
    });
  }

  // Upsert prepared exercise media rows in a single transaction.
  private async persistMediaRows(mediaRows: ExerciseMedia[]): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const mediaRepo = manager.getRepository(ExerciseMedia);

      for (const rowsChunk of chunkArray(mediaRows, MIGRATION_CHUNK_SIZE)) {
        await mediaRepo.upsert(rowsChunk, {
          conflictPaths: ['exercise', 'display_order'],
          skipUpdateIfNoValuesChanged: true,
        });
      }

      return mediaRows.length;
    });
  }
}
