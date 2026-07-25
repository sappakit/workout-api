import { Logger } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';
import { SeedName, VALID_SEEDS } from '../types/seed.types';

type RunUpsertSeedOptions<
  Entity extends ObjectLiteral,
  SeedData extends Partial<Entity>,
> = {
  repository: Repository<Entity>;
  data: SeedData[];
  conflictPaths: (keyof Entity)[];
  entityName: string;
  logger: Logger;
};

export async function runUpsertSeed<
  Entity extends ObjectLiteral,
  SeedData extends Partial<Entity>,
>(options: RunUpsertSeedOptions<Entity, SeedData>): Promise<void> {
  const { repository, data, conflictPaths, entityName, logger } = options;

  await repository.upsert(data, {
    conflictPaths: conflictPaths as string[],
    skipUpdateIfNoValuesChanged: true,
  });

  logger.log(`Seeded ${data.length} ${entityName}`);
}

export function getSeedName(args: string[] = process.argv): SeedName {
  const seedArgs = args.slice(2).filter((arg) => arg !== '--');
  const seedName = seedArgs[0] ?? 'all';

  if (!VALID_SEEDS.some((validSeed) => validSeed === seedName)) {
    throw new Error(
      `Invalid seed "${seedName}". Valid seeds: ${VALID_SEEDS.join(', ')}`,
    );
  }

  return seedName as SeedName;
}
