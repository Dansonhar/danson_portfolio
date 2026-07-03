// ============================================
// THREE.JS SCROLL BACKGROUND
// A fixed particle field that the camera travels through as you scroll,
// with subtle mouse parallax. Sits behind all page content.
// ============================================
import * as THREE from 'three';

export function initThreeBackground() {
  // Skip the animated version for users who prefer reduced motion.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.createElement('canvas');
  canvas.className = 'bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  const BASE_Z = 6;
  camera.position.z = BASE_Z;

  // ---- Particle field ----------------------------------------------------
  // Two layers: bright green accents + dimmer neutral dust for depth.
  function makeLayer(count, spreadXY, spreadZ, color, size, opacity, additive) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spreadXY;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spreadXY;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spreadZ;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color,
      size,
      sizeAttenuation: true,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    return points;
  }

  const green = makeLayer(900, 16, 44, 0xb8ff2b, 0.05, 0.55, true);
  const dust = makeLayer(700, 18, 44, 0x8a8a8a, 0.035, 0.35, false);

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

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- Render loop --------------------------------------------------------
  const clock = new THREE.Clock();
  let rafId = null;

  function renderFrame() {
    const t = clock.getElapsedTime();

    // Slow ambient drift + scroll-driven rotation.
    green.rotation.y = t * 0.02 + scrollProgress * 0.9;
    green.rotation.x = scrollProgress * 0.35;
    dust.rotation.y = -t * 0.015 - scrollProgress * 0.6;

    // Mouse parallax (eased) + travel deeper into the field on scroll.
    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (-targetY - camera.position.y) * 0.04;
    camera.position.z = BASE_Z - scrollProgress * 4.5;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  function loop() {
    renderFrame();
    rafId = requestAnimationFrame(loop);
  }

  if (reduceMotion) {
    renderFrame(); // single static frame
  } else {
    loop();
    // Pause the loop when the tab is hidden to save resources.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      } else if (rafId === null) {
        loop();
      }
    });
  }
}
