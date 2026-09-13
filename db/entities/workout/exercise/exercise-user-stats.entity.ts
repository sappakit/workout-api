import { User } from 'db/entities/auth/user.entity';
import { BaseEntity } from 'db/entities/shared/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Exercise } from './exercises.entity';

@Index(['user', 'exercise'], { unique: true })
@Entity({ schema: 'workout', name: 'exercise_user_stats' })
export class ExerciseUserStat extends BaseEntity {
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  last_weight: number | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  max_weight: number | null;

  @Column({ type: 'int', nullable: true })
  first_reps: number | null;

  @Column({ type: 'int', nullable: true })
  last_reps: number | null;

  @Column({ type: 'int', nullable: true })
  max_reps: number | null;

  @Column({ type: 'int', nullable: true })
  total_duration: number | null;

  @Column({ type: 'int', nullable: true })
  total_calories_burned: number | null;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Exercise, (exercise) => exercise.user_stats, {
    nullable: false,
  })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;
}
