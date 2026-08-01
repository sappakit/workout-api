import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Exercise } from 'db/entities/workout/exercise/exercises.entity';
import { WorkoutExerciseSet } from 'db/entities/workout/workout/workout-exercise-sets.entity';
import { WorkoutExercise } from 'db/entities/workout/workout/workout-exercises.entity';
import { WorkoutFocusType } from 'db/entities/workout/workout/workout-focus-types.entity';
import { WorkoutMuscle } from 'db/entities/workout/workout/workout-muscles.entity';
import { WorkoutSchedule } from 'db/entities/workout/workout/workout-schedule.entity';
import { WorkoutSessionExerciseSet } from 'db/entities/workout/workout/workout-session-exercise-sets.entity';
import { WorkoutSessionExercise } from 'db/entities/workout/workout/workout-session-exercises.entity';
import { WorkoutSession } from 'db/entities/workout/workout/workout-sessions.entity';
import { WorkoutWeeklyPlan } from 'db/entities/workout/workout/workout-weekly-plan.entity';
import { Workout } from 'db/entities/workout/workout/workouts.entity';
import { ActiveUserData } from 'src/auth/enums/auth.enum';
import { PagingDto } from 'src/common/dto/request.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { RepositoryFilterConfig } from 'src/common/pagination/types/pagination.types';
import { ExerciseService } from 'src/exercise/exercise.service';
import { DataSource, FindManyOptions, In, Repository } from 'typeorm';
import {
  getISOWeekday,
  getUtcDayRange,
  getUtcWeekRange,
  toUTCDateString,
} from 'utils/time.util';
import {
  FinishWorkoutSessionDto,
  FinishWorkoutSessionExerciseDto,
  FinishWorkoutSessionSetDto,
  SaveWorkoutDto,
  UpdateWorkoutScheduleWorkoutDto,
  UpdateWorkoutWeeklyPlanDto,
} from './dto/workout-body.dto';
import {
  GetWorkoutScheduleQueryDto,
  WorkoutQueryDto,
} from './dto/workout-query.dto';
import {
  WorkoutCurrentMode,
  WorkoutProgressOverviewType,
  WorkoutScheduleStatus,
  WorkoutSessionStatus,
  WorkoutWeeklyPlanDayType,
} from './enums/workout.enum';
import { validateWorkoutSavePayload } from './helpers/workout.helper';

type UpsertSessionExerciseResult = {
  sessionExercise: WorkoutSessionExercise;
  exerciseChanged: boolean;
};

@Injectable()
export class WorkoutService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly paginationService: PaginationService,
    private readonly exerciseService: ExerciseService,

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
  ) {}

  // Workouts
  async findAllWorkouts(query: WorkoutQueryDto, user: ActiveUserData) {
    const options: FindManyOptions<Workout> = {
      relations: {
        workout_focus_type: true,
        muscles: {
          muscle: true,
        },
        workout_exercises: {
          exercise: true,
        },
      },
      order: { created_at: 'DESC' },
    };

    if (query.createdByMe) {
      options.where = {
        user: { id: user.sub },
      };
    }

    const searchFields = [
      'name',
      'description',
      'workout_focus_type.name',
      'muscles.muscle.name',
      'workout_exercises.exercise.name',
    ];

    const filters: RepositoryFilterConfig[] = [
      {
        queryKey: 'focusTypeIds',
        field: 'workout_focus_type.id',
        operator: 'in',
      },
      {
        queryKey: 'muscleIds',
        field: 'muscles.muscle.id',
        operator: 'in',
      },
    ];

    const sorts = [
      {
        queryKey: 'created_at',
        field: 'created_at',
      },
      {
        queryKey: 'name',
        field: 'name',
      },
      {
        queryKey: 'duration',
        field: 'duration',
      },
    ];

    return this.paginationService.paginateRepository(
      this.workoutRepo,
      options,
      query,
      {
        searchFields,
        filters,
        sorts,
      },
    );
  }

  async findOneWorkout(id: number) {
    const result = await this.workoutRepo.findOne({
      where: { id },
      relations: {
        workout_exercises: {
          sets: true,
          exercise: {
            category: true,
            media: true,
          },
        },
        muscles: { muscle: true },
        workout_focus_type: true,
      },
      order: {
        workout_exercises: {
          order_index: 'ASC',
          sets: {
            set_number: 'ASC',
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Workout not found');
    }

    return result;
  }

  // Create workout
  async createWorkout(payload: SaveWorkoutDto, user: ActiveUserData) {
    await this.dataSource.transaction(async (manager) => {
      const workoutRepo = manager.getRepository(Workout);
      const workoutExerciseRepo = manager.getRepository(WorkoutExercise);
      const workoutExerciseSetRepo = manager.getRepository(WorkoutExerciseSet);
      const workoutMuscleRepo = manager.getRepository(WorkoutMuscle);

      // Validate payload
      const { focusType, uniqueMuscleIds } = await validateWorkoutSavePayload(
        manager,
        payload,
      );

      // Create workout main fields
      const workout = workoutRepo.create({
        name: payload.name,
        duration: payload.duration,
        workout_focus_type: focusType,
        user: { id: user.sub },
        created_by: user.username,
        updated_by: user.username,
      });

      const savedWorkout = await workoutRepo.save(workout);

      // Create workout muscles
      if (uniqueMuscleIds.length > 0) {
        const workoutMuscles = uniqueMuscleIds.map((muscleId) => ({
          workout: { id: savedWorkout.id },
          muscle: { id: muscleId },
        }));

        await workoutMuscleRepo.insert(workoutMuscles);
      }

      // Create workout exercises
      const workoutExercises = payload.workoutExercises.map((item) => ({
        order_index: item.orderIndex,
        rest_time: item.restTime,
        workout: { id: savedWorkout.id },
        exercise: { id: item.exerciseId },
      }));

      const savedWorkoutExercises =
        await workoutExerciseRepo.save(workoutExercises);

      // Create workout exercise sets
      const workoutExerciseSets = payload.workoutExercises.flatMap(
        (item, index) => {
          const savedWorkoutExercise = savedWorkoutExercises[index];

          if (!savedWorkoutExercise) {
            return [];
          }

          return item.sets.map((set) => ({
            workout_exercise: { id: savedWorkoutExercise.id },
            set_number: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            distance: set.distance,
            duration: set.duration,
          }));
        },
      );

      if (workoutExerciseSets.length > 0) {
        await workoutExerciseSetRepo.insert(workoutExerciseSets);
      }
    });

    return { message: 'Workout created successfully' };
  }

  // Update workout
  async updateWorkout(
    id: number,
    payload: SaveWorkoutDto,
    user: ActiveUserData,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const workoutRepo = manager.getRepository(Workout);
      const workoutExerciseRepo = manager.getRepository(WorkoutExercise);
      const workoutExerciseSetRepo = manager.getRepository(WorkoutExerciseSet);
      const workoutMuscleRepo = manager.getRepository(WorkoutMuscle);

      // Only allow the owner to update the workout
      const workout = await workoutRepo.findOne({
        where: {
          id,
          user: { id: user.sub },
        },
        relations: {
          workout_focus_type: true,
          muscles: {
            muscle: true,
          },
        },
      });

      if (!workout) {
        throw new NotFoundException('Workout not found');
      }

      const { focusType, exerciseMap, uniqueMuscleIds } =
        await validateWorkoutSavePayload(manager, payload);

      // Update workout main fields
      workout.name = payload.name;
      workout.duration = payload.duration;
      workout.workout_focus_type = focusType;
      workout.updated_by = user.username;

      await workoutRepo.save(workout);

      // Update workout muscles
      const existingMuscleIds = workout.muscles
        .map((workoutMuscle) => workoutMuscle.muscle.id)
        .sort((a, b) => a - b);

      const isSameMuscles =
        existingMuscleIds.length === uniqueMuscleIds.length &&
        existingMuscleIds.every(
          (muscleId, index) => muscleId === uniqueMuscleIds[index],
        );

      if (!isSameMuscles) {
        await workoutMuscleRepo.delete({
          workout: {
            id: workout.id,
          },
        });

        if (uniqueMuscleIds.length > 0) {
          const workoutMuscles = uniqueMuscleIds.map((muscleId) => ({
            workout: {
              id: workout.id,
            },
            muscle: {
              id: muscleId,
            },
          }));

          await workoutMuscleRepo.insert(workoutMuscles);
        }
      }

      // Load existing workout exercises and sets
      const existingWorkoutExercises = await workoutExerciseRepo.find({
        where: {
          workout: {
            id: workout.id,
          },
        },
        relations: {
          sets: true,
        },
      });

      const existingById = new Map(
        existingWorkoutExercises.map((workoutExercise) => [
          workoutExercise.id,
          workoutExercise,
        ]),
      );

      const incomingIds = new Set(
        payload.workoutExercises
          .map((workoutExercise) => workoutExercise.id)
          .filter(
            (workoutExerciseId): workoutExerciseId is number =>
              workoutExerciseId != null,
          ),
      );

      // Delete removed workout exercises
      const toDeleteIds = existingWorkoutExercises
        .filter((workoutExercise) => !incomingIds.has(workoutExercise.id))
        .map((workoutExercise) => workoutExercise.id);

      if (toDeleteIds.length > 0) {
        await workoutExerciseSetRepo
          .createQueryBuilder()
          .delete()
          .from(WorkoutExerciseSet)
          .where('workout_exercise_id IN (:...ids)', {
            ids: toDeleteIds,
          })
          .execute();

        await workoutExerciseRepo.delete(toDeleteIds);
      }

      // Split incoming exercises into update and create groups
      const updateItems = payload.workoutExercises.filter(
        (
          workoutExercise,
        ): workoutExercise is typeof workoutExercise & { id: number } =>
          workoutExercise.id != null,
      );

      const createItems = payload.workoutExercises.filter(
        (workoutExercise) => workoutExercise.id == null,
      );

      // Update existing workout exercises
      const workoutExercisesToUpdate = updateItems.map(
        (incomingWorkoutExercise) => {
          const existingWorkoutExercise = existingById.get(
            incomingWorkoutExercise.id,
          );

          if (!existingWorkoutExercise) {
            throw new BadRequestException(
              `Workout exercise with id ${incomingWorkoutExercise.id} not found`,
            );
          }

          const exercise = exerciseMap.get(incomingWorkoutExercise.exerciseId);

          if (!exercise) {
            throw new BadRequestException(
              `Exercise with id ${incomingWorkoutExercise.exerciseId} not found`,
            );
          }

          existingWorkoutExercise.order_index =
            incomingWorkoutExercise.orderIndex;
          existingWorkoutExercise.rest_time = incomingWorkoutExercise.restTime;
          existingWorkoutExercise.exercise = exercise;

          return existingWorkoutExercise;
        },
      );

      if (workoutExercisesToUpdate.length > 0) {
        await workoutExerciseRepo.save(workoutExercisesToUpdate);
      }

      // Synchronize sets for existing workout exercises
      for (const incomingWorkoutExercise of updateItems) {
        const existingWorkoutExercise = existingById.get(
          incomingWorkoutExercise.id,
        );

        if (!existingWorkoutExercise) {
          throw new BadRequestException(
            `Workout exercise with id ${incomingWorkoutExercise.id} not found`,
          );
        }

        const existingSets = existingWorkoutExercise.sets ?? [];

        const existingSetById = new Map(
          existingSets.map((workoutExerciseSet) => [
            workoutExerciseSet.id,
            workoutExerciseSet,
          ]),
        );

        const incomingSetIds = new Set(
          incomingWorkoutExercise.sets
            .map((workoutExerciseSet) => workoutExerciseSet.id)
            .filter(
              (workoutExerciseSetId): workoutExerciseSetId is number =>
                workoutExerciseSetId != null,
            ),
        );

        // Delete removed sets
        const setIdsToDelete = existingSets
          .filter(
            (workoutExerciseSet) => !incomingSetIds.has(workoutExerciseSet.id),
          )
          .map((workoutExerciseSet) => workoutExerciseSet.id);

        if (setIdsToDelete.length > 0) {
          await workoutExerciseSetRepo.delete(setIdsToDelete);
        }

        const updateSetItems = incomingWorkoutExercise.sets.filter(
          (
            workoutExerciseSet,
          ): workoutExerciseSet is typeof workoutExerciseSet & {
            id: number;
          } => workoutExerciseSet.id != null,
        );

        const createSetItems = incomingWorkoutExercise.sets.filter(
          (workoutExerciseSet) => workoutExerciseSet.id == null,
        );

        // Update existing sets
        const setsToUpdate = updateSetItems.map(
          (incomingWorkoutExerciseSet) => {
            const existingSet = existingSetById.get(
              incomingWorkoutExerciseSet.id,
            );

            if (!existingSet) {
              throw new BadRequestException(
                `Workout exercise set with id ${incomingWorkoutExerciseSet.id} not found`,
              );
            }

            existingSet.set_number = incomingWorkoutExerciseSet.setNumber;
            existingSet.reps = incomingWorkoutExerciseSet.reps;
            existingSet.weight = incomingWorkoutExerciseSet.weight;
            existingSet.distance = incomingWorkoutExerciseSet.distance;
            existingSet.duration = incomingWorkoutExerciseSet.duration;

            return existingSet;
          },
        );

        if (setsToUpdate.length > 0) {
          await workoutExerciseSetRepo.save(setsToUpdate);
        }

        // Create new sets
        if (createSetItems.length > 0) {
          const newSets = createSetItems.map((incomingWorkoutExerciseSet) => ({
            workout_exercise: {
              id: existingWorkoutExercise.id,
            },
            set_number: incomingWorkoutExerciseSet.setNumber,
            reps: incomingWorkoutExerciseSet.reps,
            weight: incomingWorkoutExerciseSet.weight,
            distance: incomingWorkoutExerciseSet.distance,
            duration: incomingWorkoutExerciseSet.duration,
          }));

          await workoutExerciseSetRepo.insert(newSets);
        }
      }

      // Create new workout exercises
      if (createItems.length > 0) {
        const newWorkoutExercises = createItems.map(
          (incomingWorkoutExercise) => ({
            order_index: incomingWorkoutExercise.orderIndex,
            rest_time: incomingWorkoutExercise.restTime,
            workout: {
              id: workout.id,
            },
            exercise: {
              id: incomingWorkoutExercise.exerciseId,
            },
          }),
        );

        const savedNewWorkoutExercises =
          await workoutExerciseRepo.save(newWorkoutExercises);

        const newWorkoutExerciseSets = createItems.flatMap(
          (incomingWorkoutExercise, index) => {
            const savedWorkoutExercise = savedNewWorkoutExercises[index];

            if (!savedWorkoutExercise) {
              return [];
            }

            return incomingWorkoutExercise.sets.map(
              (incomingWorkoutExerciseSet) => ({
                workout_exercise: {
                  id: savedWorkoutExercise.id,
                },
                set_number: incomingWorkoutExerciseSet.setNumber,
                reps: incomingWorkoutExerciseSet.reps,
                weight: incomingWorkoutExerciseSet.weight,
                distance: incomingWorkoutExerciseSet.distance,
                duration: incomingWorkoutExerciseSet.duration,
              }),
            );
          },
        );

        if (newWorkoutExerciseSets.length > 0) {
          await workoutExerciseSetRepo.insert(newWorkoutExerciseSets);
        }
      }
    });

    return {
      message: 'Workout updated successfully',
    };
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
  async getOrCreateScheduleByDate(
    user: ActiveUserData,
    query: GetWorkoutScheduleQueryDto,
  ) {
    const { date } = query;

    const rawDate = date ? new Date(date) : new Date();
    const scheduledDate = toUTCDateString(rawDate);

    // Check if the schedule already exists
    const exists = await this.workoutScheduleRepo.exists({
      where: {
        user: { id: user.sub },
        scheduled_date: scheduledDate,
      },
    });

    // Create the schedule if it does not exist
    if (!exists) {
      await this.createScheduleForDate(user, scheduledDate);
    }

    return this.findScheduleByDate(user, scheduledDate);
  }

  // Create a new schedule for date
  private async createScheduleForDate(
    user: ActiveUserData,
    scheduledDate: string,
  ) {
    const dayOfWeek = getISOWeekday(new Date(scheduledDate)); // 1–7

    const weeklyPlan = await this.workoutWeeklyPlanRepo.findOne({
      where: {
        user: { id: user.sub },
        day_of_week: dayOfWeek,
      },
      relations: {
        workout: true,
      },
    });

    // No weekly plan row exists yet
    if (!weeklyPlan) {
      return;
    }

    // Skip rest days and unassigned days
    if (weeklyPlan.day_type !== WorkoutWeeklyPlanDayType.WORKOUT) {
      return;
    }

    if (!weeklyPlan.workout) {
      throw new BadRequestException(
        `Weekly plan for day ${dayOfWeek} is marked as workout but has no workout assigned.`,
      );
    }

    await this.workoutScheduleRepo
      .createQueryBuilder()
      .insert()
      .into(this.workoutScheduleRepo.target)
      .values({
        user: { id: user.sub },
        workout: { id: weeklyPlan.workout.id },
        scheduled_date: scheduledDate,
        status: WorkoutScheduleStatus.PLANNED,
        created_by: user.username,
        updated_by: user.username,
      })
      .orIgnore() // Ignore duplicate inserts from race conditions
      .execute();
  }

  // Find schedule by date
  private async findScheduleByDate(
    user: ActiveUserData,
    scheduledDate: string,
  ) {
    return this.workoutScheduleRepo.findOne({
      where: {
        user: { id: user.sub },
        scheduled_date: scheduledDate,
      },
      relations: {
        workout: {
          workout_focus_type: true,
          muscles: { muscle: true },
          workout_exercises: {
            exercise: true,
            sets: true,
          },
        },
      },
      order: {
        workout: {
          workout_exercises: {
            order_index: 'ASC',
            sets: {
              set_number: 'ASC',
            },
          },
        },
      },
    });
  }

  // Get the current workout state for today
  async getCurrentWorkout(user: ActiveUserData) {
    // Use unfinished session first
    const currentSession = await this.workoutSessionRepo.findOne({
      where: {
        user: { id: user.sub },
        status: In([WorkoutSessionStatus.ACTIVE, WorkoutSessionStatus.PAUSED]),
      },
      relations: this.getWorkoutSessionDetailRelations(),
      order: {
        started_at: 'DESC',
        session_exercises: {
          order_index: 'ASC',
          sets: {
            set_number: 'ASC',
          },
        },
      },
    });

    if (currentSession) {
      const exerciseIds = [
        ...new Set(
          currentSession.session_exercises
            .map((sessionExercise) => sessionExercise.exercise?.id)
            .filter((id): id is number => id != null),
        ),
      ];

      const performanceByExerciseId =
        await this.exerciseService.getExercisePerformanceSummary(
          user,
          exerciseIds,
        );

      return {
        mode: WorkoutCurrentMode.IN_PROGRESS,
        session: currentSession,
        schedule: null,
        performanceByExerciseId,
        hasCompletedWorkoutToday: false,
      };
    }

    // Get today's workout overview
    const todayOverview = await this.getTodayOverview(user);

    // Use existing schedule
    if (todayOverview.schedule) {
      return {
        mode: WorkoutCurrentMode.SCHEDULED,
        session: null,
        schedule: todayOverview.schedule,
        performanceByExerciseId: {},
        hasCompletedWorkoutToday: todayOverview.hasCompletedWorkoutToday,
      };
    }

    // If no schedule exists, then use today's weekly plan type
    if (todayOverview.todayPlanType === WorkoutWeeklyPlanDayType.REST) {
      return {
        mode: WorkoutCurrentMode.REST_DAY,
        session: null,
        schedule: null,
        performanceByExerciseId: {},
        hasCompletedWorkoutToday: todayOverview.hasCompletedWorkoutToday,
      };
    }

    return {
      mode: WorkoutCurrentMode.UNASSIGNED,
      session: null,
      schedule: null,
      performanceByExerciseId: {},
      hasCompletedWorkoutToday: todayOverview.hasCompletedWorkoutToday,
    };
  }

  private async getHasCompletedWorkoutToday(
    user: ActiveUserData,
    today = new Date(),
  ) {
    const { startOfDay, startOfNextDay } = getUtcDayRange(today);

    return this.workoutSessionRepo
      .createQueryBuilder('session')
      .where('session.user_id = :userId', {
        userId: user.sub,
      })
      .andWhere('session.status = :status', {
        status: WorkoutSessionStatus.COMPLETED,
      })
      .andWhere('session.ended_at >= :startOfDay', {
        startOfDay,
      })
      .andWhere('session.ended_at < :startOfNextDay', {
        startOfNextDay,
      })
      .getExists();
  }

  // Get today's workout overview
  async getTodayOverview(user: ActiveUserData) {
    const today = new Date();

    const hasCompletedWorkoutToday = await this.getHasCompletedWorkoutToday(
      user,
      today,
    );

    // Get existing schedule first
    const schedule = await this.getOrCreateScheduleByDate(user, {
      date: today.toISOString(),
    });

    if (schedule) {
      return {
        todayPlanType: WorkoutWeeklyPlanDayType.WORKOUT,
        schedule,
        hasCompletedWorkoutToday,
      };
    }

    // If no schedule exists, use today's weekly plan type
    const weeklyPlan = await this.workoutWeeklyPlanRepo.findOne({
      where: {
        user: { id: user.sub },
        day_of_week: getISOWeekday(today),
      },
      relations: {
        workout: true,
      },
    });

    if (
      !weeklyPlan ||
      weeklyPlan.day_type === WorkoutWeeklyPlanDayType.UNASSIGNED
    ) {
      return {
        todayPlanType: WorkoutWeeklyPlanDayType.UNASSIGNED,
        schedule: null,
        hasCompletedWorkoutToday,
      };
    }

    if (weeklyPlan.day_type === WorkoutWeeklyPlanDayType.REST) {
      return {
        todayPlanType: WorkoutWeeklyPlanDayType.REST,
        schedule: null,
        hasCompletedWorkoutToday,
      };
    }

    return {
      todayPlanType: WorkoutWeeklyPlanDayType.UNASSIGNED,
      schedule: null,
      hasCompletedWorkoutToday,
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
    const existingSession = await this.findActiveSessionForUser(user.sub);

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
      const workoutSessionExerciseSetRepo = manager.getRepository(
        WorkoutSessionExerciseSet,
      );

      // Load workout exercises in order
      const plannedExercises = await workoutExerciseRepo.find({
        where: {
          workout: { id: workoutId },
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

      // Copy workout exercise rows into session exercises
      const sessionExerciseValues = plannedExercises.map((item) => ({
        session: { id: savedSession.id },
        exercise: { id: item.exercise.id },
        workout_exercise: { id: item.id },
        order_index: item.order_index,
        rest_time: item.rest_time,
        completed_at: null,
      }));

      const savedSessionExercises = await workoutSessionExerciseRepo.save(
        sessionExerciseValues,
      );

      // Copy workout exercise set rows into session exercise sets
      const sessionSetValues = plannedExercises.flatMap(
        (plannedExercise, exerciseIndex) => {
          const sessionExercise = savedSessionExercises[exerciseIndex];

          if (!sessionExercise) {
            return [];
          }

          return plannedExercise.sets.map((set) => ({
            session_exercise: { id: sessionExercise.id },
            workout_exercise_set: { id: set.id },
            set_number: set.set_number,

            // initial actual values copied from the workout plan
            reps: set.reps,
            weight: set.weight,
            distance: set.distance,
            duration: set.duration,

            performed_at: null,
            completed_at: null,
          }));
        },
      );

      if (sessionSetValues.length > 0) {
        await workoutSessionExerciseSetRepo.insert(sessionSetValues);
      }

      return await workoutSessionRepo.findOneOrFail({
        where: { id: savedSession.id },
        relations: this.getWorkoutSessionDetailRelations(),
        order: this.getWorkoutSessionDetailOrder(),
      });
    });
  }

  // Start empty workout session
  async startEmptyWorkoutSession(user: ActiveUserData) {
    const existingSession = await this.findActiveSessionForUser(user.sub);

    if (existingSession) {
      return existingSession;
    }

    const session = this.workoutSessionRepo.create({
      user: { id: user.sub },
      workout: null,
      status: WorkoutSessionStatus.ACTIVE,
      started_at: new Date(),
      created_by: user.username,
      updated_by: user.username,
    });

    const savedSession = await this.workoutSessionRepo.save(session);

    return await this.workoutSessionRepo.findOneOrFail({
      where: { id: savedSession.id },
      relations: this.getWorkoutSessionDetailRelations(),
      order: this.getWorkoutSessionDetailOrder(),
    });
  }

  private async findActiveSessionForUser(userId: number) {
    return await this.workoutSessionRepo.findOne({
      where: {
        user: { id: userId },
        status: In([WorkoutSessionStatus.ACTIVE, WorkoutSessionStatus.PAUSED]),
      },
      relations: this.getWorkoutSessionDetailRelations(),
      order: this.getWorkoutSessionDetailOrder(),
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
          category: true,
          media: true,
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
  async finishWorkoutSession(
    id: number,
    body: FinishWorkoutSessionDto,
    user: ActiveUserData,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const workoutSessionRepo = manager.getRepository(WorkoutSession);
      const workoutSessionExerciseRepo = manager.getRepository(
        WorkoutSessionExercise,
      );
      const workoutSessionExerciseSetRepo = manager.getRepository(
        WorkoutSessionExerciseSet,
      );
      const exerciseRepo = manager.getRepository(Exercise);
      const workoutScheduleRepo = manager.getRepository(WorkoutSchedule);

      // 1) Load the user's session
      const session = await workoutSessionRepo.findOne({
        where: {
          id,
          user: { id: user.sub },
        },
        relations: {
          user: true,
          workout: true,
        },
      });

      if (!session) {
        throw new NotFoundException('Workout session not found.');
      }

      const allowedStatuses = [
        WorkoutSessionStatus.ACTIVE,
        WorkoutSessionStatus.PAUSED,
      ];

      if (!allowedStatuses.includes(session.status)) {
        throw new BadRequestException(
          'Workout session must be active or paused to be finished.',
        );
      }

      // 2) Load the current session exercises and sets
      const existingSessionExercises = await workoutSessionExerciseRepo.find({
        where: {
          session: { id: session.id },
        },
        relations: {
          exercise: true,
          workout_exercise: true,
          sets: {
            workout_exercise_set: true,
          },
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

      // Validate duplicate session exercise IDs
      const incomingExerciseIds = body.sessionExercises
        .map((item) => item.id)
        .filter((exerciseId): exerciseId is number => exerciseId != null);

      if (new Set(incomingExerciseIds).size !== incomingExerciseIds.length) {
        throw new BadRequestException(
          'Duplicate workout session exercise ids found in payload.',
        );
      }

      // Validate that existing exercise rows belong to this session
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

      // Load exercises needed for newly added session rows
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
              where: {
                id: In(newExerciseIds),
              },
            })
          : [];

      const exerciseEntityMap = new Map(
        exerciseEntities.map((exercise) => [exercise.id, exercise]),
      );

      // Validate exercises used by new session rows
      for (const incomingExercise of body.sessionExercises) {
        if (incomingExercise.id != null) {
          continue;
        }

        if (!exerciseEntityMap.has(incomingExercise.exerciseId)) {
          throw new NotFoundException(
            `Exercise id ${incomingExercise.exerciseId} not found.`,
          );
        }
      }

      const keptSessionExerciseIds: number[] = [];

      // 3) Upsert session exercises and sets
      for (const incomingExercise of body.sessionExercises) {
        const { sessionExercise, exerciseChanged } =
          await this.upsertSessionExercise({
            incomingExercise,
            session,
            existingSessionExerciseMap,
            exerciseEntityMap,
            workoutSessionExerciseRepo,
            exerciseRepo,
          });

        keptSessionExerciseIds.push(sessionExercise.id);

        const existingSets = sessionExercise.sets ?? [];

        const existingSetMap = new Map(
          existingSets.map((set) => [set.id, set]),
        );

        const incomingSetIds = incomingExercise.sets
          .map((set) => set.id)
          .filter((setId): setId is number => setId != null);

        if (new Set(incomingSetIds).size !== incomingSetIds.length) {
          throw new BadRequestException(
            `Duplicate set ids found in payload for session exercise ${sessionExercise.id}.`,
          );
        }

        // Validate that existing set rows belong to this session exercise
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
            clearWorkoutExerciseSetLink: exerciseChanged,
          });

          keptSetIds.push(setEntity.id);
        }

        // Delete sets removed from the session
        const setIdsToDelete = existingSets
          .filter((set) => !keptSetIds.includes(set.id))
          .map((set) => set.id);

        if (setIdsToDelete.length > 0) {
          await workoutSessionExerciseSetRepo.delete(setIdsToDelete);
        }
      }

      // 4) Delete exercises removed from the session
      const sessionExerciseIdsToDelete = existingSessionExercises
        .filter(
          (sessionExercise) =>
            !keptSessionExerciseIds.includes(sessionExercise.id),
        )
        .map((sessionExercise) => sessionExercise.id);

      if (sessionExerciseIdsToDelete.length > 0) {
        await workoutSessionExerciseSetRepo.delete({
          session_exercise: {
            id: In(sessionExerciseIdsToDelete),
          },
        });

        await workoutSessionExerciseRepo.delete(sessionExerciseIdsToDelete);
      }

      // 5) Complete the session
      session.status = WorkoutSessionStatus.COMPLETED;
      session.ended_at = new Date(body.endedAt);
      session.paused_at = null;
      session.total_duration = body.totalDuration ?? null;
      session.total_paused_duration = body.totalPausedDuration ?? 0;
      session.calories_burned = body.caloriesBurned ?? null;
      session.updated_by = user.username;

      await workoutSessionRepo.save(session);

      // 6) Complete today's matching schedule
      if (session.workout) {
        const finishedDate = toUTCDateString(session.ended_at);

        const schedule = await workoutScheduleRepo.findOne({
          where: {
            user: { id: user.sub },
            workout: { id: session.workout.id },
            scheduled_date: finishedDate,
            status: WorkoutScheduleStatus.PLANNED,
          },
        });

        if (schedule) {
          schedule.status = WorkoutScheduleStatus.COMPLETED;
          schedule.updated_by = user.username;

          await workoutScheduleRepo.save(schedule);
        }
      }
    });

    return {
      message: 'Workout session finished successfully.',
    };
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
  }): Promise<UpsertSessionExerciseResult> {
    if (incomingExercise.id != null) {
      // Update an existing session exercise
      const sessionExercise = existingSessionExerciseMap.get(
        incomingExercise.id,
      );

      if (!sessionExercise) {
        throw new BadRequestException(
          `Workout session exercise id ${incomingExercise.id} does not belong to session ${session.id}.`,
        );
      }

      const exerciseChanged =
        sessionExercise.exercise.id !== incomingExercise.exerciseId;

      sessionExercise.order_index = incomingExercise.orderIndex;
      sessionExercise.rest_time = incomingExercise.restTime;
      sessionExercise.completed_at =
        incomingExercise.completedAt != null
          ? new Date(incomingExercise.completedAt)
          : null;

      if (exerciseChanged) {
        const newExercise = await exerciseRepo.findOne({
          where: { id: incomingExercise.exerciseId },
        });

        if (!newExercise) {
          throw new NotFoundException(
            `Exercise id ${incomingExercise.exerciseId} not found.`,
          );
        }

        sessionExercise.exercise = newExercise;

        // A replaced exercise no longer belongs to the original workout plan row
        sessionExercise.workout_exercise = null;
      }

      const savedSessionExercise =
        await workoutSessionExerciseRepo.save(sessionExercise);

      return {
        sessionExercise: savedSessionExercise,
        exerciseChanged,
      };
    }

    // Create a session exercise added during the workout
    const exercise = exerciseEntityMap.get(incomingExercise.exerciseId);

    if (!exercise) {
      throw new NotFoundException(
        `Exercise id ${incomingExercise.exerciseId} not found.`,
      );
    }

    const sessionExercise = workoutSessionExerciseRepo.create({
      session: {
        id: session.id,
      },
      exercise: {
        id: exercise.id,
      },

      // A newly added exercise has no original workout plan row
      workout_exercise: null,

      order_index: incomingExercise.orderIndex,
      rest_time: incomingExercise.restTime,
      completed_at:
        incomingExercise.completedAt != null
          ? new Date(incomingExercise.completedAt)
          : null,
    });

    const savedSessionExercise =
      await workoutSessionExerciseRepo.save(sessionExercise);

    return {
      sessionExercise: savedSessionExercise,
      exerciseChanged: false,
    };
  }

  // Upsert session exercise set
  private async upsertSessionExerciseSet({
    incomingSet,
    sessionExercise,
    existingSetMap,
    workoutSessionExerciseSetRepo,
    clearWorkoutExerciseSetLink,
  }: {
    incomingSet: FinishWorkoutSessionSetDto;
    sessionExercise: WorkoutSessionExercise;
    existingSetMap: Map<number, WorkoutSessionExerciseSet>;
    workoutSessionExerciseSetRepo: Repository<WorkoutSessionExerciseSet>;
    clearWorkoutExerciseSetLink: boolean;
  }): Promise<WorkoutSessionExerciseSet> {
    if (incomingSet.id != null) {
      // Update an existing session set
      const setEntity = existingSetMap.get(incomingSet.id);

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
      setEntity.performed_at =
        incomingSet.performedAt != null
          ? new Date(incomingSet.performedAt)
          : null;
      setEntity.completed_at =
        incomingSet.completedAt != null
          ? new Date(incomingSet.completedAt)
          : null;

      if (clearWorkoutExerciseSetLink) {
        // A replaced parent exercise invalidates the original planned set link
        setEntity.workout_exercise_set = null;
      }

      // Preserve the existing planned set link when the exercise is unchanged
      return workoutSessionExerciseSetRepo.save(setEntity);
    }

    // Create a set added during the workout
    const setEntity = workoutSessionExerciseSetRepo.create({
      session_exercise: {
        id: sessionExercise.id,
      },

      // A newly added set has no original workout plan set
      workout_exercise_set: null,

      set_number: incomingSet.setNumber,
      reps: incomingSet.reps,
      weight: incomingSet.weight,
      distance: incomingSet.distance,
      duration: incomingSet.duration,
      performed_at:
        incomingSet.performedAt != null
          ? new Date(incomingSet.performedAt)
          : null,
      completed_at:
        incomingSet.completedAt != null
          ? new Date(incomingSet.completedAt)
          : null,
    });

    return workoutSessionExerciseSetRepo.save(setEntity);
  }

  // Get workout progress overview
  async getProgressOverview(user: ActiveUserData) {
    // TODO: refactor to include weekly/yearly/all time
    const { queryStartDate, queryEndDate, displayStartDate, displayEndDate } =
      getUtcWeekRange();

    const sessions = await this.workoutSessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.workout', 'workout')
      .leftJoinAndSelect('session.session_exercises', 'sessionExercise')
      .leftJoinAndSelect('sessionExercise.exercise', 'exercise')
      .leftJoinAndSelect('exercise.media', 'exerciseMedia')
      .leftJoinAndSelect('sessionExercise.sets', 'set')
      .where('session.user_id = :userId', {
        userId: user.sub,
      })
      .andWhere('session.status = :status', {
        status: WorkoutSessionStatus.COMPLETED,
      })
      .andWhere('session.ended_at >= :queryStartDate', {
        queryStartDate,
      })
      .andWhere('session.ended_at < :queryEndDate', {
        queryEndDate,
      })
      .orderBy('session.ended_at', 'DESC')
      .addOrderBy('sessionExercise.order_index', 'ASC')
      .addOrderBy('set.set_number', 'ASC')
      .addOrderBy('exerciseMedia.display_order', 'ASC')
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

  private getProgressSummary(sessions: WorkoutSession[]) {
    return {
      workoutsCompleted: sessions.length,
      totalVolumeKg: this.getTotalVolumeKg(sessions),
      completedSets: this.getCompletedSetCount(sessions),
      totalReps: this.getTotalReps(sessions),
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
      { label: 'Sun', day: 7 },
    ];

    return days.map((day) => {
      const volumeKg = sessions.reduce((total, session) => {
        if (!session.ended_at) {
          return total;
        }

        const sessionDay = getISOWeekday(session.ended_at);

        if (sessionDay !== day.day) {
          return total;
        }

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
        exerciseId: number;
        exerciseName: string;
        exerciseImageUrl: string | null;
        bestWeightKg: number;
        bestSetVolumeKg: number;
        bestSetLabel: string;
        completedAt: Date | null;
        setCompletedAt: Date | null;
      }
    >();

    for (const session of sessions) {
      for (const sessionExercise of session.session_exercises ?? []) {
        const exercise = sessionExercise.exercise;

        const exerciseId = exercise?.id;
        const exerciseName = exercise?.name;

        const primaryMedia =
          exercise.media.find((media) => media.is_primary) ?? exercise.media[0];

        const exerciseImageUrl = primaryMedia?.url ?? null;

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
              exerciseId,
              exerciseName,
              exerciseImageUrl,
              bestWeightKg: weight,
              bestSetVolumeKg: setVolumeKg,
              bestSetLabel: `${this.formatNumber(weight)} kg x ${reps} reps`,
              completedAt: session.ended_at ?? null,
              setCompletedAt: set.completed_at,
            });

            continue;
          }

          const isBetterVolume = setVolumeKg > current.bestSetVolumeKg;
          const bestWeightKg = Math.max(current.bestWeightKg, weight);

          performanceMap.set(exerciseId, {
            exerciseId,
            exerciseName,
            exerciseImageUrl: current.exerciseImageUrl ?? exerciseImageUrl,
            bestWeightKg,
            bestSetVolumeKg: isBetterVolume
              ? setVolumeKg
              : current.bestSetVolumeKg,
            bestSetLabel: isBetterVolume
              ? `${this.formatNumber(weight)} kg x ${reps} reps`
              : current.bestSetLabel,
            completedAt: isBetterVolume
              ? (session.ended_at ?? null)
              : current.completedAt,
            setCompletedAt: isBetterVolume
              ? set.completed_at
              : current.setCompletedAt,
          });
        }
      }
    }

    return Array.from(performanceMap.values()).sort(
      (a, b) => b.bestSetVolumeKg - a.bestSetVolumeKg,
    );
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

  private getTotalReps(sessions: WorkoutSession[]) {
    return sessions.reduce((total, session) => {
      const sessionReps = (session.session_exercises ?? []).reduce(
        (exerciseTotal, sessionExercise) => {
          const exerciseReps = (sessionExercise.sets ?? []).reduce(
            (setTotal, set) => {
              if (!set.completed_at) return setTotal;
              if (set.reps == null) return setTotal;

              return setTotal + Number(set.reps);
            },
            0,
          );

          return exerciseTotal + exerciseReps;
        },
        0,
      );

      return total + sessionReps;
    }, 0);
  }

  private formatNumber(value: number) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  // Update scheduled workout
  async updateScheduleWorkout(
    user: ActiveUserData,
    scheduleId: number,
    dto: UpdateWorkoutScheduleWorkoutDto,
  ) {
    const schedule = await this.workoutScheduleRepo.findOne({
      where: {
        id: scheduleId,
        user: { id: user.sub },
      },
      relations: {
        workout: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Workout schedule not found');
    }

    const workout = await this.workoutRepo.findOne({
      where: [
        // User's own workout
        {
          id: dto.workoutId,
          user: { id: user.sub },
        },
        // Public workout plan
        {
          id: dto.workoutId,
          is_public: true,
        },
      ],
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    schedule.workout = workout;
    schedule.updated_by = user.username;

    await this.workoutScheduleRepo.save(schedule);

    return { message: 'Scheduled workout updated successfully' };
  }

  // Get weekly plan
  async getWeeklyPlan(user: ActiveUserData) {
    const weeklyPlans = await this.workoutWeeklyPlanRepo.find({
      where: {
        user: { id: user.sub },
      },
      relations: {
        workout: {
          workout_exercises: true,
          muscles: true,
          workout_focus_type: true,
        },
      },
      order: {
        day_of_week: 'ASC',
      },
    });

    const weeklyPlanByDay = new Map(
      weeklyPlans.map((plan) => [plan.day_of_week, plan]),
    );

    const days = [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => {
      const plan = weeklyPlanByDay.get(dayOfWeek);

      if (!plan) {
        return {
          id: null,
          day_of_week: dayOfWeek,
          day_type: WorkoutWeeklyPlanDayType.UNASSIGNED,
          workout: null,
        };
      }

      return plan;
    });

    return { days };
  }

  // Update weekly plan
  async updateWeeklyPlan(
    user: ActiveUserData,
    dto: UpdateWorkoutWeeklyPlanDto,
  ) {
    const days = dto.days;

    const dayOfWeeks = days.map((day) => day.dayOfWeek);
    const uniqueDayOfWeeks = new Set(dayOfWeeks);

    if (uniqueDayOfWeeks.size !== 7) {
      throw new BadRequestException('Weekly plan contains duplicate days');
    }

    const expectedDays = [1, 2, 3, 4, 5, 6, 7];
    const hasAllDays = expectedDays.every((day) => uniqueDayOfWeeks.has(day));

    if (!hasAllDays) {
      throw new BadRequestException('Weekly plan must contain days 1 to 7');
    }

    const workoutDays = days.filter(
      (day) => day.dayType === WorkoutWeeklyPlanDayType.WORKOUT,
    );

    const workoutIds = [
      ...new Set(
        workoutDays
          .map((day) => day.workoutId)
          .filter((workoutId): workoutId is number => workoutId != null),
      ),
    ];

    const workouts =
      workoutIds.length > 0
        ? await this.workoutRepo.find({
            where: [
              // User's own workout
              {
                id: In(workoutIds),
                user: { id: user.sub },
              },
              // Public workout plan
              {
                id: In(workoutIds),
                is_public: true,
              },
            ],
          })
        : [];

    const workoutById = new Map(
      workouts.map((workout) => [workout.id, workout]),
    );

    for (const day of workoutDays) {
      if (day.workoutId == null || !workoutById.has(day.workoutId)) {
        throw new NotFoundException(
          `Workout not found for day ${day.dayOfWeek}`,
        );
      }
    }

    const existingPlans = await this.workoutWeeklyPlanRepo.find({
      where: {
        user: { id: user.sub },
        day_of_week: In(dayOfWeeks),
      },
    });

    const existingPlanByDay = new Map(
      existingPlans.map((plan) => [plan.day_of_week, plan]),
    );

    const plansToSave = days.map((dayDto) => {
      const existingPlan = existingPlanByDay.get(dayDto.dayOfWeek);

      const workout =
        dayDto.dayType === WorkoutWeeklyPlanDayType.WORKOUT && dayDto.workoutId
          ? workoutById.get(dayDto.workoutId)!
          : null;

      const plan =
        existingPlan ??
        this.workoutWeeklyPlanRepo.create({
          day_of_week: dayDto.dayOfWeek,
          user: { id: user.sub },
          created_by: user.username,
        });

      plan.day_type = dayDto.dayType;
      plan.workout = workout;
      plan.updated_by = user.username;

      return plan;
    });

    await this.workoutWeeklyPlanRepo.save(plansToSave);

    return { message: 'Weekly plan updated successfully' };
  }
}
