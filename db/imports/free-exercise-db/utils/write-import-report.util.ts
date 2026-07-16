import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export async function writeImportReport(
  report: unknown,
  filePath?: string,
): Promise<string> {
  const resolvedPath = filePath
    ? resolve(filePath)
    : resolve(
        process.cwd(),
        'db/imports/free-exercise-db/reports/dataset-analysis.json',
      );

  await mkdir(dirname(resolvedPath), {
    recursive: true,
  });

  await writeFile(resolvedPath, JSON.stringify(report, null, 2), 'utf8');

  return resolvedPath;
}
