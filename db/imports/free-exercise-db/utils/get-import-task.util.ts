import {
  FREE_EXERCISE_DB_IMPORT_TASKS,
  FreeExerciseDbImportTask,
} from '../types/free-exercise-db.types';

export function getImportTask(
  args: string[] = process.argv,
): FreeExerciseDbImportTask {
  const importArgs = args.slice(2).filter((arg) => arg !== '--');

  const task = importArgs[0] ?? 'inspect';

  if (!FREE_EXERCISE_DB_IMPORT_TASKS.some((validTask) => validTask === task)) {
    throw new Error(
      [
        `Invalid exercise import task "${task}".`,
        `Valid tasks: ${FREE_EXERCISE_DB_IMPORT_TASKS.join(', ')}.`,
      ].join(' '),
    );
  }

  return task as FreeExerciseDbImportTask;
}
