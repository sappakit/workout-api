import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Workout,
  WorkoutFocusType,
  WorkoutSchedule,
  WorkoutSession,
  WorkoutWeeklyPlan,
} from 'db/entities/workout';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { ExerciseModule } from 'src/exercise/exercise.module';
import { WorkoutController } from './workout.controller';
import { WorkoutService } from './workout.service';

@Module({
  imports: [
    ExerciseModule,
    TypeOrmModule.forFeature([
      Workout,
      WorkoutSchedule,
      WorkoutWeeklyPlan,
      WorkoutFocusType,
      WorkoutSession,
    ]),
  ],
  controllers: [WorkoutController],
  providers: [WorkoutService, PaginationService],
})
export class WorkoutModule {}
