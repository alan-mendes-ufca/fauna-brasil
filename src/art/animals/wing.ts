import { and, ell, type Mask, mirror, poly, type Ramp, rect, Spr, wingPoly, type Pt } from './kit';

// Asa de ave vista de frente, aberta a partir do ombro, com faixas de cor concêntricas.

export type Side = 1 | -1;
export const flipM = (m: Mask, side: Side): Mask => (side < 0 ? mirror(m) : m);
export const fromS = (S: Pt, len: number, ang: number): Pt => [S[0] + Math.cos(ang) * len, S[1] + Math.sin(ang) * len];

export interface WingSpec {
  /** Ombro (frente) e ponto de retorno da borda de trás, para o lado direito. */
  S: Pt;
  S2: Pt;
  /** Comprimento de cada pena-ponta (a última sai de S2) e ângulo relativo a theta. */
  feathers: [number, number][];
  /** Cor de fora (pontas das penas). */
  outer: Ramp;
  /** Faixas a partir do ombro: [raio, rampa], da maior para a menor. */
  bands: [number, Ramp][];
  /** Cor das divisões entre as penas. */
  sep: string;
  notch?: number;
}

/** Desenha uma asa (lado 1 = direita da tela) com abertura `theta` (rad; negativo = para cima). */
export function drawWing(s: Spr, w: WingSpec, theta: number, side: Side): Mask {
  const tips: Pt[] = w.feathers.map(([len, da], i) => fromS(i === w.feathers.length - 1 ? w.S2 : w.S, len, theta + da));
  const wing = flipM(poly(wingPoly(w.S, tips, w.S2, w.notch ?? 0.2)), side);
  s.fill(wing, w.outer);
  for (const [r, rp] of w.bands) s.fill(and(wing, flipM(ell(w.S[0], w.S[1], r, r), side)), rp, { ol: false, rim: false });
  const sx = (x: number) => (side < 0 ? 63 - x : x);
  for (let i = 0; i + 1 < tips.length; i++) {
    const a = tips[i];
    const c = tips[i + 1];
    const mx = (a[0] + c[0]) / 2 + (w.S[0] - (a[0] + c[0]) / 2) * 0.2;
    const my = (a[1] + c[1]) / 2 + (w.S[1] - (a[1] + c[1]) / 2) * 0.2;
    const p0: Pt = [w.S[0] + (mx - w.S[0]) * 0.58, w.S[1] + (my - w.S[1]) * 0.58];
    const p1: Pt = [w.S[0] + (mx - w.S[0]) * 0.98, w.S[1] + (my - w.S[1]) * 0.98];
    s.line(sx(p0[0]), p0[1], sx(p1[0]), p1[1], w.sep);
  }
  return wing;
}

/** Ângulos das asas para aves que voam: 0 asas para cima, 1 para baixo, 2–3 planando inclinado,
 *  4 ataque (asas abertas e altas, corpo erguido), 5 dano (asas caídas, corpo afundado). */
export function flapAngles(f: number, up = -1.05, down = 0.75): { r: number; l: number; dy: number; lean: number } {
  if (f === 4) return { r: -0.62, l: -0.62, dy: -2, lean: 0 };
  if (f === 5) return { r: down + 0.3, l: down + 0.3, dy: 2, lean: 0 };
  if (f === 0) return { r: up, l: up, dy: 0, lean: 0 };
  if (f === 1) return { r: down, l: down, dy: -1, lean: 0 };
  return f === 2 ? { r: -0.5, l: 0.3, dy: 0, lean: 1 } : { r: -0.38, l: 0.2, dy: 0, lean: -1 };
}

/** Cauda longa e afilada vista de frente, atrás do corpo (uma peça só, com divisão central). */
export function tailWedge(s: Spr, x: number, y0: number, w0: number, y1: number, lean: number, base: Ramp, tip?: Ramp, tipLen = 6): void {
  const m = poly([[x - w0 / 2, y0], [x + w0 / 2, y0], [x + 1.6 + lean, y1], [x + lean, y1 + 1.5], [x - 1.6 + lean, y1]]);
  s.fill(m, base);
  if (tip) s.fill(and(m, rect(0, y1 - tipLen, 64, 64)), tip, { ol: false, rim: false });
  s.line(x, y0 + 2, x + lean * 0.7, y1 - 1, base.sh);
}
