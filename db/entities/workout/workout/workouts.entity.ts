import { BaseEntity } from 'db/entities/shared';
import { Column, Entity, OneToMany } from 'typeorm';
import { WorkoutExercise, WorkoutMuscle, WorkoutSchedule } from '.';

@Entity({ schema: 'workout', name: 'workouts' })
export class Workout extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', comment: 'seconds', nullable: true })
  duration: number;

  @OneToMany(() => WorkoutExercise, (we) => we.workout)
  workout_exercises: WorkoutExercise[];

  @OneToMany(() => WorkoutSchedule, (ws) => ws.workout)
  schedules: WorkoutSchedule[];

  @OneToMany(() => WorkoutMuscle, (wm) => wm.workout)
  muscles: WorkoutMuscle[];
}
