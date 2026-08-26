import { writeJsonReport } from 'db/utils/reports/write-json-report.util';
import {
  ExerciseImageUploadErrorReport,
  ExerciseImageUploadResult,
} from '../../types/import-result.types';

const DEFAULT_UPLOAD_ERROR_REPORT_PATH =
  'db/imports/free-exercise-db/reports/image-upload-errors.json';

// Build a report containing every failed exercise image upload.
export function buildImageUploadErrorReport(
  result: ExerciseImageUploadResult,
): ExerciseImageUploadErrorReport {
  return {
    generatedAt: new Date().toLocaleString(),
    totalImages: result.totalImages,
    successfulUploads: result.uploadedImages.length,
    failedUploads: result.failedUploads.length,
    errors: result.failedUploads,
  };
}

// Write every image upload failure to a separate JSON report.
export async function writeImageUploadErrorReport(
  result: ExerciseImageUploadResult,
  filePath?: string,
): Promise<string> {
  const report = buildImageUploadErrorReport(result);

  return writeJsonReport(report, DEFAULT_UPLOAD_ERROR_REPORT_PATH, filePath);
}
