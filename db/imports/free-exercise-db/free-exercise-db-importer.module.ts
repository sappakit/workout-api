import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Equipment,
  ExerciseCategory,
  ExerciseSource,
  Muscle,
} from 'db/entities/workout';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { importEnvValidationSchema } from 'src/config/env.validation';
import { DatabaseModule } from 'src/database/database.module';
import { FreeExerciseDbImporterService } from './free-exercise-db-importer.service';
import { FreeExerciseDbImageUploadService } from './services/free-exercise-db-image-upload.service';
import { FreeExerciseDbPersistenceService } from './services/free-exercise-db-persistence.service';

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
    ]),

    CloudinaryModule,
  ],
  providers: [
    FreeExerciseDbImporterService,
    FreeExerciseDbPersistenceService,
    FreeExerciseDbImageUploadService,
  ],
})
export class FreeExerciseDbImporterModule {}
