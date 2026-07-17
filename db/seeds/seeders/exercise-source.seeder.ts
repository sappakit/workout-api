import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExerciseSource } from 'db/entities/workout';
import { Repository } from 'typeorm';
import { EXERCISE_SOURCE_SEED_DATA } from '../data/exercise-source.seed-data';
import { runUpsertSeed } from '../utils/seed.util';

@Injectable()
export class ExerciseSourceSeeder {
  private readonly logger = new Logger(ExerciseSourceSeeder.name);

  constructor(
    @InjectRepository(ExerciseSource)
    private readonly exerciseSourceRepo: Repository<ExerciseSource>,
  ) {}

  async run(): Promise<void> {
    await runUpsertSeed({
      repository: this.exerciseSourceRepo,
      data: EXERCISE_SOURCE_SEED_DATA,
      conflictPaths: ['key'],
      entityName: 'exercise sources',
      logger: this.logger,
    });
  }
}
