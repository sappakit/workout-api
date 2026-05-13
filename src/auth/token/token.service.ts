import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenPayload, RefreshTokenPayload } from './types/token.types';
import jwtConfig from '../config/jwt.config';
import { type ConfigType } from '@nestjs/config';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,

    @Inject(jwtConfig.KEY)
    private readonly jwtSettings: ConfigType<typeof jwtConfig>,
  ) {}

  async generateAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.jwtSettings.accessSecret,
      expiresIn: this.jwtSettings.accessTokenTtl,
      issuer: this.jwtSettings.issuer,
      audience: this.jwtSettings.audience,
    });
  }

  async generateRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.jwtSettings.refreshSecret,
      expiresIn: this.jwtSettings.refreshTokenTtl,
      issuer: this.jwtSettings.issuer,
      audience: this.jwtSettings.audience,
    });
  }

  async verifyRefreshToken(token: string) {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.jwtSettings.refreshSecret,
      issuer: this.jwtSettings.issuer,
      audience: this.jwtSettings.audience,
    });

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    return payload as RefreshTokenPayload;
  }

  refreshTtlSeconds() {
    return this.jwtSettings.refreshTokenTtl;
  }
}
