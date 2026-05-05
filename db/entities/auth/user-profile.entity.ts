import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from '../shared/base.entity';

@Entity({ schema: 'auth', name: 'user_profile' })
export class UserProfile extends BaseEntity {
  @Column({ type: 'varchar', length: 50, nullable: true })
  first_name?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  last_name?: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone_number?: string | null;

  @Column({ type: 'text', nullable: true })
  image_url?: string | null;

  @OneToOne(() => User, (user) => user.profile, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
