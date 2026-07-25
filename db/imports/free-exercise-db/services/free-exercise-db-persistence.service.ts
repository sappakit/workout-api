import { Injectable } from '@nestjs/common';
import { ExerciseEquipment } from 'db/entities/workout/exercise/exercise-equipment.entity';
import { ExerciseMuscle } from 'db/entities/workout/exercise/exercise-muscles.entity';
import { Exercise } from 'db/entities/workout/exercise/exercises.entity';
import { Equipment } from 'db/entities/workout/shared/equipment.entity';
import { Muscle } from 'db/entities/workout/shared/muscles.entity';
import { ExerciseMuscleRole } from 'src/workout/enums/workout.enum';
import {
  DataSource,
  DeepPartial,
  EntityManager,
  In,
  Repository,
} from 'typeorm';
import {
  PersistFreeExerciseDbInput,
  PersistFreeExerciseDbResult,
} from '../types/free-exercise-db.types';
import { ExerciseMetadataImportRecord } from '../types/import-result.types';
import {
  chunkArray,
  deleteExerciseLinks,
  getExerciseIds,
  insertInChunks,
} from '../utils/persistence.util';

const IMPORT_ACTOR = 'system:free-exercise-db-import';
const IMPORT_CHUNK_SIZE = 250;

@Injectable()
export class FreeExerciseDbPersistenceService {
  constructor(private readonly dataSource: DataSource) {}

  // Persist exercises and related links in one transaction.
  async persist(
    input: PersistFreeExerciseDbInput,
  ): Promise<PersistFreeExerciseDbResult> {
    return this.dataSource.transaction(async (manager) => {
      const exercisesByExternalId = await this.upsertExercises(manager, input);

      const equipmentLinkCount = await this.replaceEquipmentLinks(
        manager,
        input.records,
        exercisesByExternalId,
        input.references.equipmentByCode,
      );

      const muscleLinkCount = await this.replaceMuscleLinks(
        manager,
        input.records,
        exercisesByExternalId,
        input.references.musclesByCode,
      );

      return {
        exerciseCount: exercisesByExternalId.size,
        equipmentLinkCount,
        muscleLinkCount,
      };
    });
  }

  // Insert new exercises or update existing exercises from this source.
  private async upsertExercises(
    manager: EntityManager,
    input: PersistFreeExerciseDbInput,
  ): Promise<Map<string, Exercise>> {
    const exerciseRepo = manager.getRepository(Exercise);

    const rows = input.records.map((record) => {
      const category = this.getRequiredReference(
        input.references.categoriesByCode,
        record.categoryCode,
        'category',
        record.sourceExternalId,
      );

      const payload = {
        source: input.references.source,
        source_external_id: record.sourceExternalId,

        name: record.name,
        description: record.description,
        how_to_perform: record.howToPerform,

        category,
        difficulty_level: record.difficultyLevel,

        origin: record.origin,
        status: record.status,

        created_by: IMPORT_ACTOR,
        updated_by: IMPORT_ACTOR,
      } satisfies DeepPartial<Exercise>;

      return exerciseRepo.create(payload);
    });

    for (const rowsChunk of chunkArray(rows, IMPORT_CHUNK_SIZE)) {
      await exerciseRepo.upsert(rowsChunk, {
        conflictPaths: ['source', 'source_external_id'],
        skipUpdateIfNoValuesChanged: true,
      });
    }

    return this.loadPersistedExercises(manager, input);
  }

  // Reload imported exercises so their generated database IDs are available.
  private async loadPersistedExercises(
    manager: EntityManager,
    input: PersistFreeExerciseDbInput,
  ): Promise<Map<string, Exercise>> {
    const exerciseRepo = manager.getRepository(Exercise);

    const sourceExternalIds = input.records.map(
      (record) => record.sourceExternalId,
    );

    const persistedExercises = await exerciseRepo.find({
      where: {
        source: {
          id: input.references.source.id,
        },
        source_external_id: In(sourceExternalIds),
      },
    });

    const exercisesByExternalId = new Map<string, Exercise>();

    for (const exercise of persistedExercises) {
      if (exercise.source_external_id) {
        exercisesByExternalId.set(exercise.source_external_id, exercise);
      }
    }

    this.validateAllExercisesReloaded(sourceExternalIds, exercisesByExternalId);

    return exercisesByExternalId;
  }

  // Ensure every source record was found after the upsert.
  private validateAllExercisesReloaded(
    sourceExternalIds: string[],
    exercisesByExternalId: Map<string, Exercise>,
  ): void {
    const missingSourceIds = sourceExternalIds.filter(
      (sourceExternalId) => !exercisesByExternalId.has(sourceExternalId),
    );

    if (missingSourceIds.length === 0) {
      return;
    }

    throw new Error(
      [
        'Some imported exercises could not be reloaded after upsert.',
        `Missing source IDs: ${missingSourceIds.join(', ')}`,
      ].join(' '),
    );
  }

  // Delete and recreate equipment links for imported exercises.
  private async replaceEquipmentLinks(
    manager: EntityManager,
    records: ExerciseMetadataImportRecord[],
    exercisesByExternalId: Map<string, Exercise>,
    equipmentByCode: Map<string, Equipment>,
  ): Promise<number> {
    const linkRepo = manager.getRepository(ExerciseEquipment);
    const exerciseIds = getExerciseIds(exercisesByExternalId);

    await deleteExerciseLinks(linkRepo, exerciseIds);

    const links: ExerciseEquipment[] = [];

    for (const record of records) {
      // Null means this exercise does not require equipment.
      if (!record.equipmentCode) {
        continue;
      }

      const exercise = this.getPersistedExercise(
        exercisesByExternalId,
        record.sourceExternalId,
      );

      const equipment = this.getRequiredReference(
        equipmentByCode,
        record.equipmentCode,
        'equipment',
        record.sourceExternalId,
      );

      links.push(
        linkRepo.create({
          exercise,
          equipment,
        }),
      );
    }

    await insertInChunks(linkRepo, links, IMPORT_CHUNK_SIZE);

    return links.length;
  }

  // Delete and recreate primary and secondary muscle links.
  private async replaceMuscleLinks(
    manager: EntityManager,
    records: ExerciseMetadataImportRecord[],
    exercisesByExternalId: Map<string, Exercise>,
    musclesByCode: Map<string, Muscle>,
  ): Promise<number> {
    const linkRepo = manager.getRepository(ExerciseMuscle);
    const exerciseIds = getExerciseIds(exercisesByExternalId);

    await deleteExerciseLinks(linkRepo, exerciseIds);

    const links: ExerciseMuscle[] = [];

    for (const record of records) {
      const exercise = this.getPersistedExercise(
        exercisesByExternalId,
        record.sourceExternalId,
      );

      // Remove duplicate primary muscles.
      const primaryCodes = new Set(record.primaryMuscleCodes);

      // Primary wins if a muscle appears in both lists.
      const secondaryCodes = new Set(
        record.secondaryMuscleCodes.filter((code) => !primaryCodes.has(code)),
      );

      for (const muscleCode of primaryCodes) {
        links.push(
          this.createMuscleLink(
            linkRepo,
            exercise,
            muscleCode,
            ExerciseMuscleRole.PRIMARY,
            musclesByCode,
            record.sourceExternalId,
          ),
        );
      }

      for (const muscleCode of secondaryCodes) {
        links.push(
          this.createMuscleLink(
            linkRepo,
            exercise,
            muscleCode,
            ExerciseMuscleRole.SECONDARY,
            musclesByCode,
            record.sourceExternalId,
          ),
        );
      }
    }

    await insertInChunks(linkRepo, links, IMPORT_CHUNK_SIZE);

    return links.length;
  }

  // Create one exercise-muscle relationship.
  private createMuscleLink(
    repository: Repository<ExerciseMuscle>,
    exercise: Exercise,
    muscleCode: string,
    role: ExerciseMuscleRole,
    musclesByCode: Map<string, Muscle>,
    sourceExternalId: string,
  ): ExerciseMuscle {
    const muscle = this.getRequiredReference(
      musclesByCode,
      muscleCode,
      'muscle',
      sourceExternalId,
    );

    return repository.create({
      exercise,
      muscle,
      role,
    });
  }

  // Return an imported exercise or throw a useful error.
  private getPersistedExercise(
    exercisesByExternalId: Map<string, Exercise>,
    sourceExternalId: string,
  ): Exercise {
    const exercise = exercisesByExternalId.get(sourceExternalId);

    if (!exercise) {
      throw new Error(
        `Persisted exercise not found for source ID: ${sourceExternalId}`,
      );
    }

    return exercise;
  }

  // Return a required mapped reference or throw a useful error.
  private getRequiredReference<Entity>(
    recordsByCode: Map<string, Entity>,
    code: string | null,
    resourceName: string,
    sourceExternalId: string,
  ): Entity {
    if (!code) {
      throw new Error(
        [
          `Exercise "${sourceExternalId}" has no mapped ${resourceName} code.`,
          'Run the importer in dry-run mode and inspect the report.',
        ].join(' '),
      );
    }

    const record = recordsByCode.get(code);

    if (!record) {
      throw new Error(
        [
          `${resourceName} "${code}" was not found in the database.`,
          `Source exercise ID: ${sourceExternalId}.`,
        ].join(' '),
      );
    }

    return record;
  }
}
