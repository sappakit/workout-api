import { writeJsonReport } from 'db/utils/reports/write-json-report.util';

const DEFAULT_WORKOUT_SEED_REPORT_PATH =
  'db/seeds/reports/workout-seed-validation.json';

export type WorkoutSeedValidationReport = {
  generatedAt: string;

  valid: boolean;

  summary: {
    totalWorkouts: number;
    missingFocusTypes: number;
    missingExercises: number;
  };

  missingFocusTypes: string[];
  missingExercises: string[];
};

// Build and write the workout seed validation report.
export async function writeWorkoutSeedValidationReport(
  report: WorkoutSeedValidationReport,
): Promise<string> {
  return writeJsonReport(report, DEFAULT_WORKOUT_SEED_REPORT_PATH);
}
