import {
  Entity,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Workout } from '.';
import { Muscle } from '../shared';

@Index(['muscle'])
@Index(['workout', 'muscle'], { unique: true })
@Entity({ schema: 'workout', name: 'workout_muscles' })
export class WorkoutMuscle {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Workout, (workout) => workout.muscles, { nullable: false })
  @JoinColumn({ name: 'workout_id' })
  workout: Workout;

  @ManyToOne(() => Muscle, (muscle) => muscle.workout_links, {
    nullable: false,
  })
  @JoinColumn({ name: 'muscle_id' })
  muscle: Muscle;
}
