import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkoutSession, WorkoutSet } from '.';
import { Exercise } from '../exercise';

@Index(['exercise'])
@Index(['session', 'order_index'])
@Index(['session', 'exercise'], { unique: true })
@Entity({ schema: 'workout', name: 'workout_session_exercises' })
export class WorkoutSessionExercise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  order_index?: number;

  @Column({ type: 'boolean', default: false })
  is_skipped: boolean;

  @ManyToOne(() => WorkoutSession, (session) => session.exercises, {
    nullable: false,
  })
  @JoinColumn({ name: 'workout_session_id' })
  session: WorkoutSession;

  @ManyToOne(() => Exercise, (exercise) => exercise.session_exercises, {
    nullable: false,
  })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;

  @OneToMany(() => WorkoutSet, (set) => set.session_exercise)
  sets: WorkoutSet[];
}
