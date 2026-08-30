import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'db/entities/auth/role.entity';
import { ExerciseCategory } from 'db/entities/workout/exercise/exercise-category.entity';
import { ExerciseSource } from 'db/entities/workout/exercise/exercise-source.entity';
import { ExerciseTrackingType } from 'db/entities/workout/exercise/exercise-tracking-type.entity';
import { Exercise } from 'db/entities/workout/exercise/exercises.entity';
import { Equipment } from 'db/entities/workout/shared/equipment.entity';
import { Muscle } from 'db/entities/workout/shared/muscles.entity';
import { WorkoutExercise } from 'db/entities/workout/workout/workout-exercises.entity';
import { WorkoutFocusType } from 'db/entities/workout/workout/workout-focus-types.entity';
import { Workout } from 'db/entities/workout/workout/workouts.entity';
import { AuthModule } from 'src/auth/auth.module';
import { seedEnvValidationSchema } from 'src/config/env.validation';
import { DatabaseModule } from 'src/database/database.module';
import { SeedService } from './seed.service';
import { EquipmentSeeder } from './seeders/equipment.seeder';
import { ExerciseCategorySeeder } from './seeders/exercise-category.seeder';
import { ExerciseSourceSeeder } from './seeders/exercise-source.seeder';
import { ExerciseTrackingTypeSeeder } from './seeders/exercise-tracking-type.seeder';
import { MuscleSeeder } from './seeders/muscle.seeder';
import { RoleSeeder } from './seeders/role.seeder';
import { UserSeeder } from './seeders/user.seeder';
import { WorkoutFocusTypeSeeder } from './seeders/workout-focus-type.seeder';
import { WorkoutSeeder } from './seeders/workout.seeder';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: seedEnvValidationSchema,
    }),

    DatabaseModule,

    TypeOrmModule.forFeature([
      Role,

      ExerciseSource,
      ExerciseCategory,
      ExerciseTrackingType,
      Exercise,
      Equipment,
      Muscle,

      WorkoutFocusType,
      Workout,
      WorkoutExercise,
    ]),

    AuthModule,
  ],

  providers: [
    SeedService,

    RoleSeeder,
    UserSeeder,

    ExerciseSourceSeeder,
    ExerciseCategorySeeder,
    ExerciseTrackingTypeSeeder,
    EquipmentSeeder,
    MuscleSeeder,

    WorkoutFocusTypeSeeder,
    WorkoutSeeder,
  ],
})
export class SeedModule {}
