import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkoutSession, WorkoutSessionExerciseSet } from '.';
import { Exercise } from '../exercise';

@Index(['exercise'])
@Index(['session', 'order_index'], { unique: true })
@Entity({ schema: 'workout', name: 'workout_session_exercises' })
export class WorkoutSessionExercise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  order_index: number;

  @Column({ type: 'int', nullable: true })
  planned_sets?: number | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'minimum-maximum',
  })
  planned_reps_range?: string | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  planned_weight?: number | null;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  planned_rest_time?: number | null;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  planned_duration?: number | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  planned_distance?: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  started_at?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at?: Date | null;

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

  @OneToMany(() => WorkoutSessionExerciseSet, (set) => set.session_exercise)
  sets: WorkoutSessionExerciseSet[];
}
