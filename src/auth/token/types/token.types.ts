import { RefreshSession } from 'src/auth/session/types/session.types';

export type AccessTokenPayload = {
  sub: number;
  username: string;
  role: string;
  typ: 'access';
};

export type RefreshTokenPayload = {
  sub: number; // userId
  sid: string; // session id
  typ: 'refresh';
};

export type IssueTokenParams = {
  sid: string;
  userId: number;
  username: string;
  role: string;
  prevSess?: RefreshSession;
};
