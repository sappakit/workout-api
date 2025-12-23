import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkoutExercise } from '.';

@Index(['workout_exercise', 'set_number'], { unique: true })
@Entity({ schema: 'workout', name: 'workout_exercise_sets' })
export class WorkoutExerciseSet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  set_number: number;

  @Column({ type: 'int', nullable: true })
  planned_reps?: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  planned_weight?: number;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  planned_rest_time?: number;

  // cardio
  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  planned_duration?: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  planned_distance?: number;

  @ManyToOne(() => WorkoutExercise, (we) => we.planned_sets_detail, {
    nullable: false,
  })
  @JoinColumn({ name: 'workout_exercise_id' })
  workout_exercise: WorkoutExercise;
}
