import { User } from 'db/entities/auth';
import { BaseEntity } from 'db/entities/shared';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Workout } from './workouts.entity';

@Index(['user', 'day_of_week'], { unique: true })
@Entity({ schema: 'workout', name: 'workout_weekly_plan' })
export class WorkoutWeeklyPlan extends BaseEntity {
  @Column({ type: 'smallint' })
  day_of_week: number; // 1 = Monday, 7 = Sunday

  @ManyToOne(() => User, (user) => user.workout_weekly_plans, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Workout, (workout) => workout.weekly_plans, {
    nullable: false,
  })
  @JoinColumn({ name: 'workout_id' })
  workout: Workout;
}
