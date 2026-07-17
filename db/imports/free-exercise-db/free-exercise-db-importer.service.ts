import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExerciseCategory } from 'db/entities/workout';
import { Repository } from 'typeorm';
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

  constructor(
    @InjectRepository(ExerciseCategory)
    private readonly exerciseCategoryRepo: Repository<ExerciseCategory>,
  ) {}

  async run(options: ImportOptions = {}): Promise<void> {
    const { filePath, reportPath, dryRun = true } = options;

    this.logger.log('Loading Free Exercise DB dataset');

    const sourceExercises = await loadFreeExerciseDbDataset(filePath);

    const analysis = analyzeFreeExerciseDbDataset(sourceExercises);

    const mappedExercises = sourceExercises.map(mapFreeExerciseDbExercise);

    const unmappedCategories = countValues(
      mappedExercises
        .filter((exercise) => exercise.categoryCode === null)
        .map((exercise) => exercise.sourceCategory),
    );

    const unmappedLevels = countValues(
      mappedExercises
        .filter((exercise) => exercise.difficultyLevel === null)
        .map((exercise) => exercise.sourceLevel),
    );

    const report: DatasetInspectionReport = {
      generatedAt: new Date().toISOString(),
      analysis,
      unmapped: {
        categories: unmappedCategories,
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

    this.validateMappedValues(mappedExercises);

    const categoriesByCode = await this.loadCategoriesByCode();

    this.validateCategoriesExist(mappedExercises, categoriesByCode);

    this.logger.log(
      `Validated ${categoriesByCode.size} exercise categories against the database`,
    );

    if (dryRun) {
      this.logger.log('Inspection completed. No database rows were inserted.');

      return;
    }

    throw new Error('Database persistence has not been implemented yet.');
  }

  private validateMappedValues(
    exercises: ReturnType<typeof mapFreeExerciseDbExercise>[],
  ): void {
    const unmappedCategoryValues = [
      ...new Set(
        exercises
          .filter((exercise) => exercise.categoryCode === null)
          .map((exercise) => exercise.sourceCategory),
      ),
    ];

    if (unmappedCategoryValues.length > 0) {
      throw new Error(
        `Unsupported source categories found: ${unmappedCategoryValues.join(', ')}`,
      );
    }

    const unmappedLevelValues = [
      ...new Set(
        exercises
          .filter((exercise) => exercise.difficultyLevel === null)
          .map((exercise) => exercise.sourceLevel),
      ),
    ];

    if (unmappedLevelValues.length > 0) {
      throw new Error(
        `Unsupported source difficulty levels found: ${unmappedLevelValues.join(', ')}`,
      );
    }
  }

  private async loadCategoriesByCode(): Promise<Map<string, ExerciseCategory>> {
    const categories = await this.exerciseCategoryRepo.find();

    return new Map(categories.map((category) => [category.code, category]));
  }

  private validateCategoriesExist(
    exercises: ReturnType<typeof mapFreeExerciseDbExercise>[],
    categoriesByCode: Map<string, ExerciseCategory>,
  ): void {
    const requiredCategoryCodes = new Set(
      exercises
        .map((exercise) => exercise.categoryCode)
        .filter((code): code is string => code !== null),
    );

    const missingCategoryCodes = [...requiredCategoryCodes].filter(
      (code) => !categoriesByCode.has(code),
    );

    if (missingCategoryCodes.length > 0) {
      throw new Error(
        [
          'Mapped exercise categories are missing from the database.',
          `Missing codes: ${missingCategoryCodes.join(', ')}`,
          'Run the exercise-category seed before running the importer.',
        ].join(' '),
      );
    }
  }
}
