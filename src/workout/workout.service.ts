import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Exercise,
  Workout,
  WorkoutExercise,
  WorkoutExerciseSet,
  WorkoutFocusType,
  WorkoutMuscle,
  WorkoutSchedule,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSessionExerciseSet,
  WorkoutWeeklyPlan,
} from 'db/entities/workout';
import { ActiveUserData } from 'src/auth/enums/auth.enum';
import { PagingDto } from 'src/common/dto/request.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { RepositoryFilterConfig } from 'src/common/pagination/types/pagination.types';
import { ExerciseService } from 'src/exercise/exercise.service';
import { Between, DataSource, FindManyOptions, In, Repository } from 'typeorm';
import {
  getISOWeekday,
  getUtcDayRange,
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

@Injectable()
export class WorkoutService {
  constructor(
    private dataSource: DataSource,
    private paginationService: PaginationService,
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
  async findAllWorkouts(query: WorkoutQueryDto) {
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
      const workoutExerciseSets = payload.workoutExercises.flatMap((item) => {
        const savedWorkoutExercise = savedWorkoutExercises.find(
          (savedItem) => savedItem.order_index === item.orderIndex,
        );

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
      });

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

      // Validate payload
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

      // Load existing workout exercises with sets
      const existingWorkoutExercises = await workoutExerciseRepo.find({
        where: { workout: { id: workout.id } },
        relations: {
          sets: true,
        },
      });

      const existingById = new Map(
        existingWorkoutExercises.map((item) => [item.id, item]),
      );

      const incomingIds = new Set(
        payload.workoutExercises
          .map((item) => item.id)
          .filter((id): id is number => id != null),
      );

      // Delete removed workout exercises
      const toDeleteIds = existingWorkoutExercises
        .filter((item) => !incomingIds.has(item.id))
        .map((item) => item.id);

      if (toDeleteIds.length > 0) {
        await workoutExerciseSetRepo
          .createQueryBuilder()
          .delete()
          .from(WorkoutExerciseSet)
          .where('workout_exercise_id IN (:...ids)', { ids: toDeleteIds })
          .execute();

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
        existing.rest_time = item.restTime;
        existing.exercise = exerciseMap.get(item.exerciseId)!;

        return existing;
      });

      if (toUpdate.length > 0) {
        await workoutExerciseRepo.save(toUpdate);
      }

      // Sync sets for existing workout exercises
      for (const item of updateItems) {
        const existing = existingById.get(item.id);

        if (!existing) {
          throw new BadRequestException(
            `Workout exercise with id ${item.id} not found`,
          );
        }

        const existingSets = existing.sets ?? [];

        const existingSetById = new Map(
          existingSets.map((set) => [set.id, set]),
        );

        const incomingSetIds = new Set(
          item.sets
            .map((set) => set.id)
            .filter((setId): setId is number => setId != null),
        );

        // Delete removed sets
        const setIdsToDelete = existingSets
          .filter((set) => !incomingSetIds.has(set.id))
          .map((set) => set.id);

        if (setIdsToDelete.length > 0) {
          await workoutExerciseSetRepo.delete(setIdsToDelete);
        }

        // Split sets into update/create groups
        const updateSetItems = item.sets.filter(
          (set): set is typeof set & { id: number } => set.id != null,
        );

        const createSetItems = item.sets.filter((set) => set.id == null);

        // Update existing sets
        const setsToUpdate = updateSetItems.map((set) => {
          const existingSet = existingSetById.get(set.id);

          if (!existingSet) {
            throw new BadRequestException(
              `Workout exercise set with id ${set.id} not found`,
            );
          }

          existingSet.set_number = set.setNumber;
          existingSet.reps = set.reps;
          existingSet.weight = set.weight;
          existingSet.distance = set.distance;
          existingSet.duration = set.duration;

          return existingSet;
        });

        if (setsToUpdate.length > 0) {
          await workoutExerciseSetRepo.save(setsToUpdate);
        }

        // Create new sets
        if (createSetItems.length > 0) {
          const newSets = createSetItems.map((set) => ({
            workout_exercise: { id: existing.id },
            set_number: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            distance: set.distance,
            duration: set.duration,
          }));

          await workoutExerciseSetRepo.insert(newSets);
        }
      }

      // Create new workout exercises
      if (createItems.length > 0) {
        const newWorkoutExercises = createItems.map((item) => ({
          order_index: item.orderIndex,
          rest_time: item.restTime,
          workout: { id: workout.id },
          exercise: { id: item.exerciseId },
        }));

        const savedNewWorkoutExercises =
          await workoutExerciseRepo.save(newWorkoutExercises);

        const newWorkoutExerciseSets = createItems.flatMap((item, index) => {
          const savedWorkoutExercise = savedNewWorkoutExercises[index];

          return item.sets.map((set) => ({
            workout_exercise: { id: savedWorkoutExercise.id },
            set_number: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            distance: set.distance,
            duration: set.duration,
          }));
        });

        if (newWorkoutExerciseSets.length > 0) {
          await workoutExerciseSetRepo.insert(newWorkoutExerciseSets);
        }
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
    const scheduledDate = toUTCDateString(rawDate);

    // Check if schedule already exists
    const exists = await this.workoutScheduleRepo.exists({
      where: {
        user: { id: user.sub },
        scheduled_date: scheduledDate,
      },
    });

    // If not exists, add schedule
    if (!exists) {
      await this.createScheduleForDate(user, scheduledDate);
    }

    const schedule = await this.workoutScheduleRepo.findOne({
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

    return schedule;
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

    // No weekly plan row yet
    if (!weeklyPlan) {
      return null;
    }

    // Rest day or unassigned day
    if (weeklyPlan.day_type !== WorkoutWeeklyPlanDayType.WORKOUT) {
      return null;
    }

    if (!weeklyPlan.workout) {
      throw new BadRequestException(
        `Weekly plan for day ${dayOfWeek} is marked as workout but has no workout assigned.`,
      );
    }

    // create schedule
    const newSchedule = this.workoutScheduleRepo.create({
      user: { id: user.sub },
      workout: { id: weeklyPlan.workout.id },
      scheduled_date: scheduledDate,
      status: WorkoutScheduleStatus.PLANNED,
      created_by: user.username,
      updated_by: user.username,
    });

    return await this.workoutScheduleRepo.save(newSchedule);
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
    const { startOfDay, endOfDay } = getUtcDayRange(today);

    return this.workoutSessionRepo.exists({
      where: {
        user: { id: user.sub },
        status: WorkoutSessionStatus.COMPLETED,
        ended_at: Between(startOfDay, endOfDay),
      },
    });
  }

  // Get today's workout overview
  async getTodayOverview(user: ActiveUserData) {
    const today = new Date();

    const hasCompletedWorkoutToday = await this.getHasCompletedWorkoutToday(
      user,
      today,
    );

    // Get existing schedule first
    const schedule = await this.getScheduleByDate(user, {
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
      const workoutScheduleRepo = manager.getRepository(WorkoutSchedule);

      // 1) Load session
      const session = await workoutSessionRepo.findOne({
        where: { id },
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

      // 6) Update today's schedule if this completed session matches today's scheduled workout
      if (session.workout) {
        const finishedDate = toUTCDateString(session.ended_at);

        const schedule = await workoutScheduleRepo.findOne({
          where: {
            user: { id: session.user.id },
            workout: { id: session.workout.id },
            scheduled_date: finishedDate,
            status: WorkoutScheduleStatus.PLANNED,
          },
        });

        if (schedule) {
          schedule.status = WorkoutScheduleStatus.COMPLETED;
          await workoutScheduleRepo.save(schedule);
        }
      }
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
      sessionExercise.rest_time = incomingExercise.restTime;
      sessionExercise.completed_at = incomingExercise.completedAt
        ? new Date(incomingExercise.completedAt)
        : null;

      sessionExercise.workout_exercise =
        incomingExercise.workoutExerciseId != null
          ? ({ id: incomingExercise.workoutExerciseId } as WorkoutExercise)
          : null;

      // allow changing exercise relation
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
        workout_exercise:
          incomingExercise.workoutExerciseId != null
            ? { id: incomingExercise.workoutExerciseId }
            : null,
        order_index: incomingExercise.orderIndex,
        rest_time: incomingExercise.restTime,
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
      setEntity.workout_exercise_set =
        incomingSet.workoutExerciseSetId != null
          ? ({ id: incomingSet.workoutExerciseSetId } as WorkoutExerciseSet)
          : null;

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
        workout_exercise_set:
          incomingSet.workoutExerciseSetId != null
            ? { id: incomingSet.workoutExerciseSetId }
            : null,
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
        const exerciseId = sessionExercise.exercise?.id;
        const exerciseName = sessionExercise.exercise?.name;
        const exerciseImageUrl = sessionExercise.exercise?.image_url ?? null;

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

    return this.getScheduleByDate(user, {
      date: schedule.scheduled_date,
    });
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
          .filter((workoutId): workoutId is number => !!workoutId),
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
      if (!day.workoutId || !workoutById.has(day.workoutId)) {
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
