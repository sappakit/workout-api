import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Equipment,
  ExerciseCategory,
  ExerciseSource,
  Muscle,
} from 'db/entities/workout';
import { Repository } from 'typeorm';
import { mapFreeExerciseDbImages } from './mappers/exercise-image.mapper';
import { mapFreeExerciseDbExercise } from './mappers/exercise.mapper';
import { FreeExerciseDbPersistenceService } from './services/free-exercise-db-persistence.service';
import {
  FreeExerciseDbImportOptions,
  FreeExerciseDbReferences,
} from './types/free-exercise-db.types';
import { ExerciseMetadataImportRecord } from './types/import-result.types';
import { inspectExerciseImages } from './utils/inspect-images.util';
import {
  analyzeFreeExerciseDbDataset,
  buildInspectionReport,
  writeImportReport,
} from './utils/inspection-report.util';
import { loadFreeExerciseDbDataset } from './utils/load-dataset.util';
import {
  getRequiredCategoryCodes,
  getRequiredEquipmentCodes,
  getRequiredMuscleCodes,
  validateMappedValues,
  validateNoDuplicateSourceIds,
  validateRequiredCodesExist,
} from './utils/validate-import.util';

const FREE_EXERCISE_DB_SOURCE_KEY = 'free-exercise-db';
const IMPORT_COMMAND = 'pnpm run import:exercises:run';

@Injectable()
export class FreeExerciseDbImporterService {
  private readonly logger = new Logger(FreeExerciseDbImporterService.name);

  constructor(
    private readonly persistenceService: FreeExerciseDbPersistenceService,

    @InjectRepository(ExerciseCategory)
    private readonly exerciseCategoryRepo: Repository<ExerciseCategory>,

    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,

    @InjectRepository(Muscle)
    private readonly muscleRepo: Repository<Muscle>,

    @InjectRepository(ExerciseSource)
    private readonly exerciseSourceRepo: Repository<ExerciseSource>,
  ) {}

  async run(options: FreeExerciseDbImportOptions = {}): Promise<void> {
    const { filePath, reportPath, dryRun = true } = options;

    // Load the raw Free Exercise DB dataset.
    this.logger.log('Loading Free Exercise DB dataset');

    const sourceExercises = await loadFreeExerciseDbDataset(filePath);

    // Analyze general dataset values and statistics.
    const analysis = analyzeFreeExerciseDbDataset(sourceExercises);

    // Map source image paths and verify that the local files exist.
    const imageRecords = sourceExercises.map((exercise) =>
      mapFreeExerciseDbImages(exercise),
    );

    const imageInspection = await inspectExerciseImages(imageRecords);

    this.logger.log(
      `Inspected ${imageInspection.totalImages} image files for ${imageInspection.totalExercises} exercises`,
    );

    // Convert source records into the app's metadata import format.
    const mappedExercises = sourceExercises.map(mapFreeExerciseDbExercise);

    // Build and save the full dataset inspection report.
    const report = buildInspectionReport(
      mappedExercises,
      analysis,
      imageInspection,
    );

    const savedReportPath = await writeImportReport(report, reportPath);

    this.logger.log(`Dataset inspection report written to: ${savedReportPath}`);

    // Ensure source IDs can safely identify imported exercises.
    validateNoDuplicateSourceIds(analysis.duplicateIds);

    // Ensure all source values have supported app mappings.
    validateMappedValues(mappedExercises);

    // Stop when one or more referenced source image files cannot be found.
    if (imageInspection.missingFiles.length > 0) {
      throw new Error(
        `${imageInspection.missingFiles.length} source image files are missing.`,
      );
    }

    // Load the seeded database records needed by the importer.
    const references = await this.loadReferences();

    // Ensure every mapped reference code exists in the database.
    this.validateDatabaseReferences(mappedExercises, references);

    this.logDatabaseValidationResults(references);

    // Stop after inspection and validation during a dry run.
    if (dryRun) {
      this.logInspectionSuccess();
      return;
    }

    this.logImportWarning();

    // Insert or update exercise metadata and rebuild related links.
    //
    // Image records are not persisted yet. This step only verifies that
    // their source files exist and can be used by the future upload flow.
    const result = await this.persistenceService.persist({
      records: mappedExercises,
      references,
    });

    this.logger.log(
      `Imported ${result.exerciseCount} Free Exercise DB exercises`,
    );

    this.logger.log(
      `Inserted ${result.equipmentLinkCount} exercise-equipment links`,
    );

    this.logger.log(`Inserted ${result.muscleLinkCount} exercise-muscle links`);
  }

  // Load all seeded reference records required by the importer.
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

  // Load the source row used to identify Free Exercise DB exercises.
  private async loadExerciseSource(): Promise<ExerciseSource> {
    const source = await this.exerciseSourceRepo.findOne({
      where: { key: FREE_EXERCISE_DB_SOURCE_KEY },
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

  // Ensure every mapped category, equipment, and muscle exists in the database.
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

  // Log how many database reference records were validated.
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

  // Tell where to review the completed inspection.
  private logInspectionSuccess(): void {
    this.logger.log('Inspection completed. No database rows were modified.');

    this.logger.warn(`To run the real import, execute: ${IMPORT_COMMAND}`);

    this.logger.warn(
      [
        'The real import updates existing Free Exercise DB exercises to match',
        'the source dataset and may overwrite local edits.',
      ].join(' '),
    );
  }

  // Warn immediately before performing database writes.
  private logImportWarning(): void {
    this.logger.warn(
      [
        'Starting the real Free Exercise DB import.',
        'Existing imported exercise data may be overwritten by source values.',
      ].join(' '),
    );
  }
}
