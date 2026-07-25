import { User } from 'db/entities/auth/user.entity';
import { BaseEntity } from 'db/entities/shared/base.entity';
import { WorkoutScheduleStatus } from 'src/workout/enums/workout.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Workout } from './workouts.entity';

@Index(['user', 'status'])
@Index(['user', 'scheduled_date'], { unique: true })
@Entity({ schema: 'workout', name: 'workout_schedule' })
export class WorkoutSchedule extends BaseEntity {
  @Column({ type: 'date' })
  scheduled_date: string;

  @Column({ type: 'varchar', length: 20 })
  status: WorkoutScheduleStatus;

  @ManyToOne(() => User, (user) => user.schedules, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Workout, (workout) => workout.schedules, { nullable: false })
  @JoinColumn({ name: 'workout_id' })
  workout: Workout;
}
