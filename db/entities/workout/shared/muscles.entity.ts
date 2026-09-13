import { BaseEntity } from 'db/entities/shared/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { ExerciseMuscle } from '../exercise/exercise-muscles.entity';
import { WorkoutMuscle } from '../workout/workout-muscles.entity';

@Entity({ schema: 'workout', name: 'muscles' })
export class Muscle extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @OneToMany(() => ExerciseMuscle, (exerciseMuscle) => exerciseMuscle.muscle)
  exercise_links: ExerciseMuscle[];

  @OneToMany(() => WorkoutMuscle, (workoutMuscle) => workoutMuscle.muscle)
  workout_links: WorkoutMuscle[];
}
