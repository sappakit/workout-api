import { Injectable } from '@nestjs/common';
import { RefreshSession } from './types/session.types';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class RefreshTokenStore {
  constructor(private readonly redisService: RedisService) {}

  private sessionKey(sid: string) {
    return `auth:sess:${sid}`;
  }

  private userSessionsKey(userId: number) {
    return `auth:user-sessions:${userId}`;
  }

  async getSession(sid: string): Promise<RefreshSession | null> {
    const raw = await this.redisService.get(this.sessionKey(sid));
    return raw ? (JSON.parse(raw) as RefreshSession) : null;
  }

  async saveSession(sid: string, session: RefreshSession, ttl: number) {
    const multi = this.redisService.multi();
    multi.set(this.sessionKey(sid), JSON.stringify(session), 'EX', ttl);
    multi.sadd(this.userSessionsKey(session.userId), sid);
    multi.expire(this.userSessionsKey(session.userId), ttl);
    await multi.exec();
  }

  async deleteSession(sid: string) {
    const session = await this.getSession(sid);
    if (!session) return;

    const multi = this.redisService.multi();
    multi.del(this.sessionKey(sid));
    multi.srem(this.userSessionsKey(session.userId), sid);
    await multi.exec();
  }

  async deleteAllUserSessions(userId: number) {
    const sids = await this.redisService.smembers(this.userSessionsKey(userId));
    const multi = this.redisService.multi();
    for (const sid of sids) multi.del(this.sessionKey(sid));
    multi.del(this.userSessionsKey(userId));
    await multi.exec();
  }
}
