import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ExerciseMedia } from 'db/entities/workout/exercise/exercise-media.entity';
import { ExerciseSource } from 'db/entities/workout/exercise/exercise-source.entity';
import { Exercise } from 'db/entities/workout/exercise/exercises.entity';
import { ExerciseMediaType } from 'src/workout/enums/workout.enum';
import { DataSource, DeepPartial, EntityManager, In } from 'typeorm';
import { UploadedExerciseImage } from '../types/import-result.types';
import { chunkArray } from '../utils/persistence.util';

type PersistExerciseMediaParams = {
  source: ExerciseSource;
  uploadedImages: UploadedExerciseImage[];
};

type PersistExerciseMediaResult = {
  mediaCount: number;
};

const IMPORT_ACTOR = 'system:free-exercise-db-import';
const IMPORT_CHUNK_SIZE = 250;

@Injectable()
export class FreeExerciseDbMediaPersistenceService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async persist({
    source,
    uploadedImages,
  }: PersistExerciseMediaParams): Promise<PersistExerciseMediaResult> {
    if (uploadedImages.length === 0) {
      return { mediaCount: 0 };
    }

    return this.dataSource.transaction(async (manager) => {
      const exercisesByExternalId = await this.loadExercises(
        manager,
        source,
        uploadedImages,
      );

      const mediaRows = this.createMediaRows(
        manager,
        source,
        uploadedImages,
        exercisesByExternalId,
      );

      const mediaRepo = manager.getRepository(ExerciseMedia);

      for (const rowsChunk of chunkArray(mediaRows, IMPORT_CHUNK_SIZE)) {
        await mediaRepo.upsert(rowsChunk, {
          conflictPaths: ['exercise', 'display_order'],
          skipUpdateIfNoValuesChanged: true,
        });
      }

      return {
        mediaCount: mediaRows.length,
      };
    });
  }

  private async loadExercises(
    manager: EntityManager,
    source: ExerciseSource,
    uploadedImages: UploadedExerciseImage[],
  ): Promise<Map<string, Exercise>> {
    const exerciseRepo = manager.getRepository(Exercise);

    const sourceExternalIds = [
      ...new Set(uploadedImages.map((image) => image.sourceExternalId)),
    ];

    const exercises = await exerciseRepo.find({
      where: {
        source: { id: source.id },
        source_external_id: In(sourceExternalIds),
      },
    });

    const exercisesByExternalId = new Map<string, Exercise>();

    for (const exercise of exercises) {
      if (exercise.source_external_id) {
        exercisesByExternalId.set(exercise.source_external_id, exercise);
      }
    }

    this.validateAllExercisesExist(sourceExternalIds, exercisesByExternalId);

    return exercisesByExternalId;
  }

  private createMediaRows(
    manager: EntityManager,
    source: ExerciseSource,
    uploadedImages: UploadedExerciseImage[],
    exercisesByExternalId: Map<string, Exercise>,
  ): ExerciseMedia[] {
    const mediaRepo = manager.getRepository(ExerciseMedia);

    return uploadedImages.map((uploadedImage) => {
      const exercise = exercisesByExternalId.get(
        uploadedImage.sourceExternalId,
      );

      if (!exercise) {
        throw new Error(
          `Exercise "${uploadedImage.sourceExternalId}" was not found.`,
        );
      }

      const payload = {
        exercise,
        source,
        media_type: ExerciseMediaType.IMAGE,
        url: uploadedImage.url,
        public_id: uploadedImage.publicId,
        source_path: uploadedImage.sourcePath,
        display_order: uploadedImage.displayOrder,
        is_primary: uploadedImage.isPrimary,
        created_by: IMPORT_ACTOR,
        updated_by: IMPORT_ACTOR,
      } satisfies DeepPartial<ExerciseMedia>;

      return mediaRepo.create(payload);
    });
  }

  private validateAllExercisesExist(
    sourceExternalIds: string[],
    exercisesByExternalId: Map<string, Exercise>,
  ): void {
    const missingSourceExternalIds = sourceExternalIds.filter(
      (sourceExternalId) => !exercisesByExternalId.has(sourceExternalId),
    );

    if (missingSourceExternalIds.length === 0) {
      return;
    }

    const preview = missingSourceExternalIds.slice(0, 10).join(', ');

    throw new Error(
      [
        `${missingSourceExternalIds.length} imported exercises were not found in the database.`,
        `Missing source IDs: ${preview}`,
        'Run the exercise metadata import before importing images.',
      ].join(' '),
    );
  }
}
