// Generate the golden-ratio "x-ray" spiral -> public/assets/img/hero-xray.svg
// Glowing green filaments following the φ spiral. Deterministic (seeded).
// Usage: node scripts/make-xray.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PHI = 1.6180339887;
function fitter(all, size = 100, pad = 12) {
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  for (const p of all) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); }
  const w = c - a || 1, h = d - b || 1, s = (size - 2 * pad) / Math.max(w, h);
  const ox = (size - w * s) / 2 - a * s, oy = (size - h * s) / 2 - b * s;
  return (p) => [p[0] * s + ox, p[1] * s + oy];
}
function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function xrayArcs(fibs) {
  let x = 0, y = 0, h = 0; const arcs = [], sq = [];
  for (const r of fibs) {
    const cx = x + r * Math.cos(h - Math.PI / 2), cy = y + r * Math.sin(h - Math.PI / 2), a0 = Math.atan2(y - cy, x - cx), a1 = a0 - Math.PI / 2, start = [x, y];
    arcs.push({ cx, cy, r, a0, a1 }); x = cx + r * Math.cos(a1); y = cy + r * Math.sin(a1);
    sq.push([[cx, cy], start, [start[0] + x - cx, start[1] + y - cy], [x, y]]); h -= Math.PI / 2;
  }
  return { arcs, sq };
}
function xray() {
  const { arcs, sq } = xrayArcs([1, 1, 2, 3, 5, 8]);
  const allPts = [...sq.flat()];
  for (const A of arcs) for (let i = 0; i <= 8; i++) { const a = A.a0 + (A.a1 - A.a0) * i / 8; allPts.push([A.cx + A.r * Math.cos(a), A.cy + A.r * Math.sin(a)]); }
  const F = fitter(allPts, 100, 9), R = rng(11);
  const line = (arr) => arr.map((p, i) => { const q = F(p); return `${i ? 'L' : 'M'} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`; }).join(' ');
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of sq.flat()) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); }
  let out = '';
  out += `<path d="${line([[a, b], [c, b], [c, d], [a, d], [a, b]])}" fill="none" stroke="#3ad06a" stroke-width=".5" opacity=".4"/>`;
  out += sq.map((s) => `<path d="${line(s.concat([s[0]]))}" fill="none" stroke="#3ad06a" stroke-width=".4" opacity=".25"/>`).join('');
  for (const A of arcs) {
    const band = A.r * 0.32, fils = 22, steps = 30;
    for (let f = 0; f < fils; f++) {
      const off = (f / (fils - 1) - 0.5) * 2 * band, op = (0.13 + 0.38 * (1 - Math.abs(off) / (band || 1))) * (0.6 + 0.7 * R());
      let dd = '';
      for (let i = 0; i <= steps; i++) { const t = A.a0 + (A.a1 - A.a0) * i / steps, jit = Math.sin(i * 0.45 + f * 1.7) * 0.05 * A.r + (R() - 0.5) * 0.035 * A.r, rr = A.r + off + jit, q = F([A.cx + rr * Math.cos(t), A.cy + rr * Math.sin(t)]); dd += `${i ? 'L' : 'M'} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`; }
      out += `<path d="${dd}" fill="none" stroke="#4be07f" stroke-width=".55" stroke-linejoin="round" stroke-linecap="round" opacity="${op.toFixed(2)}"/>`;
    }
  }
  out += sq.map((s) => { const q = F(s[0]); return `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="1" fill="#c8ffdb"/>`; }).join('');
  return `<defs><filter id="xg" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="1" result="bb"/><feMerge><feMergeNode in="bb"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#xg)">${out}</g>`;
}

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${xray()}</svg>`;
writeFileSync(join(ROOT, 'public/assets/img/hero-xray.svg'), svg);
console.log('wrote public/assets/img/hero-xray.svg');
