import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Workout } from './workouts.entity';

@Entity({ schema: 'workout', name: 'workout_focus_types' })
export class WorkoutFocusType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @OneToMany(() => Workout, (workout) => workout.workout_focus_type)
  workouts: Workout[];
}
