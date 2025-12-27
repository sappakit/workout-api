import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';

@Module({
  imports: [ConfigModule.forFeature(jwtConfig), JwtModule],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
