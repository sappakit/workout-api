import { Injectable, Logger } from '@nestjs/common';
import { ExerciseSourceSeeder } from './seeders/exercise-source.seeder';
import { RoleSeeder } from './seeders/role.seeder';
import { UserSeeder } from './seeders/user.seeder';
import { SeedName } from './types/seed.types';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly roleSeeder: RoleSeeder,
    private readonly userSeeder: UserSeeder,
    private readonly exerciseSourceSeeder: ExerciseSourceSeeder,
  ) {}

  async run(seedName: SeedName): Promise<void> {
    this.logger.log(`Starting database seed: ${seedName}`);

    switch (seedName) {
      case 'all':
        await this.runAll();
        break;

      case 'role':
        await this.roleSeeder.run();
        break;

      case 'user':
        await this.roleSeeder.run();
        await this.userSeeder.run();
        break;

      case 'exercise-source':
        await this.exerciseSourceSeeder.run();
        break;

      default:
        throw new Error(`Unknown seed: ${seedName satisfies never}`);
    }

    this.logger.log(`Database seed completed: ${seedName}`);
  }

  private async runAll(): Promise<void> {
    await this.roleSeeder.run();
    await this.userSeeder.run();
    await this.exerciseSourceSeeder.run();
  }
}
