import 'dotenv/config';
import { DataSource } from 'typeorm';
import { AllEntities } from './entities';
import { getDBEnv } from 'utils/getDBEnv.util';

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
