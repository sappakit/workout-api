import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExerciseSource } from 'db/entities/workout/exercise/exercise-source.entity';
import { Exercise } from 'db/entities/workout/exercise/exercises.entity';
import { WorkoutExercise } from 'db/entities/workout/workout/workout-exercises.entity';
import { WorkoutFocusType } from 'db/entities/workout/workout/workout-focus-types.entity';
import { Workout } from 'db/entities/workout/workout/workouts.entity';
import {
  DataSource,
  DeepPartial,
  EntityManager,
  In,
  Repository,
} from 'typeorm';
import { WORKOUT_SEED_DATA, WorkoutSeedData } from '../data/workout.seed-data';
import {
  WorkoutSeedValidationReport,
  writeWorkoutSeedValidationReport,
} from '../utils/workout-seed.util';

type WorkoutSeedReferences = {
  focusTypesByCode: Map<string, WorkoutFocusType>;
  exercisesByKey: Map<string, Exercise>;
};

type WorkoutSeedResult = {
  workoutCount: number;
  workoutExerciseCount: number;
};

@Injectable()
export class WorkoutSeeder {
  private readonly logger = new Logger(WorkoutSeeder.name);

  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(WorkoutFocusType)
    private readonly workoutFocusTypeRepo: Repository<WorkoutFocusType>,

    @InjectRepository(ExerciseSource)
    private readonly exerciseSourceRepo: Repository<ExerciseSource>,

    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
  ) {}

  // Validate references, then persist workouts and their exercises in one transaction.
  async run(): Promise<void> {
    const references = await this.loadReferences(WORKOUT_SEED_DATA);

    await this.validateReferences(WORKOUT_SEED_DATA, references);

    this.logger.log(
      `Validated ${WORKOUT_SEED_DATA.length} workout seed records`,
    );

    const result = await this.dataSource.transaction((manager) =>
      this.persistWorkouts(manager, WORKOUT_SEED_DATA, references),
    );

    this.logger.log(`Seeded ${result.workoutCount} workout templates`);

    this.logger.log(
      `Inserted ${result.workoutExerciseCount} workout exercises`,
    );
  }

  // Upsert workouts and replace their exercise rows with the seed definition.
  private async persistWorkouts(
    manager: EntityManager,
    workouts: WorkoutSeedData[],
    references: WorkoutSeedReferences,
  ): Promise<WorkoutSeedResult> {
    const workoutsByCode = await this.upsertWorkouts(
      manager,
      workouts,
      references,
    );

    const workoutExerciseCount = await this.replaceWorkoutExercises(
      manager,
      workouts,
      workoutsByCode,
      references.exercisesByKey,
    );

    return {
      workoutCount: workoutsByCode.size,
      workoutExerciseCount,
    };
  }

  // Upsert system workout templates and reload their persisted entities.
  private async upsertWorkouts(
    manager: EntityManager,
    workouts: WorkoutSeedData[],
    references: WorkoutSeedReferences,
  ): Promise<Map<string, Workout>> {
    const workoutRepo = manager.getRepository(Workout);

    const rows = workouts.map((workout) => {
      const focusType = workout.workoutFocusTypeCode
        ? this.getRequiredFocusType(
            workout.workoutFocusTypeCode,
            references.focusTypesByCode,
          )
        : null;

      const payload = {
        code: workout.code,
        name: workout.name,
        image_url: workout.image_url,
        description: workout.description,
        duration: workout.duration,

        plan_type: workout.plan_type,
        status: workout.status,

        workout_focus_type: focusType,

        user: null,
        source_workout: null,

        created_by: workout.created_by,
        updated_by: workout.updated_by,
      } satisfies DeepPartial<Workout>;

      return workoutRepo.create(payload);
    });

    await workoutRepo.upsert(rows, {
      conflictPaths: ['code'],
      skipUpdateIfNoValuesChanged: true,
    });

    return this.loadPersistedWorkouts(manager, workouts);
  }

  // Reload seeded workouts so their generated database IDs are available.
  private async loadPersistedWorkouts(
    manager: EntityManager,
    workouts: WorkoutSeedData[],
  ): Promise<Map<string, Workout>> {
    const workoutRepo = manager.getRepository(Workout);

    const codes = workouts.map((workout) => workout.code);

    const persistedWorkouts = await workoutRepo.find({
      where: {
        code: In(codes),
      },
    });

    const workoutsByCode = new Map<string, Workout>();

    for (const workout of persistedWorkouts) {
      if (workout.code) {
        workoutsByCode.set(workout.code, workout);
      }
    }

    this.validateAllWorkoutsReloaded(codes, workoutsByCode);

    return workoutsByCode;
  }

  // Replace all exercise rows belonging to the seeded workout templates.
  private async replaceWorkoutExercises(
    manager: EntityManager,
    workouts: WorkoutSeedData[],
    workoutsByCode: Map<string, Workout>,
    exercisesByKey: Map<string, Exercise>,
  ): Promise<number> {
    const workoutExerciseRepo = manager.getRepository(WorkoutExercise);

    const workoutIds = [...workoutsByCode.values()].map(
      (workout) => workout.id,
    );

    if (workoutIds.length > 0) {
      await workoutExerciseRepo.delete({
        workout: {
          id: In(workoutIds),
        },
      });
    }

    const workoutExercises: WorkoutExercise[] = [];

    for (const workoutSeed of workouts) {
      const workout = this.getPersistedWorkout(
        workoutsByCode,
        workoutSeed.code,
      );

      for (const exerciseSeed of workoutSeed.exercises) {
        const exerciseKey = this.buildExerciseKey(
          exerciseSeed.sourceKey,
          exerciseSeed.sourceExternalId,
        );

        const exercise = this.getRequiredExercise(exerciseKey, exercisesByKey);

        workoutExercises.push(
          workoutExerciseRepo.create({
            workout,
            exercise,
            order_index: exerciseSeed.orderIndex,
            rest_time: exerciseSeed.restTime,
          }),
        );
      }
    }

    if (workoutExercises.length > 0) {
      await workoutExerciseRepo.insert(workoutExercises);
    }

    return workoutExercises.length;
  }

  // Ensure every seeded workout can be found after the upsert.
  private validateAllWorkoutsReloaded(
    codes: string[],
    workoutsByCode: Map<string, Workout>,
  ): void {
    const missingCodes = codes.filter((code) => !workoutsByCode.has(code));

    if (missingCodes.length === 0) {
      return;
    }

    throw new Error(
      [
        'Some workout templates could not be reloaded after upsert.',
        `Missing workout codes: ${missingCodes.join(', ')}.`,
      ].join(' '),
    );
  }

  // Return a persisted workout from its stable template code.
  private getPersistedWorkout(
    workoutsByCode: Map<string, Workout>,
    code: string,
  ): Workout {
    const workout = workoutsByCode.get(code);

    if (!workout) {
      throw new Error(`Persisted workout was not found for code: ${code}`);
    }

    return workout;
  }

  // Return a required workout focus type from the validated lookup map.
  private getRequiredFocusType(
    code: string,
    focusTypesByCode: Map<string, WorkoutFocusType>,
  ): WorkoutFocusType {
    const focusType = focusTypesByCode.get(code);

    if (!focusType) {
      throw new Error(
        `Workout focus type "${code}" was not found after validation.`,
      );
    }

    return focusType;
  }

  // Return a required exercise from the validated source/external-ID lookup map.
  private getRequiredExercise(
    key: string,
    exercisesByKey: Map<string, Exercise>,
  ): Exercise {
    const exercise = exercisesByKey.get(key);

    if (!exercise) {
      throw new Error(`Exercise "${key}" was not found after validation.`);
    }

    return exercise;
  }

  // Load all focus types and exercises referenced by the workout seed data.
  private async loadReferences(
    workouts: WorkoutSeedData[],
  ): Promise<WorkoutSeedReferences> {
    const [focusTypesByCode, exercisesByKey] = await Promise.all([
      this.loadFocusTypes(workouts),
      this.loadExercises(workouts),
    ]);

    return {
      focusTypesByCode,
      exercisesByKey,
    };
  }

  // Load the workout focus types referenced by the seed records.
  private async loadFocusTypes(
    workouts: WorkoutSeedData[],
  ): Promise<Map<string, WorkoutFocusType>> {
    const codes = [
      ...new Set(
        workouts
          .map((workout) => workout.workoutFocusTypeCode)
          .filter((code): code is string => code !== null),
      ),
    ];

    if (codes.length === 0) {
      return new Map();
    }

    const focusTypes = await this.workoutFocusTypeRepo.find({
      where: {
        code: In(codes),
      },
    });

    return new Map(focusTypes.map((focusType) => [focusType.code, focusType]));
  }

  // Load all exercise sources and exercises referenced by the seed records.
  private async loadExercises(
    workouts: WorkoutSeedData[],
  ): Promise<Map<string, Exercise>> {
    const exerciseReferences = workouts.flatMap((workout) =>
      workout.exercises.map((exercise) => ({
        sourceKey: exercise.sourceKey,
        sourceExternalId: exercise.sourceExternalId,
      })),
    );

    if (exerciseReferences.length === 0) {
      return new Map();
    }

    const sourceKeys = [
      ...new Set(exerciseReferences.map((reference) => reference.sourceKey)),
    ];

    const sources = await this.exerciseSourceRepo.find({
      where: {
        key: In(sourceKeys),
      },
    });

    if (sources.length === 0) {
      return new Map();
    }

    const sourceExternalIds = [
      ...new Set(
        exerciseReferences.map((reference) => reference.sourceExternalId),
      ),
    ];

    const exercises = await this.exerciseRepo.find({
      where: {
        source: {
          id: In(sources.map((source) => source.id)),
        },
        source_external_id: In(sourceExternalIds),
      },
      relations: {
        source: true,
      },
    });

    const exercisesByKey = new Map<string, Exercise>();

    for (const exercise of exercises) {
      if (!exercise.source || !exercise.source_external_id) {
        continue;
      }

      const key = this.buildExerciseKey(
        exercise.source.key,
        exercise.source_external_id,
      );

      exercisesByKey.set(key, exercise);
    }

    return exercisesByKey;
  }

  // Validate all seed references and write a report when any are missing.
  private async validateReferences(
    workouts: WorkoutSeedData[],
    references: WorkoutSeedReferences,
  ): Promise<void> {
    const missingFocusTypes = this.getMissingFocusTypes(
      workouts,
      references.focusTypesByCode,
    );

    const missingExercises = this.getMissingExercises(
      workouts,
      references.exercisesByKey,
    );

    const report: WorkoutSeedValidationReport = {
      generatedAt: new Date().toLocaleString(),

      valid: missingFocusTypes.length === 0 && missingExercises.length === 0,

      summary: {
        totalWorkouts: workouts.length,
        missingFocusTypes: missingFocusTypes.length,
        missingExercises: missingExercises.length,
      },

      missingFocusTypes,
      missingExercises,
    };

    if (report.valid) {
      return;
    }

    const reportPath = await writeWorkoutSeedValidationReport(report);

    throw new Error(
      [
        'Workout seed validation failed.',
        `${missingFocusTypes.length} focus type references are missing.`,
        `${missingExercises.length} exercise references are missing.`,
        `Review the validation report: ${reportPath}`,
      ].join(' '),
    );
  }

  // Return all workout focus type codes missing from the database.
  private getMissingFocusTypes(
    workouts: WorkoutSeedData[],
    focusTypesByCode: Map<string, WorkoutFocusType>,
  ): string[] {
    const requiredCodes = [
      ...new Set(
        workouts
          .map((workout) => workout.workoutFocusTypeCode)
          .filter((code): code is string => code !== null),
      ),
    ];

    return requiredCodes.filter((code) => !focusTypesByCode.has(code)).sort();
  }

  // Return all source and external ID exercise references missing from the database.
  private getMissingExercises(
    workouts: WorkoutSeedData[],
    exercisesByKey: Map<string, Exercise>,
  ): string[] {
    const requiredKeys = [
      ...new Set(
        workouts.flatMap((workout) =>
          workout.exercises.map((exercise) =>
            this.buildExerciseKey(
              exercise.sourceKey,
              exercise.sourceExternalId,
            ),
          ),
        ),
      ),
    ];

    return requiredKeys.filter((key) => !exercisesByKey.has(key)).sort();
  }

  // Build the stable lookup key used to identify an imported exercise.
  private buildExerciseKey(
    sourceKey: string,
    sourceExternalId: string,
  ): string {
    return `${sourceKey}:${sourceExternalId}`;
  }
}
