import { BaseEntity } from 'db/entities/shared';
import { EquipmentCategory } from 'src/workout/enums/workout.enum';
import { Column, Entity, OneToMany } from 'typeorm';
import { ExerciseEquipment } from '../exercise';

@Entity({ schema: 'workout', name: 'equipment' })
export class Equipment extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 30 })
  category: EquipmentCategory;

  @OneToMany(
    () => ExerciseEquipment,
    (exerciseEquipment) => exerciseEquipment.equipment,
  )
  exercise_links: ExerciseEquipment[];
}
