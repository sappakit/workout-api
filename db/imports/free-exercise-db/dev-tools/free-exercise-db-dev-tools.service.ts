import { Injectable, Logger } from '@nestjs/common';
import { FreeExerciseDbTrackingTypeReviewService } from './services/free-exercise-db-tracking-type-review.service';
import { FreeExerciseDbDevToolTask } from './types/free-exercise-db-dev-tools.types';

@Injectable()
export class FreeExerciseDbDevToolsService {
  private readonly logger = new Logger(FreeExerciseDbDevToolsService.name);

  constructor(
    private readonly trackingTypeReviewService: FreeExerciseDbTrackingTypeReviewService,
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
}
