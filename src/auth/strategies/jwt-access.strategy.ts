import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from '../config/jwt.config';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ActiveUserData } from '../enums/auth.enum';
import { DecodedAccessTokenPayload } from '../token/types/token.types';

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

  async validate(payload: DecodedAccessTokenPayload): Promise<ActiveUserData> {
    if (payload.typ !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
