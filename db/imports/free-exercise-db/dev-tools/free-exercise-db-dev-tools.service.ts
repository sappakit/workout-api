import { Injectable, Logger } from '@nestjs/common';
import { FreeExerciseDbMediaMigrationService } from './services/free-exercise-db-media-migration.service';
import { FreeExerciseDbTrackingTypeReviewService } from './services/free-exercise-db-tracking-type-review.service';
import { FreeExerciseDbDevToolTask } from './types/free-exercise-db-dev-tools.types';

@Injectable()
export class FreeExerciseDbDevToolsService {
  private readonly logger = new Logger(FreeExerciseDbDevToolsService.name);

  constructor(
    private readonly trackingTypeReviewService: FreeExerciseDbTrackingTypeReviewService,
    private readonly mediaMigrationService: FreeExerciseDbMediaMigrationService,
  ) {}

  // Run the selected Free Exercise DB development tool.
  async run(task: FreeExerciseDbDevToolTask): Promise<void> {
    this.logger.log(`Running Free Exercise DB dev tool: ${task}`);

    switch (task) {
      case 'tracking-type-initial-input':
        await this.generateTrackingTypeInput();
        return;

      case 'tracking-type-review-input':
        await this.generateTrackingTypeReviewInput();
        return;

      case 'tracking-type-finalize':
        await this.generateTrackingTypeFinal();
        return;

      case 'media-export':
        await this.exportMedia();
        return;

      case 'media-import-prepare':
        await this.prepareMediaImport();
        return;

      case 'media-import-run':
        await this.importMedia();
        return;

      default:
        throw new Error(
          `Unsupported Free Exercise DB dev tool task: ${String(task)}`,
        );
    }
  }

  // Generate the initial tracking-type classification input.
  private async generateTrackingTypeInput(): Promise<void> {
    const outputPath =
      await this.trackingTypeReviewService.writeTrackingTypeInputFile();

    this.logger.log(
      `Free Exercise DB tracking-type input generated: ${outputPath}`,
    );
  }

  // Generate detailed input for exercises requiring a second review.
  private async generateTrackingTypeReviewInput(): Promise<void> {
    const outputPath =
      await this.trackingTypeReviewService.writeTrackingTypeReviewInputFile();

    this.logger.log(
      `Free Exercise DB tracking-type review input generated: ${outputPath}`,
    );
  }

  // Merge review results into the canonical tracking-type mapping.
  private async generateTrackingTypeFinal(): Promise<void> {
    const outputPath =
      await this.trackingTypeReviewService.writeTrackingTypeFinalFile();

    this.logger.log(
      `Free Exercise DB final tracking-type mapping generated: ${outputPath}`,
    );
  }

  // Export exercise media into a portable JSON manifest.
  private async exportMedia(): Promise<void> {
    const outputPath = await this.mediaMigrationService.exportMediaManifest();

    this.logger.log(`Free Exercise DB media manifest generated: ${outputPath}`);
  }

  // Validate and prepare exercise media records without writing them.
  private async prepareMediaImport(): Promise<void> {
    const mediaRows = await this.mediaMigrationService.prepareMediaImport();

    this.logger.log(
      `Prepared ${mediaRows.length} exercise media rows successfully`,
    );

    this.logger.log('Inspection only. No exercise_media rows were modified.');
  }

  // Validate and upsert exercise media records from the portable manifest.
  private async importMedia(): Promise<void> {
    this.logger.warn(
      [
        'Starting the Free Exercise DB media migration import.',
        'Exercise media rows will be upserted and existing values may be overwritten.',
        'The "media-import-prepare" task should be run successfully before this task.',
      ].join(' '),
    );

    const mediaCount = await this.mediaMigrationService.importMedia();

    this.logger.log(`Upserted ${mediaCount} exercise_media rows`);
  }
}
