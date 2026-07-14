import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExerciseSource } from 'db/entities/workout';
import { Repository } from 'typeorm';
import { EXERCISE_SOURCE_SEED_DATA } from '../data/exercise-source.seed-data';

@Injectable()
export class ExerciseSourceSeeder {
  private readonly logger = new Logger(ExerciseSourceSeeder.name);

  constructor(
    @InjectRepository(ExerciseSource)
    private readonly exerciseSourceRepo: Repository<ExerciseSource>,
  ) {}

  async run(): Promise<void> {
    await this.exerciseSourceRepo.upsert(EXERCISE_SOURCE_SEED_DATA, {
      conflictPaths: ['key'],
      skipUpdateIfNoValuesChanged: true,
    });

    this.logger.log(
      `Seeded ${EXERCISE_SOURCE_SEED_DATA.length} exercise sources`,
    );
  }
}
