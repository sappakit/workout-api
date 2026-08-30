import 'dotenv/config';

import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { FreeExerciseDbImporterModule } from './free-exercise-db-importer.module';
import { FreeExerciseDbImporterService } from './free-exercise-db-importer.service';
import { FreeExerciseDbImportTask } from './types/free-exercise-db.types';
import { getImportTask } from './utils/get-import-task.util';

type ConfirmableImportTask = Extract<
  FreeExerciseDbImportTask,
  'metadata' | 'tracking-types' | 'images'
>;

async function bootstrap(): Promise<void> {
  const logger = new Logger('FreeExerciseDbImport');

  let app: INestApplicationContext | undefined;

  try {
    validateEnvironment();

    const task = getImportTask();

    logger.log(`Selected Free Exercise DB import task: ${task}`);

    if (requiresConfirmation(task)) {
      const confirmed = await confirmImport(task, logger);

      if (!confirmed) {
        logger.warn(
          'Import cancelled. No database rows or Cloudinary assets were modified.',
        );

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

    await importer.run(task);

    logger.log(getSuccessMessage(task));
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

function requiresConfirmation(
  task: FreeExerciseDbImportTask,
): task is ConfirmableImportTask {
  return task === 'metadata' || task === 'tracking-types' || task === 'images';
}

async function confirmImport(
  task: ConfirmableImportTask,
  logger: Logger,
): Promise<boolean> {
  logger.warn(getConfirmationWarning(task));

  const readline = createInterface({
    input,
    output,
  });

  try {
    const confirmationText = 'IMPORT';

    const answer = await readline.question(
      `Type "${confirmationText}" to confirm and continue: `,
    );

    return answer.trim() === confirmationText;
  } finally {
    readline.close();
  }
}

function getConfirmationWarning(task: ConfirmableImportTask): string {
  switch (task) {
    case 'metadata':
      return [
        'This operation will upsert Free Exercise DB exercise metadata.',
        'Existing imported values may be overwritten.',
      ].join(' ');

    case 'tracking-types':
      return [
        'This operation will update tracking types for Free Exercise DB exercises.',
        'Existing tracking-type values may be overwritten.',
      ].join(' ');

    case 'images':
      return [
        'This operation will upload Free Exercise DB images to Cloudinary.',
        'Existing imported media values may be overwritten.',
      ].join(' ');
  }
}

function getSuccessMessage(task: FreeExerciseDbImportTask): string {
  switch (task) {
    case 'inspect':
      return 'Free Exercise DB inspection completed successfully.';

    case 'metadata':
      return 'Free Exercise DB metadata import completed successfully.';

    case 'tracking-types':
      return 'Free Exercise DB tracking-type import completed successfully.';

    case 'images':
      return 'Free Exercise DB image import completed successfully.';
  }
}

void bootstrap();
