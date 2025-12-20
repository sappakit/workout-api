import { DEV_KEYS, PROD_KEYS } from 'types/env.types';

type EnvGetter = (key: string) => string | undefined;

export function getDBEnv(isDev: boolean, getEnv: EnvGetter) {
  const keys = isDev ? DEV_KEYS : PROD_KEYS;

  for (const key of Object.values(keys)) {
    if (!process.env[key]) {
      throw new Error(`Missing env: ${key}`);
    }
  }

  return {
    host: getEnv(keys.host),
    port: Number(getEnv(keys.port)),
    username: getEnv(keys.username),
    password: getEnv(keys.password),
    database: getEnv(keys.database),
  };
}
