import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Exercise } from 'db/entities/workout/exercise/exercises.entity';
import { DataSource, EntityManager } from 'typeorm';
import {
  FreeExerciseDbTrackingTypeMappingRecord,
  PersistFreeExerciseDbTrackingTypesInput,
  PersistFreeExerciseDbTrackingTypesResult,
} from '../types/free-exercise-db.types';
import { chunkArray } from '../utils/persistence.util';

const IMPORT_ACTOR = 'system:free-exercise-db-import';
const IMPORT_CHUNK_SIZE = 250;

@Injectable()
export class FreeExerciseDbTrackingTypePersistenceService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // Assign tracking types to imported exercises in one transaction.
  async persist(
    input: PersistFreeExerciseDbTrackingTypesInput,
  ): Promise<PersistFreeExerciseDbTrackingTypesResult> {
    return this.dataSource.transaction(async (manager) => {
      const exercisesByExternalId = await this.loadExercises(manager, input);

      const exercises = this.assignTrackingTypes(
        input.records,
        exercisesByExternalId,
        input.references.trackingTypesByCode,
      );

      const exerciseRepo = manager.getRepository(Exercise);

      for (const exerciseChunk of chunkArray(exercises, IMPORT_CHUNK_SIZE)) {
        await exerciseRepo.save(exerciseChunk);
      }

      return {
        exerciseCount: exercises.length,
      };
    });
  }

  // Load imported exercises and ensure every mapped exercise exists.
  private async loadExercises(
    manager: EntityManager,
    input: PersistFreeExerciseDbTrackingTypesInput,
  ): Promise<Map<string, Exercise>> {
    const exerciseRepo = manager.getRepository(Exercise);

    const exercises = await exerciseRepo.find({
      where: {
        source: {
          id: input.references.source.id,
        },
      },
    });

    const exercisesByExternalId = new Map<string, Exercise>();

    for (const exercise of exercises) {
      if (exercise.source_external_id) {
        exercisesByExternalId.set(exercise.source_external_id, exercise);
      }
    }

    this.validateAllExercisesExist(input.records, exercisesByExternalId);

    return exercisesByExternalId;
  }

  // Ensure every mapped exercise exists in the database.
  private validateAllExercisesExist(
    records: FreeExerciseDbTrackingTypeMappingRecord[],
    exercisesByExternalId: Map<string, Exercise>,
  ): void {
    const missingIds = records
      .map((record) => record.id)
      .filter((id) => !exercisesByExternalId.has(id));

    if (missingIds.length === 0) {
      return;
    }

    throw new Error(
      [
        `${missingIds.length} mapped exercises were not found in the database.`,
        `Missing source IDs: ${missingIds.join(', ')}.`,
        'Run the exercise metadata import before importing tracking types.',
      ].join(' '),
    );
  }

  // Assign the resolved tracking type to each imported exercise.
  private assignTrackingTypes(
    records: FreeExerciseDbTrackingTypeMappingRecord[],
    exercisesByExternalId: Map<string, Exercise>,
    trackingTypesByCode: PersistFreeExerciseDbTrackingTypesInput['references']['trackingTypesByCode'],
  ): Exercise[] {
    return records.map((record) => {
      const exercise = exercisesByExternalId.get(record.id);

      if (!exercise) {
        throw new Error(`Exercise "${record.id}" was not found.`);
      }

      const trackingType = trackingTypesByCode.get(record.trackingType);

      if (!trackingType) {
        throw new Error(
          [
            `Exercise tracking type "${record.trackingType}" was not found in the database.`,
            `Source exercise ID: ${record.id}.`,
          ].join(' '),
        );
      }

      exercise.tracking_type = trackingType;
      exercise.updated_by = IMPORT_ACTOR;

      return exercise;
    });
  }
}
