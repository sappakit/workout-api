import { Injectable, Logger } from '@nestjs/common';
import { mapFreeExerciseDbExercise } from './mappers/exercise.mapper';
import { DatasetInspectionReport } from './types/import-result.types';
import {
  analyzeFreeExerciseDbDataset,
  countValues,
} from './utils/analyze-dataset.util';
import { loadFreeExerciseDbDataset } from './utils/load-dataset.util';
import { writeImportReport } from './utils/write-import-report.util';

type ImportOptions = {
  filePath?: string;
  reportPath?: string;
  dryRun?: boolean;
};

@Injectable()
export class FreeExerciseDbImporterService {
  private readonly logger = new Logger(FreeExerciseDbImporterService.name);

  async run(options: ImportOptions = {}): Promise<void> {
    const { filePath, reportPath, dryRun = true } = options;

    this.logger.log('Loading Free Exercise DB dataset');

    const sourceExercises = await loadFreeExerciseDbDataset(filePath);

    const analysis = analyzeFreeExerciseDbDataset(sourceExercises);

    const mappedExercises = sourceExercises.map(mapFreeExerciseDbExercise);

    const unmappedLevels = countValues(
      mappedExercises
        .filter((exercise) => exercise.difficultyLevel === null)
        .map((exercise) => exercise.sourceLevel),
    );

    const report: DatasetInspectionReport = {
      generatedAt: new Date().toISOString(),
      analysis,
      unmapped: {
        levels: unmappedLevels,
      },
    };

    if (analysis.duplicateIds.length > 0) {
      throw new Error(
        `Duplicate source exercise IDs found: ${analysis.duplicateIds.join(', ')}`,
      );
    }

    const savedReportPath = await writeImportReport(report, reportPath);

    this.logger.log(`Dataset inspection report written to: ${savedReportPath}`);

    if (dryRun) {
      this.logger.log('Inspection completed. No database rows were inserted.');

      return;
    }

    throw new Error('Database persistence has not been implemented yet.');
  }
}
