import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseCategory } from 'db/entities/workout/exercise/exercise-category.entity';
import { Exercise } from 'db/entities/workout/exercise/exercises.entity';
import { Equipment } from 'db/entities/workout/shared/equipment.entity';
import { Muscle } from 'db/entities/workout/shared/muscles.entity';
import { WorkoutSessionExerciseSet } from 'db/entities/workout/workout/workout-session-exercise-sets.entity';
import { WorkoutSessionExercise } from 'db/entities/workout/workout/workout-session-exercises.entity';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { EquipmentController } from './controllers/equipment.controller';
import { ExerciseController } from './controllers/exercise.controller';
import { MusclesController } from './controllers/muscle.controller';
import { ExerciseService } from './exercise.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Exercise,
      Muscle,
      Equipment,
      WorkoutSessionExercise,
      WorkoutSessionExerciseSet,
      ExerciseCategory,
    ]),
  ],
  controllers: [ExerciseController, MusclesController, EquipmentController],
  providers: [ExerciseService, PaginationService],
  exports: [ExerciseService],
})
export class ExerciseModule {}
