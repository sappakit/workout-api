import { BaseEntity } from 'db/entities/shared';
import { ExerciseMediaType } from 'src/workout/enums/workout.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Exercise, ExerciseSource } from '.';

@Index(['exercise', 'display_order'], { unique: true })
@Entity({ schema: 'workout', name: 'exercise_media' })
export class ExerciseMedia extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  media_type: ExerciseMediaType;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public_id: string | null;

  @Column({ type: 'text', nullable: true })
  source_path: string | null;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @ManyToOne(() => Exercise, (exercise) => exercise.media, {
    nullable: false,
  })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;

  @ManyToOne(() => ExerciseSource, (source) => source.media, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'source_id' })
  source: ExerciseSource | null;
}
