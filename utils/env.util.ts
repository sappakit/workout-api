import { config } from 'dotenv';
import { DEV_KEYS, PROD_KEYS } from 'types/env.types';

type EnvGetter = (key: string) => string | undefined;

export function getDBEnv(isProduction: boolean, getEnv: EnvGetter) {
  const keys = isProduction ? PROD_KEYS : DEV_KEYS;

  return {
    host: getEnv(keys.host),
    port: Number(getEnv(keys.port)),
    username: getEnv(keys.username),
    password: getEnv(keys.password),
    database: getEnv(keys.database),
  };
}

export function loadLocalEnv() {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  config({ path: '.env' });

  const envFilePath = process.env.ENV_FILE_PATH;

  if (!envFilePath) {
    throw new Error(
      'Missing ENV_FILE_PATH. Please define it in the local .env file.',
    );
  }

  config({ path: envFilePath });
}

export function assertDevelopmentEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv !== 'development') {
    throw new Error(
      [
        'This operation requires NODE_ENV=development.',
        `Current NODE_ENV: ${nodeEnv ?? 'undefined'}.`,
      ].join(' '),
    );
  }
}
