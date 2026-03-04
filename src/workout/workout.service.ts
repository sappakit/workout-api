import { DataSource, FindManyOptions, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'db/entities/auth';
import {
  Equipment,
  Exercise,
  Muscle,
  Workout,
  WorkoutSchedule,
  WorkoutWeeklyPlan,
} from 'db/entities/workout';
import { PagingDto } from 'src/common/dto/request.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { getISOWeekday, normalizeToUTCDate } from 'utils/time.util';
import { WorkoutScheduleStatus } from './enums/workout.enum';
import { GetWorkoutScheduleQueryDto } from './dto/workout-query.dto';
import { ActiveUserData } from 'src/auth/enums/auth.enum';

@Injectable()
export class WorkoutService {
  constructor(
    private dataSource: DataSource,
    private paginationService: PaginationService,

    // Repository
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(Muscle)
    private readonly muscleRepo: Repository<Muscle>,
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    @InjectRepository(Workout)
    private readonly workoutRepo: Repository<Workout>,
    @InjectRepository(WorkoutSchedule)
    private readonly workoutScheduleRepo: Repository<WorkoutSchedule>,
    @InjectRepository(WorkoutWeeklyPlan)
    private readonly workoutWeeklyPlanRepo: Repository<WorkoutWeeklyPlan>,
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

    // console.log(results);
    return results;
  }

  // Schedule
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
      },
      order: {
        workout: {
          workout_exercises: { order_index: 'ASC' },
        },
      },
    });

    console.log(schedule)
    return schedule;
  }

  // Exercises
  async findAllExercises(query: PagingDto) {
    const options: FindManyOptions<Exercise> = {
      relations: {
        muscles: { muscle: true },
        equipment_links: { equipment: true },
      },
      order: { name: 'ASC' },
    };

    return this.paginationService.paginateRepository(
      this.exerciseRepo,
      options,
      query,
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
