import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exercise } from '../exercise';
import { Workout, WorkoutExerciseSet } from '.';

@Index(['exercise'])
@Index(['workout', 'order_index'], { unique: true })
@Entity({ schema: 'workout', name: 'workout_exercises' })
export class WorkoutExercise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  order_index: number;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  rest_time?: number | null;

  @ManyToOne(() => Workout, (workout) => workout.workout_exercises, {
    nullable: false,
  })
  @JoinColumn({ name: 'workout_id' })
  workout: Workout;

  @ManyToOne(() => Exercise, {
    nullable: false,
  })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;

  @OneToMany(() => WorkoutExerciseSet, (set) => set.workout_exercise)
  sets: WorkoutExerciseSet[];
}
