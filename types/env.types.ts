type DBEnvKeys = {
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
};

export const DEV_KEYS: DBEnvKeys = {
  host: 'DB_HOST_DEV',
  port: 'DB_PORT_DEV',
  username: 'DB_USERNAME_DEV',
  password: 'DB_PASSWORD_DEV',
  database: 'DB_NAME_DEV',
};

export const PROD_KEYS: DBEnvKeys = {
  host: 'DB_HOST',
  port: 'DB_PORT',
  username: 'DB_USERNAME',
  password: 'DB_PASSWORD',
  database: 'DB_NAME',
};
