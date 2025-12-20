import 'dotenv/config';
import { DataSource } from 'typeorm';
import { getDBEnv } from 'utils/getDBEnv';
import { AllEntities } from './entities';

const isDev = process.env.NODE_ENV !== 'production';
const db = getDBEnv(isDev, (key) => process.env[key]);

export default new DataSource({
  type: 'postgres',
  ...db,
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  entities: AllEntities,
  synchronize: false,
  logging: isDev,
  ssl: !isDev ? { rejectUnauthorized: false } : false,
});
