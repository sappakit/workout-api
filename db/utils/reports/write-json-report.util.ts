import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

// Write JSON data to disk and return the resolved file path.
export async function writeJsonReport(
  data: unknown,
  defaultPath: string,
  filePath?: string,
): Promise<string> {
  const resolvedPath = filePath
    ? resolve(filePath)
    : resolve(process.cwd(), defaultPath);

  await mkdir(dirname(resolvedPath), {
    recursive: true,
  });

  await writeFile(resolvedPath, JSON.stringify(data, null, 2), 'utf8');

  return resolvedPath;
}
