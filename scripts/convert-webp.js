import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

const IMAGES_DIR = new URL('../images', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const QUALITY = 82;

async function findPngs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...await findPngs(full));
    } else if (extname(e.name).toLowerCase() === '.png') {
      files.push(full);
    }
  }
  return files;
}

const pngs = await findPngs(IMAGES_DIR);
let saved = 0;

for (const src of pngs) {
  const dest = src.replace(/\.png$/i, '.webp');
  const before = (await stat(src)).size;
  await sharp(src).webp({ quality: QUALITY }).toFile(dest);
  const after = (await stat(dest)).size;
  const pct = Math.round((1 - after / before) * 100);
  saved += before - after;
  console.log(`✓ ${basename(src)} → ${basename(dest)}  ${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB  (-${pct}%)`);
}

console.log(`\nTotal saved: ${(saved / 1024 / 1024).toFixed(2)} MB`);
