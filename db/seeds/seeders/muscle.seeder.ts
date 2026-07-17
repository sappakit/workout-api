import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Muscle } from 'db/entities/workout';
import { Repository } from 'typeorm';
import { MUSCLE_SEED_DATA } from '../data/muscle.seed-data';
import { runUpsertSeed } from '../utils/seed.util';

@Injectable()
export class MuscleSeeder {
  private readonly logger = new Logger(MuscleSeeder.name);

  constructor(
    @InjectRepository(Muscle)
    private readonly muscleRepo: Repository<Muscle>,
  ) {}

  async run(): Promise<void> {
    await runUpsertSeed({
      repository: this.muscleRepo,
      data: MUSCLE_SEED_DATA,
      conflictPaths: ['code'],
      entityName: 'muscles',
      logger: this.logger,
    });
  }
}
