// ============================================
// BACKGROUND ARTWORK
// Generates public/images/bg-glass.svg: pastel rainbow light, like a sheet of
// holographic glass, with fine white silk lines flowing across it as sheen.
// It is a static file drawn once, so it costs nothing while scrolling.
//
//   node scripts/make-bg.js
// ============================================
import { writeFile } from 'fs/promises';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const W = 1600;
const H = 1000;
const LINES = 86;
const STEP = 40; // x resolution of each line, in px (curves are smoothed between samples)

// A smooth height field. Each line is a horizontal slice through it, so the
// lines bunch together on the slopes of the folds and spread out on the crests,
// which is what makes them read as fabric rather than stripes.
function field(x, y) {
  const u = x / W;
  const v = y / H;
  // The v terms change quickly from one line to the next, so neighbouring
  // lines are pushed by different amounts and gather into folds.
  return (
    Math.sin(u * 2.6 + v * 6.8 + 0.6) * 64 +
    Math.sin(u * 5.2 - v * 9.4 + 1.7) * 30 +
    Math.cos(u * 1.3 - v * 4.2 + 0.3) * 80 +
    Math.sin(u * 8.1 + v * 3.3) * 10
  );
}

const fmt = (n) => Math.round(n);

function linePath(i) {
  // Slices run slightly diagonal, rising to the right.
  const base = (i / (LINES - 1)) * (H + 360) - 180;
  const pts = [];
  for (let x = -STEP; x <= W + STEP; x += STEP) {
    const y0 = base - (x / W) * 220;
    pts.push([x, y0 + field(x, y0)]);
  }
  // Catmull-Rom through the samples, converted to cubic Béziers.
  let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
  for (let k = 0; k < pts.length - 1; k++) {
    const p0 = pts[k - 1] || pts[k];
    const p1 = pts[k];
    const p2 = pts[k + 1];
    const p3 = pts[k + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return d;
}

const paths = [];
for (let i = 0; i < LINES; i++) {
  // White lines read as light catching the glass; every fifth is brighter.
  const strong = i % 5 === 0;
  paths.push(
    `<path d="${linePath(i)}" stroke-opacity="${strong ? 0.85 : 0.5}" stroke-width="${strong ? 1.3 : 0.9}"/>`
  );
}

// Soft pools of colour, each a large radial gradient fading to nothing.
const pools = [
  ['8%', '6%', '48%', '#ffb8d9'], // pink
  ['46%', '-4%', '40%', '#ffd7a8'], // peach
  ['92%', '10%', '46%', '#b9dcff'], // sky
  ['70%', '48%', '42%', '#d9c6ff'], // lavender
  ['18%', '62%', '46%', '#bff3dc'], // mint
  ['52%', '96%', '50%', '#fff1a8'], // butter
  ['100%', '92%', '40%', '#ffc6e6'], // rose
];
const poolDefs = pools
  .map(
    ([cx, cy, r, c], i) =>
      `<radialGradient id="p${i}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${c}" stop-opacity=".95"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`
  )
  .join('\n');
const poolRects = pools.map((_, i) => `<rect width="${W}" height="${H}" fill="url(#p${i})"/>`).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<defs>
${poolDefs}
<linearGradient id="holo" x1="0" y1="0" x2="1" y2=".8"><stop offset=".2" stop-color="#fff" stop-opacity="0"/><stop offset=".42" stop-color="#ffd1ec" stop-opacity=".55"/><stop offset=".5" stop-color="#fff6c9" stop-opacity=".6"/><stop offset=".58" stop-color="#c9f1ff" stop-opacity=".55"/><stop offset=".8" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="hi" cx="30%" cy="22%" r="45%"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="#f6f2fb"/>
${poolRects}
<rect width="${W}" height="${H}" fill="url(#holo)"/>
<rect width="${W}" height="${H}" fill="url(#hi)"/>
<g fill="none" stroke="#fff" stroke-linecap="round">
${paths.join('\n')}
</g>
</svg>
`;

const out = join(ROOT, 'public/images/bg-glass.svg');
await writeFile(out, svg);
console.log(`wrote ${out} (${(svg.length / 1024).toFixed(0)} kB)`);
