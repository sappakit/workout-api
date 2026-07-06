import { RefreshSession } from 'src/auth/session/types/session.types';

export type AccessTokenPayload = {
  sub: number; // userId
  sid: string; // session id
  username: string;
  role: string;
  typ: 'access';
};

export type DecodedAccessTokenPayload = AccessTokenPayload & {
  iat: number;
  exp: number;
  aud: string;
  iss: string;
};

export type RefreshTokenPayload = {
  sub: number;
  sid: string;
  typ: 'refresh';
};

export type IssueTokenParams = {
  sid: string;
  userId: number;
  username: string;
  role: string;
  prevSess?: RefreshSession;
};
