// ============================================
// MOTION / CAPABILITY GATES
// Deliberately dependency-free and tiny: main.js consults these BEFORE
// importing either animation module, so visitors who would not see an effect
// never download the code for it.
// ============================================

const SEEN_KEY = 'danson:intro-seen';
const SEEN_TTL = 12 * 60 * 60 * 1000; // replay after 12h, not on every reload

export function prefersReducedMotion() {
  return !!(
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function introParam() {
  try {
    return new URLSearchParams(window.location.search).get('intro');
  } catch (e) {
    return null;
  }
}

export function shouldPlayIntro() {
  const forced = introParam();
  if (forced === '1') return true;
  if (forced === '0') return false;

  if (prefersReducedMotion()) return false;

  try {
    const seen = Number(window.localStorage.getItem(SEEN_KEY));
    if (seen && Date.now() - seen < SEEN_TTL) return false;
  } catch (e) {
    // Private mode / storage blocked — play it, but never let this throw.
  }
  return true;
}

export function markIntroSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch (e) {}
}

// The scroll background is pure decoration. It is the single most expensive
// thing on the page, so it is desktop-only: small screens are the most likely
// to be on a metered connection and a battery, and they gain nothing from it.
export function shouldLoadBackground() {
  if (prefersReducedMotion()) return false;
  if (window.innerWidth < 1024) return false;
  // Respect an explicit data-saver signal where the browser exposes one.
  const conn = navigator.connection;
  if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return false;
  // A very low core count usually means the particle loop would cost more than
  // it is worth.
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return false;
  return true;
}
