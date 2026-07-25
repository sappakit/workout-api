import { BaseEntity } from 'db/entities/shared/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { ExerciseMedia } from './exercise-media.entity';
import { Exercise } from './exercises.entity';

@Entity({ schema: 'workout', name: 'exercise_sources' })
export class ExerciseSource extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text' })
  source_url: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  license_name: string | null;

  @Column({ type: 'text', nullable: true })
  license_url: string | null;

  @Column({ type: 'text', nullable: true })
  attribution_text: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source_version: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source_commit_hash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  imported_at: Date | null;

  @OneToMany(() => Exercise, (exercise) => exercise.source)
  exercises: Exercise[];

  @OneToMany(() => ExerciseMedia, (media) => media.source)
  media: ExerciseMedia[];
}
