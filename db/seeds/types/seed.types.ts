export const SEED_ACTOR = 'system:seed';

export type Seeder = { run(): Promise<void> };

export const VALID_SEEDS = [
  'all',
  'role',
  'user',
  'exercise-source',
  'exercise-category',
] as const;

export type SeedName = (typeof VALID_SEEDS)[number];
