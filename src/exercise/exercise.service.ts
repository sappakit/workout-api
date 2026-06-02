import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Equipment,
  Exercise,
  Muscle,
  WorkoutSessionExercise,
  WorkoutSessionExerciseSet,
} from 'db/entities/workout';
import { ActiveUserData } from 'src/auth/enums/auth.enum';
import { PagingDto } from 'src/common/dto/request.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { WorkoutSessionStatus } from 'src/workout/enums/workout.enum';
import { FindManyOptions, Repository } from 'typeorm';
import { GetExercisesPerformanceQueryDto } from './dto/exercise-query.dto';
import { PerformanceByExerciseId } from './types/exercise.types';

@Injectable()
export class ExerciseService {
  constructor(
    private paginationService: PaginationService,

    // Repository
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(Muscle)
    private readonly muscleRepo: Repository<Muscle>,
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    @InjectRepository(WorkoutSessionExercise)
    private readonly workoutSessionExerciseRepo: Repository<WorkoutSessionExercise>,
    @InjectRepository(WorkoutSessionExerciseSet)
    private readonly workoutSessionExerciseSetRepo: Repository<WorkoutSessionExerciseSet>,
  ) {}

  // Exercises
  async findAllExercises(query: PagingDto) {
    const options: FindManyOptions<Exercise> = {
      relations: {
        muscles: { muscle: true },
        equipment_links: { equipment: true },
      },
      order: { name: 'ASC' },
    };

    const searchFields = [
      'name',
      'exercise_type',
      'difficulty_level',
      'muscles.muscle.name',
    ];

    return this.paginationService.paginateRepository(
      this.exerciseRepo,
      options,
      query,
      { searchFields },
    );
  }

  async findOneExercise(id: number) {
    const results = await this.exerciseRepo.findOne({ where: { id } });

    if (!results) {
      throw new NotFoundException('Workout not found');
    }

    return results;
  }

  // Get performance summary for multiple exercises
  async getExercisesPerformance(
    user: ActiveUserData,
    query: GetExercisesPerformanceQueryDto,
  ) {
    const exerciseIds = [...new Set(query.exerciseIds ?? [])];

    if (exerciseIds.length === 0) {
      return {
        data: {},
      };
    }

    return {
      data: await this.getExercisePerformanceSummary(user, exerciseIds),
    };
  }

  async getExercisePerformanceSummary(
    user: ActiveUserData,
    exerciseIds: number[],
  ): Promise<PerformanceByExerciseId> {
    if (exerciseIds.length === 0) {
      return {};
    }

    const [previousSets, bestSets] = await Promise.all([
      this.getPreviousExerciseSets(user, exerciseIds),
      this.getBestExerciseSets(user, exerciseIds),
    ]);

    const result: PerformanceByExerciseId = {};

    for (const exerciseId of exerciseIds) {
      result[exerciseId] = {
        previousSets: [],
        bestSets: [],
      };
    }

    for (const set of previousSets) {
      result[set.exerciseId].previousSets.push({
        setNumber: set.setNumber,
        weight: set.weight,
        reps: set.reps,
        distance: set.distance,
        duration: set.duration,
      });
    }

    for (const set of bestSets) {
      result[set.exerciseId].bestSets.push({
        setNumber: set.setNumber,
        weight: set.weight,
        reps: set.reps,
        distance: set.distance,
        duration: set.duration,
      });
    }

    return result;
  }

  private async getPreviousExerciseSets(
    user: ActiveUserData,
    exerciseIds: number[],
  ) {
    const latestSessionExercises = await this.workoutSessionExerciseRepo
      .createQueryBuilder('session_exercise')
      .innerJoin('session_exercise.session', 'session')
      .where('session.user = :userId', { userId: user.sub })
      .andWhere('session.status = :status', {
        status: WorkoutSessionStatus.COMPLETED,
      })
      .andWhere('session_exercise.exercise IN (:...exerciseIds)', {
        exerciseIds,
      })
      .andWhere('session_exercise.completed_at IS NOT NULL')
      .distinctOn(['session_exercise.exercise'])
      .orderBy('session_exercise.exercise', 'ASC')
      .addOrderBy('session.ended_at', 'DESC')
      .select(['session_exercise.id AS "sessionExerciseId"'])
      .getRawMany<{
        sessionExerciseId: number;
      }>();

    if (latestSessionExercises.length === 0) {
      return [];
    }

    const sessionExerciseIds = latestSessionExercises.map(
      (item) => item.sessionExerciseId,
    );

    return this.workoutSessionExerciseSetRepo
      .createQueryBuilder('set')
      .innerJoin('set.session_exercise', 'session_exercise')
      .where('set.session_exercise IN (:...sessionExerciseIds)', {
        sessionExerciseIds,
      })
      .andWhere('set.completed_at IS NOT NULL')
      .orderBy('session_exercise.exercise', 'ASC')
      .addOrderBy('set.set_number', 'ASC')
      .select([
        'session_exercise.exercise AS "exerciseId"',
        'set.set_number AS "setNumber"',
        'set.weight AS "weight"',
        'set.reps AS "reps"',
        'set.distance AS "distance"',
        'set.duration AS "duration"',
      ])
      .getRawMany<{
        exerciseId: number;
        setNumber: number;
        weight: number | null;
        reps: number | null;
        distance: number | null;
        duration: number | null;
      }>();
  }

  private async getBestExerciseSets(
    user: ActiveUserData,
    exerciseIds: number[],
  ) {
    return (
      this.workoutSessionExerciseSetRepo
        .createQueryBuilder('set')
        .innerJoin('set.session_exercise', 'session_exercise')
        .innerJoin('session_exercise.session', 'session')
        .where('session.user = :userId', { userId: user.sub })
        .andWhere('session.status = :status', {
          status: WorkoutSessionStatus.COMPLETED,
        })
        .andWhere('session_exercise.exercise IN (:...exerciseIds)', {
          exerciseIds,
        })
        .andWhere('set.completed_at IS NOT NULL')
        // .andWhere('set.weight IS NOT NULL')
        // .andWhere('set.reps IS NOT NULL')
        .distinctOn(['session_exercise.exercise', 'set.set_number'])
        .orderBy('session_exercise.exercise', 'ASC')
        .addOrderBy('set.set_number', 'ASC')
        .addOrderBy('(set.weight * (1 + set.reps / 30.0))', 'DESC') // estimated 1RM
        .addOrderBy('session.ended_at', 'DESC')
        .select([
          'session_exercise.exercise AS "exerciseId"',
          'set.set_number AS "setNumber"',
          'set.weight AS "weight"',
          'set.reps AS "reps"',
          'set.distance AS "distance"',
          'set.duration AS "duration"',
        ])
        .getRawMany<{
          exerciseId: number;
          setNumber: number;
          weight: number | null;
          reps: number | null;
          distance: number | null;
          duration: number | null;
        }>()
    );
  }

  // Muscles
  async findAllMuscles(query: PagingDto) {
    const options: FindManyOptions<Muscle> = {
      order: { name: 'ASC' },
    };

    return this.paginationService.paginateRepository(
      this.muscleRepo,
      options,
      query,
    );
  }

  // Equipment
  async findAllEquipment(query: PagingDto) {
    const options: FindManyOptions<Equipment> = {
      order: { name: 'ASC' },
    };

    return this.paginationService.paginateRepository(
      this.equipmentRepo,
      options,
      query,
    );
  }
}
