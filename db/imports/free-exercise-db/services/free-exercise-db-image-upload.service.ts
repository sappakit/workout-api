import { Injectable, Logger } from '@nestjs/common';
import pLimit from 'p-limit';
import { CLOUDINARY_FOLDERS } from 'src/cloudinary/cloudinary.constants';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import {
  ExerciseImageImportItem,
  ExerciseImageImportRecord,
  ExerciseImageUploadResult,
  UploadedExerciseImage,
} from '../types/import-result.types';

type ImageUploadTask = {
  sourceExternalId: string;
  image: ExerciseImageImportItem;
};

const CLOUDINARY_UPLOAD_CONCURRENCY = 10;
const PROGRESS_LOG_INTERVAL = 50;

@Injectable()
export class FreeExerciseDbImageUploadService {
  private readonly logger = new Logger(FreeExerciseDbImageUploadService.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  // Upload all exercise images with limited parallel requests.
  async uploadAll(
    records: ExerciseImageImportRecord[],
    concurrency = CLOUDINARY_UPLOAD_CONCURRENCY,
  ): Promise<ExerciseImageUploadResult> {
    this.validateConcurrency(concurrency);

    const tasks = this.buildUploadTasks(records);
    const result = this.createEmptyResult(tasks.length);

    if (tasks.length === 0) {
      this.logger.warn('No exercise images were available for upload.');
      return result;
    }

    this.logger.log(
      `Starting upload of ${tasks.length} exercise images with concurrency ${concurrency}`,
    );

    const settledResults = await this.executeUploadTasks(tasks, concurrency);

    this.collectUploadResults(tasks, settledResults, result);

    this.logger.log(
      [
        'Exercise image upload finished.',
        `Successful: ${result.uploadedImages.length}.`,
        `Failed: ${result.failedUploads.length}.`,
      ].join(' '),
    );

    return result;
  }

  // Convert grouped exercise image records into individual upload tasks.
  private buildUploadTasks(
    records: ExerciseImageImportRecord[],
  ): ImageUploadTask[] {
    return records.flatMap((record) =>
      record.images.map((image) => ({
        sourceExternalId: record.sourceExternalId,
        image,
      })),
    );
  }

  // Create the initial result object for an upload run.
  private createEmptyResult(totalImages: number): ExerciseImageUploadResult {
    return {
      totalImages,
      uploadedImages: [],
      failedUploads: [],
    };
  }

  // Execute upload tasks while limiting the number of concurrent requests.
  private async executeUploadTasks(
    tasks: ImageUploadTask[],
    concurrency: number,
  ): Promise<PromiseSettledResult<UploadedExerciseImage>[]> {
    const limit = pLimit(concurrency);

    let processedCount = 0;

    return Promise.allSettled(
      tasks.map((task) =>
        limit(async () => {
          try {
            return await this.uploadOne(task);
          } finally {
            processedCount += 1;
            this.logProgress(processedCount, tasks.length);
          }
        }),
      ),
    );
  }

  // Separate successful uploads from failed upload attempts.
  private collectUploadResults(
    tasks: ImageUploadTask[],
    settledResults: PromiseSettledResult<UploadedExerciseImage>[],
    result: ExerciseImageUploadResult,
  ): void {
    for (let index = 0; index < settledResults.length; index++) {
      const settledResult = settledResults[index];
      const task = tasks[index];

      if (settledResult.status === 'fulfilled') {
        result.uploadedImages.push(settledResult.value);
        continue;
      }

      result.failedUploads.push({
        sourceExternalId: task.sourceExternalId,
        sourcePath: task.image.sourcePath,
        displayOrder: task.image.displayOrder,
        error: this.getErrorMessage(settledResult.reason),
      });
    }
  }

  // Upload one local exercise image to its deterministic Cloudinary location.
  private async uploadOne(
    task: ImageUploadTask,
  ): Promise<UploadedExerciseImage> {
    const publicId = this.buildPublicId(
      task.sourceExternalId,
      task.image.displayOrder,
    );

    const displayName = this.buildDisplayName(
      task.sourceExternalId,
      task.image.displayOrder,
    );

    const uploadedImage = await this.cloudinaryService.uploadLocalImage(
      task.image.absolutePath,
      {
        folder: CLOUDINARY_FOLDERS.FREE_EXERCISE_DB_IMAGES,
        publicId,
        displayName,
        overwrite: true,
      },
    );

    return {
      sourceExternalId: task.sourceExternalId,
      sourcePath: task.image.sourcePath,
      displayOrder: task.image.displayOrder,
      isPrimary: task.image.isPrimary,
      url: uploadedImage.secure_url,
      publicId: uploadedImage.public_id,
    };
  }

  // Build a stable Cloudinary public ID for an imported exercise image.
  private buildPublicId(
    sourceExternalId: string,
    displayOrder: number,
  ): string {
    return `${sourceExternalId}/${displayOrder}`;
  }

  // Build a readable display name for an imported exercise image.
  private buildDisplayName(
    sourceExternalId: string,
    displayOrder: number,
  ): string {
    return `${sourceExternalId}-${displayOrder}`;
  }

  // Ensure the requested concurrency is a positive integer.
  private validateConcurrency(concurrency: number): void {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new Error('Image upload concurrency must be a positive integer.');
    }
  }

  // Log upload progress at fixed intervals and after the final image.
  private logProgress(processedCount: number, totalImages: number): void {
    const shouldLog =
      processedCount % PROGRESS_LOG_INTERVAL === 0 ||
      processedCount === totalImages;

    if (!shouldLog) {
      return;
    }

    this.logger.log(
      `Processed ${processedCount}/${totalImages} exercise images`,
    );
  }

  // Convert an unknown rejected value into a readable error message.
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}
