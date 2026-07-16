import { BaseEntity } from 'db/entities/shared';
import { Column, Entity, OneToMany } from 'typeorm';
import { Exercise } from './exercises.entity';

@Entity({ schema: 'workout', name: 'exercise_categories' })
export class ExerciseCategory extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => Exercise, (exercise) => exercise.category)
  exercises: Exercise[];
}
