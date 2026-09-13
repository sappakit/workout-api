import { User } from 'db/entities/auth/user.entity';
import { BaseEntity } from 'db/entities/shared/base.entity';
import { ContentStatus, WorkoutPlanType } from 'src/workout/enums/workout.enum';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { WorkoutExercise } from './workout-exercises.entity';
import { WorkoutFocusType } from './workout-focus-types.entity';
import { WorkoutMuscle } from './workout-muscles.entity';
import { WorkoutSchedule } from './workout-schedule.entity';
import { WorkoutSession } from './workout-sessions.entity';
import { WorkoutWeeklyPlan } from './workout-weekly-plan.entity';

// Ensures system templates have no owner, while user plans must have one.
const WORKOUT_PLAN_TYPE_OWNER_CHECK = `
  (
    "plan_type" = '${WorkoutPlanType.TEMPLATE}'
    AND "user_id" IS NULL
  )
  OR
  (
    "plan_type" = '${WorkoutPlanType.USER_PLAN}'
    AND "user_id" IS NOT NULL
  )
`;

// Ensures system templates have a stable code, while user plans do not.
const WORKOUT_PLAN_TYPE_CODE_CHECK = `
  (
    "plan_type" = '${WorkoutPlanType.TEMPLATE}'
    AND "code" IS NOT NULL
  )
  OR
  (
    "plan_type" = '${WorkoutPlanType.USER_PLAN}'
    AND "code" IS NULL
  )
`;

@Check('CHK_workouts_plan_type_owner', WORKOUT_PLAN_TYPE_OWNER_CHECK)
@Check('CHK_workouts_plan_type_code', WORKOUT_PLAN_TYPE_CODE_CHECK)
@Entity({ schema: 'workout', name: 'workouts' })
export class Workout extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    unique: true,
  })
  code: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: WorkoutPlanType.USER_PLAN,
  })
  plan_type: WorkoutPlanType;

  @Column({
    type: 'varchar',
    length: 20,
    default: ContentStatus.DRAFT,
  })
  status: ContentStatus;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  image_url: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', comment: 'seconds', nullable: true })
  duration: number | null;

  @OneToMany(
    () => WorkoutExercise,
    (workoutExercise) => workoutExercise.workout,
  )
  workout_exercises: WorkoutExercise[];

  @OneToMany(() => WorkoutSchedule, (schedule) => schedule.workout)
  schedules: WorkoutSchedule[];

  @OneToMany(() => WorkoutMuscle, (workoutMuscle) => workoutMuscle.workout)
  muscles: WorkoutMuscle[];

  @OneToMany(() => WorkoutWeeklyPlan, (plan) => plan.workout)
  weekly_plans: WorkoutWeeklyPlan[];

  @OneToMany(() => WorkoutSession, (session) => session.workout)
  sessions: WorkoutSession[];

  @OneToMany(() => Workout, (workout) => workout.source_workout)
  copied_workouts: Workout[];

  @ManyToOne(() => Workout, (workout) => workout.copied_workouts, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'source_workout_id' })
  source_workout: Workout | null;

  @ManyToOne(() => WorkoutFocusType, (focusType) => focusType.workouts, {
    nullable: true,
  })
  @JoinColumn({ name: 'workout_focus_type_id' })
  workout_focus_type: WorkoutFocusType | null;

  @ManyToOne(() => User, (user) => user.workouts, {
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;
}
