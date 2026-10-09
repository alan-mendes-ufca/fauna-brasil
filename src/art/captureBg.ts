import type Phaser from 'phaser';
import type { Habitat } from '../data/species';
import { paint, rng, type Painter } from './canvas';

// Fundos e adereços da tela de captura (primeira pessoa). Resolução de arte 320x214.
// Cada fundo tem uma camada traseira, uma dianteira (folhagem, com parallax oposto)
// e uma camada de efeito (fachos de sol ou reflexos) que a cena anima.

export const CAP_W = 320;
export const CAP_H = 214;
/** Margem extra nas camadas, para o parallax não mostrar bordas. */
export const CAP_PAD = 12;
export const W = CAP_W + CAP_PAD * 2;
export const H = CAP_H + CAP_PAD * 2;
export const X0 = -CAP_PAD;
export const X1 = CAP_W + CAP_PAD;
export const Y0 = -CAP_PAD;
export const Y1 = CAP_H + CAP_PAD;

/** Linha d'água (y) do animal: onde ele pisa. */
export const ANIMAL_GROUND_Y = 132;

export const PAL = {
  teal0: '#031f24',
  teal1: '#06383c',
  teal2: '#0a5a56',
  teal3: '#118a78',
  leaf0: '#073d27',
  leaf1: '#0e6a31',
  leaf2: '#21a03a',
  leaf3: '#5ed048',
  leaf4: '#b4f060',
  gold0: '#ff9a1f',
  gold1: '#ffc83a',
  gold2: '#ffe680',
  gold3: '#fff7c0',
  bark0: '#2e1608',
  bark1: '#5a3114',
  bark2: '#8a5424',
  bark3: '#b87a38',
  water0: '#053f55',
  water1: '#0a6f86',
  water2: '#14a6aa',
  water3: '#56dccb',
  water4: '#c4fff0',
  sand0: '#c98a3c',
  sand1: '#eeb85c',
  sand2: '#ffdc88',
  sand3: '#fff0b8',
};

export interface CaptureBgLayers {
  back: string;
  front: string;
  /** Camada de efeito: fachos de sol (mata) ou reflexos (água). */
  fx: string;
  fxKind: 'beams' | 'glints';
  /** Faixa de espuma/ondas animada (água e praia). */
  waves?: string;
}

// ---------- utilitários de desenho ----------

export const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Degradê vertical com pontilhado ordenado entre as cores (visual de pixel art). */
export function gradient(p: Painter, x: number, y: number, w: number, h: number, stops: string[]): void {
  for (let yy = 0; yy < h; yy++) {
    const pos = (yy / Math.max(1, h - 1)) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(pos));
    const f = pos - i;
    for (let xx = 0; xx < w; xx++) {
      const th = (BAYER[(y + yy) & 3][(x + xx) & 3] + 0.5) / 16;
      p.px(x + xx, y + yy, f > th ? stops[i + 1] : stops[i]);
    }
  }
}

export function ellipse(p: Painter, cx: number, cy: number, rx: number, ry: number, color: string): void {
  for (let dy = -ry; dy <= ry; dy++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.01))));
    p.hline(cx - half, cy + dy, half * 2 + 1, color);
  }
}

/** Mancha de folhas: pequenas elipses escuras com miolo claro; mais claras no alto. */
export function foliage(
  p: Painter,
  r: () => number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count: number,
  size: number,
  cols: [string, string, string, string],
): void {
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    const x = Math.round(cx + Math.cos(a) * rx * d);
    const y = Math.round(cy + Math.sin(a) * ry * d);
    const up = (cy - y) / ry; // -1 (baixo) .. 1 (alto)
    const s = Math.max(2, Math.round(size * (0.7 + r() * 0.6)));
    const shade = Math.max(0, Math.min(3, Math.floor((up + 1) * 1.5 + r() * 1.2 - 0.6)));
    ellipse(p, x, y, s, Math.max(1, Math.round(s * 0.55)), cols[0]);
    ellipse(p, x - 1, y - 1, Math.max(1, s - 1), Math.max(1, Math.round(s * 0.4)), cols[shade]);
    if (shade >= 2 && r() < 0.5) p.px(x - 1, y - 1, cols[3]);
  }
}

/** Fronde de samambaia: haste curva com folíolos que caem. */
export function frond(p: Painter, x: number, y: number, len: number, ang: number, bend: number, c0: string, c1: string): void {
  let px = x;
  let py = y;
  let a = ang;
  for (let i = 0; i < len; i++) {
    a += bend;
    px += Math.sin(a);
    py -= Math.cos(a);
    const rx = Math.round(px);
    const ry = Math.round(py);
    p.px(rx, ry, c0);
    if (i > 3 && i % 2 === 0) {
      const l = Math.max(1, Math.round(((len - i) / len) * 6));
      for (const s of [-1, 1]) {
        for (let k = 1; k <= l; k++) p.px(rx + s * k, ry + (k >> 1), k % 2 ? c0 : c1);
      }
    }
  }
}

export function trunk(p: Painter, r: () => number, x: number, w: number, y0: number, y1: number, cols: string[], moss: string): void {
  p.rect(x, y0, w, y1 - y0, cols[1]);
  p.vline(x, y0, y1 - y0, cols[2]);
  p.vline(x + 1, y0, y1 - y0, cols[2]);
  p.vline(x + w - 1, y0, y1 - y0, cols[0]);
  p.vline(x + w - 2, y0, y1 - y0, cols[0]);
  for (let i = 0; i < (y1 - y0) / 3; i++) {
    const yy = y0 + Math.floor(r() * (y1 - y0));
    p.vline(x + 2 + Math.floor(r() * Math.max(1, w - 4)), yy, 2 + Math.floor(r() * 5), cols[r() < 0.5 ? 0 : 2]);
  }
  for (let i = 0; i < w; i++) if (r() < 0.45) p.vline(x + i, y0 + Math.floor(r() * (y1 - y0)), 2 + Math.floor(r() * 4), moss);
}

/** Fachos de sol inclinados, com borda suave (alpha por linha). */
export function beams(p: Painter, xs: number[], width: number, slope: number, alpha: number): void {
  for (const bx of xs) {
    for (let y = Y0; y < Y1; y++) {
      const t = (y - Y0) / (Y1 - Y0);
      const a = alpha * (1 - t * 0.75);
      const w = Math.round(width + t * 14);
      const x = Math.round(bx + slope * (y - Y0));
      p.hline(x, y, w, `rgba(255,236,150,${a.toFixed(3)})`);
      p.hline(x - 3, y, 3, `rgba(255,236,150,${(a * 0.4).toFixed(3)})`);
      p.hline(x + w, y, 4, `rgba(255,236,150,${(a * 0.4).toFixed(3)})`);
    }
  }
}

export function layer(scene: Phaser.Scene, key: string, draw: (p: Painter) => void): string {
  return paint(scene, key, W, H, (p) => {
    p.ctx.translate(CAP_PAD, CAP_PAD);
    draw(p);
  });
}

// ---------- habitats ----------

export function drawCanopyBack(p: Painter): void {
  const r = rng(11);
  gradient(p, X0, Y0, W, 130, ['#0fa8b0', '#58d2bc', '#c8f0a0', '#ffe48a']);
  // Folhagem distante, em camadas, deixando o céu aparecer no centro.
  gradient(p, X0, 100, W, Y1 - 100, [PAL.teal2, PAL.teal1, PAL.teal0]);
  const far: [string, string, string, string] = [PAL.teal1, PAL.teal2, PAL.teal3, PAL.leaf2];
  for (let i = 0; i < 9; i++) foliage(p, r, X0 + i * 40, 92, 34, 26, 38, 6, far);
  foliage(p, r, 10, 40, 60, 60, 120, 7, far);
  foliage(p, r, 310, 36, 60, 56, 120, 7, far);
  foliage(p, r, 160, 6, 120, 16, 60, 6, far);
  const mid: [string, string, string, string] = [PAL.leaf0, PAL.leaf1, PAL.leaf2, PAL.leaf3];
  foliage(p, r, 20, 70, 50, 48, 90, 7, mid);
  foliage(p, r, 300, 74, 52, 46, 90, 7, mid);
  foliage(p, r, 160, 150, 190, 38, 220, 8, mid);
  // Galho principal: onde o animal pousa (topo em ~132).
  for (let x = X0; x < X1; x++) {
    const top = ANIMAL_GROUND_Y + Math.round(Math.sin(x * 0.025) * 3 + (x - 160) * 0.015);
    const th = 15 + Math.round(Math.sin(x * 0.04 + 1) * 2);
    p.vline(x, top, th, PAL.bark1);
    p.vline(x, top, 2, PAL.bark3);
    p.vline(x, top + 2, 2, PAL.bark2);
    p.vline(x, top + th - 3, 3, PAL.bark0);
    if (r() < 0.5) p.vline(x, top + 4 + Math.floor(r() * (th - 8)), 2 + Math.floor(r() * 4), r() < 0.5 ? PAL.bark0 : PAL.bark2);
    if (r() < 0.35) p.vline(x, top - 1, 2, r() < 0.5 ? PAL.leaf2 : PAL.leaf3); // musgo
  }
  foliage(p, r, 160, 156, 200, 10, 90, 6, [PAL.leaf0, PAL.leaf1, PAL.leaf2, PAL.leaf3]);
  // Bromélias de brilho dourado no galho.
  for (const bx of [48, 268]) {
    for (let k = 0; k < 7; k++) frond(p, bx, ANIMAL_GROUND_Y + 1, 12, -1.1 + k * 0.37, 0.05 * (k - 3), PAL.leaf2, PAL.leaf3);
  }
}

export function drawCanopyFront(p: Painter): void {
  const r = rng(12);
  const dark: [string, string, string, string] = [PAL.teal0, PAL.leaf0, PAL.leaf1, PAL.leaf2];
  foliage(p, r, X0 + 6, Y0 + 6, 54, 34, 70, 9, dark);
  foliage(p, r, X1 - 6, Y0 + 4, 58, 30, 70, 9, dark);
  foliage(p, r, X0 + 4, Y1 - 4, 46, 32, 60, 9, dark);
  foliage(p, r, X1 - 4, Y1 - 4, 46, 32, 60, 9, dark);
  // Cipós pendurados.
  for (const vx of [22, 58, 276, 300]) {
    const len = 30 + Math.floor(r() * 40);
    for (let y = Y0; y < len; y++) p.px(vx + Math.round(Math.sin(y * 0.15 + vx) * 2), y, y % 5 === 0 ? PAL.leaf3 : PAL.leaf1);
  }
}

export function drawForestBack(p: Painter, horizon: number, litter: string[], seed: number, dense: boolean): void {
  const r = rng(seed);
  // Bruma azulada ao fundo e troncos que somem na distância.
  gradient(p, X0, Y0, W, horizon - Y0 + 8, ['#0a6a6c', '#16988a', '#5cd0a0', '#c8f09a']);
  const trunkCols = [PAL.bark0, PAL.bark1, PAL.bark2];
  const xs = dense ? [-6, 28, 70, 118, 206, 252, 300, 338] : [8, 60, 150, 236, 310];
  xs.forEach((tx, i) => {
    const w = 8 + Math.floor(r() * 8);
    trunk(p, r, tx, w, Y0, horizon + 6, trunkCols, PAL.leaf2);
    // Neblina por cima do tronco, mais forte quanto mais longe (i par = mais fundo).
    if (i % 2 === 0) for (let y = Y0; y < horizon + 6; y++) p.hline(tx, y, w, 'rgba(120,230,200,0.38)');
  });
  const far: [string, string, string, string] = [PAL.teal1, PAL.teal2, PAL.teal3, PAL.leaf2];
  foliage(p, r, 160, Y0 + 6, 190, 22, 120, 7, far);
  if (dense) {
    foliage(p, r, 160, horizon - 4, 190, 14, 100, 6, [PAL.leaf0, PAL.leaf1, PAL.leaf2, PAL.leaf3]);
  }
  // Chão em perspectiva.
  gradient(p, X0, horizon, W, Y1 - horizon, [litter[0], litter[1], litter[2], litter[3]]);
  // Serapilheira: manchas maiores quanto mais perto.
  for (let i = 0; i < 900; i++) {
    const t = Math.pow(r(), 1.7);
    const y = Math.round(horizon + t * (Y1 - horizon));
    const x = Math.round(X0 + r() * W);
    const s = 1 + Math.floor(t * 4);
    const cols = [PAL.bark0, PAL.bark2, PAL.gold0, PAL.leaf1, PAL.leaf2];
    p.rect(x, y, s * 2, s, cols[Math.floor(r() * cols.length)]);
  }
  // Raízes que partem do ponto de fuga.
  for (let i = 0; i < 7; i++) {
    const tx = 40 + i * 40;
    for (let y = horizon + 2; y < Y1; y += 1) {
      const t = (y - horizon) / (Y1 - horizon);
      const x = Math.round(160 + (tx - 160) * (0.2 + t * 1.1) + Math.sin(y * 0.2 + i) * 2);
      p.rect(x, y, 1 + Math.floor(t * 3), 1, t < 0.5 ? PAL.bark1 : PAL.bark2);
    }
  }
  // Samambaias médias.
  for (let i = 0; i < 9; i++) {
    const fx = X0 + 10 + i * 40 + Math.floor(r() * 16);
    if (Math.abs(fx - 160) < 36) continue;
    const fy = horizon + 18 + Math.floor(r() * 16);
    for (let k = 0; k < 6; k++) frond(p, fx, fy, 14, -1.2 + k * 0.48, 0.05 * (k - 2.5), PAL.leaf1, PAL.leaf3);
  }
}

export function drawForestFront(p: Painter, seed: number): void {
  const r = rng(seed);
  for (const [fx, fy, mirror] of [[X0 + 14, Y1, 1], [X1 - 14, Y1, -1], [X0 + 60, Y1 + 4, 1], [X1 - 62, Y1 + 4, -1]] as const) {
    for (let k = 0; k < 8; k++) {
      const ang = mirror * (0.3 + k * 0.3);
      frond(p, fx, fy, 40 + Math.floor(r() * 14), ang, -mirror * 0.035, PAL.leaf0, k % 2 ? PAL.leaf2 : PAL.leaf3);
    }
  }
  foliage(p, r, X0 + 8, Y0 + 8, 46, 28, 60, 9, [PAL.teal0, PAL.leaf0, PAL.leaf1, PAL.leaf2]);
  foliage(p, r, X1 - 8, Y0 + 6, 46, 26, 60, 9, [PAL.teal0, PAL.leaf0, PAL.leaf1, PAL.leaf2]);
}

export function drawRiverBack(p: Painter): void {
  const r = rng(21);
  const horizon = 52;
  gradient(p, X0, Y0, W, horizon - Y0, ['#27b8c4', '#78dcc0', '#ffe7a0']);
  // Margem distante com copas.
  gradient(p, X0, horizon - 22, W, 22, [PAL.teal2, PAL.teal1]);
  foliage(p, r, 160, horizon - 20, 190, 14, 130, 7, [PAL.teal1, PAL.teal2, PAL.teal3, PAL.leaf2]);
  foliage(p, r, 160, horizon - 12, 190, 8, 80, 6, [PAL.leaf0, PAL.leaf1, PAL.leaf2, PAL.leaf3]);
  // Sol baixo refletido na névoa.
  ellipse(p, 232, horizon - 28, 14, 14, 'rgba(255,240,170,0.5)');
  ellipse(p, 232, horizon - 28, 8, 8, PAL.gold3);
  // Água em degradê.
  gradient(p, X0, horizon, W, Y1 - horizon, [PAL.water2, PAL.water1, PAL.water0, '#032d3e']);
  // Ondulações: traços horizontais mais longos e espaçados perto do observador.
  for (let i = 0; i < 260; i++) {
    const t = Math.pow(r(), 1.5);
    const y = Math.round(horizon + 2 + t * (Y1 - horizon));
    const x = Math.round(X0 + r() * W);
    const len = 3 + Math.floor(t * 18);
    p.hline(x, y, len, r() < 0.5 ? PAL.water3 : PAL.water1);
  }
  // Reflexo dourado do sol.
  for (let y = horizon + 1; y < Y1; y += 2) {
    const t = (y - horizon) / (Y1 - horizon);
    const w = Math.round(6 + t * 36 + r() * 8);
    p.hline(Math.round(232 - w / 2 + (r() - 0.5) * 6), y, w, r() < 0.6 ? PAL.gold2 : PAL.gold1);
  }
}

export function drawRiverFront(p: Painter): void {
  const r = rng(22);
  // Aguapés e folhas de vitória-régia nos cantos inferiores.
  for (const [cx, cy, rx] of [[X0 + 22, Y1 - 8, 34], [X1 - 24, Y1 - 6, 36], [X0 + 90, Y1 - 2, 22], [X1 - 100, Y1 - 2, 20]] as const) {
    ellipse(p, cx, cy, rx, Math.round(rx * 0.32), PAL.leaf0);
    ellipse(p, cx, cy - 1, rx - 2, Math.round(rx * 0.28), PAL.leaf2);
    ellipse(p, cx - 3, cy - 3, Math.round(rx * 0.55), Math.round(rx * 0.14), PAL.leaf3);
    p.hline(cx - 1, cy - 2, rx, PAL.leaf0);
  }
  // Juncos nas laterais.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const bx = side < 0 ? X0 + 4 + i * 4 : X1 - 4 - i * 4;
      const h = 50 + Math.floor(r() * 50);
      for (let y = 0; y < h; y++) p.px(bx + Math.round(side * Math.sin(y * 0.05 + i) * 4 * (y / h)), Y1 - y, y > h - 8 ? PAL.leaf3 : y % 7 < 3 ? PAL.leaf1 : PAL.leaf2);
    }
  }
}

export function drawBeachBack(p: Painter): void {
  const r = rng(31);
  const horizon = 44;
  gradient(p, X0, Y0, W, horizon - Y0, ['#27b8c4', '#8ae4c0', '#ffeaa8']);
  gradient(p, X0, horizon - 16, W, 16, [PAL.teal2, PAL.teal1]);
  foliage(p, r, 160, horizon - 14, 190, 12, 120, 7, [PAL.teal1, PAL.teal2, PAL.teal3, PAL.leaf2]);
  // Rio ao fundo.
  gradient(p, X0, horizon, W, 62, [PAL.water2, PAL.water1, PAL.water2]);
  for (let i = 0; i < 160; i++) {
    const y = horizon + 2 + Math.floor(r() * 56);
    p.hline(Math.round(X0 + r() * W), y, 3 + Math.floor(r() * 10), r() < 0.5 ? PAL.water3 : PAL.water0);
  }
  ellipse(p, 80, horizon + 14, 22, 3, 'rgba(255,236,150,0.5)');
  // Banco de areia.
  const shore = 104;
  gradient(p, X0, shore, W, Y1 - shore, [PAL.sand3, PAL.sand2, PAL.sand1, PAL.sand0]);
  for (let x = X0; x < X1; x++) {
    const edge = shore + Math.round(Math.sin(x * 0.05) * 2 + Math.sin(x * 0.13) * 1);
    p.vline(x, edge - 2, 2, PAL.water4);
    p.vline(x, edge, 1, PAL.sand3);
  }
  // Marcas de ondas na areia e grãos.
  for (let y = shore + 10; y < Y1; y += 9) {
    for (let x = X0; x < X1; x++) if (Math.sin(x * 0.07 + y) > 0.4) p.px(x, y + Math.round(Math.sin(x * 0.1) * 1), PAL.sand0);
  }
  p.speckle(X0, shore + 4, W, Y1 - shore, [PAL.sand0, PAL.sand3, PAL.bark2], 0.04, r);
  // Seixos e um tronco seco.
  for (const [sx, sy, sw] of [[40, 160, 9], [250, 170, 11], [286, 150, 7], [110, 188, 8]] as const) {
    ellipse(p, sx, sy, sw, Math.round(sw * 0.45), PAL.bark1);
    ellipse(p, sx - 1, sy - 1, sw - 2, Math.round(sw * 0.35), PAL.bark3);
  }
}

export function drawBeachFront(p: Painter): void {
  const r = rng(32);
  for (const [fx, mirror] of [[X0 + 10, 1], [X1 - 10, -1]] as const) {
    for (let k = 0; k < 8; k++) frond(p, fx, Y1, 46 + Math.floor(r() * 18), mirror * (0.25 + k * 0.28), -mirror * 0.04, PAL.leaf0, k % 2 ? PAL.leaf2 : PAL.leaf3);
  }
  foliage(p, r, X0 + 6, Y0 + 6, 40, 20, 40, 8, [PAL.teal0, PAL.leaf0, PAL.leaf1, PAL.leaf2]);
  foliage(p, r, X1 - 6, Y0 + 6, 40, 20, 40, 8, [PAL.teal0, PAL.leaf0, PAL.leaf1, PAL.leaf2]);
}

export function drawGlints(p: Painter, seed: number, top: number): void {
  const r = rng(seed);
  for (let i = 0; i < 90; i++) {
    const y = top + Math.floor(Math.pow(r(), 1.3) * (Y1 - top));
    const len = 2 + Math.floor(r() * 6);
    p.hline(Math.round(X0 + r() * W), y, len, r() < 0.5 ? 'rgba(255,248,200,0.9)' : 'rgba(196,255,240,0.8)');
  }
}

export function drawWaves(p: Painter, y: number, thick: boolean): void {
  // Linha de espuma ondulada (tileável em x pela cena).
  for (let x = X0; x < X1; x++) {
    const yy = y + Math.round(Math.sin(x * 0.09) * 1.5 + Math.sin(x * 0.23));
    p.vline(x, yy, thick ? 2 : 1, 'rgba(236,255,250,0.85)');
    if ((x * 7) % 11 < 4) p.vline(x, yy + 2, 1, 'rgba(120,230,220,0.6)');
  }
}

// ---------- Caatinga: ocre, terracota, verde-acinzentado e sombras violeta-azuladas ----------

export const CAA = {
  ochre0: '#6e3e22',
  ochre1: '#9a5a2c',
  ochre2: '#c27a3a',
  ochre3: '#e0a050',
  ochre4: '#f6c878',
  terra: '#b8553a',
  terra2: '#d9744a',
  sage0: '#3f5240',
  sage1: '#5f7a4e',
  sage2: '#8aa070',
  sage3: '#c0cc94',
  vio0: '#2e2448',
  vio1: '#4a3a6e',
  vio2: '#6e5a92',
  rock0: '#f2d2a8',
  rock1: '#dcae86',
  rock2: '#b98668',
  rock3: '#8a6270',
  rock4: '#5e4a70',
  twig: '#cbbba8',
  twigDark: '#7a6a62',
};
export const SHADOW = 'rgba(62,44,112,0.38)';

/** Linha de pixels (Bresenham). */
export function line(p: Painter, x0: number, y0: number, x1: number, y1: number, color: string): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const ex = Math.round(x1);
  const ey = Math.round(y1);
  const dx = Math.abs(ex - x);
  const dy = -Math.abs(ey - y);
  const sx = x < ex ? 1 : -1;
  const sy = y < ey ? 1 : -1;
  let err = dx + dy;
  for (let i = 0; i < 400; i++) {
    p.px(x, y, color);
    if (x === ex && y === ey) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

/** Céu quente do sertão com sol forte e halo. */
export function hotSky(p: Painter, horizon: number, sunX: number, sunY: number): void {
  gradient(p, X0, Y0, W, horizon - Y0 + 6, ['#2f93c8', '#6fc0d6', '#ffd68a', '#ffe9b0']);
  for (const [r, a] of [[44, 0.1], [30, 0.16], [20, 0.28], [13, 0.5]] as const) ellipse(p, sunX, sunY, r, r, `rgba(255,236,170,${a})`);
  ellipse(p, sunX, sunY, 9, 9, '#fff8d0');
  ellipse(p, sunX, sunY, 6, 6, '#ffffff');
}

/** Serras distantes em tons de lavanda sobre a névoa quente. */
export function farHills(p: Painter, r: () => number, baseY: number): void {
  for (const [col, amp, off] of [['#c49aa8', 9, 0], ['#a87e98', 7, 2.4]] as const) {
    for (let x = X0; x < X1; x++) {
      const h = Math.round(amp + Math.sin(x * 0.018 + off) * amp * 0.6 + Math.sin(x * 0.05 + off * 2) * 2 + r() * 0.4);
      p.vline(x, baseY - h + (off ? 4 : 0), h + 2, col);
    }
  }
}

/** Mandacaru: tronco com costelas, dois braços e espinhos claros; lado direito em sombra violeta. */
export function mandacaru(p: Painter, r: () => number, x: number, base: number, h: number, w = 6): void {
  const col = (cx: number, y0: number, y1: number, cw: number) => {
    p.rect(cx, y0, cw, y1 - y0, CAA.sage1);
    p.vline(cx, y0 + 1, y1 - y0 - 1, CAA.sage3);
    p.vline(cx + 1, y0, y1 - y0, CAA.sage2);
    p.vline(cx + cw - 1, y0 + 1, y1 - y0 - 1, CAA.vio1);
    p.vline(cx + cw - 2, y0, y1 - y0, CAA.sage0);
    p.hline(cx + 1, y0 - 1, cw - 2, CAA.sage2);
    for (let i = 0; i < (y1 - y0) / 4; i++) p.px(cx + 1 + Math.floor(r() * (cw - 2)), y0 + 2 + Math.floor(r() * (y1 - y0 - 3)), '#f4ecc8');
  };
  col(x, base - h, base, w);
  const armY = base - Math.round(h * 0.45);
  const armH = Math.round(h * 0.4);
  // braço esquerdo e direito saem na horizontal e sobem.
  p.rect(x - 9, armY, 9, 4, CAA.sage1);
  p.hline(x - 9, armY, 9, CAA.sage3);
  p.hline(x - 9, armY + 3, 9, CAA.sage0);
  col(x - 12, armY - armH, armY + 4, 5);
  const armY2 = base - Math.round(h * 0.62);
  p.rect(x + w, armY2, 8, 4, CAA.sage1);
  p.hline(x + w, armY2, 8, CAA.sage3);
  p.hline(x + w, armY2 + 3, 8, CAA.vio1);
  col(x + w + 6, armY2 - Math.round(h * 0.3), armY2 + 4, 5);
  // flor branca no topo.
  p.px(x + 2, base - h - 2, '#fff7e0');
  p.px(x + 3, base - h - 2, '#ffd8e0');
}

/** Arbusto seco de galhos retorcidos, claros como osso, com poucas folhas verde-acinzentadas. */
export function twigBush(p: Painter, r: () => number, x: number, base: number, size: number): void {
  const branch = (bx: number, by: number, ang: number, len: number, depth: number) => {
    const ex = bx + Math.sin(ang) * len;
    const ey = by - Math.cos(ang) * len;
    line(p, bx, by, ex, ey, depth > 1 ? CAA.twigDark : CAA.twig);
    if (depth > 1) line(p, bx + 1, by, ex + 1, ey, CAA.twig);
    if (depth <= 0) {
      if (r() < 0.7) ellipse(p, Math.round(ex), Math.round(ey), 2, 1, r() < 0.5 ? CAA.sage1 : CAA.sage2);
      return;
    }
    const n = 2 + (r() < 0.4 ? 1 : 0);
    for (let i = 0; i < n; i++) branch(ex, ey, ang + (r() - 0.5) * 1.6, len * (0.62 + r() * 0.15), depth - 1);
  };
  const n = 3 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) branch(x, base, -0.9 + (i / (n - 1)) * 1.8 + (r() - 0.5) * 0.3, size, 3);
}

/** Sombra violeta-azulada no chão, sob um objeto. */
export function groundShadow(p: Painter, x: number, y: number, rx: number): void {
  ellipse(p, x + 2, y, rx, Math.max(1, Math.round(rx * 0.22)), SHADOW);
}

/** Rachaduras de terra seca em perspectiva (células de Voronoi achatadas pela distância). */
export function crackedMud(p: Painter, y0: number, y1: number, vanishX: number, seed: number, light: string, dark: string, fill: boolean): void {
  const hash = (cx: number, cy: number): [number, number] => {
    let h = Math.imul(cx * 374761393 + cy * 668265263 + seed, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1103515245);
    const a = ((h >>> 8) & 255) / 255;
    const b = ((h >>> 16) & 255) / 255;
    return [a, b];
  };
  for (let y = y0; y < y1; y++) {
    const depth = y - y0 + 14;
    const v = Math.log(depth) * 24;
    for (let x = X0; x < X1; x++) {
      const u = ((x - vanishX) / depth) * 70;
      const cx = Math.floor(u / 10);
      const cy = Math.floor(v / 6);
      let d1 = 1e9;
      let d2 = 1e9;
      let id = 0;
      for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
          const [a, b] = hash(cx + i, cy + j);
          const dx = (cx + i + a) * 10 - u;
          const dy = ((cy + j + b) * 6 - v) * 1.4;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < d1) {
            d2 = d1;
            d1 = d;
            id = (cx + i) * 31 + (cy + j);
          } else if (d < d2) d2 = d;
        }
      }
      const edge = d2 - d1;
      if (edge < 0.9) p.px(x, y, dark);
      else if (edge < 1.6 && ((x + y) & 1) === 0) p.px(x, y, dark);
      else if (fill) {
        // cada placa com um tom ligeiramente diferente e borda curvada (levantada) mais clara
        if (edge < 2.6) p.px(x, y, light);
        else if (id % 3 === 0 && ((x * 7 + y * 3) % 13) < 2) p.px(x, y, light);
      }
    }
  }
}

/** Domo de granito: sombreado pela direita (luz do sol alto à direita), listras de escorrimento. */
export function graniteDome(p: Painter, r: () => number, cx: number, base: number, rx: number, ry: number): void {
  const cols = [CAA.rock0, CAA.rock1, CAA.rock2, CAA.rock3, CAA.rock4];
  for (let y = base - ry; y <= base; y++) {
    const ty = (y - base) / ry; // -1 topo .. 0 base
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - ty * ty)));
    for (let x = cx - half; x <= cx + half; x++) {
      const tx = (x - cx) / rx;
      // sol à direita-alto: mais claro para cima/direita? Para sombra violeta no lado esquerdo.
      const light = 0.55 + tx * 0.5 - ty * 0.0 + ty * 0.35 * -1 + (r() - 0.5) * 0.12;
      const l = Math.max(0, Math.min(0.999, 1 - light * 0.9 + Math.abs(tx) * 0.1));
      const th = (BAYER[y & 3][x & 3] + 0.5) / 16;
      const pos = l * 4;
      const i = Math.floor(pos);
      p.px(x, y, cols[Math.min(4, i + (pos - i > th ? 1 : 0))]);
    }
  }
  // Escorrimentos escuros e líquen.
  for (let i = 0; i < 7; i++) {
    const sx = cx + Math.round((r() - 0.5) * rx * 1.6);
    const top = base - ry + 4 + Math.floor(r() * ry * 0.4);
    p.vline(sx, top, Math.floor(ry * 0.3 + r() * ry * 0.3), 'rgba(62,44,112,0.45)');
  }
  for (let i = 0; i < 40; i++) {
    const x = cx + Math.round((r() - 0.5) * rx * 1.7);
    const y = base - Math.floor(r() * ry);
    p.px(x, y, r() < 0.5 ? CAA.sage2 : CAA.terra2);
  }
}

export function dryGrass(p: Painter, r: () => number, x: number, base: number, n: number, h: number): void {
  for (let i = 0; i < n; i++) {
    const a = (r() - 0.5) * 1.4;
    const len = h * (0.6 + r() * 0.5);
    line(p, x + i - n / 2, base, x + i - n / 2 + Math.sin(a) * len, base - Math.cos(a) * len, r() < 0.5 ? CAA.ochre4 : CAA.sage3);
  }
}

// --- mata-seca: arbustos, cactos e mandacarus ---

export function drawScrubBack(p: Painter): void {
  const r = rng(71);
  const horizon = 76;
  hotSky(p, horizon, 238, 30);
  farHills(p, r, horizon + 2);
  // Caatinga distante: pontinhos de arbustos claros sobre a serra.
  for (let i = 0; i < 80; i++) {
    const x = X0 + Math.floor(r() * W);
    ellipse(p, x, horizon + 1 + Math.floor(r() * 5), 3 + Math.floor(r() * 3), 1 + Math.floor(r() * 2), r() < 0.5 ? CAA.sage1 : '#7d8a68');
  }
  // Chão terroso em degradê, com tom quente perto do sol.
  gradient(p, X0, horizon + 4, W, Y1 - horizon, [CAA.ochre3, CAA.ochre2, CAA.ochre1, CAA.ochre0]);
  // Rachaduras suaves e pedrinhas.
  crackedMud(p, horizon + 14, Y1, 160, 5, CAA.ochre4, 'rgba(70,40,40,0.55)', false);
  for (let i = 0; i < 500; i++) {
    const t = Math.pow(r(), 1.6);
    const y = Math.round(horizon + 6 + t * (Y1 - horizon));
    const s = 1 + Math.floor(t * 3);
    p.rect(Math.round(X0 + r() * W), y, s * 2, s, [CAA.ochre4, CAA.terra, CAA.ochre0, CAA.rock2][Math.floor(r() * 4)]);
  }
  // Mandacarus e cactos de média distância (longe = menores e mais azulados pela névoa).
  for (const [mx, by, h] of [[44, 100, 40], [112, 94, 28], [268, 98, 44], [214, 92, 24]] as const) {
    groundShadow(p, mx, by + 1, 10);
    mandacaru(p, r, mx, by, h, h > 30 ? 6 : 5);
  }
  for (const [bx, by, sz] of [[78, 106, 12], [160, 92, 8], [244, 108, 12], [300, 96, 9], [16, 112, 11]] as const) {
    groundShadow(p, bx, by + 1, 9);
    twigBush(p, r, bx, by, sz);
  }
  // Xique-xique (cacto de raquetes) no meio-plano.
  for (const [px, py] of [[186, 112], [92, 118]] as const) {
    groundShadow(p, px, py + 1, 12);
    for (let k = 0; k < 4; k++) {
      const ox = px + (k - 1.5) * 6;
      const oy = py - k * 2 - ((k * 5) % 3) * 3;
      ellipse(p, ox, oy - 6, 5, 7, CAA.sage0);
      ellipse(p, ox - 1, oy - 7, 4, 6, CAA.sage1);
      ellipse(p, ox - 2, oy - 9, 2, 3, CAA.sage2);
      for (let q = 0; q < 4; q++) p.px(ox - 3 + q * 2, oy - 11 + ((q * 3) % 7), '#f4ecc8');
    }
  }
  // Galho caído de pau-branco onde o animal pisa não existe: o chão firme é terra batida.
  ellipse(p, 160, ANIMAL_GROUND_Y + 2, 36, 5, 'rgba(150,80,40,0.45)');
}

export function drawScrubFront(p: Painter): void {
  const r = rng(72);
  // Macambiras (bromélias de folhas cinzentas) e galhos secos nos cantos.
  for (const [fx, mirror] of [[X0 + 12, 1], [X1 - 12, -1], [X0 + 62, 1], [X1 - 58, -1]] as const) {
    for (let k = 0; k < 9; k++) frond(p, fx, Y1, 34 + Math.floor(r() * 14), mirror * (0.1 + k * 0.28), -mirror * 0.03, CAA.sage0, k % 2 ? CAA.sage2 : CAA.sage3);
  }
  groundShadow(p, X0 + 22, Y1 - 4, 40);
  groundShadow(p, X1 - 22, Y1 - 4, 40);
  twigBush(p, r, X0 + 20, Y0 + 28, 22);
  twigBush(p, r, X1 - 24, Y0 + 24, 26);
  dryGrass(p, r, 110, Y1, 14, 18);
  dryGrass(p, r, 232, Y1, 12, 16);
}

// --- lajedo: afloramento de granito ---

export function drawOutcropBack(p: Painter): void {
  const r = rng(81);
  const horizon = 70;
  hotSky(p, horizon, 70, 34);
  farHills(p, r, horizon + 2);
  // Morrotes de granito ao fundo.
  graniteDome(p, r, 40, horizon + 12, 56, 38);
  graniteDome(p, r, 276, horizon + 14, 64, 46);
  graniteDome(p, r, 168, horizon + 6, 34, 16);
  // Caatinga entre as pedras.
  for (let i = 0; i < 40; i++) {
    const x = X0 + Math.floor(r() * W);
    ellipse(p, x, horizon + 8 + Math.floor(r() * 5), 3 + Math.floor(r() * 3), 2, r() < 0.5 ? CAA.sage1 : CAA.sage0);
  }
  mandacaru(p, r, 118, horizon + 18, 30, 5);
  // Laje plana em primeiro plano: pedra clara e quente com manchas violeta.
  const top = horizon + 14;
  gradient(p, X0, top, W, Y1 - top, [CAA.rock1, CAA.rock0, CAA.rock1, CAA.rock2]);
  // Manchas de líquen e de sombra na pedra (elipses achatadas, maiores perto).
  for (let i = 0; i < 70; i++) {
    const t = Math.pow(r(), 1.4);
    const y = Math.round(top + 4 + t * (Y1 - top));
    const x = Math.round(X0 + r() * W);
    const rx = 3 + Math.floor(t * 14);
    ellipse(p, x, y, rx, Math.max(1, Math.round(rx * 0.28)), r() < 0.45 ? 'rgba(110,90,146,0.28)' : r() < 0.5 ? 'rgba(138,160,112,0.35)' : 'rgba(217,116,74,0.28)');
  }
  // Fendas na rocha, partindo do horizonte.
  crackedMud(p, top + 6, Y1, 160, 17, CAA.rock0, 'rgba(70,50,96,0.65)', false);
  p.speckle(X0, top, W, Y1 - top, [CAA.rock3, CAA.rock0, CAA.terra2], 0.03, r);
  // Poça de chuva no lajedo, refletindo o céu.
  ellipse(p, 252, 150, 22, 4, CAA.rock4);
  ellipse(p, 252, 150, 20, 3, '#5aa8c4');
  p.hline(236, 149, 14, '#bfe8f0');
  // Touceiras de capim seco nas frestas.
  dryGrass(p, r, 60, 142, 10, 12);
  dryGrass(p, r, 270, 122, 9, 10);
  ellipse(p, 160, ANIMAL_GROUND_Y + 2, 34, 4, 'rgba(70,50,96,0.28)');
}

export function drawOutcropFront(p: Painter): void {
  const r = rng(82);
  // Bordas de lajedo escuras nos cantos inferiores, com sombra violeta.
  graniteDome(p, r, X0 + 4, Y1 + 4, 58, 40);
  graniteDome(p, r, X1 - 2, Y1 + 6, 66, 36);
  // Galhos secos e touceiras.
  twigBush(p, r, X0 + 16, Y0 + 30, 22);
  twigBush(p, r, X1 - 18, Y0 + 26, 24);
  dryGrass(p, r, 100, Y1, 12, 14);
  for (const [fx, mirror] of [[X0 + 64, 1], [X1 - 70, -1]] as const) {
    for (let k = 0; k < 7; k++) frond(p, fx, Y1, 24 + Math.floor(r() * 8), mirror * (0.1 + k * 0.3), -mirror * 0.03, CAA.sage0, k % 2 ? CAA.sage2 : CAA.sage3);
  }
}

// --- açude: água turva e margem de terra rachada ---

export function drawReservoirBack(p: Painter): void {
  const r = rng(91);
  const horizon = 58;
  hotSky(p, horizon, 222, 28);
  farHills(p, r, horizon + 2);
  // Margem distante com carnaúbas e arbustos secos.
  gradient(p, X0, horizon - 2, W, 8, [CAA.ochre2, CAA.ochre1]);
  for (let i = 0; i < 40; i++) {
    const x = X0 + Math.floor(r() * W);
    ellipse(p, x, horizon + 1, 3 + Math.floor(r() * 3), 2, r() < 0.5 ? CAA.sage1 : CAA.sage0);
  }
  for (const px of [28, 60, 248, 296]) {
    const h = 14 + Math.floor(r() * 8);
    p.vline(px, horizon - h + 2, h, CAA.ochre0);
    for (let k = 0; k < 6; k++) frond(p, px, horizon - h + 2, 7, -1.3 + k * 0.52, 0.06 * (k - 2.5), CAA.sage1, CAA.sage2);
  }
  mandacaru(p, r, 160, horizon + 2, 20, 4);
  // Espelho d'água: cor de barro e céu, mais escura perto da margem.
  const shore = 112;
  gradient(p, X0, horizon + 4, W, shore - horizon - 2, ['#d7a86e', '#6ab0b8', '#2f8aa4', '#1f6a88']);
  for (let i = 0; i < 160; i++) {
    const t = Math.pow(r(), 1.3);
    const y = Math.round(horizon + 8 + t * (shore - horizon - 10));
    p.hline(Math.round(X0 + r() * W), y, 3 + Math.floor(t * 14), r() < 0.5 ? '#9fd8e0' : '#1a5878');
  }
  // Reflexo dourado do sol.
  for (let y = horizon + 6; y < shore; y += 2) {
    const t = (y - horizon) / (shore - horizon);
    const w = Math.round(5 + t * 26 + r() * 6);
    p.hline(Math.round(222 - w / 2 + (r() - 0.5) * 5), y, w, r() < 0.6 ? CAA.ochre4 : '#fff0b0');
  }
  // Margem de barro seco com rachaduras, perto do observador.
  for (let x = X0; x < X1; x++) {
    const edge = shore + Math.round(Math.sin(x * 0.05) * 2 + Math.sin(x * 0.17) * 1);
    p.vline(x, edge, Y1 - edge, CAA.ochre2);
    p.vline(x, edge - 1, 1, CAA.rock4);
    p.vline(x, edge, 2, CAA.ochre0); // faixa úmida e escura junto à água
  }
  gradient(p, X0, shore + 3, W, Y1 - shore - 3, [CAA.ochre3, CAA.ochre2, CAA.terra, CAA.ochre1]);
  crackedMud(p, shore + 3, Y1, 160, 29, CAA.ochre4, 'rgba(80,38,40,0.7)', true);
  p.speckle(X0, shore + 4, W, Y1 - shore, [CAA.ochre0, CAA.ochre4, CAA.rock2], 0.03, r);
  // Ossos e galhos secos na lama (detalhe de seca).
  for (const [sx, sy] of [[50, 170], [262, 160]] as const) {
    line(p, sx, sy, sx + 14, sy - 4, CAA.twig);
    line(p, sx + 7, sy - 2, sx + 12, sy - 8, CAA.twig);
    groundShadow(p, sx + 6, sy + 1, 9);
  }
  ellipse(p, 160, ANIMAL_GROUND_Y + 2, 34, 4, 'rgba(60,30,50,0.32)');
}

export function drawReservoirFront(p: Painter): void {
  const r = rng(92);
  twigBush(p, r, X0 + 18, Y1, 28);
  twigBush(p, r, X1 - 20, Y1, 30);
  groundShadow(p, X0 + 20, Y1 - 3, 36);
  groundShadow(p, X1 - 22, Y1 - 3, 38);
  // Juncos secos e capim da margem.
  dryGrass(p, r, 120, Y1, 14, 20);
  dryGrass(p, r, 226, Y1, 12, 18);
  // Galhada seca pendurada nos cantos de cima.
  twigBush(p, r, X0 + 10, Y0 + 22, 20);
  twigBush(p, r, X1 - 14, Y0 + 20, 22);
}

/** Marolinha curta na beira do açude (água turva batendo na lama). */
export function drawLapping(p: Painter, y: number): void {
  for (let x = X0; x < X1; x++) {
    const yy = y + Math.round(Math.sin(x * 0.11) * 1.2 + Math.sin(x * 0.29) * 0.8);
    p.vline(x, yy, 1, 'rgba(230,246,240,0.8)');
    if ((x * 5) % 9 < 3) p.vline(x, yy - 1, 1, 'rgba(120,190,200,0.6)');
  }
}

/** Fundo de captura de um habitat dos biomas de src/biomes/ (`key('back')` etc. dão as chaves das texturas). */
export type CaptureBgPainter = (scene: Phaser.Scene, key: (part: string) => string) => CaptureBgLayers;

/** Fundos da Amazônia e da Caatinga; os outros biomas passam por src/art/captureBackgrounds.ts. */
export function paintBaseCaptureBackground(scene: Phaser.Scene, habitat: Habitat): CaptureBgLayers | null {
  const k = (s: string) => `capbg_${habitat}_${s}`;
  switch (habitat) {
    case 'dossel':
      return {
        back: layer(scene, k('back'), drawCanopyBack),
        front: layer(scene, k('front'), drawCanopyFront),
        fx: layer(scene, k('fx'), (p) => beams(p, [40, 110, 200, 270], 9, 0.3, 0.2)),
        fxKind: 'beams',
      };
    case 'sub-bosque':
      return {
        back: layer(scene, k('back'), (p) => drawForestBack(p, 78, ['#3a8a30', '#2a7a2c', '#175a22', '#0a3a1a'], 41, true)),
        front: layer(scene, k('front'), (p) => drawForestFront(p, 42)),
        fx: layer(scene, k('fx'), (p) => beams(p, [60, 150, 240], 12, 0.25, 0.16)),
        fxKind: 'beams',
      };
    case 'chao':
      return {
        back: layer(scene, k('back'), (p) => drawForestBack(p, 62, ['#b8742a', '#9a5a22', '#6e3d1a', '#3e2210'], 51, false)),
        front: layer(scene, k('front'), (p) => drawForestFront(p, 52)),
        fx: layer(scene, k('fx'), (p) => beams(p, [90, 190, 280], 11, 0.35, 0.17)),
        fxKind: 'beams',
      };
    case 'agua':
      return {
        back: layer(scene, k('back'), drawRiverBack),
        front: layer(scene, k('front'), drawRiverFront),
        fx: layer(scene, k('fx'), (p) => drawGlints(p, 23, 56)),
        fxKind: 'glints',
        waves: layer(scene, k('waves'), (p) => {
          const r = rng(24);
          for (let i = 0; i < 40; i++) {
            const y = 70 + Math.floor(Math.pow(r(), 1.2) * 150);
            const x = Math.round(X0 + r() * W);
            const len = 6 + Math.floor(((y - 56) / 150) * 20);
            p.hline(x, y, len, 'rgba(200,255,240,0.55)');
          }
        }),
      };
    case 'praia':
      return {
        back: layer(scene, k('back'), drawBeachBack),
        front: layer(scene, k('front'), drawBeachFront),
        fx: layer(scene, k('fx'), (p) => drawGlints(p, 33, 46)),
        fxKind: 'glints',
        waves: layer(scene, k('waves'), (p) => drawWaves(p, 104, true)),
      };
    case 'mata-seca':
      return {
        back: layer(scene, k('back'), drawScrubBack),
        front: layer(scene, k('front'), drawScrubFront),
        fx: layer(scene, k('fx'), (p) => beams(p, [70, 190, 290], 14, 0.28, 0.13)),
        fxKind: 'beams',
      };
    case 'lajedo':
      return {
        back: layer(scene, k('back'), drawOutcropBack),
        front: layer(scene, k('front'), drawOutcropFront),
        fx: layer(scene, k('fx'), (p) => beams(p, [50, 170, 260], 16, 0.22, 0.12)),
        fxKind: 'beams',
      };
    case 'acude':
      return {
        back: layer(scene, k('back'), drawReservoirBack),
        front: layer(scene, k('front'), drawReservoirFront),
        fx: layer(scene, k('fx'), (p) => drawGlints(p, 63, 58)),
        fxKind: 'glints',
        waves: layer(scene, k('waves'), (p) => drawLapping(p, 112)),
      };
    default:
      return null;
  }
}

// ---------- adereços: rede (puçá), aviso, etc. ----------

interface NetPalette {
  rim: string;
  rimDark: string;
  mesh: string;
  meshLine: string;
  handle: string;
  handleDark: string;
}

const NET_NORMAL: NetPalette = { rim: '#ffc83a', rimDark: '#7a3e10', mesh: '#fff3c8', meshLine: '#c9a45a', handle: '#b87a38', handleDark: '#4a2410' };
const NET_BURNT: NetPalette = { rim: '#4a3a30', rimDark: '#120a06', mesh: '#2a2220', meshLine: '#0a0605', handle: '#3a2a20', handleDark: '#0a0605' };

export const NET_W = 36;
export const NET_H = 50;
/** Centro do aro dentro do sprite da rede aberta. */
export const NET_HOOP_Y = 9;

export function drawNet(p: Painter, c: NetPalette): void {
  const cx = 18;
  // Cabo.
  for (let y = 22; y < NET_H; y++) {
    p.px(cx - 1, y, c.handleDark);
    p.px(cx, y, c.handle);
    p.px(cx + 1, y, c.handle);
    p.px(cx + 2, y, c.handleDark);
  }
  // Saco de malha pendurado sob o aro.
  ellipse(p, cx, NET_HOOP_Y + 8, 13, 10, c.rimDark);
  ellipse(p, cx, NET_HOOP_Y + 8, 12, 9, c.mesh);
  for (let y = NET_HOOP_Y; y < NET_HOOP_Y + 18; y++) {
    for (let x = cx - 13; x <= cx + 13; x++) if ((x + y) % 4 === 0 && p.ctx.getImageData(x, y, 1, 1).data[3] > 0) p.px(x, y, c.meshLine);
  }
  // Aro (elipse vista de baixo).
  ellipse(p, cx, NET_HOOP_Y, 15, 6, c.rimDark);
  ellipse(p, cx, NET_HOOP_Y, 14, 5, c.rim);
  ellipse(p, cx, NET_HOOP_Y, 11, 3, c.mesh);
  p.hline(cx - 9, NET_HOOP_Y - 1, 18, c.meshLine);
}

export function drawNetClosed(p: Painter, c: NetPalette): void {
  const cx = 18;
  ellipse(p, cx, 24, 14, 12, c.rimDark);
  ellipse(p, cx, 24, 13, 11, c.mesh);
  for (let y = 12; y < 38; y++) {
    for (let x = 4; x < 33; x++) if ((x + y) % 4 === 0 && p.ctx.getImageData(x, y, 1, 1).data[3] > 0) p.px(x, y, c.meshLine);
  }
  // Boca amarrada e cabo.
  p.rect(cx - 6, 10, 12, 4, c.rim);
  p.frame(cx - 6, 10, 12, 4, c.rimDark);
  p.rect(cx - 1, 2, 3, 9, c.handle);
  p.px(cx - 2, 2, c.handleDark);
  p.px(cx + 2, 2, c.handleDark);
}

export function paintCaptureProps(scene: Phaser.Scene): void {
  paint(scene, 'cap_net', NET_W, NET_H, (p) => drawNet(p, NET_NORMAL));
  paint(scene, 'cap_net_burnt', NET_W, NET_H, (p) => drawNet(p, NET_BURNT));
  paint(scene, 'cap_net_closed', NET_W, 40, (p) => drawNetClosed(p, NET_NORMAL));
  // Aviso "!" que antecede a ação do animal.
  paint(scene, 'cap_warn', 9, 13, (p) => {
    p.rect(2, 0, 5, 8, '#3a1000');
    p.rect(3, 0, 3, 7, '#ffd23a');
    p.px(4, 1, '#fff7c0');
    p.rect(2, 9, 5, 4, '#3a1000');
    p.rect(3, 10, 3, 2, '#ffd23a');
  });
  // Faísca do poraquê.
  paint(scene, 'cap_spark', 9, 9, (p) => {
    p.template(['....c....', '....c....', '...cwc...', '.cc.cwccc', 'cwwwwwwwc', 'ccc.cwc..', '...cwc...', '....c.c..', '.........'], { c: '#3affd8', w: '#ffffff' });
  });
  // Pontinho de poeira/pólen e brilho.
  paint(scene, 'cap_mote', 3, 3, (p) => {
    p.px(1, 0, 'rgba(255,240,170,0.5)');
    p.px(0, 1, 'rgba(255,240,170,0.5)');
    p.px(2, 1, 'rgba(255,240,170,0.5)');
    p.px(1, 2, 'rgba(255,240,170,0.5)');
    p.px(1, 1, '#fff7c0');
  });
  // Sombra do animal (elipse achatada em degradê de dois tons).
  paint(scene, 'cap_shadow', 48, 14, (p) => {
    ellipse(p, 24, 7, 23, 6, 'rgba(2,20,22,0.35)');
    ellipse(p, 24, 7, 17, 4, 'rgba(2,20,22,0.35)');
  });
}
