import { createDatabaseOptions } from 'src/config/database-options';
import { DataSource } from 'typeorm';
import { loadLocalEnv } from 'utils/env.util';

loadLocalEnv();

export default new DataSource({
  ...createDatabaseOptions((key) => process.env[key]),
  migrations: [__dirname + '/migrations/*.{ts,js}'],
});
