import { AllEntities } from 'db/entities';
import { DataSourceOptions } from 'typeorm';
import { getDBEnv } from 'utils/getDBEnv.util';

type EnvGetter = (key: string) => string | undefined;

export function createDatabaseOptions(getEnv: EnvGetter): DataSourceOptions {
  const isProduction = getEnv('NODE_ENV') === 'production';

  return {
    type: 'postgres',
    ...getDBEnv(isProduction, getEnv),
    entities: AllEntities,
    synchronize: false,
    logging: false,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };
}
