import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  multi() {
    return this.redisClient.multi();
  }

  // String operation
  async set(key: string, value: string, ttl?: number) {
    return ttl
      ? this.redisClient.set(key, value, 'EX', ttl)
      : this.redisClient.set(key, value);
  }

  async get(key: string) {
    return this.redisClient.get(key);
  }

  async del(key: string) {
    return this.redisClient.del(key);
  }

  // Set operation
  async sadd(key: string, member: string) {
    return this.redisClient.sadd(key, member);
  }

  async srem(key: string, member: string) {
    return this.redisClient.srem(key, member);
  }

  async smembers(key: string) {
    return this.redisClient.smembers(key);
  }

  async expire(key: string, ttl: number) {
    return this.redisClient.expire(key, ttl);
  }
}
