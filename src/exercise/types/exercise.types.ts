type WorkoutSetPerformance = {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  distance: number | null;
  duration: number | null;
};

type ExercisePerformanceSummary = {
  previousSets: WorkoutSetPerformance[];
  bestSets: WorkoutSetPerformance[];
};

export type PerformanceByExerciseId = Record<
  number,
  ExercisePerformanceSummary
>;
