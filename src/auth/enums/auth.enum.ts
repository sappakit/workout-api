export enum AuthType {
  PUBLIC = 'public',
  USER = 'user',
  ADMIN = 'admin',
}

export type ActiveUserData = {
  sub: number; // user id
  sid: string; // session id
  username: string;
  role: string;
  permissions?: string[];
  tokenType?: 'access' | 'refresh' | 'info';
};

export type LocalValidatedUser = {
  id: number;
  username: string;
  email: string;
  role: { code: string; name: string };
};
