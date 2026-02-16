import { Module } from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { WorkoutController } from './workout.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'db/entities/auth';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [WorkoutController],
  providers: [WorkoutService],
})
export class WorkoutModule {}
