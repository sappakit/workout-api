import { Injectable, Logger } from '@nestjs/common';
import pLimit from 'p-limit';
import {
  CLOUDINARY_FOLDERS,
  CLOUDINARY_TRANSFORMATIONS,
} from 'src/cloudinary/cloudinary.constants';
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

const DEFAULT_UPLOAD_CONCURRENCY = 5;
const PROGRESS_LOG_INTERVAL = 50;
const TEST_UPLOAD_LIMIT = 10;

@Injectable()
export class FreeExerciseDbImageUploadService {
  private readonly logger = new Logger(FreeExerciseDbImageUploadService.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadAll(
    records: ExerciseImageImportRecord[],
    concurrency = DEFAULT_UPLOAD_CONCURRENCY,
  ): Promise<ExerciseImageUploadResult> {
    this.validateConcurrency(concurrency);

    // const tasks = this.buildUploadTasks(records);
    const tasks = this.buildUploadTasks(records).slice(0, TEST_UPLOAD_LIMIT);

    const result: ExerciseImageUploadResult = {
      totalImages: tasks.length,
      uploadedImages: [],
      failedUploads: [],
    };

    if (tasks.length === 0) {
      this.logger.warn('No exercise images were available for upload.');
      return result;
    }

    const limit = pLimit(concurrency);

    let processedCount = 0;

    this.logger.log(
      `Starting upload of ${tasks.length} exercise images with concurrency ${concurrency}`,
    );

    const settledResults = await Promise.allSettled(
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

    this.logger.log(
      [
        'Exercise image upload finished.',
        `Successful: ${result.uploadedImages.length}.`,
        `Failed: ${result.failedUploads.length}.`,
      ].join(' '),
    );

    return result;
  }

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
        transformation: CLOUDINARY_TRANSFORMATIONS.EXERCISE_IMAGE,
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

  private buildPublicId(
    sourceExternalId: string,
    displayOrder: number,
  ): string {
    return `${sourceExternalId}/${displayOrder}`;
  }

  private buildDisplayName(
    sourceExternalId: string,
    displayOrder: number,
  ): string {
    return `${sourceExternalId}-${displayOrder}`;
  }

  private validateConcurrency(concurrency: number): void {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new Error('Image upload concurrency must be at least 1.');
    }
  }

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
