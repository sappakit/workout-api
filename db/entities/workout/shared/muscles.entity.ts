import { Column, Entity, OneToMany } from 'typeorm';
import { ExerciseMuscle } from '../exercise';
import { WorkoutMuscle } from '../workout';
import { BaseEntity } from 'db/entities/shared';

@Entity({ schema: 'workout', name: 'muscles' })
export class Muscle extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @OneToMany(() => ExerciseMuscle, (em) => em.muscle)
  exercise_links: ExerciseMuscle[];

  @OneToMany(() => WorkoutMuscle, (wm) => wm.muscle)
  workout_links: WorkoutMuscle[];
}
