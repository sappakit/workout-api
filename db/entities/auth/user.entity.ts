import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../shared/base.entity';
import { Exercise } from '../workout/exercise/exercises.entity';
import { WorkoutSchedule } from '../workout/workout/workout-schedule.entity';
import { WorkoutSession } from '../workout/workout/workout-sessions.entity';
import { WorkoutWeeklyPlan } from '../workout/workout/workout-weekly-plan.entity';
import { Workout } from '../workout/workout/workouts.entity';
import { Role } from './role.entity';
import { UserProfile } from './user-profile.entity';

@Entity({ schema: 'auth', name: 'user' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password_hash: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'smallint', default: 0 })
  login_attempts: number;

  @Column({ type: 'boolean', default: false })
  is_reset_password: boolean;

  @ManyToOne(() => Role, (role) => role.users, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;

  @OneToMany(() => Exercise, (exercise) => exercise.owner)
  owned_exercises: Exercise[];

  @OneToMany(() => WorkoutSchedule, (schedule) => schedule.user)
  schedules: WorkoutSchedule[];

  @OneToMany(() => WorkoutWeeklyPlan, (plan) => plan.user)
  workout_weekly_plans: WorkoutWeeklyPlan[];

  @OneToMany(() => WorkoutSession, (session) => session.user)
  sessions: WorkoutSession[];

  @OneToMany(() => Workout, (workout) => workout.user)
  workouts: Workout[];
}
