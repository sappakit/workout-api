import { Column, PrimaryGeneratedColumn } from 'typeorm';

export abstract class WorkoutSetBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  set_number: number;

  @Column({ type: 'int', nullable: true })
  reps: number | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  weight: number | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  distance: number | null;

  @Column({ type: 'int', nullable: true, comment: 'seconds' })
  duration: number | null;
}
