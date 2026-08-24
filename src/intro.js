// ============================================
// INTRO / OPENING ANIMATION
//   1. Hyperspace particle warp rushes past the camera
//   2. Particles converge to spell "DANSON"
//   3. Everything zooms through the camera and dissolves, revealing the site
// Click / tap / any key skips ahead.
//
// Rendered with the Canvas2D point renderer — the effect is identical, but it
// no longer costs a WebGL library to draw a few thousand dots.
//
// First-visit friction is deliberately capped — see shouldPlayIntro() in
// motion.js for who gets it at all. This module is only ever imported once
// that gate has said yes:
//   - the whole thing runs ~2.2s, and the site starts revealing at ~1.7s
//   - it plays ONCE per visitor (12h window) — returning visitors go straight in
//   - prefers-reduced-motion or ?intro=0 skip it entirely
// ============================================
import { PointRenderer } from './points2d.js';
import { markIntroSeen } from './motion.js';

const NAME = 'DANSON';

// Timeline (seconds). Kept short on purpose: a recruiter's first visit should
// reach the hero in under two seconds, not four.
const FORM_START = 0.22;
const WARP_FADE_START = 0.25;
const WARP_FADE_END = 0.95;
const FORM_END = 1.25;
const HOLD_END = 1.65;
const OUT_END = 2.2;

// Per-frame delta is clamped below, so a slow device would stretch the timeline
// in wall-clock terms. This is the real-time budget: once it passes, the intro
// starts bowing out regardless of how many frames it managed to draw.
const MAX_WALL_MS = 2600;

const WARP_COUNT = 1400;
const CAMERA_Z = 6;
const FOV = 70;

export function playIntro({ onReveal } = {}) {
  return new Promise((resolve) => {
    let revealed = false;
    const fireReveal = () => {
      if (revealed) return;
      revealed = true;
      try {
        onReveal && onReveal();
      } catch (e) {
        /* never let the reveal callback block the intro */
      }
    };

    markIntroSeen();

    // ---- Overlay + canvas -------------------------------------------------
    const overlay = document.createElement('div');
    overlay.className = 'intro-overlay';
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    overlay.appendChild(canvas);
    const skipBtn = document.createElement('button');
    skipBtn.className = 'intro-skip';
    skipBtn.type = 'button';
    skipBtn.textContent = 'Skip Intro';
    skipBtn.setAttribute('aria-label', 'Skip the intro animation and go to the site');
    overlay.appendChild(skipBtn);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    try {
      skipBtn.focus({ preventScroll: true });
    } catch (e) {}

    // ---- Skip / finish ----------------------------------------------------
    let elapsed = 0; // seconds since the loop started (own accumulator)
    let skipFrom = null; // elapsed time when skip pressed
    function doSkip() {
      if (skipFrom !== null) return;
      skipFrom = elapsed;
    }
    skipBtn.addEventListener('click', doSkip);
    overlay.addEventListener('click', doSkip);
    function keyHandler() {
      doSkip();
    }
    window.addEventListener('keydown', keyHandler);

    let finished = false;
    let rafId = null;
    let safety = null;
    function cleanup(immediate) {
      if (finished) return;
      finished = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (safety) clearTimeout(safety);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', keyHandler);
      fireReveal();
      const remove = () => {
        overlay.remove();
        document.body.style.overflow = '';
        resolve();
      };
      if (immediate) {
        remove();
      } else {
        overlay.classList.add('hide');
        setTimeout(remove, 650);
      }
    }

    let renderer;
    try {
      renderer = new PointRenderer(canvas, { fov: FOV, cameraZ: CAMERA_Z });
    } catch (e) {
      // No 2D context — bail without ever showing the overlay.
      cleanup(true);
      return;
    }

    function resize() {
      renderer.resize();
    }
    window.addEventListener('resize', resize);

    // ---- Warp starfield ---------------------------------------------------
    const warp = new Float32Array(WARP_COUNT * 3);
    for (let i = 0; i < WARP_COUNT; i++) {
      warp[i * 3] = (Math.random() - 0.5) * 10;
      warp[i * 3 + 1] = (Math.random() - 0.5) * 10;
      warp[i * 3 + 2] = -Math.random() * 42 + 6;
    }

    // ---- Text particles (built after fonts are ready) ---------------------
    let hasText = false;
    let start = null; // scattered origins
    let target = null; // text positions
    let curr = null; // current, what gets drawn
    let phase = null; // per-particle random for shimmer
    let COUNT = 0;
    let textOpacity = 0;

    function buildText() {
      const sample = sampleText(NAME);
      if (!sample || sample.points.length === 0) return;

      const raw = sample.points;
      // Fit the word into world space (responsive).
      const visibleH = 2 * CAMERA_Z * Math.tan((FOV * Math.PI) / 360);
      const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      const maxW = visibleH * aspect * 0.82;
      let scale = 1.85 / sample.h; // aim ~1.85 world-units tall
      if (sample.w * scale > maxW) scale = maxW / sample.w;

      // Downsample if very dense.
      let idx = raw.map((_, i) => i);
      const CAP = 5200;
      if (idx.length > CAP) {
        for (let i = idx.length - 1; i > 0; i--) {
          const j = Math.floor(pseudoRand(i) * (i + 1));
          [idx[i], idx[j]] = [idx[j], idx[i]];
        }
        idx = idx.slice(0, CAP);
      }

      COUNT = idx.length;
      start = new Float32Array(COUNT * 3);
      target = new Float32Array(COUNT * 3);
      curr = new Float32Array(COUNT * 3);
      phase = new Float32Array(COUNT);

      for (let k = 0; k < COUNT; k++) {
        const p = raw[idx[k]];
        target[k * 3] = (p[0] - sample.w / 2) * scale;
        target[k * 3 + 1] = -(p[1] - sample.h / 2) * scale;
        target[k * 3 + 2] = (Math.random() - 0.5) * 0.25;

        // Scatter origins on a large shell, biased toward deep space.
        const r = 6 + Math.random() * 6;
        const a = Math.random() * Math.PI * 2;
        const e = (Math.random() - 0.5) * Math.PI;
        start[k * 3] = Math.cos(a) * Math.cos(e) * r;
        start[k * 3 + 1] = Math.sin(e) * r;
        start[k * 3 + 2] = -8 - Math.random() * 14;

        curr[k * 3] = start[k * 3];
        curr[k * 3 + 1] = start[k * 3 + 1];
        curr[k * 3 + 2] = start[k * 3 + 2];
        phase[k] = Math.random() * Math.PI * 2;
      }
      hasText = true;
    }

    // ---- Render loop ------------------------------------------------------
    let last = performance.now();
    const startWall = last;

    function frame() {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      // Out of real-time budget (slow device, throttled tab) — bow out now.
      if (skipFrom === null && now - startWall > MAX_WALL_MS) doSkip();
      let t = elapsed;
      // When skipping, fast-forward time toward the out phase.
      if (skipFrom !== null) {
        t = HOLD_END + (elapsed - skipFrom) * 3.2;
      }

      renderer.clear();

      // Warp motion + fade
      const wOpacity =
        1 - clamp((t - WARP_FADE_START) / (WARP_FADE_END - WARP_FADE_START));
      if (wOpacity > 0.01) {
        const speed = 26;
        for (let i = 0; i < WARP_COUNT; i++) {
          warp[i * 3 + 2] += speed * dt;
          if (warp[i * 3 + 2] > 7) {
            warp[i * 3] = (Math.random() - 0.5) * 10;
            warp[i * 3 + 1] = (Math.random() - 0.5) * 10;
            warp[i * 3 + 2] -= 46;
          }
        }
        renderer.draw(warp, WARP_COUNT, {
          color: '#9dff3d',
          size: 0.07,
          opacity: 0.9 * wOpacity,
        });
      }

      // Text: form -> hold -> out
      if (hasText) {
        const form = easeOutCubic(clamp((t - FORM_START) / (FORM_END - FORM_START)));
        const out = clamp((t - HOLD_END) / (OUT_END - HOLD_END));
        const outE = easeInCubic(out);

        for (let k = 0; k < COUNT; k++) {
          const i = k * 3;
          let x = lerp(start[i], target[i], form);
          let y = lerp(start[i + 1], target[i + 1], form);
          let z = lerp(start[i + 2], target[i + 2], form);

          // Shimmer once formed
          const sh = form * 0.03;
          y += Math.sin(t * 2.2 + phase[k]) * sh;
          x += Math.cos(t * 1.8 + phase[k]) * sh;

          // Out phase: burst toward camera + spread outward
          if (out > 0) {
            z += outE * 11;
            x *= 1 + outE * 1.4;
            y *= 1 + outE * 1.4;
          }
          curr[i] = x;
          curr[i + 1] = y;
          curr[i + 2] = z;
        }

        textOpacity = clamp(form * 1.1) * (1 - easeInCubic(out));

        // gentle camera drift for depth during the hold
        renderer.cam.x = Math.sin(t * 0.3) * 0.15 * form * (1 - out);
        renderer.cam.y = Math.cos(t * 0.25) * 0.1 * form * (1 - out);

        renderer.draw(curr, COUNT, {
          color: '#d6ff70',
          size: 0.055,
          opacity: textOpacity,
        });

        // Kick off the site reveal + start fading the overlay near the end.
        if (out > 0.02) fireReveal();
        if (out >= 1) {
          cleanup(false);
          return;
        }
        // Fade the black overlay away over the tail of the out phase, and stop
        // it swallowing clicks meant for the page now showing through it.
        if (out > 0.35) {
          overlay.style.background = `rgba(5,5,5,${(1 - (out - 0.35) / 0.65).toFixed(3)})`;
          overlay.style.pointerEvents = 'none';
        } else {
          overlay.style.background = '#050505';
        }
      }

      rafId = requestAnimationFrame(frame);
    }

    // Build text once the brand font is ready, then start rendering.
    ensureFont().then(() => {
      if (finished) return;
      buildText();
      // Last resort: if frames stop arriving entirely, never trap the user.
      safety = setTimeout(() => cleanup(true), 4500);
      last = performance.now();
      frame();
      // If sampling failed for any reason, still run the warp + a timed reveal.
      if (!hasText) setTimeout(() => cleanup(false), 900);
    });
  });
}

// ---- Helpers -------------------------------------------------------------
function clamp(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
function easeInCubic(t) {
  return t * t * t;
}
// Deterministic pseudo-random (no Math.random dependency for the shuffle).
function pseudoRand(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function ensureFont() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  return document.fonts
    .load("700 200px 'Space Grotesk'")
    .catch(() => {})
    .then(() => document.fonts.ready)
    .catch(() => {});
}

// Rasterize the word and collect filled pixel coordinates as particle targets.
function sampleText(text) {
  const fontSize = 220;
  const pad = 24;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  if (!ctx) return null;

  const font = `900 ${fontSize}px 'Space Grotesk', 'Arial Black', sans-serif`;
  ctx.font = font;
  const metrics = ctx.measureText(text);
  const w = Math.ceil(metrics.width) + pad * 2;
  const h = Math.ceil(fontSize * 1.3);
  c.width = w;
  c.height = h;

  ctx.font = font;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, pad, h / 2);

  let data;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch (e) {
    return null;
  }

  const gap = 4;
  const points = [];
  for (let y = 0; y < h; y += gap) {
    for (let x = 0; x < w; x += gap) {
      if (data[(y * w + x) * 4 + 3] > 128) {
        // small jitter so the letterforms don't look like a rigid grid
        points.push([x + (Math.random() - 0.5) * gap, y + (Math.random() - 0.5) * gap]);
      }
    }
  }
  return { points, w, h };
}
