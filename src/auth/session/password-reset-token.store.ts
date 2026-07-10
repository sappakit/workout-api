import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';

export type PasswordResetTokenData = {
  userId: number;
};

@Injectable()
export class PasswordResetTokenStore {
  constructor(private readonly redisService: RedisService) {}

  private tokenKey(tokenHash: string) {
    return `auth:password-reset:${tokenHash}`;
  }

  async saveToken(
    tokenHash: string,
    data: PasswordResetTokenData,
    ttl: number,
  ) {
    await this.redisService.set(
      this.tokenKey(tokenHash),
      JSON.stringify(data),
      ttl,
    );
  }

  async getToken(tokenHash: string): Promise<PasswordResetTokenData | null> {
    const raw = await this.redisService.get(this.tokenKey(tokenHash));

    return raw ? JSON.parse(raw) : null;
  }

  async deleteToken(tokenHash: string) {
    await this.redisService.del(this.tokenKey(tokenHash));
  }
}
