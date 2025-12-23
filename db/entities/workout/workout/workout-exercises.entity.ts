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
@Index(['workout', 'order_index'])
@Index(['workout', 'exercise'], { unique: true })
@Entity({ schema: 'workout', name: 'workout_exercises' })
export class WorkoutExercise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  order_index: number;

  @Column({ type: 'int', nullable: true })
  planned_sets?: number;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'minimum-maximum',
  })
  planned_reps_range?: string;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  planned_weight?: number;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  planned_rest_time?: number;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  planned_duration?: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  planned_distance?: number;

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
  planned_sets_detail: WorkoutExerciseSet[];
}
