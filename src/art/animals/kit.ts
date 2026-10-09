import type { Painter } from '../canvas';

// Kit de pixel art procedural dos animais: máscaras (formas) + preenchimento com
// contorno colorido, luz de recorte e 4 tons de sombreado automáticos.

export const N = 64;
export type Mask = Uint8Array;
export type Pt = [number, number];

const inb = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N;
const mk = (): Mask => new Uint8Array(N * N);

function build(test: (px: number, py: number) => boolean): Mask {
  const m = mk();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (test(x + 0.5, y + 0.5)) m[y * N + x] = 1;
  return m;
}

export const ell = (cx: number, cy: number, rx: number, ry: number): Mask =>
  build((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1);

export const rect = (x: number, y: number, w: number, h: number): Mask =>
  build((px, py) => px >= x && px <= x + w && py >= y && py <= y + h);

export function poly(pts: Pt[]): Mask {
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

/** Cápsula afilada de (x0,y0,r0) a (x1,y1,r1): membros, pescoços, corpos de cobra. */
export const cap = (x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): Mask =>
  build((x, y) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / l2));
    const r = r0 + (r1 - r0) * t;
    return Math.hypot(x - (x0 + dx * t), y - (y0 + dy * t)) <= r;
  });

/** Corpo de cobra/peixe: cápsulas encadeadas por pontos [x, y, raio]. */
export function path(pts: [number, number, number][]): Mask {
  const out = mk();
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const m = cap(a[0], a[1], a[2], b[0], b[1], b[2]);
    for (let k = 0; k < out.length; k++) out[k] |= m[k];
  }
  return out;
}

export const uni = (...ms: Mask[]): Mask => {
  const out = mk();
  for (const m of ms) for (let k = 0; k < out.length; k++) out[k] |= m[k];
  return out;
};
export const sub = (a: Mask, b: Mask): Mask => a.map((v, k) => (v && !b[k] ? 1 : 0)) as Mask;
export const and = (a: Mask, b: Mask): Mask => a.map((v, k) => (v && b[k] ? 1 : 0)) as Mask;
export function shift(m: Mask, dx: number, dy: number): Mask {
  const out = mk();
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) if (m[y * N + x] && inb(x + dx, y + dy)) out[(y + dy) * N + x + dx] = 1;
  return out;
}
/** Espelha a máscara em torno de x = cx. */
export function mirror(m: Mask, cx = 32): Mask {
  const out = mk();
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const nx = Math.round(2 * cx - 1 - x);
      if (m[y * N + x] && inb(nx, y)) out[y * N + nx] = 1;
    }
  return out;
}
/** Encolhe a máscara em n pixels (borda de 4 vizinhos). */
export function erode(m: Mask, n = 1): Mask {
  let cur = m;
  for (let k = 0; k < n; k++) {
    const out = mk();
    for (let y = 1; y < N - 1; y++)
      for (let x = 1; x < N - 1; x++)
        if (cur[y * N + x] && cur[y * N + x - 1] && cur[y * N + x + 1] && cur[(y - 1) * N + x] && cur[(y + 1) * N + x]) out[y * N + x] = 1;
    cur = out;
  }
  return cur;
}
export const rot = (p: Pt, a: number, cx = 32, cy = 32): Pt => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const dx = p[0] - cx;
  const dy = p[1] - cy;
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
};

// ------------------------------------------------------------------ cores
function rgb(h: string): [number, number, number] {
  const v = parseInt(h.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
export function mix(a: string, b: string, t: number): string {
  const A = rgb(a);
  const B = rgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export interface Ramp {
  rim: string;
  hi: string;
  md: string;
  sh: string;
  dp: string;
  ol: string;
}
/** Rampa de 6 tons a partir de uma cor: luz quente, sombra violeta, contorno quase-roxo. */
export function ramp(base: string, o: Partial<Ramp> = {}): Ramp {
  return {
    rim: mix(base, '#fff6d6', 0.62),
    hi: mix(mix(base, '#ffffff', 0.18), '#ffd88a', 0.16),
    md: base,
    sh: mix(base, '#3a1c78', 0.34),
    dp: mix(base, '#1e0f55', 0.6),
    ol: mix(base, '#10081f', 0.8),
    ...o,
  };
}

export const INK = '#150b26';

// ------------------------------------------------------------------ sprite
export interface FillOpts {
  /** false = sem contorno; string = cor do contorno. */
  ol?: boolean | string;
  /** Luz de recorte na borda superior esquerda. */
  rim?: boolean;
  /** Cor única, sem sombreado. */
  flat?: boolean;
  /** Largura do sombreado (padrão: pelo tamanho da forma). */
  n?: number;
}

export class Spr {
  readonly g: (string | null)[] = new Array(N * N).fill(null);

  put(x: number, y: number, c: string): this {
    x = Math.round(x);
    y = Math.round(y);
    if (inb(x, y)) this.g[y * N + x] = c;
    return this;
  }
  get(x: number, y: number): string | null {
    return inb(x, y) ? this.g[y * N + x] : null;
  }
  /** Pinta pontos soltos [x, y, ...]. */
  dots(c: string, ...pts: Pt[]): this {
    for (const [x, y] of pts) this.put(x, y, c);
    return this;
  }
  /** Linha de pixels (Bresenham). */
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
  /** Pinta toda a máscara com uma cor, sem contorno. */
  paint(m: Mask, c: string): this {
    for (let k = 0; k < m.length; k++) if (m[k]) this.g[k] = c;
    return this;
  }
  /** Pinta uma máscara só onde `clip` existe (manchas, listras, rosetas). */
  paintIn(clip: Mask, m: Mask, c: string): this {
    return this.paint(and(clip, m), c);
  }
  /** Contorno de 1px por fora da máscara. */
  outline(m: Mask, c: string): this {
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        if (m[y * N + x]) continue;
        if (
          (x > 0 && m[y * N + x - 1]) ||
          (x < N - 1 && m[y * N + x + 1]) ||
          (y > 0 && m[(y - 1) * N + x]) ||
          (y < N - 1 && m[(y + 1) * N + x])
        )
          this.g[y * N + x] = c;
      }
    return this;
  }

  /** Preenche a forma com contorno e sombreado em 4 tons. */
  fill(m: Mask, r: Ramp, o: FillOpts = {}): this {
    if (o.ol !== false) this.outline(m, typeof o.ol === 'string' ? o.ol : r.ol);
    let x0 = N;
    let x1 = 0;
    let y0 = N;
    let y1 = 0;
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++)
        if (m[y * N + x]) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
    const n = o.n ?? Math.max(1, Math.min(4, Math.round(Math.min(x1 - x0 + 1, y1 - y0 + 1) / 7)));
    const run = (x: number, y: number, dx: number, dy: number) => {
      let k = 1;
      while (inb(x + dx * k, y + dy * k) && m[(y + dy * k) * N + x + dx * k]) k++;
      return k;
    };
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        if (!m[y * N + x]) continue;
        let c = r.md;
        if (!o.flat) {
          const dl = Math.min(run(x, y, -1, -1), run(x, y, -1, 0), run(x, y, 0, -1));
          const da = Math.min(run(x, y, 1, 1), run(x, y, 1, 0), run(x, y, 0, 1));
          if (da <= n) c = n >= 3 && da === 1 ? r.dp : r.sh;
          else if (dl === 1 && n >= 2 && o.rim !== false) c = r.rim;
          else if (dl <= n) c = r.hi;
        }
        this.g[y * N + x] = c;
      }
    return this;
  }

  /** Reamostra o sprite (vizinho mais próximo): o pixel de destino (x, y) lê a origem em `src(x, y)`. */
  warp(src: (x: number, y: number) => Pt): this {
    const old = this.g.slice();
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const [u, v] = src(x + 0.5, y + 0.5);
        const ux = Math.floor(u);
        const vy = Math.floor(v);
        this.g[y * N + x] = inb(ux, vy) ? old[vy * N + ux] : null;
      }
    return this;
  }
  /** Mistura as cores opacas (#rrggbb) com `c` na proporção `t`; tons mais escuros que `keep` (0–255) ficam como estão. */
  tint(c: string, t: number, keep = 0): this {
    for (let k = 0; k < this.g.length; k++) {
      const v = this.g[k];
      if (!v || v[0] !== '#') continue;
      const [r, g, b] = rgb(v);
      if (r * 0.3 + g * 0.59 + b * 0.11 >= keep) this.g[k] = mix(v, c, t);
    }
    return this;
  }

  /** Envia os pixels para o canvas do Phaser. */
  emit(p: Painter): void {
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const c = this.g[y * N + x];
        if (c) p.px(x, y, c);
      }
  }
}

// ------------------------------------------------------------------ detalhes
/**
 * Expressão do quadro em desenho: 'attack' (quadro 4) põe sobrancelha brava em `eye()`;
 * 'hurt' (quadro 5) troca os olhos por "><". Quem desenha olhos à mão consulta `pose.mode`.
 */
export const pose: { mode: '' | 'attack' | 'hurt' } = { mode: '' };

/** Olho apertado de dor: ">" à esquerda do centro do quadro, "<" à direita. */
export function hurtEye(s: Spr, x: number, y: number, w: number, h: number, c = INK): void {
  const W = Math.max(3, Math.round(w));
  const half = Math.max(1, Math.floor((Math.max(3, Math.round(h)) - 1) / 2));
  const x0 = Math.round(x);
  const y0 = Math.round(y + h / 2) - half;
  const x1 = x0 + W - 1;
  const left = x + w / 2 < 32;
  const [a, b] = left ? [x0, x1] : [x1, x0];
  s.line(a, y0, b, y0 + half, c).line(b, y0 + half, a, y0 + half * 2, c);
  if (W >= 5) {
    const k = left ? -1 : 1;
    s.line(a, y0 + 1, b + k, y0 + half, c).line(b + k, y0 + half, a, y0 + half * 2 - 1, c);
  }
}

/** Sobrancelha brava (canto de fora alto, de dentro baixo) sobre a caixa do olho. */
export function angryBrow(s: Spr, x: number, y: number, w: number, c = INK): void {
  const left = x + w / 2 < 32;
  const xo = Math.round(left ? x - 1 : x + w);
  const xi = Math.round(left ? x + w - 1 : x);
  s.line(xo, y - 1, xi, y + (w >= 4 ? 1 : 0), c);
}

/** Olho expressivo: aro escuro, íris, pupila e brilho. Caixa w×h com canto em (x, y). */
export function eye(s: Spr, x: number, y: number, w: number, h: number, iris: string, blink = false, glint = '#ffffff'): void {
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (pose.mode === 'hurt') {
    hurtEye(s, x, y, w, h);
    return;
  }
  if (pose.mode === 'attack') blink = false;
  if (blink) {
    s.line(x, y + Math.floor(h / 2), x + w - 1, y + Math.floor(h / 2), INK);
    return;
  }
  s.paint(ell(cx, cy, w / 2, h / 2), INK);
  if (w >= 4 && h >= 3) {
    s.paint(ell(cx, cy + 0.2, w / 2 - 1, h / 2 - 0.8), iris);
    s.paint(ell(cx, cy + 0.4, Math.max(0.7, w / 4), Math.max(0.9, h / 3.2)), INK);
    s.paint(ell(cx + w / 5, cy + h / 5, 0.9, 0.9), mix(iris, '#ffffff', 0.45));
  }
  s.put(x + (w >= 4 ? 1 : 0), y + (h >= 3 ? 1 : 0), glint);
  if (pose.mode === 'attack') angryBrow(s, x, y, w);
}

/** Pequena coroa de pelos/penas pixelada sobre a borda de uma máscara (ruído de silhueta). */
export function fuzz(s: Spr, m: Mask, c: string, rand: () => number, density = 0.35): void {
  for (let y = 1; y < N - 1; y++)
    for (let x = 1; x < N - 1; x++) {
      if (m[y * N + x]) continue;
      const near = m[y * N + x - 1] || m[y * N + x + 1] || m[(y - 1) * N + x] || m[(y + 1) * N + x];
      if (near && rand() < density) s.put(x, y, c);
    }
}

/** Polígono de asa com penas: ombro S, pontas das penas T[], e retorno S2 (borda de trás). */
export function wingPoly(S: Pt, tips: Pt[], S2: Pt, notch = 0.22): Pt[] {
  const pts: Pt[] = [S];
  tips.forEach((t, i) => {
    pts.push(t);
    if (i + 1 < tips.length) {
      const n = tips[i + 1];
      const mx = (t[0] + n[0]) / 2;
      const my = (t[1] + n[1]) / 2;
      pts.push([mx + (S[0] - mx) * notch, my + (S[1] - my) * notch]);
    }
  });
  pts.push(S2);
  return pts;
}

/** Desenhista de uma espécie: quadros 0–3 (parado e ação); 4–5 (ataque e dano) são opcionais, ver combat.ts. */
export type Drawer = (s: Spr, f: number) => void;

/** Linha d'água em ANIMAL_BASE (58) com ondulações; `f` anima os anéis. Corta o que estiver por baixo. */
export function water(s: Spr, cx: number, rx: number, f: number, wide = 0): void {
  const y = 58;
  s.fill(ell(cx, y + 1.5, rx, 3.6), ramp('#2C86B6', { hi: '#6FD0EA', rim: '#C8F6FF', sh: '#1C5E96', dp: '#143A78', ol: '#10285C' }), { n: 1 });
  s.paint(rect(cx - rx + 4, y - 0.4, rx * 2 - 8, 1.2), '#D6FAFF');
  const k = f % 2;
  const grow = wide + k * 2;
  for (const [dy, c] of [[0, '#9CE6F4'], [2, '#5CB4DC']] as [number, string][]) {
    const a = rx + 3 + grow + dy * 2;
    s.line(cx - a, y + 3 - dy, cx - a + 4, y + 4 - dy, c);
    s.line(cx + a, y + 3 - dy, cx + a - 4, y + 4 - dy, c);
  }
  s.dots('#E8FCFF', [cx - rx + 6 + k * 3, y + 1], [cx + rx - 9 - k * 3, y + 2]);
}
