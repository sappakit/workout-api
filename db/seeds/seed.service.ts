import { Injectable, Logger } from '@nestjs/common';
import { ExerciseCategorySeeder } from './seeders/exercise-category.seeder';
import { ExerciseSourceSeeder } from './seeders/exercise-source.seeder';
import { RoleSeeder } from './seeders/role.seeder';
import { UserSeeder } from './seeders/user.seeder';
import { Seeder, SeedName } from './types/seed.types';

type SingleSeedName = Exclude<SeedName, 'all'>;

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);
  private readonly seeders: Record<SingleSeedName, Seeder>;
  private readonly seedOrder: SingleSeedName[] = [
    'role',
    'user',
    'exercise-source',
    'exercise-category',
  ];

  constructor(
    private readonly roleSeeder: RoleSeeder,
    private readonly userSeeder: UserSeeder,
    private readonly exerciseSourceSeeder: ExerciseSourceSeeder,
    private readonly exerciseCategorySeeder: ExerciseCategorySeeder,
  ) {
    this.seeders = {
      role: this.roleSeeder,
      user: this.userSeeder,
      'exercise-source': this.exerciseSourceSeeder,
      'exercise-category': this.exerciseCategorySeeder,
    };
  }

  async run(seedName: SeedName): Promise<void> {
    this.logger.log(`Starting database seed: ${seedName}`);

    if (seedName === 'all') {
      await this.runAll();
    } else {
      await this.seeders[seedName].run();
    }

    this.logger.log(`Database seed completed: ${seedName}`);
  }

  private async runAll(): Promise<void> {
    for (const seedName of this.seedOrder) {
      await this.seeders[seedName].run();
    }
  }
}
