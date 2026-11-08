// ============================================
// FAVICONS / APP ICONS
// One rainbow-glass tile with a bold "D", rendered to every size the page and
// the web manifest reference. favicon.ico is written by hand as an ICO
// container holding PNG images (supported by every current browser).
//
//   node scripts/make-icons.js
// ============================================
import sharp from 'sharp';
import { writeFile } from 'fs/promises';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const PUB = join(ROOT, 'public');

// rounded = true for browser-tab icons; app icons are full-bleed squares
// because iOS/Android apply their own mask.
function svg(rounded) {
  const rx = rounded ? 116 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#ff4f9a"/><stop offset=".25" stop-color="#ff8a3d"/>
<stop offset=".45" stop-color="#ffc83d"/><stop offset=".62" stop-color="#1fc28a"/>
<stop offset=".8" stop-color="#2a9dff"/><stop offset="1" stop-color="#8a5cff"/>
</linearGradient>
<radialGradient id="hi" cx="30%" cy="18%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
<rect width="512" height="512" rx="${rx}" fill="url(#g)"/>
<rect width="512" height="512" rx="${rx}" fill="url(#hi)"/>
<path fill="#121018" fill-rule="evenodd" d="M138 104h126a152 152 0 0 1 0 304H138Z M218 180v152h44a76 76 0 0 0 0-152Z"/>
</svg>`;
}

const png = (size, rounded = true) => sharp(Buffer.from(svg(rounded))).resize(size, size).png().toBuffer();

const out = {
  'favicon-16x16.png': await png(16),
  'favicon-32x32.png': await png(32),
  'apple-touch-icon.png': await png(180, false),
  'android-chrome-192x192.png': await png(192, false),
  'android-chrome-512x512.png': await png(512, false),
};
for (const [name, buf] of Object.entries(out)) await writeFile(join(PUB, name), buf);

// ICO: 6-byte header, a 16-byte directory entry per image, then the PNG data.
const icoImages = [
  [16, out['favicon-16x16.png']],
  [32, out['favicon-32x32.png']],
  [48, await png(48)],
];
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(icoImages.length, 4);
let offset = 6 + 16 * icoImages.length;
const entries = icoImages.map(([size, buf]) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(size, 0);
  e.writeUInt8(size, 1);
  e.writeUInt16LE(1, 4); // colour planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(buf.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += buf.length;
  return e;
});
await writeFile(join(PUB, 'favicon.ico'), Buffer.concat([header, ...entries, ...icoImages.map(([, b]) => b)]));

console.log('icons written:', [...Object.keys(out), 'favicon.ico'].join(', '));
