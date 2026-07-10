import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import redisConfig from 'src/config/redis.config';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [redisConfig.KEY],
      useFactory: async (cfg: ConfigType<typeof redisConfig>) => {
        const client = new Redis({
          host: cfg.host,
          port: cfg.port,
          password: cfg.password,
          db: cfg.db,
          enableReadyCheck: true,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
        });

        try {
          await client.connect();
        } catch (err) {
          console.error('[Redis] failed to connect');
          throw `[Redis] ${err}`;
        }

        return client;
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
