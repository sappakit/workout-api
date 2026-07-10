export enum ExerciseType {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  CALISTHENICS = 'calisthenics',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum WorkoutScheduleStatus {
  PLANNED = 'planned',
  SKIPPED = 'skipped',
  COMPLETED = 'completed',
}

export enum WorkoutSessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum EquipmentCategory {
  FREE_WEIGHT = 'free_weight',
  MACHINE = 'machine',
  BODYWEIGHT = 'bodyweight',
  ACCESSORY = 'accessory',
}

export enum WorkoutCurrentMode {
  IN_PROGRESS = 'in_progress',
  SCHEDULED = 'scheduled',
  REST_DAY = 'rest_day',
  UNASSIGNED = 'unassigned',
}

export enum WorkoutProgressOverviewType {
  WEEKLY = 'weekly',
  YEARLY = 'yearly',
  ALL_TIME = 'all_time',
}

export enum WorkoutWeeklyPlanDayType {
  WORKOUT = 'workout',
  REST = 'rest',
  UNASSIGNED = 'unassigned',
}
