// ============================================
// CANVAS 2D POINT-CLOUD RENDERER
// Both visual effects on this site are perspective-projected coloured dots —
// a warping starfield, a word made of particles, and a drifting background
// field. Three.js did that with ~505 kB (125 kB gzipped) of scene graph,
// material and shader machinery; this file does the same job in a few hundred
// bytes, using the same pinhole projection and additive blending.
//
// World space matches the Three.js setup it replaces: a camera on +Z looking
// at the origin, vertical FOV in degrees, Y up.
// ============================================

export class PointRenderer {
  constructor(canvas, { fov = 70, cameraZ = 6 } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.fov = fov;
    this.cam = { x: 0, y: 0, z: cameraZ };
    this.dpr = 1;
    this.resize();
  }

  resize() {
    // Cap the device pixel ratio: these are soft glowing dots, so rendering
    // beyond 2x costs fill rate for no visible gain.
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = Math.max(window.innerHeight, 1);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    // Focal length in CSS pixels, from the vertical field of view.
    this.focal = this.h / 2 / Math.tan((this.fov * Math.PI) / 360);
    // Point size attenuates by half-height rather than focal length, matching
    // the formula the WebGL point shader used (gl_PointSize *= scale / -z,
    // where scale is half the drawing-buffer height). Keeping the two separate
    // is what preserves the original dot scale.
    this.sizeScale = this.h / 2;
  }

  clear() {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.clearRect(0, 0, this.w, this.h);
  }

  /**
   * Draw a packed xyz Float32Array as additive dots.
   *
   * @param {Float32Array} pos     flat [x,y,z, x,y,z, ...]
   * @param {number}       count   number of points to read
   * @param {object}       opts    colour, size (world units), opacity, and an
   *                               optional transform applied per point
   */
  draw(pos, count, { color, size = 0.05, opacity = 1, rotX = 0, rotY = 0 } = {}) {
    if (opacity <= 0.005) return;
    const { ctx, focal, sizeScale, cam } = this;
    const cx = this.w / 2;
    const cy = this.h / 2;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // 'lighter' is Canvas2D's additive blend — the equivalent of
    // THREE.AdditiveBlending, so overlapping dots bloom the same way.
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = color;

    const sinY = rotY ? Math.sin(rotY) : 0;
    const cosY = rotY ? Math.cos(rotY) : 1;
    const sinX = rotX ? Math.sin(rotX) : 0;
    const cosX = rotX ? Math.cos(rotX) : 1;

    for (let i = 0; i < count; i++) {
      let x = pos[i * 3];
      let y = pos[i * 3 + 1];
      let z = pos[i * 3 + 2];

      if (rotY) {
        const nx = x * cosY + z * sinY;
        z = z * cosY - x * sinY;
        x = nx;
      }
      if (rotX) {
        const ny = y * cosX - z * sinX;
        z = z * cosX + y * sinX;
        y = ny;
      }

      // Depth in front of the camera; anything at or behind it is skipped.
      const d = cam.z - z;
      if (d <= 0.06) continue;

      const k = focal / d;
      const sx = cx + (x - cam.x) * k;
      const sy = cy - (y - cam.y) * k;
      const s = (size * sizeScale) / d;
      if (s < 0.35 || sx < -s || sy < -s || sx > this.w + s || sy > this.h + s) continue;

      // Sub-pixel dots would vanish with fillRect, so fade them in by alpha
      // instead — this is what keeps the distant field looking like dust.
      ctx.globalAlpha = s < 1 ? opacity * s : opacity;
      const half = s / 2;
      ctx.fillRect(sx - half, sy - half, s, s);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// Random points in a box, matching the old THREE.BufferGeometry fields.
export function makeField(count, spreadXY, spreadZ) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spreadXY;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spreadXY;
    pos[i * 3 + 2] = (Math.random() - 0.5) * spreadZ;
  }
  return pos;
}
