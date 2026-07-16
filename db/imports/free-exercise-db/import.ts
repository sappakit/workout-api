import 'dotenv/config';

import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FreeExerciseDbImporterService } from './free-exercise-db-importer.service';
import { FreeExerciseDbImportModule } from './import.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('FreeExerciseDbImport');
  let app: INestApplicationContext | undefined;

  try {
    const nodeEnv = process.env.NODE_ENV;

    if (nodeEnv !== 'development') {
      throw new Error(
        `Exercise import currently requires NODE_ENV=development. Current NODE_ENV: ${
          nodeEnv ?? 'undefined'
        }`,
      );
    }

    app = await NestFactory.createApplicationContext(
      FreeExerciseDbImportModule,
      {
        logger: ['log', 'warn', 'error'],
      },
    );

    const importer = app.get(FreeExerciseDbImporterService);

    await importer.run({ dryRun: true });
  } catch (error) {
    logger.error(
      'Free Exercise DB import failed',
      error instanceof Error ? error.stack : String(error),
    );

    process.exitCode = 1;
  } finally {
    await app?.close();
  }
}

void bootstrap();
