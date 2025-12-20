import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { Role } from './role.entity';
import { UserProfile } from './user-profile.entity';
import { BaseEntity } from '../shared/base.entity';

@Entity({ schema: 'auth', name: 'user' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  email?: string;

  @Column({ type: 'smallint', default: 0 })
  login_attempts: number;

  @Column({ type: 'boolean', default: false })
  is_reset_password: boolean;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;

  @ManyToOne(() => Role, (role) => role.users, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
