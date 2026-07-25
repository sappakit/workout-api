import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

// Write a JSON report to disk and return its resolved path.
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
