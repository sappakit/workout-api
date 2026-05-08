import { DataSource, FindManyOptions, In, Repository } from 'typeorm';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Exercise,
  Muscle,
  Workout,
  WorkoutExercise,
  WorkoutFocusType,
  WorkoutMuscle,
  WorkoutSchedule,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSessionExerciseSet,
  WorkoutWeeklyPlan,
} from 'db/entities/workout';
import { PagingDto } from 'src/common/dto/request.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { getISOWeekday, normalizeToUTCDate } from 'utils/time.util';
import {
  WorkoutCurrentMode,
  WorkoutProgressOverviewType,
  WorkoutScheduleStatus,
  WorkoutSessionStatus,
} from './enums/workout.enum';
import { GetWorkoutScheduleQueryDto } from './dto/workout-query.dto';
import { ActiveUserData } from 'src/auth/enums/auth.enum';
import {
  FinishWorkoutSessionDto,
  FinishWorkoutSessionExerciseDto,
  FinishWorkoutSessionSetDto,
  UpdateWorkoutDto,
} from './dto/workout-body.dto';

@Injectable()
export class WorkoutService {
  constructor(
    private dataSource: DataSource,
    private paginationService: PaginationService,

    // Repository
    @InjectRepository(Workout)
    private readonly workoutRepo: Repository<Workout>,
    @InjectRepository(WorkoutSchedule)
    private readonly workoutScheduleRepo: Repository<WorkoutSchedule>,
    @InjectRepository(WorkoutWeeklyPlan)
    private readonly workoutWeeklyPlanRepo: Repository<WorkoutWeeklyPlan>,
    @InjectRepository(WorkoutFocusType)
    private readonly workoutFocusTypeRepo: Repository<WorkoutFocusType>,
    @InjectRepository(WorkoutSession)
    private readonly workoutSessionRepo: Repository<WorkoutSession>,
    @InjectRepository(WorkoutSessionExercise)
    private readonly workoutSessionExerciseRepo: Repository<WorkoutSessionExercise>,
  ) {}

  // Workouts
  async findAllWorkouts(query: PagingDto) {
    const options: FindManyOptions<Workout> = {
      order: { created_at: 'DESC' },
    };

    return this.paginationService.paginateRepository(
      this.workoutRepo,
      options,
      query,
    );
  }

  async findOneWorkout(id: number) {
    const results = await this.workoutRepo.findOne({
      where: { id },
      relations: {
        workout_exercises: {
          exercise: {
            user_stats: true,
            muscles: { muscle: true },
            equipment_links: {
              equipment: true,
            },
          },
        },
        muscles: { muscle: true },
        workout_focus_type: true,
      },
      order: {
        workout_exercises: { order_index: 'ASC' },
      },
    });

    if (!results) {
      throw new NotFoundException('Workout not found');
    }

    return results;
  }

  async updateWorkout(id: number, payload: UpdateWorkoutDto) {
    await this.dataSource.transaction(async (manager) => {
      const workoutRepo = manager.getRepository(Workout);
      const workoutExerciseRepo = manager.getRepository(WorkoutExercise);
      const workoutMuscleRepo = manager.getRepository(WorkoutMuscle);
      const workoutFocusTypeRepo = manager.getRepository(WorkoutFocusType);
      const exerciseRepo = manager.getRepository(Exercise);
      const muscleRepo = manager.getRepository(Muscle);

      const workout = await workoutRepo.findOne({
        where: { id },
        relations: {
          workout_focus_type: true,
          muscles: { muscle: true },
        },
      });

      if (!workout) {
        throw new NotFoundException('Workout not found');
      }

      const focusType = await workoutFocusTypeRepo.findOne({
        where: { id: payload.workoutFocusTypeId },
      });

      if (!focusType) {
        throw new BadRequestException('Workout focus type not found');
      }

      /* Validate part */
      const uniqueExerciseIds = [
        ...new Set(payload.workoutExercises.map((i) => i.exerciseId)),
      ];

      // Guard against duplicate exercise in same workout
      if (uniqueExerciseIds.length !== payload.workoutExercises.length) {
        throw new BadRequestException(
          'Duplicate exerciseId is not allowed in the same workout',
        );
      }

      // Validate exercise ids
      const exercises = await exerciseRepo.find({
        where: { id: In(uniqueExerciseIds) },
      });

      if (exercises.length !== uniqueExerciseIds.length) {
        throw new BadRequestException('One or more exercises not found');
      }

      const exerciseMap = new Map(exercises.map((item) => [item.id, item]));

      // Validate muscle ids
      const uniqueMuscleIds = [...new Set(payload.targetMuscles)].sort(
        (a, b) => a - b,
      );

      const muscles = uniqueMuscleIds.length
        ? await muscleRepo.find({
            where: { id: In(uniqueMuscleIds) },
          })
        : [];

      if (muscles.length !== uniqueMuscleIds.length) {
        throw new BadRequestException('One or more target muscles not found');
      }

      /* Update part */
      // Update workout main fields
      workout.name = payload.name;
      workout.duration = payload.duration;
      workout.workout_focus_type = focusType;

      await workoutRepo.save(workout);

      // Update workout muscles
      const existingMuscleIds = workout.muscles
        .map((item) => item.muscle.id)
        .sort((a, b) => a - b);

      const isSameMuscles =
        existingMuscleIds.length === uniqueMuscleIds.length &&
        existingMuscleIds.every((id, i) => id === uniqueMuscleIds[i]);

      if (!isSameMuscles) {
        await workoutMuscleRepo.delete({
          workout: { id: workout.id },
        });

        if (uniqueMuscleIds.length > 0) {
          const workoutMuscles = uniqueMuscleIds.map((muscleId) => ({
            workout: { id: workout.id },
            muscle: { id: muscleId },
          }));

          await workoutMuscleRepo.insert(workoutMuscles);
        }
      }

      // Update workout exercises
      const existingWorkoutExercises = await workoutExerciseRepo.find({
        where: { workout: { id: workout.id } },
      });

      const existingById = new Map(
        existingWorkoutExercises.map((item) => [item.id, item]),
      );

      const incomingIds = new Set(
        payload.workoutExercises
          .map((item) => item.id)
          .filter((id) => id != null),
      );

      // Delete removed workout exercises
      const toDeleteIds = existingWorkoutExercises
        .filter((item) => !incomingIds.has(item.id))
        .map((item) => item.id);

      if (toDeleteIds.length > 0) {
        await workoutExerciseRepo.delete(toDeleteIds);
      }

      // Split incoming workout exercises into update/create groups
      const updateItems = payload.workoutExercises.filter(
        (item): item is typeof item & { id: number } => item.id != null,
      );

      const createItems = payload.workoutExercises.filter(
        (item) => item.id == null,
      );

      // Update existing workout exercises
      const toUpdate = updateItems.map((item) => {
        const existing = existingById.get(item.id);

        if (!existing) {
          throw new BadRequestException(
            `Workout exercise with id ${item.id} not found`,
          );
        }

        existing.order_index = item.orderIndex;
        existing.planned_sets = item.plannedSets;
        existing.planned_reps_range = item.plannedRepsRange;
        existing.planned_weight = item.plannedWeight;
        existing.planned_rest_time = item.plannedRestTime;
        existing.planned_duration = item.plannedDuration;
        existing.planned_distance = item.plannedDistance;
        existing.exercise = exerciseMap.get(item.exerciseId)!;

        return existing;
      });

      if (toUpdate.length > 0) {
        await workoutExerciseRepo.save(toUpdate);
      }

      // Bulk create new workout exercises
      if (createItems.length > 0) {
        const newWorkoutExercises = createItems.map((item) => ({
          order_index: item.orderIndex,
          planned_sets: item.plannedSets,
          planned_reps_range: item.plannedRepsRange,
          planned_weight: item.plannedWeight,
          planned_rest_time: item.plannedRestTime,
          planned_duration: item.plannedDuration,
          planned_distance: item.plannedDistance,
          workout: { id: workout.id },
          exercise: { id: item.exerciseId },
        }));

        await workoutExerciseRepo.insert(newWorkoutExercises);
      }
    });

    return { message: 'Workout updated successfully' };
  }

  // Workout focus type
  async findAllWorkoutFocusTypes(query: PagingDto) {
    const options: FindManyOptions<WorkoutFocusType> = {
      order: { name: 'ASC' },
    };

    return this.paginationService.paginateRepository(
      this.workoutFocusTypeRepo,
      options,
      query,
    );
  }

  // Workout schedule
  async getScheduleByDate(
    user: ActiveUserData,
    query: GetWorkoutScheduleQueryDto,
  ) {
    const { date } = query;

    const rawDate = date ? new Date(date) : new Date();
    const normalizedDate = normalizeToUTCDate(rawDate);

    // Check if schedule already exists
    const exists = await this.workoutScheduleRepo.exists({
      where: {
        user: { id: user.sub },
        scheduled_date: normalizedDate,
      },
    });

    // If not exists, add schedule
    if (!exists) {
      await this.createScheduleForDate(user, normalizedDate);
    }

    const schedule = await this.workoutScheduleRepo.findOne({
      where: {
        user: { id: user.sub },
        scheduled_date: normalizedDate,
      },
      relations: {
        workout: {
          workout_focus_type: true,
          muscles: { muscle: true },
          workout_exercises: {
            exercise: {
              user_stats: true,
              muscles: { muscle: true },
              equipment_links: { equipment: true },
            },
          },
        },
      },
      order: {
        workout: {
          workout_exercises: { order_index: 'ASC' },
        },
      },
    });

    return schedule;
  }

  // Create a new schedule for date
  private async createScheduleForDate(
    user: ActiveUserData,
    normalizedDate: Date,
  ) {
    const dayOfWeek = getISOWeekday(normalizedDate); // 1–7

    const weeklyPlan = await this.workoutWeeklyPlanRepo.findOne({
      where: {
        user: { id: user.sub },
        day_of_week: dayOfWeek,
      },
      relations: {
        workout: true,
      },
    });

    if (!weeklyPlan) {
      return null; // Rest day
    }

    // create schedule
    const newSchedule = this.workoutScheduleRepo.create({
      user: { id: user.sub },
      workout: { id: weeklyPlan.workout.id },
      scheduled_date: normalizedDate,
      status: WorkoutScheduleStatus.PLANNED,
      created_by: user.username,
      updated_by: user.username,
    });

    await this.workoutScheduleRepo.save(newSchedule);
  }

  // Get current workout state for today
  async getCurrentWorkout(user: ActiveUserData) {
    // use unfinished session first
    const currentSession = await this.workoutSessionRepo.findOne({
      where: {
        user: { id: user.sub },
        status: In([WorkoutSessionStatus.ACTIVE, WorkoutSessionStatus.PAUSED]),
      },
      relations: this.getWorkoutSessionDetailRelations(),
      order: {
        started_at: 'DESC',
      },
    });

    if (currentSession) {
      return {
        mode: WorkoutCurrentMode.IN_PROGRESS,
        session: currentSession,
        schedule: null,
      };
    }

    // use today schedule
    const today = new Date();
    const normalizedDate = normalizeToUTCDate(today);

    const schedule = await this.workoutScheduleRepo.findOne({
      where: {
        user: { id: user.sub },
        scheduled_date: normalizedDate,
      },
    });

    // no schedule means rest day
    if (!schedule) {
      return {
        mode: WorkoutCurrentMode.REST_DAY,
        session: null,
        schedule: null,
      };
    }

    const fullSchedule = await this.getScheduleByDate(user, {
      date: today.toISOString(),
    });

    return {
      mode: WorkoutCurrentMode.SCHEDULED,
      session: null,
      schedule: fullSchedule,
    };
  }

  // Get user workout session history
  async getWorkoutSessionHistory(user: ActiveUserData, query: PagingDto) {
    const options: FindManyOptions<WorkoutSession> = {
      where: {
        user: { id: user.sub },
        status: WorkoutSessionStatus.COMPLETED,
      },
      relations: this.getWorkoutSessionDetailRelations(),
      order: {
        ended_at: 'DESC',
        started_at: 'DESC',
      },
    };

    return this.paginationService.paginateRepository(
      this.workoutSessionRepo,
      options,
      query,
    );
  }

  // Start session
  async startWorkoutSession(workoutId: number, user: ActiveUserData) {
    const workout = await this.workoutRepo.findOne({
      where: { id: workoutId },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found.');
    }

    // If no session exists, create a new one and use it
    const existingSession = await this.workoutSessionRepo.findOne({
      where: {
        user: { id: user.sub },
        workout: { id: workoutId },
        status: In([WorkoutSessionStatus.ACTIVE, WorkoutSessionStatus.PAUSED]),
      },
      relations: this.getWorkoutSessionDetailRelations(),
      order: this.getWorkoutSessionDetailOrder(),
    });

    if (existingSession) {
      return existingSession;
    }

    return await this.createSessionFromWorkout(workoutId, user);
  }

  // Create a new session from workout
  private async createSessionFromWorkout(
    workoutId: number,
    user: ActiveUserData,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const workoutExerciseRepo = manager.getRepository(WorkoutExercise);
      const workoutSessionRepo = manager.getRepository(WorkoutSession);
      const workoutSessionExerciseRepo = manager.getRepository(
        WorkoutSessionExercise,
      );

      // Load workout exercises in order
      const plannedExercises = await workoutExerciseRepo.find({
        where: {
          workout: { id: workoutId },
        },
        relations: {
          exercise: true,
        },
        order: {
          order_index: 'ASC',
        },
      });

      if (!plannedExercises.length) {
        throw new NotFoundException('This workout has no exercises to start.');
      }

      // Create session
      const session = workoutSessionRepo.create({
        user: { id: user.sub },
        workout: { id: workoutId },
        status: WorkoutSessionStatus.ACTIVE,
        started_at: new Date(),
        created_by: user.username,
        updated_by: user.username,
      });

      const savedSession = await workoutSessionRepo.save(session);

      // Copy workout plan rows into session exercises as a snapshot
      const sessionExerciseValues = plannedExercises.map((item) => ({
        session: { id: savedSession.id },
        exercise: { id: item.exercise.id },
        order_index: item.order_index,

        planned_sets: item.planned_sets,
        planned_reps_range: item.planned_reps_range,
        planned_weight: item.planned_weight,
        planned_rest_time: item.planned_rest_time,
        planned_duration: item.planned_duration,
        planned_distance: item.planned_distance,

        completed_at: null,
      }));

      await workoutSessionExerciseRepo.insert(sessionExerciseValues);

      return await workoutSessionRepo.findOneOrFail({
        where: { id: savedSession.id },
        relations: this.getWorkoutSessionDetailRelations(),
        order: this.getWorkoutSessionDetailOrder(),
      });
    });
  }

  // Cancel session
  async cancelWorkoutSession(id: number, user: ActiveUserData) {
    const session = await this.workoutSessionRepo.findOne({
      where: {
        id,
        user: { id: user.sub },
      },
    });

    if (!session) {
      throw new NotFoundException('Workout session not found.');
    }

    if (
      session.status !== WorkoutSessionStatus.ACTIVE &&
      session.status !== WorkoutSessionStatus.PAUSED
    ) {
      throw new BadRequestException(
        'Only active or paused workout sessions can be cancelled.',
      );
    }

    session.status = WorkoutSessionStatus.CANCELLED;
    session.ended_at = new Date();
    session.updated_by = user.username;

    await this.workoutSessionRepo.save(session);

    return { message: 'Workout session cancelled successfully' };
  }

  private getWorkoutSessionDetailRelations() {
    return {
      workout: {
        workout_focus_type: true,
      },
      session_exercises: {
        exercise: {
          user_stats: true,
        },
        sets: true,
      },
    } as const;
  }

  private getWorkoutSessionDetailOrder() {
    return {
      session_exercises: {
        order_index: 'ASC' as const,
      },
    };
  }

  // Finish session
  async finishWorkoutSession(id: number, body: FinishWorkoutSessionDto) {
    await this.dataSource.transaction(async (manager) => {
      const workoutSessionRepo = manager.getRepository(WorkoutSession);
      const workoutSessionExerciseRepo = manager.getRepository(
        WorkoutSessionExercise,
      );
      const workoutSessionExerciseSetRepo = manager.getRepository(
        WorkoutSessionExerciseSet,
      );
      const exerciseRepo = manager.getRepository(Exercise);

      // 1) Load session
      const session = await workoutSessionRepo.findOne({
        where: { id },
      });

      if (!session) {
        throw new NotFoundException('Workout session not found.');
      }

      const allowedStatuses = [
        WorkoutSessionStatus.ACTIVE,
        WorkoutSessionStatus.PAUSED,
      ];

      // Only allow session with 'allowedStatuses' to be finished
      if (!allowedStatuses.includes(session.status)) {
        throw new BadRequestException(
          'Workout session must be active or paused to be finished.',
        );
      }

      // 2) Load current db children
      const existingSessionExercises = await workoutSessionExerciseRepo.find({
        where: {
          session: { id: session.id },
        },
        relations: {
          exercise: true,
          sets: true,
        },
        order: {
          order_index: 'ASC',
          sets: {
            set_number: 'ASC',
          },
        },
      });

      const existingSessionExerciseMap = new Map(
        existingSessionExercises.map((item) => [item.id, item]),
      );

      // Validate duplicate ids in payload
      const incomingExerciseIds = body.sessionExercises
        .map((item) => item.id)
        .filter((id): id is number => id != null);

      if (new Set(incomingExerciseIds).size !== incomingExerciseIds.length) {
        throw new BadRequestException(
          'Duplicate workout session exercise ids found in payload.',
        );
      }

      // Validate all referenced existing exercise rows belong to this session
      for (const incomingExercise of body.sessionExercises) {
        if (
          incomingExercise.id != null &&
          !existingSessionExerciseMap.has(incomingExercise.id)
        ) {
          throw new BadRequestException(
            `Workout session exercise id ${incomingExercise.id} does not belong to session ${session.id}.`,
          );
        }
      }

      // Load exercise entities needed for new session exercise rows
      const newExerciseIds = [
        ...new Set(
          body.sessionExercises
            .filter((item) => item.id == null)
            .map((item) => item.exerciseId),
        ),
      ];

      const exerciseEntities =
        newExerciseIds.length > 0
          ? await exerciseRepo.find({
              where: { id: In(newExerciseIds) },
            })
          : [];

      const exerciseEntityMap = new Map(
        exerciseEntities.map((item) => [item.id, item]),
      );

      for (const incomingExercise of body.sessionExercises) {
        if (incomingExercise.id == null) {
          const exercise = exerciseEntityMap.get(incomingExercise.exerciseId);

          if (!exercise) {
            throw new NotFoundException(
              `Exercise id ${incomingExercise.exerciseId} not found.`,
            );
          }
        }
      }

      // Track kept session_exercise ids to later delete removed rows
      const keptSessionExerciseIds: number[] = [];

      // 3) Upsert workout_session_exercises + nested sets
      for (const incomingExercise of body.sessionExercises) {
        // Upsert workout_session_exercises
        const sessionExercise = await this.upsertSessionExercise({
          incomingExercise,
          session,
          existingSessionExerciseMap,
          exerciseEntityMap,
          workoutSessionExerciseRepo,
          exerciseRepo,
        });

        // Add sessionExercise ID to kept list
        keptSessionExerciseIds.push(sessionExercise.id);

        // Sync sets for this session exercise
        const existingSets = sessionExercise.sets ?? [];
        const existingSetMap = new Map(
          existingSets.map((item) => [item.id, item]),
        );

        const incomingSetIds = incomingExercise.sets
          .map((item) => item.id)
          .filter((id): id is number => id != null);

        if (new Set(incomingSetIds).size !== incomingSetIds.length) {
          throw new BadRequestException(
            `Duplicate set ids found in payload for session exercise ${sessionExercise.id}.`,
          );
        }

        for (const incomingSet of incomingExercise.sets) {
          if (incomingSet.id != null && !existingSetMap.has(incomingSet.id)) {
            throw new BadRequestException(
              `Set id ${incomingSet.id} does not belong to workout session exercise ${sessionExercise.id}.`,
            );
          }
        }

        const keptSetIds: number[] = [];

        for (const incomingSet of incomingExercise.sets) {
          const setEntity = await this.upsertSessionExerciseSet({
            incomingSet,
            sessionExercise,
            existingSetMap,
            workoutSessionExerciseSetRepo,
          });

          // Add set ID to kept list
          keptSetIds.push(setEntity.id);
        }

        // DELETE removed sets
        const setIdsToDelete = existingSets
          .filter((item) => !keptSetIds.includes(item.id))
          .map((item) => item.id);

        if (setIdsToDelete.length > 0) {
          await workoutSessionExerciseSetRepo.delete(setIdsToDelete);
        }
      }

      // 4) DELETE removed workout_session_exercises
      const sessionExerciseIdsToDelete = existingSessionExercises
        .filter((item) => !keptSessionExerciseIds.includes(item.id))
        .map((item) => item.id);

      if (sessionExerciseIdsToDelete.length > 0) {
        // Delete child sets first
        await workoutSessionExerciseSetRepo.delete({
          session_exercise: {
            id: In(sessionExerciseIdsToDelete),
          },
        });

        await workoutSessionExerciseRepo.delete(sessionExerciseIdsToDelete);
      }

      // 5) Update workout_session
      session.status = WorkoutSessionStatus.COMPLETED;
      session.ended_at = new Date(body.endedAt);
      session.paused_at = null;
      session.total_duration = body.totalDuration ?? null;
      session.total_paused_duration = body.totalPausedDuration ?? 0;
      session.calories_burned = body.caloriesBurned ?? null;

      await workoutSessionRepo.save(session);
    });

    return { message: 'Workout session finished successfully.' };
  }

  // Upsert session exercise
  private async upsertSessionExercise({
    incomingExercise,
    session,
    existingSessionExerciseMap,
    exerciseEntityMap,
    workoutSessionExerciseRepo,
    exerciseRepo,
  }: {
    incomingExercise: FinishWorkoutSessionExerciseDto;
    session: WorkoutSession;
    existingSessionExerciseMap: Map<number, WorkoutSessionExercise>;
    exerciseEntityMap: Map<number, Exercise>;
    workoutSessionExerciseRepo: Repository<WorkoutSessionExercise>;
    exerciseRepo: Repository<Exercise>;
  }): Promise<WorkoutSessionExercise> {
    let sessionExercise: WorkoutSessionExercise | undefined;

    if (incomingExercise.id != null) {
      // UPDATE existing workout_session_exercises
      sessionExercise = existingSessionExerciseMap.get(incomingExercise.id);

      if (!sessionExercise) {
        throw new BadRequestException(
          `Workout session exercise id ${incomingExercise.id} does not belong to session ${session.id}.`,
        );
      }

      sessionExercise.order_index = incomingExercise.orderIndex;
      sessionExercise.planned_rest_time = incomingExercise.plannedRestTime;
      sessionExercise.completed_at = incomingExercise.completedAt
        ? new Date(incomingExercise.completedAt)
        : null;

      // TODO: Optional: allow changing exercise relation if needed
      if (sessionExercise.exercise.id !== incomingExercise.exerciseId) {
        const newExercise = await exerciseRepo.findOne({
          where: { id: incomingExercise.exerciseId },
        });

        if (!newExercise) {
          throw new NotFoundException(
            `Exercise id ${incomingExercise.exerciseId} not found.`,
          );
        }

        sessionExercise.exercise = newExercise;
      }

      sessionExercise = await workoutSessionExerciseRepo.save(sessionExercise);
    } else {
      // CREATE new workout_session_exercises
      const exercise = exerciseEntityMap.get(incomingExercise.exerciseId);

      if (!exercise) {
        throw new NotFoundException(
          `Exercise id ${incomingExercise.exerciseId} not found.`,
        );
      }

      sessionExercise = workoutSessionExerciseRepo.create({
        session: { id: session.id },
        exercise: { id: exercise.id },
        order_index: incomingExercise.orderIndex,
        completed_at: incomingExercise.completedAt
          ? new Date(incomingExercise.completedAt)
          : null,
      });

      sessionExercise = await workoutSessionExerciseRepo.save(sessionExercise);
    }

    return sessionExercise;
  }

  // Upsert session exercise set
  private async upsertSessionExerciseSet({
    incomingSet,
    sessionExercise,
    existingSetMap,
    workoutSessionExerciseSetRepo,
  }: {
    incomingSet: FinishWorkoutSessionSetDto;
    sessionExercise: WorkoutSessionExercise;
    existingSetMap: Map<number, WorkoutSessionExerciseSet>;
    workoutSessionExerciseSetRepo: Repository<WorkoutSessionExerciseSet>;
  }): Promise<WorkoutSessionExerciseSet> {
    let setEntity: WorkoutSessionExerciseSet | undefined;

    if (incomingSet.id != null) {
      // UPDATE existing set
      setEntity = existingSetMap.get(incomingSet.id);

      if (!setEntity) {
        throw new BadRequestException(
          `Set id ${incomingSet.id} does not belong to workout session exercise ${sessionExercise.id}.`,
        );
      }

      setEntity.set_number = incomingSet.setNumber;
      setEntity.reps = incomingSet.reps;
      setEntity.weight = incomingSet.weight;
      setEntity.distance = incomingSet.distance;
      setEntity.duration = incomingSet.duration;
      setEntity.performed_at = incomingSet.performedAt
        ? new Date(incomingSet.performedAt)
        : null;
      setEntity.completed_at = incomingSet.completedAt
        ? new Date(incomingSet.completedAt)
        : null;

      setEntity = await workoutSessionExerciseSetRepo.save(setEntity);
    } else {
      // CREATE new set
      setEntity = workoutSessionExerciseSetRepo.create({
        session_exercise: { id: sessionExercise.id },
        set_number: incomingSet.setNumber,
        reps: incomingSet.reps,
        weight: incomingSet.weight,
        distance: incomingSet.distance,
        duration: incomingSet.duration,
        performed_at: incomingSet.performedAt
          ? new Date(incomingSet.performedAt)
          : null,
        completed_at: incomingSet.completedAt
          ? new Date(incomingSet.completedAt)
          : null,
      });

      setEntity = await workoutSessionExerciseSetRepo.save(setEntity);
    }

    return setEntity;
  }

  // Get workout progress overview
  async getProgressOverview(user: ActiveUserData) {
    // TODO: refactor to include weekly/yearly/all time
    const { queryStartDate, queryEndDate, displayStartDate, displayEndDate } =
      this.getCurrentWeekRange();

    const sessions = await this.workoutSessionRepo
      .createQueryBuilder('session')

      .leftJoinAndSelect('session.workout', 'workout')
      .leftJoinAndSelect('session.session_exercises', 'sessionExercise')
      .leftJoinAndSelect('sessionExercise.exercise', 'exercise')
      .leftJoinAndSelect('sessionExercise.sets', 'set')

      .where('session.user_id = :userId', { userId: user.sub })
      .andWhere('session.status = :status', {
        status: WorkoutSessionStatus.COMPLETED,
      })
      .andWhere('session.ended_at >= :queryStartDate', { queryStartDate })
      .andWhere('session.ended_at < :queryEndDate', { queryEndDate })

      .orderBy('session.ended_at', 'DESC')
      .addOrderBy('sessionExercise.order_index', 'ASC')
      .addOrderBy('set.set_number', 'ASC')
      .getMany();

    return {
      type: WorkoutProgressOverviewType.WEEKLY,
      startDate: displayStartDate,
      endDate: displayEndDate,
      summary: this.getProgressSummary(sessions),
      volumeTrend: this.getWeeklyVolumeTrend(sessions),
      bestPerformances: this.getBestPerformances(sessions),
    };
  }

  private getCurrentWeekRange() {
    const now = new Date();

    const queryStartDate = new Date(now);
    const currentDay = queryStartDate.getDay(); // 0 = Sunday, 6 = Saturday

    // Calculate how many days to go back to reach Monday
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;

    // Set the date and time to Monday at midnight for the current week
    queryStartDate.setDate(queryStartDate.getDate() - daysFromMonday);
    queryStartDate.setHours(0, 0, 0, 0);

    const queryEndDate = new Date(queryStartDate);
    queryEndDate.setDate(queryEndDate.getDate() + 7); // Next Monday at midnight

    // Display date for frontend
    const displayStartDate = new Date(queryStartDate);

    const displayEndDate = new Date(queryEndDate);

    // Show the inclusive end of the week (Sunday)
    displayEndDate.setDate(displayEndDate.getDate() - 1);

    return {
      queryStartDate,
      queryEndDate,
      displayStartDate,
      displayEndDate,
    };
  }

  private getProgressSummary(sessions: WorkoutSession[]) {
    return {
      workoutsCompleted: sessions.length,
      totalVolumeKg: this.getTotalVolumeKg(sessions),
      completedSets: this.getCompletedSetCount(sessions),
      totalDurationSeconds: sessions.reduce((total, session) => {
        return total + (session.total_duration ?? 0);
      }, 0),
    };
  }

  private getWeeklyVolumeTrend(sessions: WorkoutSession[]) {
    const days = [
      { label: 'Mon', day: 1 },
      { label: 'Tue', day: 2 },
      { label: 'Wed', day: 3 },
      { label: 'Thu', day: 4 },
      { label: 'Fri', day: 5 },
      { label: 'Sat', day: 6 },
      { label: 'Sun', day: 0 },
    ];

    return days.map((day) => {
      const volumeKg = sessions.reduce((total, session) => {
        if (!session.ended_at) return total;

        const sessionDay = session.ended_at.getDay();

        if (sessionDay !== day.day) return total;

        return total + this.getSessionVolumeKg(session);
      }, 0);

      return {
        label: day.label,
        volumeKg,
      };
    });
  }

  private getBestPerformances(sessions: WorkoutSession[]) {
    const performanceMap = new Map<
      number,
      {
        exerciseName: string;
        bestWeightKg: number;
        bestSetVolumeKg: number;
        bestSetLabel: string;
      }
    >();

    for (const session of sessions) {
      for (const sessionExercise of session.session_exercises ?? []) {
        const exerciseId = sessionExercise.exercise?.id;
        const exerciseName = sessionExercise.exercise?.name;

        if (!exerciseId || !exerciseName) continue;

        for (const set of sessionExercise.sets ?? []) {
          if (!set.completed_at) continue;
          if (set.reps == null || set.weight == null) continue;

          const reps = Number(set.reps);
          const weight = Number(set.weight);
          const setVolumeKg = reps * weight;

          const current = performanceMap.get(exerciseId);

          if (!current) {
            performanceMap.set(exerciseId, {
              exerciseName,
              bestWeightKg: weight,
              bestSetVolumeKg: setVolumeKg,
              bestSetLabel: `${this.formatNumber(weight)} kg x ${reps} reps`,
            });

            continue;
          }

          const isBetterVolume = setVolumeKg > current.bestSetVolumeKg;
          const bestWeightKg = Math.max(current.bestWeightKg, weight);

          performanceMap.set(exerciseId, {
            exerciseName,
            bestWeightKg,
            bestSetVolumeKg: isBetterVolume
              ? setVolumeKg
              : current.bestSetVolumeKg,
            bestSetLabel: isBetterVolume
              ? `${this.formatNumber(weight)} kg x ${reps} reps`
              : current.bestSetLabel,
          });
        }
      }
    }

    return Array.from(performanceMap.values())
      .sort((a, b) => b.bestSetVolumeKg - a.bestSetVolumeKg)
      .slice(0, 5);
  }

  private getTotalVolumeKg(sessions: WorkoutSession[]) {
    return sessions.reduce((total, session) => {
      return total + this.getSessionVolumeKg(session);
    }, 0);
  }

  private getSessionVolumeKg(session: WorkoutSession) {
    return (session.session_exercises ?? []).reduce(
      (exerciseTotal, sessionExercise) => {
        const setVolume = (sessionExercise.sets ?? []).reduce(
          (setTotal, set) => {
            if (!set.completed_at) return setTotal;
            if (set.reps == null || set.weight == null) return setTotal;

            return setTotal + Number(set.reps) * Number(set.weight);
          },
          0,
        );

        return exerciseTotal + setVolume;
      },
      0,
    );
  }

  private getCompletedSetCount(sessions: WorkoutSession[]) {
    return sessions.reduce((total, session) => {
      const sessionCompletedSets = (session.session_exercises ?? []).reduce(
        (exerciseTotal, sessionExercise) => {
          const completedSets = (sessionExercise.sets ?? []).filter(
            (set) => set.completed_at,
          ).length;

          return exerciseTotal + completedSets;
        },
        0,
      );

      return total + sessionCompletedSets;
    }, 0);
  }

  private formatNumber(value: number) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
}
