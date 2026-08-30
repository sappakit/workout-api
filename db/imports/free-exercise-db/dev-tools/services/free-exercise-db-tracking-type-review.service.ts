import { Injectable, Logger } from '@nestjs/common';
import { loadFreeExerciseDbDataset } from '../../utils/load-dataset.util';
import {
  extractTrackingTypeInputs,
  extractTrackingTypeReviewIds,
  extractTrackingTypeReviewInputs,
  loadTrackingTypeInitialResult,
  loadTrackingTypeReviewResult,
  mergeTrackingTypeRecords,
  writeTrackingTypeFinalReport,
  writeTrackingTypeInputReport,
  writeTrackingTypeReviewInputReport,
} from '../utils/tracking-type-review.util';

@Injectable()
export class FreeExerciseDbTrackingTypeReviewService {
  private readonly logger = new Logger(
    FreeExerciseDbTrackingTypeReviewService.name,
  );

  // Generate the initial tracking-type classification input.
  async writeTrackingTypeInputFile({
    filePath,
    outputPath,
  }: {
    filePath?: string;
    outputPath?: string;
  } = {}): Promise<string> {
    this.logger.log(
      'Loading Free Exercise DB dataset for tracking-type extraction',
    );

    const exercises = await loadFreeExerciseDbDataset(filePath);
    const inputs = extractTrackingTypeInputs(exercises);

    this.logger.log(
      `Extracted tracking-type classification data for ${inputs.length} exercises`,
    );

    const savedPath = await writeTrackingTypeInputReport(inputs, outputPath);

    this.logger.log(`Tracking-type initial input written to: ${savedPath}`);

    return savedPath;
  }

  // Generate richer source data for exercises requiring detailed review.
  async writeTrackingTypeReviewInputFile({
    filePath,
    initialResultPath,
    outputPath,
  }: {
    filePath?: string;
    initialResultPath?: string;
    outputPath?: string;
  } = {}): Promise<string> {
    this.logger.log('Loading tracking-type initial result');

    const initialRecords =
      await loadTrackingTypeInitialResult(initialResultPath);

    const reviewIds = extractTrackingTypeReviewIds(initialRecords);

    this.logger.log(
      `Found ${reviewIds.length} exercises requiring tracking-type review`,
    );

    this.logger.log('Loading Free Exercise DB dataset for detailed review');

    const exercises = await loadFreeExerciseDbDataset(filePath);

    const reviewInputs = extractTrackingTypeReviewInputs(exercises, reviewIds);

    const savedPath = await writeTrackingTypeReviewInputReport(
      reviewInputs,
      outputPath,
    );

    this.logger.log(`Tracking-type review input written to: ${savedPath}`);

    return savedPath;
  }

  // Merge the initial and review results into the canonical mapping.
  async writeTrackingTypeFinalFile({
    initialResultPath,
    reviewResultPath,
    outputPath,
  }: {
    initialResultPath?: string;
    reviewResultPath?: string;
    outputPath?: string;
  } = {}): Promise<string> {
    this.logger.log('Loading tracking-type classification results');

    const [initialRecords, reviewRecords] = await Promise.all([
      loadTrackingTypeInitialResult(initialResultPath),
      loadTrackingTypeReviewResult(reviewResultPath),
    ]);

    const finalRecords = mergeTrackingTypeRecords(
      initialRecords,
      reviewRecords,
    );

    const savedPath = await writeTrackingTypeFinalReport(
      finalRecords,
      outputPath,
    );

    this.logger.log(`Merged ${finalRecords.length} tracking-type records`);

    this.logger.log(`Final tracking-type mapping written to: ${savedPath}`);

    return savedPath;
  }
}
