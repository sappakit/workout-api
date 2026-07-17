export const SEED_ACTOR = 'system:seed';

export type Seeder = {
  run(): Promise<void>;
};

export const VALID_SEEDS = [
  'all',
  'role',
  'exercise-source',
  'exercise-category',
  'equipment',
  'muscle',
  'user',
] as const;

export type SeedName = (typeof VALID_SEEDS)[number];
export type SingleSeedName = Exclude<SeedName, 'all'>;

export const SEED_ORDER = VALID_SEEDS.filter((seedName) => seedName !== 'all');
