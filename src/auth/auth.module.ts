import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import jwtConfig from './config/jwt.config';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { APP_GUARD } from '@nestjs/core';
import { AppAuthGuard } from './guards/auth.guard';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { HashingModule } from 'src/hashing/hashing.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role, User, UserProfile } from 'db/entities/auth';
import { TokenModule } from './token/token.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, Role]),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      inject: [jwtConfig.KEY],
      useFactory: (jwt) => ({
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
  ],
  controllers: [AuthController],
  providers: [
    // Strategies
    JwtAccessStrategy,
    JwtRefreshStrategy,
    LocalStrategy,

    // Guards
    JwtAccessGuard,

    // Global guard
    {
      provide: APP_GUARD,
      useClass: AppAuthGuard,
    },

    //Service
    AuthService,
  ],
})
export class AuthModule {}
