import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { WorkoutExerciseSet, WorkoutSessionExercise } from '.';
import { WorkoutSetBase } from '../shared/workout-set-base.entity';

@Index(['session_exercise', 'set_number'], { unique: true })
@Entity({ schema: 'workout', name: 'workout_session_exercise_sets' })
export class WorkoutSessionExerciseSet extends WorkoutSetBase {
  @Column({ type: 'timestamptz', nullable: true })
  performed_at?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at?: Date | null;

  @ManyToOne(() => WorkoutSessionExercise, (se) => se.sets, {
    nullable: false,
  })
  @JoinColumn({ name: 'session_exercise_id' })
  session_exercise: WorkoutSessionExercise;

  @ManyToOne(() => WorkoutExerciseSet, {
    nullable: true,
  })
  @JoinColumn({ name: 'workout_exercise_set_id' })
  workout_exercise_set?: WorkoutExerciseSet | null;
}
