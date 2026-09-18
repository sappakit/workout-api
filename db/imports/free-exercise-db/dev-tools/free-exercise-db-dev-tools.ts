import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { assertDevelopmentEnvironment } from 'utils/env.util';
import { FreeExerciseDbDevToolsModule } from './free-exercise-db-dev-tools.module';
import { FreeExerciseDbDevToolsService } from './free-exercise-db-dev-tools.service';
import { FreeExerciseDbDevToolTask } from './types/free-exercise-db-dev-tools.types';
import { getDevToolTask } from './utils/get-dev-tool-task.util';

type ConfirmableDevToolTask = Extract<
  FreeExerciseDbDevToolTask,
  'media-import-run'
>;

async function bootstrap(): Promise<void> {
  const logger = new Logger('FreeExerciseDbDevTools');

  let app: INestApplicationContext | undefined;

  try {
    assertDevelopmentEnvironment();

    const task = getDevToolTask();

    logger.log(`Selected Free Exercise DB dev tool task: ${task}`);

    if (requiresConfirmation(task)) {
      const confirmed = await confirmTask(task, logger);

      if (!confirmed) {
        logger.warn(
          'Media import cancelled. No exercise_media rows were modified.',
        );

        return;
      }
    }

    app = await NestFactory.createApplicationContext(
      FreeExerciseDbDevToolsModule,
      {
        logger: ['log', 'warn', 'error'],
      },
    );

    const devTools = app.get(FreeExerciseDbDevToolsService);

    await devTools.run(task);

    logger.log(getSuccessMessage(task));
  } catch (error: unknown) {
    logger.error(
      'Free Exercise DB dev tool failed',
      error instanceof Error ? error.stack : String(error),
    );

    process.exitCode = 1;
  } finally {
    await app?.close();
  }
}

function requiresConfirmation(
  task: FreeExerciseDbDevToolTask,
): task is ConfirmableDevToolTask {
  return task === 'media-import-run';
}

async function confirmTask(
  task: ConfirmableDevToolTask,
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

function getConfirmationWarning(task: ConfirmableDevToolTask): string {
  switch (task) {
    case 'media-import-run':
      return [
        'This operation will upsert exercise_media rows from the portable media manifest.',
        'Existing media values may be overwritten.',
        'Run the "media-import-prepare" task first to inspect and validate the manifest before continuing.',
      ].join(' ');
  }
}

function getSuccessMessage(task: FreeExerciseDbDevToolTask): string {
  switch (task) {
    case 'tracking-type-initial-input':
      return 'Free Exercise DB tracking-type input generated successfully.';

    case 'tracking-type-review-input':
      return 'Free Exercise DB tracking-type review input generated successfully.';

    case 'tracking-type-finalize':
      return 'Free Exercise DB final tracking-type mapping generated successfully.';

    case 'media-export':
      return 'Free Exercise DB media manifest exported successfully.';

    case 'media-import-prepare':
      return 'Free Exercise DB media manifest prepared successfully.';

    case 'media-import-run':
      return 'Free Exercise DB media import completed successfully.';
  }
}

void bootstrap();
