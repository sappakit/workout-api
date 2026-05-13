import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkoutSessionExercise } from '.';

@Index(['session_exercise', 'set_number'], { unique: true })
@Entity({ schema: 'workout', name: 'workout_session_exercise_sets' })
export class WorkoutSessionExerciseSet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  set_number: number;

  @Column({ type: 'int', nullable: true })
  reps?: number | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  weight?: number | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  distance?: number | null;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  duration?: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  performed_at?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at?: Date | null;

  @ManyToOne(() => WorkoutSessionExercise, (se) => se.sets, { nullable: false })
  @JoinColumn({ name: 'session_exercise_id' })
  session_exercise: WorkoutSessionExercise;
}
