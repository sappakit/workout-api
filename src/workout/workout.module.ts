import { Module } from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { WorkoutController } from './workout.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'db/entities/auth';
import {
  Equipment,
  Exercise,
  Muscle,
  Workout,
  WorkoutFocusType,
  WorkoutSchedule,
  WorkoutWeeklyPlan,
} from 'db/entities/workout';
import { PaginationService } from 'src/common/pagination/pagination.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Exercise,
      Muscle,
      Equipment,
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
