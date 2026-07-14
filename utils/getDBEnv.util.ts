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
