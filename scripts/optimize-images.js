// ============================================
// IMAGE DERIVATIVES
// The page renders full-resolution screenshots (often 1920x4075) into slots
// 300-600px wide, so first load used to pull ~660 kB of images that were
// 3-7x larger than anything displayed.
//
// This generates small, correctly-cropped derivatives into public/images/opt/
// and leaves the originals untouched — the lightbox still serves those at full
// size, but only once a visitor actually opens a gallery.
//
//   node scripts/optimize-images.js
// ============================================
import sharp from 'sharp';
import { mkdir, stat, readdir } from 'fs/promises';
import { dirname, join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'public/images/opt');

// Where to look for a source file, in priority order.
const SOURCES = [join(ROOT, 'images'), join(ROOT, 'public/images')];

async function findSource(rel) {
  for (const base of SOURCES) {
    const p = join(base, rel);
    try {
      await stat(p);
      return p;
    } catch (e) {}
  }
  throw new Error(`source not found: ${rel}`);
}

// Slots the page actually renders, with the crop each one displays.
//   card    — .project__screenshot-img, 16/10 box, object-position:top
//   gallery — lightbox images: viewed large, but never the raw multi-MB capture
//   phone   — portrait phone captures. Capped at 800px so the zoom overlay's
//             `naturalWidth <= 900` test recognises them as mobile shots and
//             fits them to the viewport height instead of scrolling them.
//   sprite  — alien-vs-malaysian characters, ~141px, transparent, no crop
//   square  — the profile photo, rendered in a 200px circle
//   icon    — the Create Anything logo, rendered at 22px

// Qstudio: one site with an "Attractions" switcher, captured across three
// verticals. Sources live outside public/, so only these derivatives deploy.
const QSTUDIO = [
  'ThemePark/00-hero-desktop.png',
  'ThemePark/03-scene-desktop.png',
  'ThemePark/05-scene-desktop.png',
  'ThemePark/08-scene-desktop.png',
  'ThemePark/09-scene-desktop.png',
  'Gym/00-hero-desktop.png',
  'Gym/02-solutions-desktop.png',
  'Gym/08-qsentry-desktop.png',
  'Solution/00-hero-desktop.png',
  'Solution/03-solutions-desktop.png',
].map((f) => ({ rel: 'Motion-website/' + f, kind: 'gallery' }));

// Qstudio mobile: the same site's responsive build, shown under App. The card
// image is a composed three-phone frame (see the note in README-style comment
// above qstudio-mobile-card.png's generation) because a 16/10 crop of a
// 1170x2532 phone capture would show nothing but the nav bar.
const QSTUDIO_MOBILE = [
  'ThemePark/00-hero-mobile.png',
  'ThemePark/03-scene-mobile.png',
  'ThemePark/07-scene-mobile.png',
  'ThemePark/11-scene-mobile.png',
  'ThemePark/12-scene-mobile.png',
  'Gym/00-hero-mobile.png',
  'Gym/02-solutions-mobile.png',
  'Gym/06-section-mobile.png',
  'Solution/00-hero-mobile.png',
  'Solution/05-where-the-business-sells-mobile.png',
].map((f) => ({ rel: 'Motion-website/' + f, kind: 'phone' }));

const JOBS = [
  // Qstudio card thumbnail — the theme-park hero is the strongest frame.
  { rel: 'Motion-website/ThemePark/00-hero-desktop.png', kind: 'card' },
  { rel: 'Motion-website/qstudio-mobile-card.png', kind: 'card' },
  ...QSTUDIO,
  ...QSTUDIO_MOBILE,
  { rel: 'AlcPest/alcpest-home.webp',            kind: 'card' },
  { rel: 'qparking/park1.webp',                  kind: 'card' },
  { rel: 'qpos/qbot-home.webp',                  kind: 'card' },
  { rel: 'aigenius/1.webp',                      kind: 'card' },
  { rel: '3d-house/house-1.webp',                kind: 'card' },
  { rel: '3d-rube-goldberg/rube-goldberg-1.webp',kind: 'card' },
  { rel: 'Wedding-Invitations/page1.webp',       kind: 'card' },
  { rel: 'agency_crm/2.png',                     kind: 'card' },
  { rel: 'product-explode/viewer-desktop.webp',  kind: 'card' },
  { rel: 'alien-vs-malaysian/bg.webp',           kind: 'card', position: 'centre' },
  { rel: 'alien-vs-malaysian/alien-red.webp',    kind: 'sprite' },
  { rel: 'alien-vs-malaysian/alien-green.webp',  kind: 'sprite' },
  { rel: 'alien-vs-malaysian/human-aunty.webp',  kind: 'sprite' },
  { rel: 'alien-vs-malaysian/human-pakcik.webp', kind: 'sprite' },
  { rel: 'danson-profile.png',                   kind: 'square' },
  { rel: 'create_anything_logo.png',             kind: 'icon' },
];

// Card slot is 596x373 at desktop; ship a 1x and a 2x and let srcset choose.
const KINDS = {
  // Card slots after the 3-up rework: 388px desktop, ~460px tablet, ~350px
  // phone. 400/800 cover 1x and 2x for all three; 1200 is for a 1-up card at
  // the 640px breakpoint on a retina screen.
  card:    { widths: [400, 800, 1200], ratio: 16 / 10, quality: 74 },
  gallery: { widths: [1600],      ratio: null,    quality: 78 },
  phone:   { widths: [800],       ratio: null,    quality: 78 },
  sprite:  { widths: [300],       ratio: null,    quality: 80 },
  square:  { widths: [400],       ratio: 1,       quality: 80 },
  icon:    { widths: [48],        ratio: 1,       quality: 85 },
};

function outName(rel, width, kind) {
  const stem = rel.replace(/\.(webp|png|jpe?g)$/i, '').replace(/\//g, '-');
  // 'gallery' is tagged so a card and a gallery crop of the same source never
  // overwrite each other.
  if (kind === 'gallery') return `${stem}-g${width}.webp`;
  if (kind === 'phone') return `${stem}-p${width}.webp`;
  return `${stem}-${width}.webp`;
}

await mkdir(OUT, { recursive: true });

let before = 0;
let after = 0;
const results = [];

for (const job of JOBS) {
  const src = await findSource(job.rel);
  const spec = KINDS[job.kind];
  const srcBytes = (await stat(src)).size;
  let jobAfter = 0;

  for (const width of spec.widths) {
    const dest = join(OUT, outName(job.rel, width, job.kind));
    let pipe = sharp(src);

    if (spec.ratio) {
      pipe = pipe.resize({
        width,
        height: Math.round(width / spec.ratio),
        fit: 'cover',
        // Cards use object-position:top, so crop from the top to match.
        position: job.position === 'centre' ? 'centre' : 'top',
        withoutEnlargement: true,
      });
    } else {
      pipe = pipe.resize({ width, withoutEnlargement: true });
    }

    await pipe.webp({ quality: spec.quality, effort: 6 }).toFile(dest);
    jobAfter += (await stat(dest)).size;
  }

  before += srcBytes;
  after += jobAfter;
  results.push({ rel: job.rel, from: srcBytes, to: jobAfter });
}

const kb = (n) => (n / 1024).toFixed(0).padStart(5) + ' kB';
for (const r of results.sort((a, b) => b.from - a.from)) {
  const pct = Math.round((1 - r.to / r.from) * 100);
  console.log(`${kb(r.from)} -> ${kb(r.to)}  (-${String(pct).padStart(2)}%)  ${r.rel}`);
}
console.log(`\n${results.length} images: ${kb(before)} -> ${kb(after)} of derivatives`);
