// Import styles
import './style.css';

// ============================================
// SCROLL REVEAL
// ============================================
function initReveal() {
  const els = document.querySelectorAll('.reveal');
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
    sections.forEach((s) => {
      const top = s.offsetTop;
      const id = s.getAttribute('id');
      if (y >= top && y < top + s.offsetHeight) {
        allLinks.forEach((l) =>
          l.classList.toggle('active', l.getAttribute('href') === `#${id}`)
        );
      }
    });
  });
}

// ============================================
// PORTFOLIO FILTER
// ============================================
function initFilters() {
  const btns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project');

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      btns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;

      cards.forEach((card, i) => {
        const show = f === 'all' || card.dataset.category === f;
        if (show) {
          card.classList.remove('hidden');
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.transition = 'opacity .45s ease, transform .45s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, i * 70);
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

// ============================================
// STAT COUNTERS
// ============================================
function initCounters() {
  const nums = document.querySelectorAll('.stat__number');
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
// SKILL BARS
// ============================================
function initSkillBars() {
  const fills = document.querySelectorAll('.skill-fill');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );
  fills.forEach((f) => observer.observe(f));
}

// ============================================
// CONTACT FORM
// ============================================
function initForm() {
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const span = btn.querySelector('span');
    const orig = span.textContent;
    span.textContent = 'Sent!';
    btn.style.background = '#22c55e';
    setTimeout(() => {
      span.textContent = orig;
      btn.style.background = '';
      form.reset();
    }, 2500);
  });
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const t = document.querySelector(a.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// ============================================
// HERO ENTRANCE ANIMATION
// ============================================
function initHeroAnim() {
  // Stagger hero text elements
  const els = [
    document.querySelector('.hero__badge'),
    document.querySelector('.hero__title'),
    document.querySelector('.hero__subtitle-row'),
    document.querySelector('.hero__actions'),
  ].filter(Boolean);

  els.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(50px)';
    el.style.transition = `opacity .7s ease ${0.15 + i * 0.12}s, transform .7s ease ${0.15 + i * 0.12}s`;
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  });

  // Mockups fly in
  const mockups = document.querySelectorAll('.mockup');
  mockups.forEach((m, i) => {
    const origTransform = getComputedStyle(m).transform;
    m.style.opacity = '0';
    m.style.transition = `opacity .8s ease ${0.4 + i * 0.15}s, transform .8s ease ${0.4 + i * 0.15}s`;
    m.style.transform += ' translateX(80px)';
    requestAnimationFrame(() => {
      m.style.opacity = '1';
      m.style.transform = '';
    });
  });
}

// ============================================
// FLOATING MOCKUP SUBTLE ANIMATION
// ============================================
function initMockupFloat() {
  const mockups = document.querySelectorAll('.mockup');
  let frame;

  function animate() {
    const t = Date.now() / 1000;
    mockups.forEach((m, i) => {
      const offset = i * 1.2;
      const y = Math.sin(t * 0.6 + offset) * 8;
      const baseRotation = ['-4', '6', '-8'][i] || '0';
      m.style.transform = `rotate(${baseRotation}deg) translateY(${y}px)`;
    });
    frame = requestAnimationFrame(animate);
  }

  // Start after entrance animation
  setTimeout(animate, 1600);
}

// ============================================
// LIGHTBOX — generic, works for any project
// ============================================
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

    // Load thumbnails for this project now (deferred from page load)
    panel.querySelectorAll('.gallery__thumb img[data-src]').forEach((img) => {
      if (img.src !== img.dataset.src) img.src = img.dataset.src;
    });

    images = Array.from(panel.querySelectorAll('.gallery__thumb img')).map(
      (img) => img.dataset.src || img.src
    );
    const totalEl = panel.querySelector('.gallery__total');
    if (totalEl) totalEl.textContent = images.length;

    goTo(0);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    activePanel = null;
  }

  function goTo(index) {
    if (!activePanel || images.length === 0) return;
    currentIndex = (index + images.length) % images.length;

    const mainImg = activePanel.querySelector('.gallery__main-img');
    const currentEl = activePanel.querySelector('.gallery__current');

    if (mainImg) {
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
  if (!overlay) return;

  function openZoom(src, alt) {
    zoomImg.src = src;
    zoomImg.alt = alt || '';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeZoom() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (e) => {
    const img = e.target.closest('.gallery__main-img');
    if (img) openZoom(img.src, img.alt);
  });

  closeBtn.addEventListener('click', closeZoom);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeZoom();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeZoom();
  });
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initHeroAnim();
  initMockupFloat();
  initReveal();
  initNav();
  initFilters();
  initCounters();
  initSkillBars();
  initForm();
  initScroll();
  initLightbox();
  initZoom();
});
