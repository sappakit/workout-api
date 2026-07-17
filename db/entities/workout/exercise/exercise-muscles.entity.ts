import { ExerciseMuscleRole } from 'src/workout/enums/workout.enum';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exercise } from '.';
import { Muscle } from '../shared';

@Index(['muscle'])
@Index(['exercise', 'role'])
@Index(['exercise', 'muscle'], { unique: true })
@Entity({ schema: 'workout', name: 'exercise_muscles' })
export class ExerciseMuscle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  role: ExerciseMuscleRole;

  @ManyToOne(() => Exercise, (exercise) => exercise.muscles, {
    nullable: false,
  })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;

  @ManyToOne(() => Muscle, (muscle) => muscle.exercise_links, {
    nullable: false,
  })
  @JoinColumn({ name: 'muscle_id' })
  muscle: Muscle;
}
