import { BaseEntity } from 'db/entities/shared';
import { WorkoutSessionStatus } from 'src/workout/enums/workout.enum';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Workout, WorkoutSessionExercise } from '.';
import { User } from 'db/entities/auth';

@Index(['user', 'status'])
@Entity({ schema: 'workout', name: 'workout_sessions' })
export class WorkoutSession extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  status: WorkoutSessionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  started_at?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  ended_at?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  paused_at?: Date | null;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  total_duration?: number | null;

  @Column({ type: 'int', nullable: true })
  calories_burned?: number | null;

  @ManyToOne(() => User, (user) => user.sessions, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Workout, (workout) => workout.sessions, { nullable: false })
  @JoinColumn({ name: 'workout_id' })
  workout: Workout;

  @OneToMany(() => WorkoutSessionExercise, (wse) => wse.session)
  session_exercises: WorkoutSessionExercise[];
}
