import {
  DifficultyLevel,
  ExerciseOrigin,
  ExerciseStatus,
} from 'src/workout/enums/workout.enum';

// Metadata
export type ExerciseMetadataImportRecord = {
  sourceExternalId: string;

  name: string;
  description: string | null;
  howToPerform: string[] | null;

  categoryCode: string | null;
  equipmentCode: string | null;
  primaryMuscleCodes: string[];
  secondaryMuscleCodes: string[];

  difficultyLevel: DifficultyLevel | null;

  origin: ExerciseOrigin;
  status: ExerciseStatus;

  sourceCategory: string;
  sourceLevel: string;
  sourceEquipment: string | null;
  sourcePrimaryMuscles: string[];
  sourceSecondaryMuscles: string[];

  imagePaths: string[];
};

// Image
export type ExerciseImageImportItem = {
  sourcePath: string;
  absolutePath: string;
  displayOrder: number;
  isPrimary: boolean;
};

export type ExerciseImageImportRecord = {
  sourceExternalId: string;
  images: ExerciseImageImportItem[];
};

export type MissingExerciseImageFile = {
  sourceExternalId: string;
  sourcePath: string;
  absolutePath: string;
};

export type ExerciseImageInspectionResult = {
  totalExercises: number;
  totalImages: number;
  exercisesWithoutImages: string[];
  missingFiles: MissingExerciseImageFile[];
};

// Analysis
export type DatasetAnalysis = {
  totalExercises: number;
  duplicateIds: string[];

  categories: Record<string, number>;
  levels: Record<string, number>;
  equipment: Record<string, number>;
  forceTypes: Record<string, number>;
  mechanics: Record<string, number>;

  primaryMuscles: Record<string, number>;
  secondaryMuscles: Record<string, number>;

  missingInstructions: number;
  missingImages: number;
};

type DatasetUnmappedValues = {
  categories: Record<string, number>;
  levels: Record<string, number>;
  equipment: Record<string, number>;
  primaryMuscles: Record<string, number>;
  secondaryMuscles: Record<string, number>;
};

export type DatasetInspectionReport = {
  generatedAt: string;
  analysis: DatasetAnalysis;
  images: ExerciseImageInspectionResult;
  unmapped: DatasetUnmappedValues;
};
