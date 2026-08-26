import { User } from 'db/entities/auth/user.entity';
import { BaseEntity } from 'db/entities/shared/base.entity';
import {
  ContentStatus,
  DifficultyLevel,
  ExerciseOrigin,
} from 'src/workout/enums/workout.enum';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { WorkoutExercise } from '../workout/workout-exercises.entity';
import { WorkoutSessionExercise } from '../workout/workout-session-exercises.entity';
import { ExerciseCategory } from './exercise-category.entity';
import { ExerciseEquipment } from './exercise-equipment.entity';
import { ExerciseMedia } from './exercise-media.entity';
import { ExerciseMuscle } from './exercise-muscles.entity';
import { ExerciseSource } from './exercise-source.entity';
import { ExerciseUserStat } from './exercise-user-stats.entity';

// Ensures system exercises have no owner, while user exercises must have one.
const EXERCISE_ORIGIN_OWNER_CHECK = `
  (
    "origin" = '${ExerciseOrigin.SYSTEM}'
    AND "owner_user_id" IS NULL
  )
  OR
  (
    "origin" = '${ExerciseOrigin.USER}'
    AND "owner_user_id" IS NOT NULL
  )
`;

// Ensures source_id and source_external_id are either both set or both null.
const EXERCISE_SOURCE_IDENTITY_CHECK = `
  (
    "source_id" IS NULL
    AND "source_external_id" IS NULL
  )
  OR
  (
    "source_id" IS NOT NULL
    AND "source_external_id" IS NOT NULL
  )
`;

// Prevents user-created exercises from being linked to an external source.
const EXERCISE_USER_SOURCE_CHECK = `
  "origin" = '${ExerciseOrigin.SYSTEM}'
  OR
  (
    "source_id" IS NULL
    AND "source_external_id" IS NULL
  )
`;

@Check('CHK_exercises_origin_owner', EXERCISE_ORIGIN_OWNER_CHECK)
@Check('CHK_exercises_source_identity', EXERCISE_SOURCE_IDENTITY_CHECK)
@Check('CHK_exercises_user_source', EXERCISE_USER_SOURCE_CHECK)
@Index(['owner'])
@Index(['category'])
@Index(['source', 'source_external_id'], { unique: true })
@Entity({ schema: 'workout', name: 'exercises' })
export class Exercise extends BaseEntity {
  @Column({ type: 'varchar', length: 20, default: ExerciseOrigin.SYSTEM })
  origin: ExerciseOrigin;

  @Column({ type: 'varchar', length: 20, default: ContentStatus.DRAFT })
  status: ContentStatus;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  difficulty_level: DifficultyLevel | null;

  // Strength: per set. Cardio: per minute.
  @Column({ type: 'int', nullable: true })
  default_calories_burned: number | null;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  default_duration: number | null;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  default_rest_time: number | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'minimum-maximum',
  })
  default_reps_range: string | null;

  @Column({ type: 'int', nullable: true })
  default_sets: number | null;

  @Column({ type: 'text', nullable: true })
  demo_link: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  how_to_perform: string[] | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source_external_id: string | null;

  @ManyToOne(() => ExerciseCategory, (category) => category.exercises, {
    nullable: false,
  })
  @JoinColumn({ name: 'exercise_category_id' })
  category: ExerciseCategory;

  @ManyToOne(() => ExerciseSource, (source) => source.exercises, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'source_id' })
  source: ExerciseSource | null;

  @ManyToOne(() => User, (user) => user.owned_exercises, {
    nullable: true,
  })
  @JoinColumn({ name: 'owner_user_id' })
  owner: User | null;

  @OneToMany(() => ExerciseMedia, (media) => media.exercise)
  media: ExerciseMedia[];

  @OneToMany(
    () => WorkoutExercise,
    (workoutExercise) => workoutExercise.exercise,
  )
  workout_exercises: WorkoutExercise[];

  @OneToMany(
    () => WorkoutSessionExercise,
    (sessionExercise) => sessionExercise.exercise,
  )
  session_exercises: WorkoutSessionExercise[];

  @OneToMany(() => ExerciseUserStat, (stat) => stat.exercise)
  user_stats: ExerciseUserStat[];

  @OneToMany(
    () => ExerciseEquipment,
    (exerciseEquipment) => exerciseEquipment.exercise,
  )
  equipment_links: ExerciseEquipment[];

  @OneToMany(() => ExerciseMuscle, (exerciseMuscle) => exerciseMuscle.exercise)
  muscles: ExerciseMuscle[];
}
