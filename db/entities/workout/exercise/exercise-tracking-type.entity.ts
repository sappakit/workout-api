import { BaseEntity } from 'db/entities/shared/base.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Exercise } from './exercises.entity';

@Index(['code'], { unique: true })
@Entity({ schema: 'workout', name: 'exercise_tracking_types' })
export class ExerciseTrackingType extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => Exercise, (exercise) => exercise.tracking_type)
  exercises: Exercise[];
}
