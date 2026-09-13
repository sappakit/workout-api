import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { assertDevelopmentEnvironment } from 'utils/env.util';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';
import { getSeedName } from './utils/seed.util';

async function bootstrap(): Promise<void> {
  const logger = new Logger('DatabaseSeed');

  let app: INestApplicationContext | undefined;

  try {
    assertDevelopmentEnvironment();

    const seedName = getSeedName();

    app = await NestFactory.createApplicationContext(SeedModule, {
      logger: ['log', 'warn', 'error'],
    });

    const seedService = app.get(SeedService);

    await seedService.run(seedName);
  } catch (error: unknown) {
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
