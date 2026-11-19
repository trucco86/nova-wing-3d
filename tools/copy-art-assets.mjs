import { copyFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const FIVE_CATS_ART_FILES = Object.freeze([
  'five-cats-portraits.webp',
  'bob-spotlight.webp',
  'five-cats-ships-concept.webp',
  'five-cats-rank-emblems.webp',
  'nova-wing-weapons-concept.webp',
  'nova-wing-pods-concept.webp',
]);

// These assets stay external to the single-file HTML so its size, parse cost,
// and WebGL memory are not increased by concept art that is not always visible.
export async function copyGameArt(destination) {
  const target = resolve(destination, 'src/assets');
  await mkdir(target, { recursive: true });
  for (const name of FIVE_CATS_ART_FILES)
    await copyFile(resolve(root, 'src/assets', name), resolve(target, name));
  return FIVE_CATS_ART_FILES.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Usage: node tools/copy-art-assets.mjs <web-root>');
  const count = await copyGameArt(process.argv[2]);
  console.log('Five Cats original artwork copied: ' + count);
}
