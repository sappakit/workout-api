import { User } from 'db/entities/auth';
import { WorkoutScheduleStatus } from 'src/workout/enums/workout.enum';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Workout, WorkoutSession } from '.';
import { BaseEntity } from 'db/entities/shared';

@Index(['user', 'status'])
@Index(['user', 'scheduled_date'], { unique: true })
@Entity({ schema: 'workout', name: 'workout_schedule' })
export class WorkoutSchedule extends BaseEntity {
  @Column({ type: 'date' })
  scheduled_date: Date;

  @Column({ type: 'varchar', length: 20 })
  status: WorkoutScheduleStatus;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Workout, (workout) => workout.schedules, { nullable: false })
  @JoinColumn({ name: 'workout_id' })
  workout: Workout;

  @OneToMany(() => WorkoutSession, (session) => session.schedule)
  sessions: WorkoutSession[];
}
