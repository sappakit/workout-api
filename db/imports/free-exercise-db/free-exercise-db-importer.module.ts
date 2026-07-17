import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseCategory } from 'db/entities/workout';
import { importEnvValidationSchema } from 'src/config/env.validation';
import { DatabaseModule } from 'src/database/database.module';
import { FreeExerciseDbImporterService } from './free-exercise-db-importer.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: importEnvValidationSchema,
    }),

    DatabaseModule,
    TypeOrmModule.forFeature([ExerciseCategory]),
  ],
  providers: [FreeExerciseDbImporterService],
})
export class FreeExerciseDbImporterModule {}
