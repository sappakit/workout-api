import { User } from 'db/entities/auth';
import { BaseEntity } from 'db/entities/shared';
import {
  DifficultyLevel,
  ExerciseOrigin,
  ExerciseStatus,
  ExerciseType,
} from 'src/workout/enums/workout.enum';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import {
  ExerciseEquipment,
  ExerciseMedia,
  ExerciseMuscle,
  ExerciseSource,
  ExerciseUserStat,
} from '.';
import { WorkoutExercise, WorkoutSessionExercise } from '../workout';

@Index(['owner'])
@Index(['source', 'source_external_id'], { unique: true })
@Entity({ schema: 'workout', name: 'exercises' })
export class Exercise extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 20,
    default: ExerciseOrigin.SYSTEM,
  })
  origin: ExerciseOrigin;

  @Column({
    type: 'varchar',
    length: 20,
    default: ExerciseStatus.DRAFT,
  })
  status: ExerciseStatus;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 30 })
  exercise_type: ExerciseType;

  @Column({ type: 'varchar', length: 20, nullable: true })
  difficulty_level?: DifficultyLevel;

  // Strength: per set. Cardio: per minute.
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

  @Column({ type: 'varchar', length: 255, nullable: true })
  source_external_id?: string;

  @ManyToOne(() => ExerciseSource, (source) => source.exercises, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'source_id' })
  source?: ExerciseSource;

  @ManyToOne(() => User, (user) => user.owned_exercises, {
    nullable: true,
  })
  @JoinColumn({ name: 'owner_user_id' })
  owner?: User;

  @OneToMany(() => ExerciseMedia, (media) => media.exercise)
  media: ExerciseMedia[];

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
