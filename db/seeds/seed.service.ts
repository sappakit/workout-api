import { Injectable, Logger } from '@nestjs/common';
import { ExerciseSourceSeeder } from './seeders/exercise-source.seeder';
import { RoleSeeder } from './seeders/role.seeder';
import { UserSeeder } from './seeders/user.seeder';
import { Seeder, SeedName } from './types/seed.types';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);
  private readonly seeders: Record<Exclude<SeedName, 'all'>, Seeder>;

  constructor(
    private readonly roleSeeder: RoleSeeder,
    private readonly userSeeder: UserSeeder,
    private readonly exerciseSourceSeeder: ExerciseSourceSeeder,
  ) {
    this.seeders = {
      role: this.roleSeeder,
      user: this.userSeeder,
      'exercise-source': this.exerciseSourceSeeder,
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
    // Run in the order of 'this.seeders'
    for (const seeder of Object.values(this.seeders)) {
      await seeder.run();
    }
  }
}
