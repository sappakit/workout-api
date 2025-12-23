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
import { WorkoutSchedule, WorkoutSessionExercise } from '.';

@Index(['schedule'])
@Index(['status'])
@Entity({ schema: 'workout', name: 'workout_sessions' })
export class WorkoutSession extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  status: WorkoutSessionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  ended_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  paused_at?: Date;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  total_duration?: number;

  @Column({ type: 'int', nullable: true })
  calories_burned?: number;

  @ManyToOne(() => WorkoutSchedule, (schedule) => schedule.sessions)
  @JoinColumn({ name: 'workout_schedule_id' })
  schedule?: WorkoutSchedule;

  @OneToMany(() => WorkoutSessionExercise, (wse) => wse.session)
  exercises: WorkoutSessionExercise[];
}
