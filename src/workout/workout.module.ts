import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutFocusType } from 'db/entities/workout/workout/workout-focus-types.entity';
import { WorkoutSchedule } from 'db/entities/workout/workout/workout-schedule.entity';
import { WorkoutSession } from 'db/entities/workout/workout/workout-sessions.entity';
import { WorkoutWeeklyPlan } from 'db/entities/workout/workout/workout-weekly-plan.entity';
import { Workout } from 'db/entities/workout/workout/workouts.entity';
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
