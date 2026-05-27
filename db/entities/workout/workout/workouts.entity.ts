import { BaseEntity } from 'db/entities/shared';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import {
  WorkoutExercise,
  WorkoutFocusType,
  WorkoutMuscle,
  WorkoutSchedule,
  WorkoutSession,
} from '.';
import { WorkoutWeeklyPlan } from './workout-weekly-plan.entity';
import { User } from 'db/entities/auth';

@Entity({ schema: 'workout', name: 'workouts' })
export class Workout extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  image_url?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', comment: 'seconds', nullable: true })
  duration: number;

  @Column({ type: 'boolean', default: false })
  is_public: boolean;

  @OneToMany(() => WorkoutExercise, (we) => we.workout)
  workout_exercises: WorkoutExercise[];

  @OneToMany(() => WorkoutSchedule, (ws) => ws.workout)
  schedules: WorkoutSchedule[];

  @OneToMany(() => WorkoutMuscle, (wm) => wm.workout)
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

  @ManyToOne(() => WorkoutFocusType, (focus) => focus.workouts)
  @JoinColumn({ name: 'workout_focus_type_id' })
  workout_focus_type: WorkoutFocusType | null;

  @ManyToOne(() => User, (user) => user.workouts, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
