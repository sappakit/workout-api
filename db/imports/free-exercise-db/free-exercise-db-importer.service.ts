import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equipment, ExerciseCategory, Muscle } from 'db/entities/workout';
import { Repository } from 'typeorm';
import { mapFreeExerciseDbExercise } from './mappers/exercise.mapper';
import { analyzeFreeExerciseDbDataset } from './utils/analyze-dataset.util';
import {
  getRequiredCategoryCodes,
  getRequiredEquipmentCodes,
  getRequiredMuscleCodes,
} from './utils/collect-required-codes.util';
import {
  buildInspectionReport,
  writeImportReport,
} from './utils/inspection-report.util';
import { loadFreeExerciseDbDataset } from './utils/load-dataset.util';
import {
  validateMappedValues,
  validateNoDuplicateSourceIds,
  validateRequiredCodesExist,
} from './utils/validate-import.util';

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

    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,

    @InjectRepository(Muscle)
    private readonly muscleRepo: Repository<Muscle>,
  ) {}

  async run(options: ImportOptions = {}): Promise<void> {
    const { filePath, reportPath, dryRun = true } = options;

    // Load and analyze the source dataset.
    this.logger.log('Loading Free Exercise DB dataset');

    const sourceExercises = await loadFreeExerciseDbDataset(filePath);
    const analysis = analyzeFreeExerciseDbDataset(sourceExercises);

    // Convert source records into the app's import format.
    const mappedExercises = sourceExercises.map(mapFreeExerciseDbExercise);

    // Build and save the dataset inspection report.
    const report = buildInspectionReport(mappedExercises, analysis);

    validateNoDuplicateSourceIds(analysis.duplicateIds);

    const savedReportPath = await writeImportReport(report, reportPath);

    this.logger.log(`Dataset inspection report written to: ${savedReportPath}`);

    // Ensure every source value has a supported app mapping.
    validateMappedValues(mappedExercises);

    // Load seeded reference data from the database.
    const [categoriesByCode, equipmentByCode, musclesByCode] =
      await Promise.all([
        this.loadCategoriesByCode(),
        this.loadEquipmentByCode(),
        this.loadMusclesByCode(),
      ]);

    // Ensure every mapped code exists in the database.
    validateRequiredCodesExist(
      'exercise categories',
      getRequiredCategoryCodes(mappedExercises),
      categoriesByCode,
      'exercise-category',
    );

    validateRequiredCodesExist(
      'equipment records',
      getRequiredEquipmentCodes(mappedExercises),
      equipmentByCode,
      'equipment',
    );

    validateRequiredCodesExist(
      'muscles',
      getRequiredMuscleCodes(mappedExercises),
      musclesByCode,
      'muscle',
    );

    this.logDatabaseValidationResults(
      categoriesByCode.size,
      equipmentByCode.size,
      musclesByCode.size,
    );

    // Stop after validation when running in dry-run mode.
    if (dryRun) {
      this.logger.log('Inspection completed. No database rows were inserted.');
      return;
    }

    throw new Error('Database persistence has not been implemented yet.');
  }

  // Load exercise categories and index them by stable code.
  private async loadCategoriesByCode(): Promise<Map<string, ExerciseCategory>> {
    const categories = await this.exerciseCategoryRepo.find();

    return new Map(categories.map((category) => [category.code, category]));
  }

  // Load equipment records and index them by stable code.
  private async loadEquipmentByCode(): Promise<Map<string, Equipment>> {
    const equipmentItems = await this.equipmentRepo.find();

    return new Map(
      equipmentItems.map((equipment) => [equipment.code, equipment]),
    );
  }

  // Load muscles and index them by stable code.
  private async loadMusclesByCode(): Promise<Map<string, Muscle>> {
    const muscles = await this.muscleRepo.find();

    return new Map(muscles.map((muscle) => [muscle.code, muscle]));
  }

  // Log how many reference records were successfully loaded and validated.
  private logDatabaseValidationResults(
    categoryCount: number,
    equipmentCount: number,
    muscleCount: number,
  ): void {
    this.logger.log(
      `Validated ${categoryCount} exercise categories against the database`,
    );

    this.logger.log(
      `Validated ${equipmentCount} equipment records against the database`,
    );

    this.logger.log(`Validated ${muscleCount} muscles against the database`);
  }
}
