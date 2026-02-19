import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import jwtConfig from './config/jwt.config';
import { LocalStrategy } from './strategies/local.strategy';
import { APP_GUARD } from '@nestjs/core';
import { AppAuthGuard } from './guards/auth.guard';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { HashingModule } from 'src/hashing/hashing.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role, User, UserProfile } from 'db/entities/auth';
import { TokenModule } from './token/token.module';
import { RedisModule } from 'src/redis/redis.module';
import { RefreshTokenStore } from './session/refresh-session.store';

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
  ],
})
export class AuthModule {}
