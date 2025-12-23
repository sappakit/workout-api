import {
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exercise } from '.';
import { Equipment } from '../shared';

@Index(['equipment'])
@Index(['exercise', 'equipment'], { unique: true })
@Entity({ schema: 'workout', name: 'exercise_equipment' })
export class ExerciseEquipment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Exercise, { nullable: false })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;

  @ManyToOne(() => Equipment, { nullable: false })
  @JoinColumn({ name: 'equipment_id' })
  equipment: Equipment;
}
