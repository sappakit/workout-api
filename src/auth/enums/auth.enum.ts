export enum AuthType {
  PUBLIC = 'public',
  USER = 'user',
  ADMIN = 'admin',
}

export interface ActiveUserData {
  sub: string; // user id
  username?: string;
  role?: string;
  permissions?: string[];
  tokenType?: 'access' | 'refresh' | 'info';
}
