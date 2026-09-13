import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RoleMenu } from './role-menu.entity';
import { User } from './user.entity';

@Entity({ schema: 'auth', name: 'role' })
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @OneToMany(() => RoleMenu, (roleMenu) => roleMenu.role)
  roleMenus: RoleMenu[];
}
