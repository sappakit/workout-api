import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { createDatabaseOptions } from './database-options';

export function createTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return createDatabaseOptions((key) => configService.get<string>(key));
}
