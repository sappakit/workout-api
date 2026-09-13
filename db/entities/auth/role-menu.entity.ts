import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Menu } from './menu.entity';
import { Role } from './role.entity';

@Entity({ schema: 'auth', name: 'role_menu' })
export class RoleMenu {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Role, (role) => role.roleMenus, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Menu, (menu) => menu.roleMenus, { nullable: false })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;
}
