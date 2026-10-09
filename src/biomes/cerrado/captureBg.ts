import { rng, type Painter } from '../../art/canvas';
import { ANIMAL_GROUND_Y, W, X0, X1, Y0, Y1, beams, drawGlints, drawWaves, ellipse, farHills, frond, gradient, groundShadow, hotSky, layer, line, type CaptureBgPainter } from '../../art/captureBg';
import type { Habitat } from '../../data/species';

// Fundos de captura do Cerrado (320×214 de arte): campo aberto, cerradão e vereda.
// Céu quente, capim dourado, terra vermelha e sombras frias verde-azuladas.

const C = {
  red0: '#6a3028',
  red1: '#a2523a',
  red2: '#c87a4a',
  red3: '#e8a468',
  gold0: '#8a5a30',
  gold1: '#c08a3c',
  gold2: '#e0b44e',
  gold3: '#f6dc84',
  gold4: '#fff4c0',
  olive0: '#1e3a28',
  olive1: '#34602c',
  olive2: '#5a9038',
  olive3: '#98c04c',
  olive4: '#d4dc78',
  bark0: '#2a1a22',
  bark1: '#4a3430',
  bark2: '#765848',
  bark3: '#a48468',
};

/** Árvore torta e baixa: tronco sinuoso e copa achatada em tufos. */
function twistedTree(p: Painter, r: () => number, x: number, base: number, h: number, flat = true): void {
  groundShadow(p, x, base + 1, Math.round(h * 0.45));
  let cx = x;
  const top = base - h;
  for (let y = base; y > top; y--) {
    cx += Math.round((r() - 0.5) * 1.4);
    const wd = Math.max(2, Math.round(3 + (y - top) / h * 3));
    p.hline(cx - (wd >> 1), y, wd, C.bark1);
    p.vline(cx - (wd >> 1), y, 1, C.bark3);
    p.vline(cx - (wd >> 1) + wd - 1, y, 1, C.bark0);
  }
  for (let i = 0; i < 6; i++) {
    const bx = cx + (r() - 0.5) * h * 0.9;
    const by = top + (r() - 0.3) * h * 0.25;
    line(p, cx, top + 4, bx, by, C.bark1);
    ellipse(p, Math.round(bx), Math.round(by), Math.round(h * (flat ? 0.3 : 0.2)), Math.round(h * 0.13), C.olive1);
    ellipse(p, Math.round(bx) - 1, Math.round(by) - 1, Math.round(h * (flat ? 0.26 : 0.17)), Math.round(h * 0.1), r() < 0.5 ? C.olive2 : C.olive3);
    p.px(Math.round(bx) - 3, Math.round(by) - 2, C.olive4);
  }
}

function seedHeads(p: Painter, r: () => number, x: number, base: number, n: number, h: number): void {
  for (let i = 0; i < n; i++) {
    const a = (r() - 0.5) * 1.3;
    const len = h * (0.6 + r() * 0.5);
    const x1 = x + i - n / 2 + Math.sin(a) * len;
    const y1 = base - Math.cos(a) * len;
    line(p, x + i - n / 2, base, x1, y1, r() < 0.4 ? C.gold1 : C.gold3);
    p.px(Math.round(x1), Math.round(y1) - 1, C.gold4);
  }
}

function groundTexture(p: Painter, r: () => number, top: number, dense: number): void {
  for (let i = 0; i < dense; i++) {
    const t = Math.pow(r(), 1.5);
    const y = Math.round(top + t * (Y1 - top));
    const s = 1 + Math.floor(t * 3);
    p.rect(Math.round(X0 + r() * W), y, s * 2, s, [C.gold3, C.red3, C.red0, C.gold1][Math.floor(r() * 4)]);
  }
}

// ---------- campo ----------

function campoBack(p: Painter): void {
  const r = rng(301);
  const horizon = 74;
  hotSky(p, horizon, 82, 30);
  farHills(p, r, horizon + 2);
  // cerrado distante: pontinhos de árvores sobre o campo
  gradient(p, X0, horizon + 2, W, 14, ['#a8a460', '#8a9a4c']);
  for (let i = 0; i < 60; i++) ellipse(p, X0 + Math.floor(r() * W), horizon + 2 + Math.floor(r() * 7), 3 + Math.floor(r() * 3), 1 + Math.floor(r() * 2), r() < 0.5 ? C.olive2 : C.olive1);
  gradient(p, X0, horizon + 14, W, Y1 - horizon, [C.gold3, C.gold2, C.gold1, C.red1, C.red0]);
  groundTexture(p, r, horizon + 14, 420);
  for (let i = 0; i < 300; i++) {
    const t = Math.pow(r(), 1.4);
    const y = Math.round(horizon + 16 + t * (Y1 - horizon));
    seedHeads(p, r, Math.round(X0 + r() * W), y, 3, 3 + t * 9);
  }
  // árvores tortas espaçadas e cupinzeiros
  for (const [x, b, h] of [[40, 98, 34], [118, 90, 24], [262, 96, 36], [210, 88, 20], [300, 104, 28]] as const) twistedTree(p, r, x, b, h);
  for (const [x, b] of [[88, 112], [236, 108]] as const) {
    groundShadow(p, x, b + 1, 9);
    for (let y = 0; y < 14; y++) p.hline(x - 5 + (y >> 2), b - y, 11 - (y >> 1), y < 4 ? C.red3 : y > 9 ? C.red0 : C.red2);
    p.px(x - 2, b - 10, C.gold4);
  }
  ellipse(p, 160, ANIMAL_GROUND_Y + 2, 36, 5, 'rgba(140,70,40,0.4)');
}

function campoFront(p: Painter): void {
  const r = rng(302);
  seedHeads(p, r, X0 + 20, Y1, 22, 50);
  seedHeads(p, r, X1 - 20, Y1, 22, 54);
  seedHeads(p, r, X0 + 70, Y1, 14, 30);
  seedHeads(p, r, X1 - 66, Y1, 14, 32);
  groundShadow(p, X0 + 24, Y1 - 3, 40);
  groundShadow(p, X1 - 24, Y1 - 3, 40);
  // flores do campo
  for (const [x, y, c] of [[30, 200, '#ff7ab0'], [290, 196, '#c070f0'], [60, 208, '#ffb02a']] as const) {
    p.px(x, y, c).px(x - 1, y - 1, c).px(x + 1, y - 1, c).px(x, y - 2, c).px(x, y - 1, C.gold4);
    p.vline(x, y + 1, 6, C.olive2);
  }
}

// ---------- cerradão ----------

function cerradaoBack(p: Painter): void {
  const r = rng(311);
  gradient(p, X0, Y0, W, 130, ['#6ab8c0', '#b0d89c', '#e8e090', '#c8c070']);
  // copas ao fundo
  gradient(p, X0, 60, W, Y1 - 60, [C.olive2, C.olive1, C.olive0, '#102a22']);
  const cols = [C.olive0, C.olive1, C.olive2, C.olive3];
  for (let i = 0; i < 180; i++) {
    const x = X0 + Math.floor(r() * W);
    const y = Y0 + Math.floor(Math.pow(r(), 0.8) * 120);
    const up = 1 - y / 130;
    ellipse(p, x, y, 5 + Math.floor(r() * 6), 3 + Math.floor(r() * 3), cols[Math.max(0, Math.min(3, Math.floor(r() * 2 + up * 2.2)))]);
  }
  // troncos tortos
  for (const [x, w] of [[24, 8], [92, 6], [212, 7], [286, 9], [150, 4]] as const) {
    let cx = x;
    for (let y = Y0; y < 150; y++) {
      if (y % 9 === 0) cx += Math.round((r() - 0.5) * 3);
      p.hline(cx, y, w, C.bark1);
      p.vline(cx, y, 1, C.bark3);
      p.vline(cx + 1, y, 1, C.bark2);
      p.vline(cx + w - 1, y, 1, C.bark0);
      if (r() < 0.25) p.px(cx + 2 + Math.floor(r() * (w - 3)), y, C.bark0);
    }
  }
  // chão de serapilheira escura
  gradient(p, X0, 118, W, Y1 - 118, ['#a07a48', '#7a5636', '#5a3c2c', '#3c2a24']);
  for (let i = 0; i < 380; i++) {
    const t = Math.pow(r(), 1.5);
    const y = Math.round(122 + t * (Y1 - 122));
    const s = 1 + Math.floor(t * 2);
    p.rect(Math.round(X0 + r() * W), y, s * 2, s, [C.gold2, C.gold1, '#6a4a30', C.red1, C.olive2][Math.floor(r() * 5)]);
  }
  // raízes e galhos caídos
  for (const [sx, sy] of [[60, 168], [250, 176]] as const) {
    line(p, sx, sy, sx + 22, sy - 5, C.bark1);
    line(p, sx, sy - 1, sx + 22, sy - 6, C.bark3);
    groundShadow(p, sx + 10, sy + 1, 14);
  }
  ellipse(p, 160, ANIMAL_GROUND_Y + 2, 36, 5, 'rgba(20,40,40,0.4)');
}

function cerradaoFront(p: Painter): void {
  const r = rng(312);
  // galhos e folhagem pendendo nos cantos de cima
  for (const [x, m] of [[X0, 1], [X1, -1]] as const) {
    line(p, x, Y0 + 20, x + m * 90, Y0 + 40, C.bark1);
    line(p, x, Y0 + 19, x + m * 90, Y0 + 39, C.bark3);
    for (let i = 0; i < 18; i++) {
      const fx = x + m * (6 + r() * 90);
      const fy = Y0 + 24 + r() * 28;
      ellipse(p, Math.round(fx), Math.round(fy), 7, 3, C.olive0);
      ellipse(p, Math.round(fx) - 1, Math.round(fy) - 1, 5, 2, r() < 0.5 ? C.olive1 : C.olive2);
      if (r() < 0.3) p.px(Math.round(fx) - 2, Math.round(fy) - 2, C.olive4);
    }
  }
  seedHeads(p, r, X0 + 30, Y1, 12, 28);
  seedHeads(p, r, X1 - 30, Y1, 12, 30);
  groundShadow(p, X0 + 30, Y1 - 3, 36);
  groundShadow(p, X1 - 30, Y1 - 3, 36);
}

// ---------- vereda ----------


function veredaBack(p: Painter): void {
  const r = rng(321);
  const horizon = 66;
  const shore = 134;
  hotSky(p, horizon, 240, 28);
  farHills(p, r, horizon + 2);
  // margem distante: brejo verde e buritis
  gradient(p, X0, horizon - 2, W, 14, ['#6a9a48', '#3e7a40']);
  for (let i = 0; i < 50; i++) ellipse(p, X0 + Math.floor(r() * W), horizon + 3, 3 + Math.floor(r() * 3), 2, r() < 0.5 ? C.olive2 : C.olive1);
  for (const px of [22, 58, 104, 214, 254, 296]) {
    const h = 24 + Math.floor(r() * 14);
    const base = horizon + 4;
    p.vline(px, base - h, h, '#6a5a50');
    p.vline(px + 1, base - h, h, '#a89878');
    for (let k = 0; k < 7; k++) frond(p, px, base - h + 1, 11, -1.4 + k * 0.47, 0.07 * (k - 3), C.olive0, k % 2 ? C.olive3 : C.olive2);
  }
  // espelho d'água do córrego
  gradient(p, X0, horizon + 8, W, shore - horizon - 6, ['#9ad8c8', '#4cb4a8', '#2a8a8c', '#1c6a72']);
  for (let i = 0; i < 160; i++) {
    const t = Math.pow(r(), 1.3);
    const y = Math.round(horizon + 10 + t * (shore - horizon - 12));
    p.hline(Math.round(X0 + r() * W), y, 3 + Math.floor(t * 14), r() < 0.5 ? '#bff4e0' : '#1a5a68');
  }
  // reflexo dos buritis
  for (const px of [58, 214, 254]) for (let y = horizon + 10; y < shore - 6; y += 2) p.hline(px - 1 + Math.round(Math.sin(y) * 2), y, 3, 'rgba(20,70,60,0.5)');
  // margem: brejo e lama junto ao animal
  for (let x = X0; x < X1; x++) {
    const edge = shore + Math.round(Math.sin(x * 0.06) * 2 + Math.sin(x * 0.19));
    p.vline(x, edge, Y1 - edge, '#4e8a40');
    p.vline(x, edge - 1, 1, '#d0f0e0');
    p.vline(x, edge, 2, '#2e5a3a');
  }
  gradient(p, X0, shore + 3, W, Y1 - shore - 3, ['#5aa048', '#3e8442', '#2e6a3a', '#6a5a3a']);
  for (let i = 0; i < 380; i++) {
    const t = Math.pow(r(), 1.4);
    const y = Math.round(shore + 5 + t * (Y1 - shore));
    p.rect(Math.round(X0 + r() * W), y, 1 + Math.floor(t * 4), 1 + Math.floor(t * 2), [C.olive3, C.olive4, C.olive0, '#7a6a48'][Math.floor(r() * 4)]);
  }
  ellipse(p, 160, ANIMAL_GROUND_Y + 2, 34, 4, 'rgba(10,50,50,0.35)');
}

function veredaFront(p: Painter): void {
  const r = rng(322);
  // folhas de buriti caídas sobre os cantos de cima
  for (const [x, m] of [[X0 + 6, 1], [X1 - 6, -1]] as const) {
    for (let k = 0; k < 7; k++) frond(p, x, Y0 + 10, 36 + Math.floor(r() * 12), m * (1.1 + k * 0.28), m * 0.1, C.olive0, k % 2 ? C.olive3 : C.olive2);
  }
  // juncos e capim úmido
  for (const [x, n, h] of [[X0 + 24, 18, 44], [X1 - 24, 18, 48], [X0 + 80, 10, 26], [X1 - 78, 10, 28]] as const) {
    for (let i = 0; i < n; i++) {
      const a = (r() - 0.5) * 1.1;
      const len = h * (0.55 + r() * 0.5);
      line(p, x + i - n / 2, Y1, x + i - n / 2 + Math.sin(a) * len, Y1 - Math.cos(a) * len, r() < 0.5 ? C.olive1 : C.olive3);
    }
  }
  groundShadow(p, X0 + 26, Y1 - 3, 36);
  groundShadow(p, X1 - 26, Y1 - 3, 36);
  // taboas: hastes escuras com espiga marrom
  for (const x of [X0 + 52, X1 - 46]) {
    p.vline(x, Y1 - 52, 52, C.olive1);
    p.rect(x - 1, Y1 - 62, 3, 12, '#6a3a24');
    p.vline(x - 1, Y1 - 62, 12, '#9a5a38');
  }
}

const mk =
  (back: (p: Painter) => void, front: (p: Painter) => void, name: string, water: boolean, fxSeed: number): CaptureBgPainter =>
  (scene, key) => ({
    back: layer(scene, key('back'), back),
    front: layer(scene, key('front'), front),
    fx: layer(scene, key('fx'), water ? (p) => drawGlints(p, fxSeed, 60) : (p) => beams(p, [60, 160, 270], name === 'cerradao' ? 11 : 15, 0.26, name === 'cerradao' ? 0.17 : 0.12)),
    fxKind: water ? 'glints' : 'beams',
    ...(water ? { waves: layer(scene, key('waves'), (p) => drawWaves(p, 134, false)) } : {}),
  });

export const CAPTURE_BG: Partial<Record<Habitat, CaptureBgPainter>> = {
  campo: mk(campoBack, campoFront, 'campo', false, 0),
  cerradao: mk(cerradaoBack, cerradaoFront, 'cerradao', false, 0),
  vereda: mk(veredaBack, veredaFront, 'vereda', true, 331),
};
