import { User } from 'db/entities/auth/user.entity';
import { BaseEntity } from 'db/entities/shared/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { WorkoutExercise } from './workout-exercises.entity';
import { WorkoutFocusType } from './workout-focus-types.entity';
import { WorkoutMuscle } from './workout-muscles.entity';
import { WorkoutSchedule } from './workout-schedule.entity';
import { WorkoutSession } from './workout-sessions.entity';
import { WorkoutWeeklyPlan } from './workout-weekly-plan.entity';

@Entity({ schema: 'workout', name: 'workouts' })
export class Workout extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  image_url: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', comment: 'seconds', nullable: true })
  duration: number | null;

  @Column({ type: 'boolean', default: false })
  is_public: boolean;

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
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
