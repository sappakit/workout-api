import { User } from 'db/entities/auth';
import { BaseEntity } from 'db/entities/shared';
import { Column, Entity, JoinColumn, ManyToOne, Index } from 'typeorm';
import { Exercise } from '.';

@Index(['user', 'exercise'], { unique: true })
@Entity({ schema: 'workout', name: 'exercise_user_stats' })
export class ExerciseUserStat extends BaseEntity {
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  last_weight?: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  max_weight?: number;

  @Column({ type: 'int', nullable: true })
  first_reps?: number;

  @Column({ type: 'int', nullable: true })
  last_reps?: number;

  @Column({ type: 'int', nullable: true })
  max_reps?: number;

  @Column({ type: 'int', nullable: true })
  total_duration?: number;

  @Column({ type: 'int', nullable: true })
  total_calories_burned?: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Exercise, (exercise) => exercise.user_stats, {
    nullable: false,
  })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;
}
