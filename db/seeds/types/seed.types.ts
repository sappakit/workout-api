export const SEED_ACTOR = 'system:seed';

export type Seeder = {
  run(): Promise<void>;
};

export const VALID_SEEDS = [
  'role',
  'user',
  'exercise-source',
  'exercise-category',
  'exercise-tracking-type',
  'equipment',
  'muscle',
  'workout-focus-type',
  'workout',
  'all',
] as const;

export type SeedName = (typeof VALID_SEEDS)[number];
export type SingleSeedName = Exclude<SeedName, 'all'>;

export const SEED_ORDER = VALID_SEEDS.filter((seedName) => seedName !== 'all');
