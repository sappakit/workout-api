export const FREE_EXERCISE_DB_DEV_TOOL_TASKS = [
  'tracking-type-initial-input',
  'tracking-type-review-input',
  'tracking-type-finalize',
] as const;

export type FreeExerciseDbDevToolTask =
  (typeof FREE_EXERCISE_DB_DEV_TOOL_TASKS)[number];
