import { DataSource, FindManyOptions, In, Repository } from 'typeorm';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'db/entities/auth';
import {
  Equipment,
  Exercise,
  Muscle,
  Workout,
  WorkoutExercise,
  WorkoutFocusType,
  WorkoutMuscle,
  WorkoutSchedule,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutWeeklyPlan,
} from 'db/entities/workout';
import { PagingDto } from 'src/common/dto/request.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { getISOWeekday, normalizeToUTCDate } from 'utils/time.util';
import {
  WorkoutScheduleStatus,
  WorkoutSessionStatus,
} from './enums/workout.enum';
import { GetWorkoutScheduleQueryDto } from './dto/workout-query.dto';
import { ActiveUserData } from 'src/auth/enums/auth.enum';
import { UpdateWorkoutDto } from './dto/workout-body.dto';

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
    @InjectRepository(WorkoutExercise)
    private readonly workoutExerciseRepo: Repository<WorkoutExercise>,
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

  // Start session
  async startTodayWorkoutSession(user: ActiveUserData) {
    const today = new Date();

    // Find today schedule
    const schedule = await this.getScheduleByDate(user, {
      date: today.toISOString(),
    });

    if (!schedule) {
      throw new NotFoundException('No workout scheduled for today.');
    }

    // If an active or paused session already exists, return it
    const existingSession = await this.workoutSessionRepo.findOne({
      where: {
        schedule: { id: schedule.id },
        status: In([WorkoutSessionStatus.ACTIVE, WorkoutSessionStatus.PAUSED]),
      },
      relations: {
        schedule: {
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
        exercises: {
          exercise: {
            user_stats: true,
            muscles: { muscle: true },
            equipment_links: { equipment: true },
          },
          sets: true,
        },
      },
      order: {
        exercises: {
          order_index: 'ASC',
        },
      },
    });

    if (existingSession) {
      // TODO: remove
      console.log('--- existingSession! ---');
      return existingSession;
    }

    return await this.dataSource.transaction(async (manager) => {
      const workoutExerciseRepo = manager.getRepository(WorkoutExercise);
      const workoutSessionRepo = manager.getRepository(WorkoutSession);
      const workoutSessionExerciseRepo = manager.getRepository(
        WorkoutSessionExercise,
      );

      // Load planned workout exercises in order
      const plannedExercises = await workoutExerciseRepo.find({
        where: {
          workout: { id: schedule.workout.id },
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
        schedule: { id: schedule.id },
        status: WorkoutSessionStatus.ACTIVE,
        started_at: new Date(),
        created_by: user.username,
        updated_by: user.username,
      });

      const savedSession = await workoutSessionRepo.save(session);

      // Copy workout plan rows into session exercises as a snapshot
      const sessionExerciseValues = plannedExercises.map((item) => ({
        workout_session_id: savedSession.id,
        exercise_id: item.exercise.id,
        order_index: item.order_index,

        planned_sets: item.planned_sets,
        planned_reps_range: item.planned_reps_range,
        planned_weight: item.planned_weight,
        planned_rest_time: item.planned_rest_time,
        planned_duration: item.planned_duration,
        planned_distance: item.planned_distance,

        is_skipped: false,
        started_at: null,
        completed_at: null,
      }));

      await workoutSessionExerciseRepo.insert(sessionExerciseValues);

      // Reload fully for response
      const createdSession = await workoutSessionRepo.findOne({
        where: {
          id: savedSession.id,
        },
        relations: {
          schedule: {
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
          exercises: {
            exercise: {
              user_stats: true,
              muscles: { muscle: true },
              equipment_links: { equipment: true },
            },
            sets: true,
          },
        },
        order: {
          exercises: {
            order_index: 'ASC',
          },
        },
      });

      return createdSession;
    });
  }
}
