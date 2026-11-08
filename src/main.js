// Import styles
import './style.css';
import { prefersReducedMotion } from './motion.js';

// Always land at the top (Home) on load/refresh — stop the browser from
// restoring the previous scroll position.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// ============================================
// HERO ENTRANCE
// ============================================
function initHero() {
  if (prefersReducedMotion()) return;
  document.querySelectorAll('[data-hero]').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 1s cubic-bezier(.2,.7,.2,1) ${0.1 + i * 0.12}s, transform 1s cubic-bezier(.2,.7,.2,1) ${0.1 + i * 0.12}s`;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      })
    );
  });
}

// ============================================
// LOCAL TIME — Kuala Lumpur
// ============================================
function initClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    hour: '2-digit',
    minute: '2-digit',
  });
  const tick = () => (el.textContent = fmt.format(new Date()));
  tick();
  setInterval(tick, 15000);
}

// ============================================
// INDEX HOVER PREVIEW
// A screenshot follows the pointer over the project index. Desktop pointers
// only; touch screens get the inline thumbnail instead (see style.css).
// ============================================
function initPreview() {
  const box = document.getElementById('preview');
  if (!box || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const img = box.querySelector('img');
  let x = 0, y = 0, cx = 0, cy = 0, raf = null;

  function loop() {
    // Ease toward the pointer so the preview trails it slightly.
    cx += (x - cx) * 0.18;
    cy += (y - cy) * 0.18;
    box.style.transform = `translate3d(${cx + 28}px, ${cy - 110}px, 0)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.5 ? requestAnimationFrame(loop) : null;
  }
  function move(e) {
    x = e.clientX;
    y = e.clientY;
    if (!raf) raf = requestAnimationFrame(loop);
  }

  document.querySelectorAll('.row[data-preview]').forEach((row) => {
    row.addEventListener('mouseenter', (e) => {
      if (img.getAttribute('src') !== row.dataset.preview) img.src = row.dataset.preview;
      if (!box.classList.contains('on')) {
        // Jump straight to the pointer on first show instead of sliding in.
        cx = x = e.clientX;
        cy = y = e.clientY;
        loop();
      }
      box.classList.add('on');
    });
    row.addEventListener('mousemove', move);
    row.addEventListener('mouseleave', () => box.classList.remove('on'));
    row.addEventListener('click', () => box.classList.remove('on'));
  });
}

// ============================================
// SCROLL REVEAL
// ============================================
function initReveal() {
  const els = document.querySelectorAll('.reveal');

  // No IntersectionObserver (or reduced motion): show the content outright
  // rather than leaving it stuck at opacity 0.
  if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
    els.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );
  els.forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.04}s`;
    observer.observe(el);
  });
}

// ============================================
// NAVBAR
// ============================================
function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  const allLinks = document.querySelectorAll('.nav__link');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 50);
  });

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    links.classList.toggle('open');
  });

  allLinks.forEach((l) =>
    l.addEventListener('click', () => {
      toggle.classList.remove('active');
      links.classList.remove('open');
    })
  );

  // Active on scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const y = window.scrollY + 120;

    // The current section is the last one whose top we've scrolled past.
    let currentId = sections[0] ? sections[0].getAttribute('id') : null;
    sections.forEach((s) => {
      if (y >= s.offsetTop) currentId = s.getAttribute('id');
    });

    // At the very bottom of the page, always highlight the last section
    // (a short final section like Contact may never reach the threshold otherwise).
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
      currentId = sections[sections.length - 1].getAttribute('id');
    }

    allLinks.forEach((l) =>
      l.classList.toggle('active', l.getAttribute('href') === `#${currentId}`)
    );
  });
}

// ============================================
// PORTFOLIO FILTER
// ============================================
function initFilters() {
  const btns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project');
  const more3D = document.getElementById('workMore3D');

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      btns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;

      // Show the "View More 3D Projects" button only on the 3D Design filter.
      if (more3D) more3D.hidden = f !== 'design';

      const still = prefersReducedMotion();
      let shown = 0;
      cards.forEach((card) => {
        const show = f === 'all' || card.dataset.category === f;
        if (show) {
          const order = shown++;
          card.classList.remove('hidden');
          if (still) {
            card.style.opacity = '';
            card.style.transform = '';
            return;
          }
          card.style.opacity = '0';
          card.style.transform = 'translateY(12px)';
          setTimeout(() => {
            card.style.transition = 'opacity .45s ease, transform .45s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, order * 45);
        } else {
          card.classList.add('hidden');
        }
      });

      // The little count next to "Index" follows the filter.
      const count = document.getElementById('workCount');
      if (count) count.textContent = shown;
    });
  });
}

// ============================================
// STAT COUNTERS
// ============================================
function initCounters() {
  const nums = document.querySelectorAll('.stat__number');

  // Keep the Projects stat in sync with the actual number of project cards.
  // The markup ships the real number so no-JS visitors never read "0"; this only
  // corrects it when cards are added or removed.
  const projectsStat = document.querySelector('.stat__number[data-count="projects"]');
  if (projectsStat) {
    const total = document.querySelectorAll('.work__grid .project').length;
    if (total > 0) {
      projectsStat.dataset.target = String(total);
      projectsStat.textContent = String(total);
    }
  }

  // Reduced motion: show the final figures, skip the count-up entirely.
  if (prefersReducedMotion()) {
    nums.forEach((n) => {
      if (n.dataset.target) n.textContent = n.dataset.target;
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = +el.dataset.target;
          animateCount(el, target);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );
  nums.forEach((n) => observer.observe(n));
}

function animateCount(el, target) {
  const dur = 1400;
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      // A bare "#" is the logo's back-to-top link; querySelector('#') throws.
      if (href === '#') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        return;
      }
      e.preventDefault();
      const t = document.querySelector(href);
      if (t) {
        t.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      }
    });
  });
}

// ============================================
// LIGHTBOX — generic, works for any project
// ============================================

// './images/AlcPest/home.webp' -> './images/opt/AlcPest-home-t240.webp'.
// Must match outName() for 'thumb' in scripts/optimize-images.js.
function thumbSrc(src) {
  const rel = src.replace(/^\.\/images\//, '').replace(/\.(webp|png|jpe?g)$/i, '');
  return `./images/opt/${rel.replace(/\//g, '-')}-t240.webp`;
}

function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const backdrop = document.getElementById('lightboxBackdrop');
  const closeBtn = document.getElementById('lightboxClose');

  let activePanel = null;
  let images = [];
  let currentIndex = 0;

  function openLightbox(projectId) {
    document.querySelectorAll('.lightbox__content').forEach((c) => c.classList.remove('active'));
    const panel = document.querySelector(`.lightbox__content[data-project="${projectId}"]`);
    if (!panel) return;

    panel.classList.add('active');
    activePanel = panel;

    // Load thumbnails for this project now (deferred from page load). They use
    // small pre-cropped derivatives — decoding every full-size screenshot just
    // to fill 120px buttons froze the page on open. data-src stays the full
    // image for the main view.
    panel.querySelectorAll('.gallery__thumb img[data-src]').forEach((img) => {
      if (img.dataset.loaded) return;
      img.dataset.loaded = '1';
      img.decoding = 'async';
      img.onerror = () => {
        img.onerror = null;
        img.src = img.dataset.src;
      };
      img.src = thumbSrc(img.dataset.src);
    });

    images = Array.from(panel.querySelectorAll('.gallery__thumb img')).map(
      (img) => img.dataset.src || img.src
    );
    const totalEl = panel.querySelector('.gallery__total');
    if (totalEl) totalEl.textContent = images.length;

    goTo(0);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Background animations check this and stop drawing while they're hidden.
    document.body.classList.add('lightbox-open');
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    document.body.classList.remove('lightbox-open');
    activePanel = null;
  }

  function goTo(index) {
    if (!activePanel || images.length === 0) return;
    currentIndex = (index + images.length) % images.length;

    const mainImg = activePanel.querySelector('.gallery__main-img');
    const currentEl = activePanel.querySelector('.gallery__current');

    if (mainImg) {
      mainImg.decoding = 'async';
      mainImg.style.opacity = '0';
      setTimeout(() => {
        mainImg.src = images[currentIndex];
        mainImg.style.opacity = '1';
      }, 150);
    }
    if (currentEl) currentEl.textContent = currentIndex + 1;

    activePanel.querySelectorAll('.gallery__thumb').forEach((t, i) => {
      t.classList.toggle('active', i === currentIndex);
    });
  }

  // Open
  document.querySelectorAll('[data-lightbox]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(btn.dataset.lightbox);
    });
  });

  // Close
  closeBtn.addEventListener('click', closeLightbox);
  backdrop.addEventListener('click', closeLightbox);

  // Nav buttons — delegated on lightbox panel
  lightbox.addEventListener('click', (e) => {
    if (e.target.closest('.gallery__nav--prev')) goTo(currentIndex - 1);
    if (e.target.closest('.gallery__nav--next')) goTo(currentIndex + 1);
    const thumb = e.target.closest('.gallery__thumb');
    if (thumb) goTo(+thumb.dataset.index);
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    // When the fullscreen zoom is open on top, let it handle the keys instead.
    const zoom = document.getElementById('zoomOverlay');
    if (zoom && zoom.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
    if (e.key === 'ArrowRight') goTo(currentIndex + 1);
  });
}

// ============================================
// ZOOM OVERLAY
// ============================================
function initZoom() {
  const overlay = document.getElementById('zoomOverlay');
  const zoomImg = document.getElementById('zoomImg');
  const closeBtn = document.getElementById('zoomClose');
  const prevBtn = document.getElementById('zoomPrev');
  const nextBtn = document.getElementById('zoomNext');
  if (!overlay) return;

  // Show the prev/next arrows only when the current project has more than one image.
  function updateNavVisibility() {
    const panel = document.querySelector('.lightbox__content.active');
    const count = panel ? panel.querySelectorAll('.gallery__thumb').length : 0;
    const hide = count <= 1;
    if (prevBtn) prevBtn.classList.toggle('zoom-overlay__nav--hidden', hide);
    if (nextBtn) nextBtn.classList.toggle('zoom-overlay__nav--hidden', hide);
  }

  function openZoom(src, alt) {
    zoomImg.classList.remove('zoom-overlay__img--portrait', 'zoom-overlay__img--landscape');
    zoomImg.src = src;
    zoomImg.alt = alt || '';
    const applyOrientation = () => {
      // Only narrow, tall images (phone/mobile screenshots) fit to viewport height.
      // Wide full-page web captures stay full-width and scroll, even when very tall.
      const mobile =
        zoomImg.naturalHeight > zoomImg.naturalWidth && zoomImg.naturalWidth <= 900;
      zoomImg.classList.toggle('zoom-overlay__img--portrait', mobile);
      // Landscape shots fit the whole screen, centred.
      zoomImg.classList.toggle(
        'zoom-overlay__img--landscape',
        zoomImg.naturalWidth >= zoomImg.naturalHeight
      );
    };
    if (zoomImg.complete && zoomImg.naturalWidth) applyOrientation();
    else zoomImg.onload = applyOrientation;
    overlay.scrollTop = 0;
    updateNavVisibility();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeZoom() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Advance the underlying gallery (keeps its state in sync) and re-sync the zoom.
  function navZoom(dir) {
    const panel = document.querySelector('.lightbox__content.active');
    if (!panel) return;
    const btn = panel.querySelector(
      dir > 0 ? '.gallery__nav--next' : '.gallery__nav--prev'
    );
    if (btn) btn.click();
    const activeThumb = panel.querySelector('.gallery__thumb.active img');
    if (activeThumb) openZoom(activeThumb.dataset.src || activeThumb.src, activeThumb.alt);
  }

  document.addEventListener('click', (e) => {
    const img = e.target.closest('.gallery__main-img');
    if (img) openZoom(img.src, img.alt);
  });

  closeBtn.addEventListener('click', closeZoom);
  if (prevBtn)
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navZoom(-1);
    });
  if (nextBtn)
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navZoom(1);
    });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeZoom();
  });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeZoom();
    if (e.key === 'ArrowLeft') navZoom(-1);
    if (e.key === 'ArrowRight') navZoom(1);
  });
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Force the top on every load: clear any #hash and reset scroll.
  if (location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  window.scrollTo(0, 0);
  // Some browsers restore scroll slightly after load — pin it to top once more.
  window.addEventListener('load', () => window.scrollTo(0, 0));

  // Each feature is independent, so isolate them: one throwing (a missing
  // element, no WebGL) must not stop the rest from wiring up. Before this
  // guard, a WebGL failure in the background left the whole page invisible.
  [
    initHero,
    initClock,
    initReveal,
    initNav,
    initFilters,
    initCounters,
    initScroll,
    initPreview,
    initLightbox,
    initZoom,
  ].forEach((init) => {
    try {
      init();
    } catch (e) {
      console.error(`${init.name} failed:`, e);
    }
  });
});
