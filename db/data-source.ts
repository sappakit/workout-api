import 'dotenv/config';

import { createDatabaseOptions } from 'src/config/database-options';
import { DataSource } from 'typeorm';

export default new DataSource({
  ...createDatabaseOptions((key) => process.env[key]),
  migrations: [__dirname + '/migrations/*.{ts,js}'],
});
