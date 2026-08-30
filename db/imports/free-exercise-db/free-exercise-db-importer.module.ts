import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseCategory } from 'db/entities/workout/exercise/exercise-category.entity';
import { ExerciseSource } from 'db/entities/workout/exercise/exercise-source.entity';
import { ExerciseTrackingType } from 'db/entities/workout/exercise/exercise-tracking-type.entity';
import { Equipment } from 'db/entities/workout/shared/equipment.entity';
import { Muscle } from 'db/entities/workout/shared/muscles.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { importEnvValidationSchema } from 'src/config/env.validation';
import { DatabaseModule } from 'src/database/database.module';
import { FreeExerciseDbImporterService } from './free-exercise-db-importer.service';
import { FreeExerciseDbImageUploadService } from './services/free-exercise-db-image-upload.service';
import { FreeExerciseDbMediaPersistenceService } from './services/free-exercise-db-media-persistence.service';
import { FreeExerciseDbPersistenceService } from './services/free-exercise-db-persistence.service';
import { FreeExerciseDbPreparationService } from './services/free-exercise-db-preparation.service';
import { FreeExerciseDbTrackingTypePersistenceService } from './services/free-exercise-db-tracking-type-persistence.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: importEnvValidationSchema,
    }),

    DatabaseModule,
    TypeOrmModule.forFeature([
      ExerciseCategory,
      Equipment,
      Muscle,
      ExerciseSource,
      ExerciseTrackingType,
    ]),

    CloudinaryModule,
  ],

  providers: [
    FreeExerciseDbImporterService,
    FreeExerciseDbPersistenceService,
    FreeExerciseDbImageUploadService,
    FreeExerciseDbMediaPersistenceService,
    FreeExerciseDbPreparationService,
    FreeExerciseDbTrackingTypePersistenceService,
  ],
})
export class FreeExerciseDbImporterModule {}
