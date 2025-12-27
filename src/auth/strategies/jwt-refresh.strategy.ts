import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { Inject } from '@nestjs/common';
import { Request } from 'express';
import { ActiveUserData } from '../enums/auth.enum';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwt: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwt.refreshSecret,
      issuer: jwt.issuer,
      audience: jwt.audience,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any): Promise<ActiveUserData> {
    const refreshToken = req.get('authorization')?.replace('Bearer ', '');

    return {
      sub: payload.sub,
      tokenType: 'refresh',
    };
  }
}
