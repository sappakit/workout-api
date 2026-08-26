import { Injectable, Logger } from '@nestjs/common';
import { EquipmentSeeder } from './seeders/equipment.seeder';
import { ExerciseCategorySeeder } from './seeders/exercise-category.seeder';
import { ExerciseSourceSeeder } from './seeders/exercise-source.seeder';
import { MuscleSeeder } from './seeders/muscle.seeder';
import { RoleSeeder } from './seeders/role.seeder';
import { UserSeeder } from './seeders/user.seeder';
import { WorkoutFocusTypeSeeder } from './seeders/workout-focus-type.seeder';
import { WorkoutSeeder } from './seeders/workout.seeder';
import {
  SEED_ORDER,
  Seeder,
  SeedName,
  SingleSeedName,
} from './types/seed.types';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);
  private readonly seeders: Record<SingleSeedName, Seeder>;

  constructor(
    private readonly roleSeeder: RoleSeeder,
    private readonly userSeeder: UserSeeder,
    private readonly exerciseSourceSeeder: ExerciseSourceSeeder,
    private readonly exerciseCategorySeeder: ExerciseCategorySeeder,
    private readonly equipmentSeeder: EquipmentSeeder,
    private readonly muscleSeeder: MuscleSeeder,
    private readonly workoutFocusTypeSeeder: WorkoutFocusTypeSeeder,
    private readonly workoutSeeder: WorkoutSeeder,
  ) {
    this.seeders = {
      role: this.roleSeeder,
      user: this.userSeeder,
      'exercise-source': this.exerciseSourceSeeder,
      'exercise-category': this.exerciseCategorySeeder,
      equipment: this.equipmentSeeder,
      muscle: this.muscleSeeder,
      'workout-focus-type': this.workoutFocusTypeSeeder,
      workout: this.workoutSeeder,
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
    for (const seedName of SEED_ORDER) {
      await this.seeders[seedName].run();
    }
  }
}
