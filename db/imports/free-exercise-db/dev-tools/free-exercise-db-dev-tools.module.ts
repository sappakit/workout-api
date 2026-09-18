import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseMedia } from 'db/entities/workout/exercise/exercise-media.entity';
import { ExerciseSource } from 'db/entities/workout/exercise/exercise-source.entity';
import { Exercise } from 'db/entities/workout/exercise/exercises.entity';
import { databaseToolEnvValidationSchema } from 'src/config/env.validation';
import { DatabaseModule } from 'src/database/database.module';
import { loadLocalEnv } from 'utils/env.util';
import { FreeExerciseDbDevToolsService } from './free-exercise-db-dev-tools.service';
import { FreeExerciseDbMediaMigrationService } from './services/free-exercise-db-media-migration.service';
import { FreeExerciseDbTrackingTypeReviewService } from './services/free-exercise-db-tracking-type-review.service';

loadLocalEnv();

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: databaseToolEnvValidationSchema,
      ignoreEnvFile: true,
    }),

    DatabaseModule,

    TypeOrmModule.forFeature([ExerciseSource, Exercise, ExerciseMedia]),
  ],

  providers: [
    FreeExerciseDbDevToolsService,
    FreeExerciseDbTrackingTypeReviewService,
    FreeExerciseDbMediaMigrationService,
  ],
})
export class FreeExerciseDbDevToolsModule {}
