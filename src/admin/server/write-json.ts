import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Write `data` as pretty-printed JSON to `path`, atomically.
 *
 * The content is written to a sibling `.tmp` file first and then renamed into
 * place, so a reader never observes a half-written file.
 */
export async function writeJsonAtomic(path: string, data: unknown): Promise<void> {
  const tmpPath = `${path}.tmp`;
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(tmpPath, serialized, 'utf8');
  await rename(tmpPath, path);
}
