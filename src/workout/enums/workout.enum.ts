export enum ExerciseType {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  CALISTHENICS = 'calisthenics',
}

export enum ExerciseMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum ExerciseOrigin {
  SYSTEM = 'system',
  USER = 'user',
}

export enum ExerciseMuscleRole {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
}

export enum ContentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  HIDDEN = 'hidden',
  ARCHIVED = 'archived',
}

export enum WorkoutPlanType {
  TEMPLATE = 'template',
  USER_PLAN = 'user_plan',
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
  CABLE = 'cable',
  BODYWEIGHT = 'bodyweight',
  RESISTANCE = 'resistance',
  STABILITY = 'stability',
  RECOVERY = 'recovery',
  ACCESSORY = 'accessory',
  OTHER = 'other',
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
