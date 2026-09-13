import { Injectable } from '@nestjs/common';
import { ExerciseMedia } from 'db/entities/workout/exercise/exercise-media.entity';
import { Exercise } from 'db/entities/workout/exercise/exercises.entity';
import { ExerciseMediaType } from 'src/workout/enums/workout.enum';
import { DataSource, DeepPartial, EntityManager } from 'typeorm';
import {
  PersistFreeExerciseDbMediaInput,
  PersistFreeExerciseDbMediaResult,
} from '../types/free-exercise-db.types';
import { chunkArray } from '../utils/persistence.util';

const IMPORT_ACTOR = 'system:free-exercise-db-import';
const IMPORT_CHUNK_SIZE = 250;

@Injectable()
export class FreeExerciseDbMediaPersistenceService {
  constructor(private readonly dataSource: DataSource) {}

  // Persist prepared exercise images using validated database references.
  async persist(
    input: PersistFreeExerciseDbMediaInput,
  ): Promise<PersistFreeExerciseDbMediaResult> {
    if (input.uploadedImages.length === 0) {
      return {
        mediaCount: 0,
      };
    }

    return this.dataSource.transaction(async (manager) => {
      const mediaRows = this.createMediaRows(manager, input);

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

  // Create exercise_media rows using prepared exercise references.
  private createMediaRows(
    manager: EntityManager,
    input: PersistFreeExerciseDbMediaInput,
  ): ExerciseMedia[] {
    const mediaRepo = manager.getRepository(ExerciseMedia);

    return input.uploadedImages.map((uploadedImage) => {
      const exercise = this.getPreparedExercise(
        input.references.exercisesByExternalId,
        uploadedImage.sourceExternalId,
      );

      const payload = {
        exercise,
        source: input.references.source,

        media_type: ExerciseMediaType.IMAGE,

        url: uploadedImage.url,
        public_id: uploadedImage.publicId,
        source_path: uploadedImage.sourcePath,
        content_hash: uploadedImage.contentHash,

        display_order: uploadedImage.displayOrder,
        is_primary: uploadedImage.isPrimary,

        created_by: IMPORT_ACTOR,
        updated_by: IMPORT_ACTOR,
      } satisfies DeepPartial<ExerciseMedia>;

      return mediaRepo.create(payload);
    });
  }

  // Return a prepared exercise reference or throw on inconsistent input.
  private getPreparedExercise(
    exercisesByExternalId: Map<string, Exercise>,
    sourceExternalId: string,
  ): Exercise {
    const exercise = exercisesByExternalId.get(sourceExternalId);

    if (!exercise) {
      throw new Error(
        `Prepared exercise not found for source ID: ${sourceExternalId}`,
      );
    }

    return exercise;
  }
}
