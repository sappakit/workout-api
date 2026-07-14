import 'dotenv/config';

import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';
import { getSeedName } from './utils/seed.util';

async function bootstrap(): Promise<void> {
  const logger = new Logger('DatabaseSeed');
  let app: INestApplicationContext | undefined;

  try {
    const nodeEnv = process.env.NODE_ENV;

    if (nodeEnv !== 'development') {
      throw new Error(
        `Development seeds require NODE_ENV=development. Current NODE_ENV: ${
          nodeEnv ?? 'undefined'
        }`,
      );
    }

    const seedName = getSeedName();

    app = await NestFactory.createApplicationContext(SeedModule, {
      logger: ['log', 'warn', 'error'],
    });

    const seedService = app.get(SeedService);

    await seedService.run(seedName);
  } catch (error) {
    logger.error(
      'Database seed failed',
      error instanceof Error ? error.stack : String(error),
    );

    process.exitCode = 1;
  } finally {
    await app?.close();
  }
}

void bootstrap();
