import { ObjectLiteral, Repository } from 'typeorm';

// Collect database IDs from imported exercises.
export function getExerciseIds(
  exercisesByExternalId: Map<string, { id: number }>,
): number[] {
  return [...exercisesByExternalId.values()].map((exercise) => exercise.id);
}

// Delete relationship rows belonging to the imported exercises.
export async function deleteExerciseLinks<Entity extends ObjectLiteral>(
  repository: Repository<Entity>,
  exerciseIds: number[],
): Promise<void> {
  if (exerciseIds.length === 0) {
    return;
  }

  await repository
    .createQueryBuilder()
    .delete()
    .from(repository.target)
    .where('exercise_id IN (:...exerciseIds)', {
      exerciseIds,
    })
    .execute();
}

// Split a large array into smaller database-operation chunks.
export function chunkArray<Item>(items: Item[], size: number): Item[][] {
  if (size <= 0) {
    throw new Error('Chunk size must be greater than zero.');
  }

  const chunks: Item[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

// Insert records in smaller chunks to avoid oversized queries.
export async function insertInChunks<Entity extends ObjectLiteral>(
  repository: Repository<Entity>,
  records: Entity[],
  chunkSize: number,
): Promise<void> {
  for (const recordsChunk of chunkArray(records, chunkSize)) {
    await repository.insert(recordsChunk);
  }
}
