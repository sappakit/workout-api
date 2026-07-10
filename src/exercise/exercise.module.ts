import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Equipment,
  Exercise,
  Muscle,
  WorkoutSessionExercise,
  WorkoutSessionExerciseSet,
} from 'db/entities/workout';
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
    ]),
  ],
  controllers: [ExerciseController, MusclesController, EquipmentController],
  providers: [ExerciseService, PaginationService],
  exports: [ExerciseService],
})
export class ExerciseModule {}
