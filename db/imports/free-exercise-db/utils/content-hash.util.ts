import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

// Calculate a SHA-256 hash from a local file without loading it fully into memory.
export async function calculateFileContentHash(
  filePath: string,
): Promise<string> {
  const hash = createHash('sha256');
  const stream = createReadStream(filePath);

  for await (const chunk of stream) {
    hash.update(chunk);
  }

  return hash.digest('hex');
}

// Calculate a SHA-256 hash from an in-memory file buffer.
export function calculateBufferContentHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}
