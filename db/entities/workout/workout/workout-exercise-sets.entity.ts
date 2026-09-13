import { Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { WorkoutSetBase } from '../shared/workout-set-base.entity';
import { WorkoutExercise } from './workout-exercises.entity';

@Index(['workout_exercise', 'set_number'], { unique: true })
@Entity({ schema: 'workout', name: 'workout_exercise_sets' })
export class WorkoutExerciseSet extends WorkoutSetBase {
  @ManyToOne(() => WorkoutExercise, (workoutExercise) => workoutExercise.sets, {
    nullable: false,
  })
  @JoinColumn({ name: 'workout_exercise_id' })
  workout_exercise: WorkoutExercise;
}
