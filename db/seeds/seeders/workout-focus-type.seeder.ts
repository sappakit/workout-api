import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkoutFocusType } from 'db/entities/workout/workout/workout-focus-types.entity';
import { Repository } from 'typeorm';
import { WORKOUT_FOCUS_TYPE_SEED_DATA } from '../data/workout-focus-type.seed-data';
import { runUpsertSeed } from '../utils/seed.util';

@Injectable()
export class WorkoutFocusTypeSeeder {
  private readonly logger = new Logger(WorkoutFocusTypeSeeder.name);

  constructor(
    @InjectRepository(WorkoutFocusType)
    private readonly workoutFocusTypeRepo: Repository<WorkoutFocusType>,
  ) {}

  async run(): Promise<void> {
    await runUpsertSeed({
      repository: this.workoutFocusTypeRepo,
      data: WORKOUT_FOCUS_TYPE_SEED_DATA,
      conflictPaths: ['code'],
      entityName: 'workout focus types',
      logger: this.logger,
    });
  }
}
