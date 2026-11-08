// ============================================
// MOTION PREFERENCE
// ============================================

export function prefersReducedMotion() {
  return !!(
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
