import { User } from 'db/entities/auth/user.entity';
import { BaseEntity } from 'db/entities/shared/base.entity';
import { WorkoutSessionStatus } from 'src/workout/enums/workout.enum';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { WorkoutSessionExercise } from './workout-session-exercises.entity';
import { Workout } from './workouts.entity';

@Index(['user', 'status'])
@Entity({ schema: 'workout', name: 'workout_sessions' })
export class WorkoutSession extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  status: WorkoutSessionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  ended_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  paused_at: Date | null;

  @Column({ type: 'int', default: 0, comment: 'seconds' })
  total_paused_duration: number;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  total_duration: number | null;

  @Column({ type: 'int', nullable: true })
  calories_burned: number | null;

  @ManyToOne(() => User, (user) => user.sessions, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Workout, (workout) => workout.sessions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'workout_id' })
  workout: Workout | null;

  @OneToMany(
    () => WorkoutSessionExercise,
    (sessionExercise) => sessionExercise.session,
  )
  session_exercises: WorkoutSessionExercise[];
}
