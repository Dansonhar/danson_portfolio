// ============================================
// CUSTOM CURSOR
// A small solid dot that tracks the pointer exactly, plus a larger ring
// that trails with easing and grows when hovering interactive elements.
// Desktop-only (devices with a fine pointer + hover); touch keeps native.
// ============================================
export function initCursor() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine) return;

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(ring);
  document.body.appendChild(dot);
  document.body.classList.add('has-custom-cursor');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let visible = false;

  window.addEventListener(
    'mousemove',
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      if (!visible) {
        visible = true;
        dot.classList.add('is-visible');
        ring.classList.add('is-visible');
      }
    },
    { passive: true }
  );

  // Hide when the pointer leaves the window; show again on enter.
  document.addEventListener('mouseleave', () => {
    dot.classList.remove('is-visible');
    ring.classList.remove('is-visible');
    visible = false;
  });

  // Grow the ring over clickable things.
  const interactive = 'a, button, .btn, [data-lightbox], .filter-btn, .gallery__thumb, input, textarea, label';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactive)) ring.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactive)) ring.classList.remove('is-hover');
  });

  // Press feedback.
  document.addEventListener('mousedown', () => ring.classList.add('is-down'));
  document.addEventListener('mouseup', () => ring.classList.remove('is-down'));

  // Eased ring follow.
  (function loop() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(loop);
  })();
}
