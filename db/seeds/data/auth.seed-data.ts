import { Role } from 'db/entities/auth/role.entity';
import { UserProfile } from 'db/entities/auth/user-profile.entity';
import { User } from 'db/entities/auth/user.entity';

type RoleSeedData = Pick<Role, 'code' | 'name' | 'description'>;

export const ROLE_SEED_DATA = [
  {
    code: 'admin',
    name: 'Admin',
    description: 'Application administrator',
  },
  {
    code: 'user',
    name: 'User',
    description: 'Standard application user',
  },
] satisfies RoleSeedData[];

type UserProfileSeedData = Pick<UserProfile, 'first_name' | 'last_name'>;

type UserSeedData = Pick<User, 'username' | 'email'> & {
  roleCode: Role['code'];
  profile: UserProfileSeedData;
};

export const USER_SEED_DATA = [
  {
    username: 'admin',
    email: 'admin@nextrep.local',
    roleCode: 'admin',

    profile: {
      first_name: 'Development',
      last_name: 'Admin',
    },
  },
  {
    username: 'demo-user',
    email: 'demo@nextrep.local',
    roleCode: 'user',

    profile: {
      first_name: 'Demo',
      last_name: 'User',
    },
  },
] satisfies UserSeedData[];
