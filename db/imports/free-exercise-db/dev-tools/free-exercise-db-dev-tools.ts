import 'dotenv/config';

import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FreeExerciseDbDevToolsModule } from './free-exercise-db-dev-tools.module';
import { FreeExerciseDbDevToolsService } from './free-exercise-db-dev-tools.service';
import { FreeExerciseDbDevToolTask } from './types/free-exercise-db-dev-tools.types';
import { getDevToolTask } from './utils/get-dev-tool-task.util';

async function bootstrap(): Promise<void> {
  const logger = new Logger('FreeExerciseDbDevTools');

  let app: INestApplicationContext | undefined;

  try {
    const task = getDevToolTask();

    logger.log(`Selected Free Exercise DB dev tool task: ${task}`);

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

function getSuccessMessage(task: FreeExerciseDbDevToolTask): string {
  switch (task) {
    case 'tracking-type-initial-input':
      return 'Free Exercise DB tracking-type input generated successfully.';

    case 'tracking-type-review-input':
      return 'Free Exercise DB tracking-type review input generated successfully.';

    case 'tracking-type-finalize':
      return 'Free Exercise DB final tracking-type mapping generated successfully.';
  }
}

void bootstrap();
