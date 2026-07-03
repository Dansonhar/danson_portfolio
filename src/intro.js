// ============================================
// THREE.JS INTRO / OPENING ANIMATION
// Plays on every page load:
//   1. Hyperspace particle warp rushes past the camera
//   2. Particles converge to spell "DANSON"
//   3. A brief hold + shimmer
//   4. Everything zooms through the camera and dissolves, revealing the site
// Click / tap / any key skips ahead. Respects prefers-reduced-motion.
// ============================================
import * as THREE from 'three';

const NAME = 'DANSON';

// Timeline (seconds)
const FORM_START = 0.45;
const WARP_FADE_START = 0.5;
const WARP_FADE_END = 1.7;
const FORM_END = 2.5;
const HOLD_END = 3.3;
const OUT_END = 4.15;

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

    // Skip the whole thing for reduced-motion users.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      fireReveal();
      resolve();
      return;
    }

    // ---- Overlay + canvas -------------------------------------------------
    const overlay = document.createElement('div');
    overlay.className = 'intro-overlay';
    const canvas = document.createElement('canvas');
    overlay.appendChild(canvas);
    const skipBtn = document.createElement('button');
    skipBtn.className = 'intro-skip';
    skipBtn.textContent = 'Skip Intro';
    overlay.appendChild(skipBtn);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch (e) {
      // WebGL unavailable — bail gracefully.
      cleanup(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, aspect(), 0.1, 100);
    camera.position.z = 6;
    camera.lookAt(0, 0, 0);

    function aspect() {
      return window.innerWidth / Math.max(window.innerHeight, 1);
    }
    function resize() {
      camera.aspect = aspect();
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
    window.addEventListener('resize', resize);
    resize();

    // ---- Warp starfield ---------------------------------------------------
    const WARP_COUNT = 1400;
    const warpPos = new Float32Array(WARP_COUNT * 3);
    for (let i = 0; i < WARP_COUNT; i++) {
      warpPos[i * 3] = (Math.random() - 0.5) * 10;
      warpPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      warpPos[i * 3 + 2] = -Math.random() * 42 + 6;
    }
    const warpGeo = new THREE.BufferGeometry();
    warpGeo.setAttribute('position', new THREE.BufferAttribute(warpPos, 3));
    const warpMat = new THREE.PointsMaterial({
      color: 0x9dff3d,
      size: 0.07,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const warp = new THREE.Points(warpGeo, warpMat);
    scene.add(warp);

    // ---- Text particles (built after fonts are ready) ---------------------
    let textPoints = null;
    let textMat = null;
    let start = null; // Float32Array scattered origins
    let target = null; // Float32Array text positions
    let curr = null; // Float32Array current, bound to geometry
    let phase = null; // per-particle random for shimmer
    let COUNT = 0;

    function buildText() {
      const sample = sampleText(NAME);
      if (!sample || sample.points.length === 0) return;

      const raw = sample.points;
      // Fit the word into world space (responsive).
      const visibleH = 2 * camera.position.z * Math.tan((70 * Math.PI) / 360);
      const maxW = visibleH * aspect() * 0.82;
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

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(curr, 3));
      textMat = new THREE.PointsMaterial({
        color: 0xd6ff70,
        size: 0.055,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      textPoints = new THREE.Points(geo, textMat);
      scene.add(textPoints);
    }

    // ---- Skip / finish ----------------------------------------------------
    let elapsed = 0; // seconds since the loop started (own accumulator)
    let skipFrom = null; // elapsed time when skip pressed
    function doSkip() {
      if (skipFrom !== null) return;
      skipFrom = elapsed;
    }
    skipBtn.addEventListener('click', doSkip);
    overlay.addEventListener('click', doSkip);
    const keyHandler = () => doSkip();
    window.addEventListener('keydown', keyHandler);

    let finished = false;
    function cleanup(immediate) {
      if (finished) return;
      finished = true;
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', keyHandler);
      fireReveal();
      const remove = () => {
        try {
          renderer && renderer.dispose();
        } catch (e) {}
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

    // ---- Render loop ------------------------------------------------------
    const clock = new THREE.Clock();
    let rafId = null;
    // Safety net: never trap the user behind the overlay.
    const safety = setTimeout(() => cleanup(true), 9000);

    function frame() {
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      let t = elapsed;
      // When skipping, fast-forward time toward the out phase.
      if (skipFrom !== null) {
        t = HOLD_END + (elapsed - skipFrom) * 3.2;
      }

      // Warp motion + fade
      const wOpacity =
        1 - clamp((t - WARP_FADE_START) / (WARP_FADE_END - WARP_FADE_START));
      warpMat.opacity = 0.9 * wOpacity;
      const speed = 26;
      const arr = warpGeo.attributes.position.array;
      if (wOpacity > 0.01) {
        for (let i = 0; i < WARP_COUNT; i++) {
          arr[i * 3 + 2] += speed * dt;
          if (arr[i * 3 + 2] > 7) {
            arr[i * 3] = (Math.random() - 0.5) * 10;
            arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
            arr[i * 3 + 2] -= 46;
          }
        }
        warpGeo.attributes.position.needsUpdate = true;
        warp.visible = true;
      } else {
        warp.visible = false;
      }

      // Text: form -> hold -> out
      if (textPoints) {
        const form = easeOutCubic(
          clamp((t - FORM_START) / (FORM_END - FORM_START))
        );
        const out = clamp((t - HOLD_END) / (OUT_END - HOLD_END));
        const outE = easeInCubic(out);

        const pos = textPoints.geometry.attributes.position.array;
        for (let k = 0; k < COUNT; k++) {
          const i = k * 3;
          let x = lerp(start[i], target[i], form);
          let y = lerp(start[i + 1], target[i + 1], form);
          let z = lerp(start[i + 2], target[i + 2], form);

          // Shimmer once formed
          const sh = (1 - form) * 0.0 + form * 0.03;
          y += Math.sin(t * 2.2 + phase[k]) * sh;
          x += Math.cos(t * 1.8 + phase[k]) * sh;

          // Out phase: burst toward camera + spread outward
          if (out > 0) {
            z += outE * 11;
            x *= 1 + outE * 1.4;
            y *= 1 + outE * 1.4;
          }
          pos[i] = x;
          pos[i + 1] = y;
          pos[i + 2] = z;
        }
        textPoints.geometry.attributes.position.needsUpdate = true;
        textMat.opacity = clamp(form * 1.1) * (1 - easeInCubic(out));

        // gentle camera drift for depth during the hold
        camera.position.x = Math.sin(t * 0.3) * 0.15 * form * (1 - out);
        camera.position.y = Math.cos(t * 0.25) * 0.1 * form * (1 - out);
        camera.lookAt(0, 0, 0);

        // Kick off the site reveal + start fading the overlay near the end.
        if (out > 0.02) fireReveal();
        if (out >= 1) {
          renderer.render(scene, camera);
          clearTimeout(safety);
          cleanup(false);
          return;
        }
        // Fade the black overlay away over the tail of the out phase.
        overlay.style.background =
          out > 0.35
            ? `rgba(5,5,5,${(1 - (out - 0.35) / 0.65).toFixed(3)})`
            : '#050505';
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(frame);
    }

    // Build text once the brand font is ready, then start rendering.
    ensureFont().then(() => {
      buildText();
      // If sampling failed for any reason, still run the warp + a timed reveal.
      clock.start();
      frame();
      if (!textPoints) {
        setTimeout(() => cleanup(false), 1600);
      }
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
    .load("900 200px 'Space Grotesk'")
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
