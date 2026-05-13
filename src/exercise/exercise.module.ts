import { Module } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipment, Exercise, Muscle } from 'db/entities/workout';
import { MusclesController } from './controllers/muscle.controller';
import { EquipmentController } from './controllers/equipment.controller';
import { ExerciseController } from './controllers/exercise.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise, Muscle, Equipment])],
  controllers: [ExerciseController, MusclesController, EquipmentController],
  providers: [ExerciseService, PaginationService],
})
export class ExerciseModule {}
