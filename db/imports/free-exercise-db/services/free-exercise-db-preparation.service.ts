import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExerciseCategory } from 'db/entities/workout/exercise/exercise-category.entity';
import { ExerciseMedia } from 'db/entities/workout/exercise/exercise-media.entity';
import { ExerciseSource } from 'db/entities/workout/exercise/exercise-source.entity';
import { ExerciseTrackingType } from 'db/entities/workout/exercise/exercise-tracking-type.entity';
import { Exercise } from 'db/entities/workout/exercise/exercises.entity';
import { Equipment } from 'db/entities/workout/shared/equipment.entity';
import { Muscle } from 'db/entities/workout/shared/muscles.entity';
import { ExerciseMediaType } from 'src/workout/enums/workout.enum';
import { In, Repository } from 'typeorm';
import { mapFreeExerciseDbImages } from '../mappers/exercise-image.mapper';
import { mapFreeExerciseDbExercise } from '../mappers/exercise.mapper';
import {
  FreeExerciseDbImagePreparationResult,
  FreeExerciseDbImageReferences,
  FreeExerciseDbImportOptions,
  FreeExerciseDbReferences,
  FreeExerciseDbTrackingTypeMappingRecord,
  FreeExerciseDbTrackingTypeReferences,
} from '../types/free-exercise-db.types';
import {
  ExerciseImageImportRecord,
  ExerciseImagePreparationResult,
  ExerciseMetadataImportRecord,
  PreparedExerciseImageImportItem,
} from '../types/import-result.types';
import { calculateFileContentHash } from '../utils/content-hash.util';
import { inspectExerciseImages } from '../utils/inspect-images.util';
import { loadFreeExerciseDbDataset } from '../utils/load-dataset.util';
import {
  analyzeFreeExerciseDbDataset,
  buildInspectionReport,
  writeImportReport,
} from '../utils/reports/inspection-report.util';
import {
  getRequiredTrackingTypeCodes,
  loadTrackingTypeMapping,
} from '../utils/tracking-type-mapping.util';
import {
  getRequiredCategoryCodes,
  getRequiredEquipmentCodes,
  getRequiredMuscleCodes,
  validateMappedValues,
  validateNoDuplicateSourceIds,
  validateRequiredCodesExist,
  validateTrackingTypeMappingCoverage,
} from '../utils/validate-import.util';

const FREE_EXERCISE_DB_SOURCE_KEY = 'free-exercise-db';

type FreeExerciseDbInspectionResult = {
  exerciseCount: number;
  imageCount: number;
  reportPath: string;
};

type FreeExerciseDbMetadataPreparationResult = {
  records: ExerciseMetadataImportRecord[];
  references: FreeExerciseDbReferences;
};

type FreeExerciseDbTrackingTypePreparationResult = {
  records: FreeExerciseDbTrackingTypeMappingRecord[];
  references: FreeExerciseDbTrackingTypeReferences;
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

    @InjectRepository(ExerciseTrackingType)
    private readonly exerciseTrackingTypeRepo: Repository<ExerciseTrackingType>,

    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,

    @InjectRepository(ExerciseMedia)
    private readonly exerciseMediaRepo: Repository<ExerciseMedia>,
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

  // Load and validate tracking-type mappings before database persistence.
  async prepareTrackingTypes(
    options: FreeExerciseDbImportOptions,
  ): Promise<FreeExerciseDbTrackingTypePreparationResult> {
    const sourceExercises = await this.loadDataset(options.filePath);
    const analysis = analyzeFreeExerciseDbDataset(sourceExercises);

    validateNoDuplicateSourceIds(analysis.duplicateIds);

    this.logger.log('Loading Free Exercise DB tracking-type mapping');

    const records = await loadTrackingTypeMapping(
      options.trackingTypeMappingPath,
    );

    validateTrackingTypeMappingCoverage(sourceExercises, records);

    const references = await this.loadTrackingTypeReferences();
    const requiredCodes = getRequiredTrackingTypeCodes(records);

    validateRequiredCodesExist(
      'exercise tracking types',
      requiredCodes,
      references.trackingTypesByCode,
      'exercise-tracking-type',
    );

    this.logger.log(
      `Validated ${requiredCodes.size} exercise tracking types against the database`,
    );

    this.logger.log(
      `Validated tracking-type mappings for ${records.length} exercises`,
    );

    return {
      records,
      references,
    };
  }

  // Load, validate, hash, and filter image records before Cloudinary upload.
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

    const references = await this.loadImageReferences(imageRecords);

    const prepared = await this.prepareChangedImages(imageRecords, references);

    this.logger.log(
      `Prepared ${prepared.uploadImages}/${prepared.totalImages} exercise images for upload`,
    );

    this.logger.log(
      `Skipped ${prepared.skippedImages} unchanged exercise images`,
    );

    return {
      imageRecords: prepared.records,
      references,
      totalImages: prepared.totalImages,
      uploadImages: prepared.uploadImages,
      skippedImages: prepared.skippedImages,
    };
  }

  // Hash local images and remove records whose persisted content is unchanged.
  private async prepareChangedImages(
    records: ExerciseImageImportRecord[],
    references: FreeExerciseDbImageReferences,
  ): Promise<ExerciseImagePreparationResult> {
    const existingMediaByKey = await this.loadExistingMedia(references);

    const preparedRecords: ExerciseImagePreparationResult['records'] = [];

    let totalImages = 0;
    let uploadImages = 0;
    let skippedImages = 0;

    for (const record of records) {
      const exercise = this.getRequiredImportedExercise(
        references.exercisesByExternalId,
        record.sourceExternalId,
      );

      const preparedImages: PreparedExerciseImageImportItem[] = [];

      for (const image of record.images) {
        totalImages += 1;

        const contentHash = await calculateFileContentHash(image.absolutePath);

        const mediaKey = this.buildMediaKey(exercise.id, image.displayOrder);

        const existingMedia = existingMediaByKey.get(mediaKey);

        if (existingMedia?.content_hash === contentHash) {
          skippedImages += 1;
          continue;
        }

        preparedImages.push({
          ...image,
          contentHash,
        });

        uploadImages += 1;
      }

      if (preparedImages.length === 0) {
        continue;
      }

      preparedRecords.push({
        sourceExternalId: record.sourceExternalId,
        images: preparedImages,
      });
    }

    return {
      records: preparedRecords,
      totalImages,
      uploadImages,
      skippedImages,
    };
  }

  // Load and validate database references required by the image importer.
  private async loadImageReferences(
    records: ExerciseImageImportRecord[],
  ): Promise<FreeExerciseDbImageReferences> {
    const source = await this.loadExerciseSource();

    const exercisesByExternalId = await this.loadImportedExercises(
      source,
      records,
    );

    return {
      source,
      exercisesByExternalId,
    };
  }

  // Load imported exercises referenced by the image dataset.
  private async loadImportedExercises(
    source: ExerciseSource,
    records: ExerciseImageImportRecord[],
  ): Promise<Map<string, Exercise>> {
    const sourceExternalIds = [
      ...new Set(records.map((record) => record.sourceExternalId)),
    ];

    if (sourceExternalIds.length === 0) {
      return new Map();
    }

    const exercises = await this.exerciseRepo.find({
      where: {
        source: {
          id: source.id,
        },
        source_external_id: In(sourceExternalIds),
      },
    });

    const exercisesByExternalId = new Map<string, Exercise>();

    for (const exercise of exercises) {
      if (exercise.source_external_id) {
        exercisesByExternalId.set(exercise.source_external_id, exercise);
      }
    }

    this.validateAllImageExercisesExist(
      sourceExternalIds,
      exercisesByExternalId,
    );

    return exercisesByExternalId;
  }

  // Load existing imported image media for content-hash comparison.
  private async loadExistingMedia(
    references: FreeExerciseDbImageReferences,
  ): Promise<Map<string, ExerciseMedia>> {
    const exerciseIds = [...references.exercisesByExternalId.values()].map(
      (exercise) => exercise.id,
    );

    if (exerciseIds.length === 0) {
      return new Map();
    }

    const mediaRows = await this.exerciseMediaRepo.find({
      where: {
        exercise: {
          id: In(exerciseIds),
        },
        source: {
          id: references.source.id,
        },
        media_type: ExerciseMediaType.IMAGE,
      },
      relations: {
        exercise: true,
      },
    });

    return new Map(
      mediaRows.map((media) => [
        this.buildMediaKey(media.exercise.id, media.display_order),
        media,
      ]),
    );
  }

  // Ensure every dataset exercise has already been imported into the database.
  private validateAllImageExercisesExist(
    sourceExternalIds: string[],
    exercisesByExternalId: Map<string, Exercise>,
  ): void {
    const missingSourceExternalIds = sourceExternalIds.filter(
      (sourceExternalId) => !exercisesByExternalId.has(sourceExternalId),
    );

    if (missingSourceExternalIds.length === 0) {
      return;
    }

    const preview = missingSourceExternalIds.slice(0, 10).join(', ');

    throw new Error(
      [
        `${missingSourceExternalIds.length} imported exercises were not found in the database.`,
        `Missing source IDs: ${preview}`,
        'Run the exercise metadata import before importing images.',
      ].join(' '),
    );
  }

  // Return a validated imported exercise from its source ID.
  private getRequiredImportedExercise(
    exercisesByExternalId: Map<string, Exercise>,
    sourceExternalId: string,
  ): Exercise {
    const exercise = exercisesByExternalId.get(sourceExternalId);

    if (!exercise) {
      throw new Error(
        `Validated exercise not found for source ID: ${sourceExternalId}`,
      );
    }

    return exercise;
  }

  // Build the stable lookup key for an exercise media position.
  private buildMediaKey(exerciseId: number, displayOrder: number): string {
    return `${exerciseId}:${displayOrder}`;
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

  // Load seeded references required by the tracking-type importer.
  private async loadTrackingTypeReferences(): Promise<FreeExerciseDbTrackingTypeReferences> {
    const [source, trackingTypes] = await Promise.all([
      this.loadExerciseSource(),
      this.exerciseTrackingTypeRepo.find(),
    ]);

    return {
      source,

      trackingTypesByCode: new Map(
        trackingTypes.map((trackingType) => [trackingType.code, trackingType]),
      ),
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
