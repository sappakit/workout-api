import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExerciseTrackingType } from 'db/entities/workout/exercise/exercise-tracking-type.entity';
import { Repository } from 'typeorm';
import { EXERCISE_TRACKING_TYPE_SEED_DATA } from '../data/exercise-tracking-type.seed-data';
import { runUpsertSeed } from '../utils/seed.util';

@Injectable()
export class ExerciseTrackingTypeSeeder {
  private readonly logger = new Logger(ExerciseTrackingTypeSeeder.name);

  constructor(
    @InjectRepository(ExerciseTrackingType)
    private readonly exerciseTrackingTypeRepo: Repository<ExerciseTrackingType>,
  ) {}

  async run(): Promise<void> {
    await runUpsertSeed({
      repository: this.exerciseTrackingTypeRepo,
      data: EXERCISE_TRACKING_TYPE_SEED_DATA,
      conflictPaths: ['code'],
      entityName: 'exercise tracking type records',
      logger: this.logger,
    });
  }
}
