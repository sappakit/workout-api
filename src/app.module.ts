import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDBEnv } from 'utils/getDBEnv';
import { AllEntities } from 'db/entities';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get('NODE_ENV') !== 'production';
        const db = getDBEnv(isDev, (key) => config.get<string>(key));

        return {
          type: 'postgres',
          ...db,
          entities: AllEntities,
          synchronize: false,
          ssl: !isDev ? { rejectUnauthorized: false } : false,
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
