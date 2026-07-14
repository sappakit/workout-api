import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role, User, UserProfile } from 'db/entities/auth';
import { EmailModule } from 'src/email/email.module';
import { HashingModule } from 'src/hashing/hashing.module';
import { RedisModule } from 'src/redis/redis.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import jwtConfig from './config/jwt.config';
import { AppAuthGuard } from './guards/auth.guard';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { PasswordResetTokenStore } from './session/password-reset-token.store';
import { RefreshTokenStore } from './session/refresh-token.store';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { TokenModule } from './token/token.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, Role]),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      inject: [jwtConfig.KEY],
      useFactory: (jwt: ConfigType<typeof jwtConfig>) => ({
        secret: jwt.accessSecret,
        signOptions: {
          expiresIn: jwt.accessTokenTtl,
          issuer: jwt.issuer,
          audience: jwt.audience,
        },
      }),
    }),
    PassportModule,
    HashingModule,
    TokenModule,
    RedisModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    // Strategies
    LocalStrategy,
    JwtAccessStrategy,

    // Guards
    JwtAccessGuard,

    // Global guard
    {
      provide: APP_GUARD,
      useClass: AppAuthGuard,
    },

    //Service
    AuthService,
    RefreshTokenStore,
    PasswordResetTokenStore,
  ],
  exports: [AuthService],
})
export class AuthModule {}
