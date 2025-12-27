import { Injectable } from '@nestjs/common';
import { genSalt, hash, compare } from 'bcrypt';
import { HashingService } from './hashing.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BcryptService implements HashingService {
  private readonly saltRounds: number;

  constructor(private readonly configService: ConfigService) {
    this.saltRounds =
      this.configService.getOrThrow<number>('BCRYPT_SALT_ROUNDS');
  }

  async hash(data: string): Promise<string> {
    const salt = await genSalt(this.saltRounds);
    return hash(data, salt);
  }

  async compare(data: string, encrypted: string): Promise<boolean> {
    return compare(data, encrypted);
  }
}
