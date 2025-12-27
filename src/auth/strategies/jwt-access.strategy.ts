import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from '../config/jwt.config';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ActiveUserData } from '../enums/auth.enum';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwt: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwt.accessSecret,
      issuer: jwt.issuer,
      audience: jwt.audience,
    });
  }

  async validate(payload: any): Promise<ActiveUserData> {
    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
      tokenType: 'access',
    };
  }
}
