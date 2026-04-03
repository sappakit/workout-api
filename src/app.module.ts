import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllEntities } from 'db/entities';
import { AuthModule } from './auth/auth.module';
import { envValidationSchema } from './config/env.validation';
import { HashingModule } from './hashing/hashing.module';
import { CommonModule } from './common/common.module';
import { WorkoutModule } from './workout/workout.module';
import { getDBEnv } from 'utils/getDBEnv.util';
import { ExerciseModule } from './exercise/exercise.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: envValidationSchema,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
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

    AuthModule,
    HashingModule,
    CommonModule,
    WorkoutModule,
    ExerciseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
