import { User } from 'db/entities/auth';
import { BaseEntity } from 'db/entities/shared';
import { WorkoutWeeklyPlanDayType } from 'src/workout/enums/workout.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Workout } from './workouts.entity';

@Index(['user', 'day_of_week'], { unique: true })
@Entity({ schema: 'workout', name: 'workout_weekly_plan' })
export class WorkoutWeeklyPlan extends BaseEntity {
  @Column({ type: 'smallint' })
  day_of_week: number; // 1 = Monday, 7 = Sunday

  @Column({
    type: 'varchar',
    length: 20,
    default: WorkoutWeeklyPlanDayType.UNASSIGNED,
  })
  day_type: WorkoutWeeklyPlanDayType;

  @ManyToOne(() => User, (user) => user.workout_weekly_plans, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Workout, (workout) => workout.weekly_plans)
  @JoinColumn({ name: 'workout_id' })
  workout: Workout | null;
}
