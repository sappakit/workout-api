import {
  DifficultyLevel,
  ExerciseOrigin,
  ExerciseStatus,
} from 'src/workout/enums/workout.enum';

export type ExerciseMetadataImportRecord = {
  sourceExternalId: string;

  name: string;
  description: string | null;
  howToPerform: string[] | null;

  difficultyLevel: DifficultyLevel | null;

  origin: ExerciseOrigin;
  status: ExerciseStatus;

  sourceCategory: string;
  sourceLevel: string;
  sourceEquipment: string | null;

  primaryMuscles: string[];
  secondaryMuscles: string[];

  imagePaths: string[];
};

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

export type DatasetInspectionReport = {
  generatedAt: string;
  analysis: DatasetAnalysis;

  unmapped: {
    levels: Record<string, number>;
  };
};
