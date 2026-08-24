// ============================================
// SCROLL BACKGROUND
// A fixed particle field the camera travels through as you scroll, with subtle
// mouse parallax. Sits behind all page content.
//
// Rendered with the Canvas2D point renderer rather than WebGL — same two
// layers, same drift and parallax, none of the Three.js payload.
// ============================================
import { PointRenderer, makeField } from './points2d.js';
import { prefersReducedMotion } from './motion.js';

const BASE_Z = 6;

export function initBackground() {
  const canvas = document.createElement('canvas');
  canvas.className = 'bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  let renderer;
  try {
    renderer = new PointRenderer(canvas, { fov: 70, cameraZ: BASE_Z });
  } catch (e) {
    // Decoration only — a missing 2D context must never break the page.
    canvas.remove();
    return;
  }

  // Two layers: bright green accents in front, dimmer neutral dust for depth.
  const green = makeField(900, 16, 44);
  const dust = makeField(700, 18, 44);

  // ---- Interaction state --------------------------------------------------
  let scrollProgress = 0;
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  let targetX = 0;
  let targetY = 0;
  window.addEventListener(
    'pointermove',
    (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 1.4;
      targetY = (e.clientY / window.innerHeight - 0.5) * 1.4;
    },
    { passive: true }
  );

  const resize = () => renderer.resize();
  window.addEventListener('resize', resize);

  // ---- Render loop --------------------------------------------------------
  const t0 = performance.now();
  let rafId = null;

  function renderFrame() {
    const t = (performance.now() - t0) / 1000;

    // Mouse parallax (eased) + travel deeper into the field on scroll.
    renderer.cam.x += (targetX - renderer.cam.x) * 0.04;
    renderer.cam.y += (-targetY - renderer.cam.y) * 0.04;
    renderer.cam.z = BASE_Z - scrollProgress * 4.5;

    renderer.clear();
    renderer.draw(dust, 700, {
      color: '#8a8a8a',
      size: 0.035,
      opacity: 0.35,
      rotY: -t * 0.015 - scrollProgress * 0.6,
    });
    renderer.draw(green, 900, {
      color: '#b8ff2b',
      size: 0.05,
      opacity: 0.55,
      rotY: t * 0.02 + scrollProgress * 0.9,
      rotX: scrollProgress * 0.35,
    });
  }

  function loop() {
    renderFrame();
    rafId = requestAnimationFrame(loop);
  }

  if (prefersReducedMotion()) {
    renderFrame(); // single static frame
    return;
  }

  loop();
  // Pause the loop when the tab is hidden to save battery.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (rafId === null) {
      loop();
    }
  });
}
