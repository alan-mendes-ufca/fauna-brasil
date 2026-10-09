import { rng, type Painter } from './canvas';

// Ferramentas de desenho compartilhadas pela arte da floresta (tiles, objetos, personagem).

/** Hash determinístico de (x, y, seed) em [0, 1). */
export function hash2(x: number, y: number, s = 0): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Paleta de volume: o = contorno, d = sombra, m = meio, l = luz, h = brilho. */
export interface Pal5 {
  o: string;
  d: string;
  m: string;
  l: string;
  h: string;
}

/** Paletas de folhagem (verdes saturados; o contorno é verde-azulado escuro, nunca preto). */
export const LEAF: Record<'dark' | 'lime' | 'teal' | 'gold', Pal5> = {
  dark: { o: '#05202e', d: '#0b3646', m: '#15683f', l: '#3ea84c', h: '#ffd27a' },
  lime: { o: '#08302c', d: '#125a3c', m: '#2f9a3a', l: '#86cc40', h: '#ffe08a' },
  teal: { o: '#04182a', d: '#0a2c44', m: '#10584c', l: '#24905a', h: '#8fd45a' },
  gold: { o: '#1e3a1c', d: '#44742a', m: '#8cb42c', l: '#d8d040', h: '#fff0a8' },
};

export interface BlobOpts {
  /** Número de lóbulos do contorno. */
  lobes?: number;
  /** Amplitude da irregularidade do contorno (fração do raio). */
  amp?: number;
  /** Desloca a luz: positivo escurece, negativo clareia. */
  bias?: number;
  /** Granulação do sombreado. */
  noise?: number;
  /** Direção da luz (padrão: topo e esquerda). */
  lx?: number;
  ly?: number;
}

/** Massa de folhas ou pedra com contorno, luz de recorte no topo-esquerdo e sombra embaixo-direita. */
export function blob(p: Painter, cx: number, cy: number, rx: number, ry: number, pal: Pal5, seed: number, o: BlobOpts = {}): void {
  const k = o.lobes ?? 6;
  const amp = o.amp ?? 0.16;
  const bias = o.bias ?? 0;
  const noise = o.noise ?? 0.4;
  const lx = o.lx ?? 0.55;
  const ly = o.ly ?? 0.85;
  const ph = hash2(seed, 7, 3) * 6.283;
  const edge = 1.15 / ((rx + ry) / 2);
  for (let y = Math.floor(cy - ry - 2); y <= Math.ceil(cy + ry + 2); y++) {
    for (let x = Math.floor(cx - rx - 2); x <= Math.ceil(cx + rx + 2); x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.hypot(dx / rx, dy / ry);
      const r = 1 + amp * Math.sin(Math.atan2(dy / ry, dx / rx) * k + ph);
      if (d > r + edge) continue;
      if (d > r) {
        p.px(x, y, pal.o);
        continue;
      }
      const s = -(dx / rx) * lx - (dy / ry) * ly - bias + (hash2(x, y, seed) - 0.5) * noise;
      p.px(x, y, s > 1.0 ? pal.h : s > 0.38 ? pal.l : s > -0.28 ? pal.m : s > -0.9 ? pal.d : pal.o);
    }
  }
}

/** Sombra projetada suave (duas elipses translúcidas) no chão. */
export function shadow(p: Painter, cx: number, cy: number, rx: number, ry: number, a = 0.3, color = '#04202e'): void {
  for (const [k, al] of [
    [1, a * 0.6],
    [0.62, a * 0.6],
  ] as const) {
    const col = rgba(color, al);
    for (let y = Math.floor(cy - ry * k); y <= Math.ceil(cy + ry * k); y++) {
      for (let x = Math.floor(cx - rx * k); x <= Math.ceil(cx + rx * k); x++) {
        const dx = (x + 0.5 - cx) / (rx * k);
        const dy = (y + 0.5 - cy) / (ry * k);
        if (dx * dx + dy * dy <= 1) p.px(x, y, col);
      }
    }
  }
}

export function disc(p: Painter, cx: number, cy: number, rx: number, ry: number, color: string): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) p.px(x, y, color);
    }
  }
}

export function line(p: Painter, x0: number, y0: number, x1: number, y1: number, color: string): void {
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
    p.px(x0, y0, color);
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
}

/** Folha alongada afilada de (x0,y0) até (x1,y1), com contorno e luz de um lado. */
export function leaf(p: Painter, x0: number, y0: number, x1: number, y1: number, w: number, pal: Pal5, bulge = 0.35): void {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;
  const steps = Math.ceil(len * 2);
  const half = (t: number) => (w / 2) * Math.sin(Math.PI * Math.min(1, (t + bulge * (1 - t)) * 0.95 + 0.04)) ** 0.7;
  for (const pass of [0, 1]) {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      const hw = half(t) + (pass === 0 ? 0.9 : 0);
      for (let s = -hw; s <= hw + 0.01; s += 0.5) {
        const px = Math.round(x + nx * s);
        const py = Math.round(y + ny * s);
        if (pass === 0) p.px(px, py, pal.o);
        else p.px(px, py, s < -hw * 0.35 ? (ny < 0 || (ny === 0 && nx < 0) ? pal.l : pal.d) : s > hw * 0.35 ? (ny < 0 || (ny === 0 && nx < 0) ? pal.d : pal.l) : pal.m);
      }
    }
  }
}

/** Corpo recortado por máscara, sombreado por uma coordenada lateral u em [-1, 1] (-1 = lado da luz). */
export class Body {
  readonly m: Uint8Array;
  readonly u: Float32Array;
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.m = new Uint8Array(w * h);
    this.u = new Float32Array(w * h);
  }
  set(x: number, y: number, u: number): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.m[y * this.w + x] = 1;
    this.u[y * this.w + x] = u;
  }
  has(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h && this.m[y * this.w + x] === 1;
  }
  /** Preenche uma faixa horizontal [x0, x1] da linha y; u vai de -1 (esquerda) a 1 (direita). */
  span(y: number, x0: number, x1: number): void {
    const n = x1 - x0;
    for (let x = x0; x <= x1; x++) this.set(x, y, n === 0 ? 0 : ((x - x0) / n) * 2 - 1);
  }
  render(p: Painter, pal: Pal5, seed: number, grain = 0.5): void {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (!this.has(x, y)) continue;
        const edge = !this.has(x - 1, y) || !this.has(x + 1, y) || !this.has(x, y - 1) || !this.has(x, y + 1);
        if (edge) {
          // O topo e o lado da luz ganham brilho em vez de contorno escuro.
          const lit = !this.has(x, y - 1) && this.u[y * this.w + x] < 0.4;
          p.px(x, y, lit ? pal.l : pal.o);
          continue;
        }
        const u = this.u[y * this.w + x] + (hash2(x, y, seed) - 0.5) * grain;
        p.px(x, y, u < -0.62 ? pal.h : u < -0.2 ? pal.l : u < 0.38 ? pal.m : u < 0.8 ? pal.d : pal.o);
      }
    }
  }
}

/** Pontinhos de luz do sol filtrado pela copa. */
export function dapples(p: Painter, seed: number, count: number, x0: number, y0: number, x1: number, y1: number): void {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(x0 + r() * (x1 - x0));
    const y = Math.floor(y0 + r() * (y1 - y0));
    p.px(x, y, '#fff4c0');
    p.px(x + 1, y, '#ffe08a');
    if (r() < 0.5) p.px(x, y + 1, '#ffd27a');
    if (r() < 0.2) p.px(x + 1, y + 1, '#f0a040');
  }
}

/** Paletas de uma copa, da parte mais iluminada à mais sombreada. */
export type CanopyPals = Record<'dark' | 'lime' | 'teal' | 'gold', Pal5>;

/** Copa de várias massas de folhas (de cima para baixo), com luz dourada a esquerda e sombra teal embaixo-direita. */
export function canopy(p: Painter, cx: number, cy: number, rx: number, ry: number, n: number, seed: number, rmin: number, rmax: number, pals: CanopyPals = LEAF, sun = true): void {
  const r = rng(seed);
  const blobs: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < n * 6 && blobs.length < n; i++) {
    const a = r() * 6.283;
    const d = Math.sqrt(r()) * 0.88;
    blobs.push({ x: cx + Math.cos(a) * d * rx, y: cy + Math.sin(a) * d * ry, r: rmin + r() * (rmax - rmin) });
  }
  blobs.sort((a, b) => a.y - b.y);
  for (const [i, b] of blobs.entries()) {
    const fx = (b.x - cx) / rx;
    const fy = (b.y - cy) / ry;
    const warm = fx * -0.7 + fy * -0.9 + (r() - 0.5) * 0.5;
    const pal = warm > 0.55 ? pals.gold : warm > 0.0 ? pals.lime : fy > 0.28 || fx * 0.6 + fy * 0.9 > 0.7 ? pals.teal : pals.dark;
    blob(p, b.x, b.y, b.r, b.r * 0.82, pal, seed + i * 13, { lobes: 5 + (i % 3), amp: 0.2, bias: fy * 0.35 + fx * 0.15, noise: 0.5 });
  }
  if (sun) dapples(p, seed + 99, Math.round(n * 0.4), cx - rx * 0.8, cy - ry * 0.8, cx + rx * 0.4, cy + ry * 0.3);
}

/** Fronda em arco de (cx,cy) para a direção `dir` (-1..1), com folíolos pendendo dos dois lados da nervura. */
export function frond(p: Painter, cx: number, cy: number, dir: number, len: number, lift: number, droop: number, pal: Pal5, comb = 2): void {
  const n = Math.ceil(len * 1.6);
  const pt = (t: number): [number, number] => [cx + dir * len * t, cy - lift * Math.sin(t * Math.PI * 0.55) * len * 0.5 + droop * len * t * t * 0.7];
  let step = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [x, y] = pt(t);
    const [x2, y2] = pt(Math.min(1, t + 0.04));
    const [x1, y1] = pt(Math.max(0, t - 0.04));
    const tx = x2 - x1;
    const ty = y2 - y1;
    const tl = Math.hypot(tx, ty) || 1;
    // perpendicular que aponta "para baixo" na tela
    let nx = -ty / tl;
    let ny = tx / tl;
    if (ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    const len2 = Math.max(1, Math.round(comb * (1 - t * 0.55)) - (step % 4 === 2 ? 1 : 0));
    if (t > 0.08) {
      step++;
      if (step % 2 === 0) {
        // folíolos pendem de um lado; o de baixo fica na sombra
        for (let k = 1; k <= len2; k++) p.px(Math.round(x + nx * k + (tx / tl) * k * 0.6), Math.round(y + ny * k), k === len2 ? pal.d : pal.m);
      } else if (step % 4 === 1) {
        p.px(Math.round(x - nx), Math.round(y - ny), pal.l);
      }
    }
    p.px(Math.round(x), Math.round(y), t < 0.55 ? pal.h : pal.l);
  }
}
