import { Injectable, Logger } from '@nestjs/common';
import { ExerciseSource } from 'db/entities/workout/exercise/exercise-source.entity';
import { FreeExerciseDbImageUploadService } from './services/free-exercise-db-image-upload.service';
import { FreeExerciseDbMediaPersistenceService } from './services/free-exercise-db-media-persistence.service';
import { FreeExerciseDbPersistenceService } from './services/free-exercise-db-persistence.service';
import { FreeExerciseDbPreparationService } from './services/free-exercise-db-preparation.service';
import { FreeExerciseDbTrackingTypePersistenceService } from './services/free-exercise-db-tracking-type-persistence.service';
import {
  FreeExerciseDbImportOptions,
  FreeExerciseDbImportTask,
} from './types/free-exercise-db.types';
import { ExerciseImageImportRecord } from './types/import-result.types';
import { writeImageUploadErrorReport } from './utils/reports/upload-error-report.util';

@Injectable()
export class FreeExerciseDbImporterService {
  private readonly logger = new Logger(FreeExerciseDbImporterService.name);

  constructor(
    private readonly preparationService: FreeExerciseDbPreparationService,
    private readonly persistenceService: FreeExerciseDbPersistenceService,
    private readonly imageUploadService: FreeExerciseDbImageUploadService,
    private readonly mediaPersistenceService: FreeExerciseDbMediaPersistenceService,
    private readonly trackingTypePersistenceService: FreeExerciseDbTrackingTypePersistenceService,
  ) {}

  // Run the selected Free Exercise DB import task.
  async run(
    task: FreeExerciseDbImportTask,
    options: FreeExerciseDbImportOptions = {},
  ): Promise<void> {
    this.logger.log(`Running Free Exercise DB task: ${task}`);

    switch (task) {
      case 'inspect':
        await this.inspect(options);
        return;

      case 'metadata':
        await this.importMetadata(options);
        return;

      case 'tracking-types':
        await this.importTrackingTypes(options);
        return;

      case 'images':
        await this.importImages(options);
        return;

      default:
        throw new Error(
          `Unsupported Free Exercise DB import task: ${String(task)}`,
        );
    }
  }

  // Inspect and validate the dataset without modifying external data.
  private async inspect(options: FreeExerciseDbImportOptions): Promise<void> {
    const result = await this.preparationService.prepareInspection(options);

    this.logger.log(
      [
        'Inspection completed successfully.',
        `Validated ${result.exerciseCount} exercises.`,
        `Validated ${result.imageCount} image files.`,
        'No database rows or Cloudinary assets were modified.',
      ].join(' '),
    );

    this.logger.warn(
      'Next step — import metadata: pnpm run import:exercises -- metadata',
    );

    this.logger.warn(
      [
        'After metadata is imported — import tracking types:',
        'pnpm run import:exercises -- tracking-types',
      ].join(' '),
    );

    this.logger.warn(
      [
        'After tracking types are imported — import images:',
        'pnpm run import:exercises -- images',
      ].join(' '),
    );
  }

  // Validate and persist exercise metadata and relationships.
  private async importMetadata(
    options: FreeExerciseDbImportOptions,
  ): Promise<void> {
    this.logger.warn(
      [
        'Starting the Free Exercise DB metadata import.',
        'Existing imported exercise values may be overwritten.',
      ].join(' '),
    );

    const prepared = await this.preparationService.prepareMetadata(options);

    const result = await this.persistenceService.persist({
      records: prepared.records,
      references: prepared.references,
    });

    this.logger.log(
      `Imported ${result.exerciseCount} Free Exercise DB exercises`,
    );

    this.logger.log(
      `Inserted ${result.equipmentLinkCount} exercise-equipment links`,
    );

    this.logger.log(`Inserted ${result.muscleLinkCount} exercise-muscle links`);

    this.logger.log('Free Exercise DB metadata import completed.');
  }

  // Validate and assign tracking types to imported exercises.
  private async importTrackingTypes(
    options: FreeExerciseDbImportOptions,
  ): Promise<void> {
    this.logger.warn(
      [
        'Starting the Free Exercise DB tracking-type import.',
        'Existing exercise tracking types may be overwritten.',
      ].join(' '),
    );

    const prepared =
      await this.preparationService.prepareTrackingTypes(options);

    const result = await this.trackingTypePersistenceService.persist({
      records: prepared.records,
      references: prepared.references,
    });

    this.logger.log(
      `Updated tracking types for ${result.exerciseCount} Free Exercise DB exercises`,
    );

    this.logger.log('Free Exercise DB tracking-type import completed.');
  }

  // Validate, upload, and persist exercise image records.
  private async importImages(
    options: FreeExerciseDbImportOptions,
  ): Promise<void> {
    this.logger.warn(
      [
        'Starting the Free Exercise DB image import.',
        'Images will be uploaded to Cloudinary and upserted into exercise_media.',
      ].join(' '),
    );

    const prepared = await this.preparationService.prepareImages(options);

    await this.uploadAndPersistImages(prepared.imageRecords, prepared.source);
  }

  // Upload local images and upsert their exercise_media rows.
  private async uploadAndPersistImages(
    imageRecords: ExerciseImageImportRecord[],
    source: ExerciseSource,
  ): Promise<void> {
    const uploadResult = await this.imageUploadService.uploadAll(imageRecords);

    this.logger.log(
      `Uploaded ${uploadResult.uploadedImages.length}/${uploadResult.totalImages} exercise images`,
    );

    if (uploadResult.failedUploads.length > 0) {
      const errorReportPath = await writeImageUploadErrorReport(uploadResult);

      this.logger.error(
        [
          `${uploadResult.failedUploads.length} exercise image uploads failed.`,
          `Full error report written to: ${errorReportPath}`,
        ].join(' '),
      );

      throw new Error(
        [
          `${uploadResult.failedUploads.length} exercise image uploads failed.`,
          'No exercise_media rows were modified.',
          `Review the error report: ${errorReportPath}`,
        ].join(' '),
      );
    }

    const mediaResult = await this.mediaPersistenceService.persist({
      source,
      uploadedImages: uploadResult.uploadedImages,
    });

    this.logger.log(`Upserted ${mediaResult.mediaCount} exercise_media rows`);

    this.logger.log(
      'Free Exercise DB image upload and database persistence completed.',
    );
  }
}
