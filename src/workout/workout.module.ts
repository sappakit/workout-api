import { Module } from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { WorkoutController } from './workout.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Workout,
  WorkoutFocusType,
  WorkoutSchedule,
  WorkoutWeeklyPlan,
} from 'db/entities/workout';
import { PaginationService } from 'src/common/pagination/pagination.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workout,
      WorkoutSchedule,
      WorkoutWeeklyPlan,
      WorkoutFocusType,
    ]),
  ],
  controllers: [WorkoutController],
  providers: [WorkoutService, PaginationService],
})
export class WorkoutModule {}
