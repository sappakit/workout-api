import { BaseEntity } from 'db/entities/shared';
import { DifficultyLevel, ExerciseType } from 'src/workout/enums/workout.enum';
import { Column, Entity, OneToMany } from 'typeorm';
import { WorkoutExercise, WorkoutSessionExercise } from '../workout';
import { ExerciseEquipment, ExerciseMuscle, ExerciseUserStat } from '.';

@Entity({ schema: 'workout', name: 'exercises' })
export class Exercise extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 30 })
  exercise_type: ExerciseType;

  @Column({ type: 'varchar', length: 20 })
  difficulty_level: DifficultyLevel;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // strength: per set, cardio: per minutes
  @Column({ type: 'int', nullable: true })
  default_calories_burned?: number;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  default_duration?: number;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  default_rest_time?: number;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'minimum-maximum',
  })
  default_reps_range?: string;

  @Column({ type: 'int', nullable: true })
  default_sets?: number;

  @Column({ type: 'text', nullable: true })
  demo_link?: string;

  @Column({ type: 'text', nullable: true })
  how_to_perform?: string;

  @OneToMany(() => WorkoutExercise, (we) => we.exercise)
  workout_exercises: WorkoutExercise[];

  @OneToMany(() => WorkoutSessionExercise, (wse) => wse.exercise)
  session_exercises: WorkoutSessionExercise[];

  @OneToMany(() => ExerciseUserStat, (stat) => stat.exercise)
  user_stats: ExerciseUserStat[];

  @OneToMany(
    () => ExerciseEquipment,
    (exerciseEquipment) => exerciseEquipment.exercise,
  )
  equipment_links: ExerciseEquipment[];

  @OneToMany(() => ExerciseMuscle, (em) => em.exercise)
  muscles: ExerciseMuscle[];
}
