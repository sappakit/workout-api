import {
  FREE_EXERCISE_DB_DEV_TOOL_TASKS,
  FreeExerciseDbDevToolTask,
} from '../types/free-exercise-db-dev-tools.types';

export function getDevToolTask(
  args: string[] = process.argv,
): FreeExerciseDbDevToolTask {
  const toolArgs = args.slice(2).filter((arg) => arg !== '--');

  const task = toolArgs[0] ?? 'tracking-types';

  if (
    !FREE_EXERCISE_DB_DEV_TOOL_TASKS.some((validTask) => validTask === task)
  ) {
    throw new Error(
      [
        `Invalid Free Exercise DB dev tool task "${task}".`,
        `Valid tasks: ${FREE_EXERCISE_DB_DEV_TOOL_TASKS.join(', ')}.`,
      ].join(' '),
    );
  }

  return task as FreeExerciseDbDevToolTask;
}
