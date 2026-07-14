import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CommonModule } from './common/common.module';
import { appEnvValidationSchema } from './config/env.validation';
import { createTypeOrmOptions } from './config/typeorm.config';
import { EmailModule } from './email/email.module';
import { ExerciseModule } from './exercise/exercise.module';
import { HashingModule } from './hashing/hashing.module';
import { UserModule } from './user/user.module';
import { WorkoutModule } from './workout/workout.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: appEnvValidationSchema,
    }),

    // Connect to datatbase
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createTypeOrmOptions,
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
