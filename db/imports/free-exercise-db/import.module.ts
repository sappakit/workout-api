import { Module } from '@nestjs/common';
import { FreeExerciseDbImporterService } from './free-exercise-db-importer.service';

@Module({
  providers: [FreeExerciseDbImporterService],
})
export class FreeExerciseDbImportModule {}
