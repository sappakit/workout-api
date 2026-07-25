import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Equipment,
  ExerciseCategory,
  ExerciseSource,
  Muscle,
} from 'db/entities/workout';
import { Repository } from 'typeorm';
import { mapFreeExerciseDbImages } from '../mappers/exercise-image.mapper';
import { mapFreeExerciseDbExercise } from '../mappers/exercise.mapper';
import {
  FreeExerciseDbImportOptions,
  FreeExerciseDbReferences,
} from '../types/free-exercise-db.types';
import {
  ExerciseImageImportRecord,
  ExerciseMetadataImportRecord,
} from '../types/import-result.types';
import { inspectExerciseImages } from '../utils/inspect-images.util';
import { loadFreeExerciseDbDataset } from '../utils/load-dataset.util';
import {
  analyzeFreeExerciseDbDataset,
  buildInspectionReport,
  writeImportReport,
} from '../utils/reports/inspection-report.util';
import {
  getRequiredCategoryCodes,
  getRequiredEquipmentCodes,
  getRequiredMuscleCodes,
  validateMappedValues,
  validateNoDuplicateSourceIds,
  validateRequiredCodesExist,
} from '../utils/validate-import.util';

const FREE_EXERCISE_DB_SOURCE_KEY = 'free-exercise-db';

export type FreeExerciseDbInspectionResult = {
  exerciseCount: number;
  imageCount: number;
  reportPath: string;
};

export type FreeExerciseDbMetadataPreparationResult = {
  records: ExerciseMetadataImportRecord[];
  references: FreeExerciseDbReferences;
};

export type FreeExerciseDbImagePreparationResult = {
  imageRecords: ExerciseImageImportRecord[];
  source: ExerciseSource;
};

@Injectable()
export class FreeExerciseDbPreparationService {
  private readonly logger = new Logger(FreeExerciseDbPreparationService.name);

  constructor(
    @InjectRepository(ExerciseCategory)
    private readonly exerciseCategoryRepo: Repository<ExerciseCategory>,

    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,

    @InjectRepository(Muscle)
    private readonly muscleRepo: Repository<Muscle>,

    @InjectRepository(ExerciseSource)
    private readonly exerciseSourceRepo: Repository<ExerciseSource>,
  ) {}

  // Load and validate the complete dataset and write its inspection report.
  async prepareInspection(
    options: FreeExerciseDbImportOptions,
  ): Promise<FreeExerciseDbInspectionResult> {
    const { filePath, reportPath } = options;

    const sourceExercises = await this.loadDataset(filePath);
    const analysis = analyzeFreeExerciseDbDataset(sourceExercises);

    const mappedExercises = sourceExercises.map(mapFreeExerciseDbExercise);

    const imageRecords = sourceExercises.map((exercise) =>
      mapFreeExerciseDbImages(exercise),
    );

    const imageInspection = await inspectExerciseImages(imageRecords);

    this.logger.log(
      `Inspected ${imageInspection.totalImages} image files for ${imageInspection.totalExercises} exercises`,
    );

    const report = buildInspectionReport(
      mappedExercises,
      analysis,
      imageInspection,
    );

    const savedReportPath = await writeImportReport(report, reportPath);

    this.logger.log(`Dataset inspection report written to: ${savedReportPath}`);

    validateNoDuplicateSourceIds(analysis.duplicateIds);
    validateMappedValues(mappedExercises);

    this.validateImageInspection(
      imageInspection.missingFiles.length,
      savedReportPath,
    );

    const references = await this.loadReferences();

    this.validateDatabaseReferences(mappedExercises, references);
    this.logDatabaseValidationResults(references);

    return {
      exerciseCount: mappedExercises.length,
      imageCount: imageInspection.totalImages,
      reportPath: savedReportPath,
    };
  }

  // Load and validate exercise metadata before database persistence.
  async prepareMetadata(
    options: FreeExerciseDbImportOptions,
  ): Promise<FreeExerciseDbMetadataPreparationResult> {
    const sourceExercises = await this.loadDataset(options.filePath);
    const analysis = analyzeFreeExerciseDbDataset(sourceExercises);

    const records = sourceExercises.map(mapFreeExerciseDbExercise);

    validateNoDuplicateSourceIds(analysis.duplicateIds);
    validateMappedValues(records);

    const references = await this.loadReferences();

    this.validateDatabaseReferences(records, references);
    this.logDatabaseValidationResults(references);

    return {
      records,
      references,
    };
  }

  // Load and validate image records before uploading them.
  async prepareImages(
    options: FreeExerciseDbImportOptions,
  ): Promise<FreeExerciseDbImagePreparationResult> {
    const sourceExercises = await this.loadDataset(options.filePath);
    const analysis = analyzeFreeExerciseDbDataset(sourceExercises);

    validateNoDuplicateSourceIds(analysis.duplicateIds);

    const imageRecords = sourceExercises.map((exercise) =>
      mapFreeExerciseDbImages(exercise),
    );

    const imageInspection = await inspectExerciseImages(imageRecords);

    this.logger.log(
      `Inspected ${imageInspection.totalImages} image files for ${imageInspection.totalExercises} exercises`,
    );

    this.validateImageInspection(imageInspection.missingFiles.length);

    const source = await this.loadExerciseSource();

    return {
      imageRecords,
      source,
    };
  }

  // Load the raw Free Exercise DB dataset from disk.
  private async loadDataset(filePath?: string) {
    this.logger.log('Loading Free Exercise DB dataset');

    return loadFreeExerciseDbDataset(filePath);
  }

  // Throw when one or more expected local image files are missing.
  private validateImageInspection(
    missingFileCount: number,
    reportPath?: string,
  ): void {
    if (missingFileCount === 0) {
      return;
    }

    throw new Error(
      [
        `${missingFileCount} source image files are missing.`,
        reportPath ? `Review the inspection report: ${reportPath}` : '',
        'Run the inspection task for a complete report.',
      ]
        .filter(Boolean)
        .join(' '),
    );
  }

  // Load all seeded references required by the metadata importer.
  private async loadReferences(): Promise<FreeExerciseDbReferences> {
    const [source, categories, equipmentItems, muscles] = await Promise.all([
      this.loadExerciseSource(),
      this.exerciseCategoryRepo.find(),
      this.equipmentRepo.find(),
      this.muscleRepo.find(),
    ]);

    return {
      source,

      categoriesByCode: new Map(
        categories.map((category) => [category.code, category]),
      ),

      equipmentByCode: new Map(
        equipmentItems.map((equipment) => [equipment.code, equipment]),
      ),

      musclesByCode: new Map(muscles.map((muscle) => [muscle.code, muscle])),
    };
  }

  // Load the source row representing Free Exercise DB.
  private async loadExerciseSource(): Promise<ExerciseSource> {
    const source = await this.exerciseSourceRepo.findOne({
      where: {
        key: FREE_EXERCISE_DB_SOURCE_KEY,
      },
    });

    if (!source) {
      throw new Error(
        [
          `Exercise source "${FREE_EXERCISE_DB_SOURCE_KEY}" is missing.`,
          'Run the exercise-source seed before running the importer.',
        ].join(' '),
      );
    }

    return source;
  }

  // Ensure every mapped category, equipment, and muscle code exists.
  private validateDatabaseReferences(
    mappedExercises: ExerciseMetadataImportRecord[],
    references: FreeExerciseDbReferences,
  ): void {
    validateRequiredCodesExist(
      'exercise categories',
      getRequiredCategoryCodes(mappedExercises),
      references.categoriesByCode,
      'exercise-category',
    );

    validateRequiredCodesExist(
      'equipment records',
      getRequiredEquipmentCodes(mappedExercises),
      references.equipmentByCode,
      'equipment',
    );

    validateRequiredCodesExist(
      'muscles',
      getRequiredMuscleCodes(mappedExercises),
      references.musclesByCode,
      'muscle',
    );
  }

  // Log the number of database reference records validated.
  private logDatabaseValidationResults(
    references: FreeExerciseDbReferences,
  ): void {
    this.logger.log(
      `Validated ${references.categoriesByCode.size} exercise categories against the database`,
    );

    this.logger.log(
      `Validated ${references.equipmentByCode.size} equipment records against the database`,
    );

    this.logger.log(
      `Validated ${references.musclesByCode.size} muscles against the database`,
    );
  }
}
