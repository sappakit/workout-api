import { Module } from '@nestjs/common';
import { loadLocalEnv } from 'utils/env.util';
import { FreeExerciseDbDevToolsService } from './free-exercise-db-dev-tools.service';
import { FreeExerciseDbTrackingTypeReviewService } from './services/free-exercise-db-tracking-type-review.service';

loadLocalEnv();

@Module({
  providers: [
    FreeExerciseDbDevToolsService,
    FreeExerciseDbTrackingTypeReviewService,
  ],
})
export class FreeExerciseDbDevToolsModule {}
