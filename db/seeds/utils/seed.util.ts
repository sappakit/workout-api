import { SeedName } from '../types/seed.types';

const VALID_SEEDS: SeedName[] = ['all', 'role', 'user', 'exercise-source'];

export function getSeedName(args: string[] = process.argv): SeedName {
  const seedArgs = args.slice(2).filter((arg) => arg !== '--');
  const seedName = seedArgs[0] ?? 'all';

  if (!VALID_SEEDS.includes(seedName as SeedName)) {
    throw new Error(
      `Invalid seed "${seedName}". Valid seeds: ${VALID_SEEDS.join(', ')}`,
    );
  }

  return seedName as SeedName;
}
