import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExerciseCategory } from 'db/entities/workout';
import { Repository } from 'typeorm';
import { EXERCISE_CATEGORY_SEED_DATA } from '../data/exercise-category.seed-data';
import { runUpsertSeed } from '../utils/seed.util';

@Injectable()
export class ExerciseCategorySeeder {
  private readonly logger = new Logger(ExerciseCategorySeeder.name);

  constructor(
    @InjectRepository(ExerciseCategory)
    private readonly exerciseCategoryRepo: Repository<ExerciseCategory>,
  ) {}

  async run(): Promise<void> {
    await runUpsertSeed({
      repository: this.exerciseCategoryRepo,
      data: EXERCISE_CATEGORY_SEED_DATA,
      conflictPaths: ['code'],
      entityName: 'exercise categories',
      logger: this.logger,
    });
  }
}
