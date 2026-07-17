import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'db/entities/auth';
import { ExerciseCategory, ExerciseSource } from 'db/entities/workout';
import { AuthModule } from 'src/auth/auth.module';
import { seedEnvValidationSchema } from 'src/config/env.validation';
import { DatabaseModule } from 'src/database/database.module';
import { SeedService } from './seed.service';
import { ExerciseCategorySeeder } from './seeders/exercise-category.seeder';
import { ExerciseSourceSeeder } from './seeders/exercise-source.seeder';
import { RoleSeeder } from './seeders/role.seeder';
import { UserSeeder } from './seeders/user.seeder';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: seedEnvValidationSchema,
    }),

    DatabaseModule,
    TypeOrmModule.forFeature([Role, ExerciseSource, ExerciseCategory]),

    AuthModule,
  ],
  providers: [
    SeedService,
    RoleSeeder,
    UserSeeder,
    ExerciseSourceSeeder,
    ExerciseCategorySeeder,
  ],
})
export class SeedModule {}
