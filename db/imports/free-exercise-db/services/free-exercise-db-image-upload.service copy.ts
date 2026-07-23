import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class FreeExerciseDbImageUploadService {
  private readonly logger = new Logger(FreeExerciseDbImageUploadService.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadAll(
    records: ExerciseImageImportRecord[],
    concurrency = DEFAULT_UPLOAD_CONCURRENCY,
  ): Promise<ExerciseImageUploadResult> {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new Error('Image upload concurrency must be at least 1.');
    }

    // const tasks = this.buildUploadTasks(records);
    const tasks = this.buildUploadTasks(records).slice(0, 10);

    const result: ExerciseImageUploadResult = {
      totalImages: tasks.length,
      uploadedImages: [],
      failedUploads: [],
    };

    this.logger.log(
      `Starting upload of ${tasks.length} exercise images with concurrency ${concurrency}`,
    );

    for (let index = 0; index < tasks.length; index += concurrency) {
      const batch = tasks.slice(index, index + concurrency);

      const batchResults = await Promise.allSettled(
        batch.map((task) => this.uploadOne(task)),
      );

      for (let batchIndex = 0; batchIndex < batchResults.length; batchIndex++) {
        const uploadResult = batchResults[batchIndex];
        const task = batch[batchIndex];

        if (uploadResult.status === 'fulfilled') {
          result.uploadedImages.push(uploadResult.value);
          continue;
        }

        result.failedUploads.push({
          sourceExternalId: task.sourceExternalId,
          sourcePath: task.image.sourcePath,
          displayOrder: task.image.displayOrder,
          error: this.getErrorMessage(uploadResult.reason),
        });
      }

      const processedCount = Math.min(index + batch.length, tasks.length);

      this.logger.log(
        `Processed ${processedCount}/${tasks.length} exercise images`,
      );
    }

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

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
