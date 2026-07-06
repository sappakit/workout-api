import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllEntities } from 'db/entities';
import { getDBEnv } from 'utils/getDBEnv.util';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CommonModule } from './common/common.module';
import { envValidationSchema } from './config/env.validation';
import { ExerciseModule } from './exercise/exercise.module';
import { HashingModule } from './hashing/hashing.module';
import { UserModule } from './user/user.module';
import { WorkoutModule } from './workout/workout.module';
import { EmailModule } from './email/email.module';

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
    UserModule,
    CloudinaryModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
