import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeJsonAtomic } from './write-json.js';

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'write-json-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('writeJsonAtomic', () => {
  it('writes exact bytes: 2-space JSON plus a trailing newline', async () => {
    const dir = await makeTempDir();
    const target = join(dir, 'out.json');
    const data = { b: 2, a: [1, 'x', null, { nested: true }] };

    await writeJsonAtomic(target, data);

    expect(await readFile(target, 'utf8')).toBe(`${JSON.stringify(data, null, 2)}\n`);
  });

  it('leaves no .tmp file behind', async () => {
    const dir = await makeTempDir();
    const target = join(dir, 'out.json');

    await writeJsonAtomic(target, { hello: 'world' });

    expect(await readdir(dir)).toEqual(['out.json']);
  });

  it('creates missing parent directories', async () => {
    const dir = await makeTempDir();
    const target = join(dir, 'nested', 'deep', 'out.json');
    const data = { x: 1 };

    await writeJsonAtomic(target, data);

    expect(await readFile(target, 'utf8')).toBe(`${JSON.stringify(data, null, 2)}\n`);
  });

  it('atomically overwrites an existing file', async () => {
    const dir = await makeTempDir();
    const target = join(dir, 'out.json');

    await writeJsonAtomic(target, { version: 1 });
    await writeJsonAtomic(target, { version: 2 });

    expect(await readFile(target, 'utf8')).toBe(`${JSON.stringify({ version: 2 }, null, 2)}\n`);
  });
});
