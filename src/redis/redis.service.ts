import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  // Closes the Redis connection when the Nest module is destroyed
  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  // Starts a Redis transaction/pipeline for running multiple commands together
  multi() {
    return this.redisClient.multi();
  }

  // String operation
  // Stores a string value by key, optionally with TTL in seconds.
  async set(key: string, value: string, ttl?: number) {
    return ttl
      ? this.redisClient.set(key, value, 'EX', ttl)
      : this.redisClient.set(key, value);
  }

  // Gets a string value by key
  async get(key: string) {
    return this.redisClient.get(key);
  }

  // Deletes a key and its value
  async del(key: string) {
    return this.redisClient.del(key);
  }

  // Set operation
  // Adds a member to a Redis set
  async sadd(key: string, member: string) {
    return this.redisClient.sadd(key, member);
  }

  // Removes a member from a Redis set
  async srem(key: string, member: string) {
    return this.redisClient.srem(key, member);
  }

  // Gets all members from a Redis set
  async smembers(key: string) {
    return this.redisClient.smembers(key);
  }

  // Sets an expiration time in seconds for a key
  async expire(key: string, ttl: number) {
    return this.redisClient.expire(key, ttl);
  }
}
