import type { Painter } from '../canvas';
import { INK, type Ramp } from '../animals/kit';

// Kit de pixel art dos animais na exploração (quadro 32×32, vista de cima 3/4, olhando para a direita).
// Mesma ideia do kit da captura: máscaras + preenchimento com contorno colorido, luz de recorte e sombra.

export const W = 32;
export type M = Uint8Array;
export type P = [number, number];

const inb = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < W;
const mk = (): M => new Uint8Array(W * W);
function build(test: (x: number, y: number) => boolean): M {
  const m = mk();
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (test(x + 0.5, y + 0.5)) m[y * W + x] = 1;
  return m;
}

export const ell = (cx: number, cy: number, rx: number, ry: number): M => build((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1);
export const rect = (x: number, y: number, w: number, h: number): M => build((px, py) => px >= x && px <= x + w && py >= y && py <= y + h);
export const cap = (x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): M =>
  build((x, y) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / l2));
    return Math.hypot(x - (x0 + dx * t), y - (y0 + dy * t)) <= r0 + (r1 - r0) * t;
  });
export function poly(pts: P[]): M {
  return build((x, y) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  });
}
export const uni = (...ms: M[]): M => {
  const out = mk();
  for (const m of ms) for (let k = 0; k < out.length; k++) out[k] |= m[k];
  return out;
};
export const and = (a: M, b: M): M => a.map((v, k) => (v && b[k] ? 1 : 0)) as M;
export const sub = (a: M, b: M): M => a.map((v, k) => (v && !b[k] ? 1 : 0)) as M;
/** Corpo de cobra/peixe/cauda: cápsulas encadeadas [x, y, raio]. */
export function path(pts: [number, number, number][]): M {
  const out = mk();
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0, r0] = pts[i];
    const [x1, y1, r1] = pts[i + 1];
    const m = cap(x0, y0, r0, x1, y1, r1);
    for (let k = 0; k < out.length; k++) out[k] |= m[k];
  }
  return out;
}

export interface Fill {
  ol?: boolean | string;
  rim?: boolean;
  flat?: boolean;
}

export class Spr {
  readonly g: (string | null)[] = new Array(W * W).fill(null);
  put(x: number, y: number, c: string): this {
    x = Math.round(x);
    y = Math.round(y);
    if (inb(x, y)) this.g[y * W + x] = c;
    return this;
  }
  dots(c: string, ...pts: P[]): this {
    for (const [x, y] of pts) this.put(x, y, c);
    return this;
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string): this {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.put(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
    return this;
  }
  paint(m: M, c: string): this {
    for (let k = 0; k < m.length; k++) if (m[k]) this.g[k] = c;
    return this;
  }
  paintIn(clip: M, m: M, c: string): this {
    return this.paint(and(clip, m), c);
  }
  outline(m: M, c: string): this {
    for (let y = 0; y < W; y++)
      for (let x = 0; x < W; x++) {
        if (m[y * W + x]) continue;
        if ((x > 0 && m[y * W + x - 1]) || (x < W - 1 && m[y * W + x + 1]) || (y > 0 && m[(y - 1) * W + x]) || (y < W - 1 && m[(y + 1) * W + x]))
          this.g[y * W + x] = c;
      }
    return this;
  }
  /**
   * Preenche com contorno, luz de recorte em cima (de onde vem a luz), meio-tom no topo
   * e sombra na borda de baixo/direita. Em 32 px, um pixel de cada faixa basta.
   */
  fill(m: M, r: Ramp, o: Fill = {}): this {
    if (o.ol !== false) this.outline(m, typeof o.ol === 'string' ? o.ol : r.ol);
    const has = (x: number, y: number) => inb(x, y) && m[y * W + x] === 1;
    for (let y = 0; y < W; y++)
      for (let x = 0; x < W; x++) {
        if (!m[y * W + x]) continue;
        let c = r.md;
        if (!o.flat) {
          if (!has(x, y + 1) || !has(x + 1, y + 1)) c = r.sh;
          else if (!has(x, y - 1)) c = o.rim === false ? r.hi : r.rim;
          else if (!has(x, y - 2) || !has(x - 1, y - 1)) c = r.hi;
          if (c === r.md && !has(x, y + 2)) c = r.sh;
        }
        this.g[y * W + x] = c;
      }
    return this;
  }
  emit(p: Painter): void {
    for (let y = 0; y < W; y++)
      for (let x = 0; x < W; x++) {
        const c = this.g[y * W + x];
        if (c) p.px(x, y, c);
      }
  }
}

/** Sombra suave no chão (desenhada direto no Painter, antes do animal), como a do explorador. */
export function shadow(p: Painter, cx: number, w: number, y = 28, alpha = 1): void {
  const a1 = (0.28 * alpha).toFixed(2);
  const a2 = (0.16 * alpha).toFixed(2);
  const hw = Math.round(w / 2);
  p.rect(cx - hw, y, hw * 2, 1, `rgba(4,32,46,${a1})`);
  p.rect(cx - hw + 2, y + 1, Math.max(2, hw * 2 - 4), 1, `rgba(4,32,46,${a2})`);
  p.rect(cx - hw + 1, y - 1, Math.max(2, hw * 2 - 2), 1, `rgba(4,32,46,${a2})`);
}

/** Olho de 1–2 px com brilho. */
export function eye(s: Spr, x: number, y: number, big = false, iris = INK, blink = false): void {
  if (blink) {
    s.put(x, y, INK);
    if (big) s.put(x + 1, y, INK);
    return;
  }
  if (big) {
    s.dots(INK, [x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]);
    s.put(x + 1, y + 1, iris);
    s.put(x, y, '#ffffff');
  } else s.put(x, y, iris);
}

/** Ondulação de superfície d'água em volta de quem nada (linha de anéis claros + reflexo). */
export function ripple(p: Painter, cx: number, w: number, f: number, y = 27): void {
  const k = f % 2;
  const hw = Math.round(w / 2) + k;
  p.rect(cx - hw + 1, y, hw * 2 - 2, 1, 'rgba(200,246,255,0.55)');
  p.rect(cx - hw - 1, y + 1, 3, 1, 'rgba(156,230,244,0.85)');
  p.rect(cx + hw - 2, y + 1, 3, 1, 'rgba(156,230,244,0.85)');
  p.rect(cx - hw - 3 - k, y + 2, 3, 1, 'rgba(120,200,230,0.6)');
  p.rect(cx + hw + k, y + 2, 3, 1, 'rgba(120,200,230,0.6)');
  p.rect(cx - hw + 2, y + 2, hw * 2 - 4, 1, 'rgba(10,60,100,0.25)');
}
