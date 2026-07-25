import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exercise } from '../exercise/exercises.entity';
import { WorkoutExercise } from './workout-exercises.entity';
import { WorkoutSessionExerciseSet } from './workout-session-exercise-sets.entity';
import { WorkoutSession } from './workout-sessions.entity';

@Index(['exercise'])
@Index(['session', 'order_index'], { unique: true })
@Entity({ schema: 'workout', name: 'workout_session_exercises' })
export class WorkoutSessionExercise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  order_index: number;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  rest_time: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @ManyToOne(() => WorkoutSession, (session) => session.session_exercises, {
    nullable: false,
  })
  @JoinColumn({ name: 'workout_session_id' })
  session: WorkoutSession;

  @ManyToOne(() => Exercise, (exercise) => exercise.session_exercises, {
    nullable: false,
  })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;

  @ManyToOne(() => WorkoutExercise, {
    nullable: true,
  })
  @JoinColumn({ name: 'workout_exercise_id' })
  workout_exercise: WorkoutExercise | null;

  @OneToMany(
    () => WorkoutSessionExerciseSet,
    (sessionExerciseSet) => sessionExerciseSet.session_exercise,
  )
  sets: WorkoutSessionExerciseSet[];
}
