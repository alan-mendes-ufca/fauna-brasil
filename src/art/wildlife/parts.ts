import type { Painter } from '../canvas';
import type { Ramp } from '../animals/kit';
import { cap, ell, type M, poly, ripple, shadow, Spr, type P } from './kit';

/** Desenhista de exploração: pinta o quadro `f` (0–3) direto no Painter de 32×32. */
export type OwDrawer = (p: Painter, f: number) => void;

/** Rampa um tom abaixo, para patas e asa do lado de lá. */
export const far = (r: Ramp): Ramp => ({ ...r, rim: r.hi, hi: r.md, md: r.sh, sh: r.dp });

/** Fase da passada: 0 parado, +1 / −1 nos quadros de movimento. */
export const gait = (f: number): number => (f === 2 ? 1 : f === 3 ? -1 : 0);

/** Embrulha: sombra no chão, sprite por cima. */
export function owSprite(sh: { cx: number; w: number; y?: number; alpha?: number } | null, draw: (s: Spr, f: number) => void, water?: { cx: number; w: number; y?: number }): OwDrawer {
  return (p, f) => {
    if (sh) shadow(p, sh.cx, sh.w, sh.y ?? 28, sh.alpha ?? 1);
    const s = new Spr();
    draw(s, f);
    s.emit(p);
    if (water) ripple(p, water.cx, water.w, f, water.y);
  };
}

export interface QuadSpec {
  r: Ramp;
  /** Pés: [x da traseira, x da dianteira] do lado de cá. */
  legs: [number, number];
  legTop: number;
  lr: number;
  stride: number;
  foot?: string;
  /** Corpo (elipse). */
  b: [number, number, number, number];
  /** Deslocamento das patas do lado de lá. */
  farDx?: number;
}

/** Quadrúpede de perfil 3/4: patas do lado de lá, corpo, patas do lado de cá. Devolve a máscara do corpo. */
export function quad(s: Spr, f: number, q: QuadSpec, beforeBody?: () => void): M {
  const g = gait(f);
  const by = f === 1 ? 0.5 : g !== 0 ? -0.5 : 0;
  const leg = (x: number, dx: number, r: Ramp, lift: number) => {
    const m = cap(x, q.legTop + by, q.lr, x + dx, 26.5 - lift, q.lr * 0.8);
    s.fill(m, r);
    if (q.foot) s.put(x + dx + 0.5, 27 - lift, q.foot);
  };
  const fd = q.farDx ?? 1.5;
  leg(q.legs[0] + fd, g * q.stride, far(q.r), 1);
  leg(q.legs[1] + fd, -g * q.stride, far(q.r), 1);
  beforeBody?.();
  const [cx, cy, rx, ry] = q.b;
  const body = ell(cx, cy + by, rx, ry);
  s.fill(body, q.r);
  leg(q.legs[0], -g * q.stride, q.r, 0);
  leg(q.legs[1], g * q.stride, q.r, 0);
  return body;
}

export interface FlySpec {
  body: Ramp;
  wing: Ramp;
  /** Faixa clara/escura nas pontas das penas. */
  tip?: Ramp;
  /** Centro e raios do corpo, em voo. */
  b: [number, number, number, number];
  /** Faixas de cor a partir do ombro na asa de cá: [raio, cor]. */
  bands?: [number, string][];
  /** Ombro (x, y) relativo ao quadro. */
  sh: P;
  span: number;
  chord: number;
}

/**
 * Ave voando vista de cima 3/4 olhando para a direita.
 * Quadros 0 e 2: asas levantadas (só a do lado de cá por cima do corpo); 1 e 3: abertas
 * (a do lado de lá sobe na tela, a de cá desce).
 */
export function flyer(s: Spr, f: number, o: FlySpec, tail: (dy: number) => void, head: (dy: number) => void): void {
  const up = f % 2 === 0;
  const dy = up ? 0 : 1;
  const [sx, sy0] = o.sh;
  const sy = sy0 + dy;
  const c = o.chord;
  // asa afilada para trás: borda de ataque curva, ponta fina, borda de fuga recortada
  const wingShape = (dir: 1 | -1, len: number): P[] => [
    [sx + 2, sy],
    [sx - c, sy + dir * 0.5],
    [sx - c - 1.5, sy + dir * len * 0.5],
    [sx - c - 3, sy + dir * len],
    [sx - c * 0.3 - 1, sy + dir * len * 0.75],
    [sx + 1.5, sy + dir * len * 0.4],
  ];
  const notches = (dir: 1 | -1, len: number) => {
    for (const t of [0.3, 0.55, 0.8]) s.put(sx - c - t * 3, sy + dir * len * t, o.wing.ol);
  };
  if (up) {
    s.fill(poly(wingShape(-1, o.span * 0.85).map(([x, y]) => [x + 2, y - 1] as P)), far(o.wing));
  } else {
    s.fill(poly(wingShape(-1, o.span * 0.5).map(([x, y]) => [x + 2, y - 1] as P)), far(o.wing));
  }
  tail(dy);
  const [cx, cy, rx, ry] = o.b;
  s.fill(ell(cx, cy + dy, rx, ry), o.body);
  head(dy);
  const len = up ? o.span : o.span * 0.8;
  const nw = poly(up ? wingShape(-1, len) : wingShape(1, len));
  s.fill(nw, o.wing);
  notches(up ? -1 : 1, len);
  for (const [r, col] of o.bands ?? []) s.paintIn(nw, ell(sx, sy, r, r), col);
  if (o.tip) {
    const tipM = ell(sx - c - 2, sy + (up ? -len : len), c * 0.6, len * 0.4);
    s.paintIn(nw, tipM, o.tip.md);
  }
}
