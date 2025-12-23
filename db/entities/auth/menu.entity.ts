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
  parent?: Menu;

  @OneToMany(() => Menu, (menu) => menu.parent)
  children: Menu[];

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  path?: string;

  @Column({ type: 'int', nullable: true })
  order?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => RoleMenu, (rm) => rm.menu)
  roleMenus: RoleMenu[];
}
