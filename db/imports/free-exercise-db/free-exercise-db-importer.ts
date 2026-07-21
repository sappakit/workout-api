import 'dotenv/config';

import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { FreeExerciseDbImporterModule } from './free-exercise-db-importer.module';
import { FreeExerciseDbImporterService } from './free-exercise-db-importer.service';

async function bootstrap(): Promise<void> {
  const logger = new Logger('FreeExerciseDbImport');
  let app: INestApplicationContext | undefined;

  try {
    validateEnvironment();

    const dryRun = !process.argv.includes('--import');

    if (!dryRun) {
      const confirmed = await confirmRealImport(logger);

      if (!confirmed) {
        logger.warn('Import cancelled. No database rows were modified.');
        return;
      }
    }

    app = await NestFactory.createApplicationContext(
      FreeExerciseDbImporterModule,
      {
        logger: ['log', 'warn', 'error'],
      },
    );

    const importer = app.get(FreeExerciseDbImporterService);

    await importer.run({ dryRun });

    logger.log(
      dryRun
        ? 'Free Exercise DB inspection completed successfully.'
        : 'Free Exercise DB import completed successfully.',
    );
  } catch (error: unknown) {
    logger.error(
      'Free Exercise DB import failed',
      error instanceof Error ? error.stack : String(error),
    );

    process.exitCode = 1;
  } finally {
    await app?.close();
  }
}

function validateEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv !== 'development') {
    throw new Error(
      [
        'Exercise import currently requires NODE_ENV=development.',
        `Current NODE_ENV: ${nodeEnv ?? 'undefined'}.`,
      ].join(' '),
    );
  }
}

async function confirmRealImport(logger: Logger): Promise<boolean> {
  logger.warn(
    [
      'This operation will update existing Free Exercise DB exercises',
      'to match the source dataset and may overwrite local edits.',
    ].join(' '),
  );

  const readline = createInterface({ input, output });

  try {
    const answer = await readline.question(
      'Type "IMPORT" to confirm and continue: ',
    );

    return answer.trim() === 'IMPORT';
  } finally {
    readline.close();
  }
}

void bootstrap();
