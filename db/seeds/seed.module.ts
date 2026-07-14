import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'db/entities/auth';
import { ExerciseSource } from 'db/entities/workout';
import { AuthModule } from 'src/auth/auth.module';
import { seedEnvValidationSchema } from 'src/config/env.validation';
import { createTypeOrmOptions } from 'src/config/typeorm.config';
import { SeedService } from './seed.service';
import { ExerciseSourceSeeder } from './seeders/exercise-source.seeder';
import { RoleSeeder } from './seeders/role.seeder';
import { UserSeeder } from './seeders/user.seeder';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: seedEnvValidationSchema,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createTypeOrmOptions,
    }),

    TypeOrmModule.forFeature([Role, ExerciseSource]),
    AuthModule,
  ],
  providers: [SeedService, RoleSeeder, UserSeeder, ExerciseSourceSeeder],
})
export class SeedModule {}
