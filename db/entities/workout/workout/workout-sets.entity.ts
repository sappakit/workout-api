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
@Entity({ schema: 'workout', name: 'workout_sets' })
export class WorkoutSet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  set_number: number;

  @Column({ type: 'int', nullable: true })
  reps?: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  weight?: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  distance?: number;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  duration?: number;

  @Column({ type: 'timestamptz', nullable: true })
  performed_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at?: Date;

  @ManyToOne(() => WorkoutSessionExercise, (se) => se.sets, { nullable: false })
  @JoinColumn({ name: 'session_exercise_id' })
  session_exercise: WorkoutSessionExercise;
}
