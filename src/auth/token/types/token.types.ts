export interface AccessTokenPayload {
  sub: number;
  username: string;
  role: string;
}

export interface RefreshTokenPayload {
  sub: number;
}
