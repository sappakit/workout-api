import { Module } from '@nestjs/common';
import { FreeExerciseDbDevToolsService } from './free-exercise-db-dev-tools.service';
import { FreeExerciseDbTrackingTypeReviewService } from './services/free-exercise-db-tracking-type-review.service';

@Module({
  providers: [
    FreeExerciseDbDevToolsService,
    FreeExerciseDbTrackingTypeReviewService,
  ],
})
export class FreeExerciseDbDevToolsModule {}
