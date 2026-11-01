import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function copyDeclarations(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const input = join(source, entry.name);
    if (entry.isDirectory()) {
      await copyDeclarations(input, join(destination, entry.name));
    } else if (entry.name.endsWith('.d.ts')) {
      const content = await readFile(input, 'utf8');
      await writeFile(
        join(destination, entry.name.replace(/\.d\.ts$/, '.d.cts')),
        content.replace(/(from\s+|import\s*\(\s*)(['"])(\.{1,2}\/[^'"]+)\.js\2/g, '$1$2$3.cjs$2'),
      );
    }
  }
}

await copyDeclarations('dist/types', 'dist/types-cjs');
