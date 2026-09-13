import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoleMenu } from './role-menu.entity';

@Entity({ schema: 'auth', name: 'menu' })
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Menu, (menu) => menu.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Menu | null;

  @OneToMany(() => Menu, (menu) => menu.parent)
  children: Menu[];

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  path: string | null;

  @Column({ type: 'int', nullable: true })
  sort_order: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => RoleMenu, (roleMenu) => roleMenu.menu)
  roleMenus: RoleMenu[];
}
