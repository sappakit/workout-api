import { Module } from '@nestjs/common';
import { HashingService } from './services/hashing.service';
import { BcryptService } from './services/bcrypt.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
  ],
  exports: [HashingService],
})
export class HashingModule {}
