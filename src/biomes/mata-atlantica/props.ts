import { rng, type Painter } from '../../art/canvas';
import { Body, canopy, disc, frond, hash2, line, shadow, type CanopyPals, type Pal5 } from '../../art/draw';
import type { PropSpec } from '../../art/forest';
import type { PropPainter } from '../types';

// Objetos da Mata Atlântica (prefixo `mat_`). Mesmo contrato da floresta: textura `prop_<tipo>`,
// centrada na largura da base e apoiada no fundo do tile. Luz do alto à esquerda; sombras frias azuladas.
// Os objetos de `src/art/forest.ts` (samambaia, bromelia, heliconia, cipo, tronco...) e da Caatinga (agreste) também são usados no mapa.

export const PROPS: Record<string, PropSpec> = {
  mat_jequitiba: { w: 80, h: 128, fw: 1, fh: 1, canopy: true },
  mat_palmito_jucara: { w: 40, h: 88, fw: 1, fh: 1, canopy: true },
  mat_quaresmeira: { w: 56, h: 68, fw: 1, fh: 1, canopy: true },
  mat_ipe_roxo: { w: 64, h: 80, fw: 1, fh: 1, canopy: true },
  mat_xaxim: { w: 32, h: 40, fw: 1, fh: 1 },
  mat_araucaria: { w: 64, h: 112, fw: 1, fh: 1, canopy: true },
  mat_bromelia_grande: { w: 24, h: 22, fw: 1, fh: 1 },
  mat_mangue_vermelho: { w: 48, h: 48, fw: 1, fh: 1 },
  mat_cascata: { w: 48, h: 64, fw: 2, fh: 1 },
  mat_pedra_musgosa: { w: 32, h: 24, fw: 2, fh: 1 },
  mat_jeriva: { w: 48, h: 88, fw: 1, fh: 1, canopy: true },
  mat_orquidea: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
  mat_musgo: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
  mat_capim_frio: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
  mat_flores_campo: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
  mat_restinga: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
};

const SHADE = '#0a2a3a';

const BARK: Pal5 = { o: '#1c2430', d: '#44505a', m: '#6e7c7c', l: '#9eac9c', h: '#d4dcc0' };
const BARK_RED: Pal5 = { o: '#2a1820', d: '#5c3430', m: '#8a5444', l: '#b87c58', h: '#e8b484' };
const PALM_TRUNK: Pal5 = { o: '#1e2a34', d: '#4a5a60', m: '#7c8e88', l: '#b0c0aa', h: '#e4ecd0' };
const ROCK: Pal5 = { o: '#14243a', d: '#36506a', m: '#5c7a92', l: '#90aec0', h: '#d0e4ec' };
const FERN: Pal5 = { o: '#0a2c2a', d: '#17583e', m: '#2e9050', l: '#6cc86c', h: '#c4f4a0' };
const PALM: Pal5 = { o: '#0a2830', d: '#146044', m: '#2c9a58', l: '#6cd070', h: '#d0f8a4' };
const SPIKE: Pal5 = { o: '#0c2630', d: '#1c4c44', m: '#2e7a5a', l: '#5ca67a', h: '#b0dcae' };

const MATA: CanopyPals = {
  gold: { o: '#14382c', d: '#2c6a44', m: '#58a05a', l: '#98d070', h: '#e4f4a8' },
  lime: { o: '#0c3030', d: '#1c5e48', m: '#34905a', l: '#6cc072', h: '#bce8a0' },
  teal: { o: '#0a2236', d: '#143e54', m: '#206a68', l: '#3a9a80', h: '#80d0a0' },
  dark: { o: '#0a1c34', d: '#122e4a', m: '#1a5058', l: '#2c806c', h: '#70c4a0' },
};
const QUARESMA: CanopyPals = {
  gold: { o: '#5a2272', d: '#a24cc8', m: '#d078ec', l: '#f0a8f8', h: '#fff0ff' },
  lime: { o: '#40186a', d: '#8438b8', m: '#b45ce0', l: '#dc90f4', h: '#fadcff' },
  teal: { o: '#2a1a5a', d: '#5a2e98', m: '#8446c0', l: '#a870d8', h: '#d8b0f0' },
  dark: { o: '#142a3a', d: '#245a4c', m: '#388a5c', l: '#58b070', h: '#a0dc98' },
};
const IPE_ROXO: CanopyPals = {
  gold: { o: '#6a2a70', d: '#c260b0', m: '#f08cc8', l: '#ffb8dc', h: '#fff0f8' },
  lime: { o: '#5a2878', d: '#b058c0', m: '#e07cdc', l: '#f8a8ec', h: '#fff0fc' },
  teal: { o: '#38226a', d: '#7a44b0', m: '#a468d4', l: '#c890e8', h: '#ecc8fa' },
  dark: { o: '#142c3a', d: '#285c50', m: '#3c8c60', l: '#60b478', h: '#a8e0a0' },
};

/** Tronco recortado, com leve ondulação e alargamento na base; lean desloca o topo. */
function trunk(w: number, h: number, cx: number, y0: number, y1: number, hwTop: number, hwBase: number, flareFrom: number, lean = 0, wob = 0.6): Body {
  const b = new Body(w, h);
  for (let y = y0; y <= y1; y++) {
    const t = y > flareFrom ? (y - flareFrom) / (y1 - flareFrom) : 0;
    const hw = hwTop + (hwBase - hwTop) * t * t;
    const c = cx + (lean * (y1 - y)) / (y1 - y0) + Math.sin(y * 0.35) * wob;
    for (let x = Math.ceil(c - hw); x <= Math.floor(c + hw); x++) b.set(x, y, (x - c) / hw);
  }
  return b;
}

function branch(p: Painter, x0: number, y0: number, x1: number, y1: number, pal: Pal5): void {
  line(p, x0, y0 + 1, x1, y1 + 1, pal.o);
  line(p, x0, y0, x1, y1, pal.m);
  line(p, x0, y0 - 1, x1, y1 - 1, pal.l);
}

/** Pequena bromélia-epífita: roseta de lâminas verdes com miolo vermelho. */
function epiphyte(p: Painter, x: number, y: number): void {
  for (const [dx, dy, c] of [[-3, -1, '#1c6a48'], [3, -1, '#1c6a48'], [-2, -3, '#3aa05a'], [2, -3, '#3aa05a'], [0, -4, '#6cd070'], [-1, -2, '#2e8a50'], [1, -2, '#2e8a50']] as const) line(p, x, y, x + dx, y + dy, c);
  p.px(x, y - 1, '#ff4a5a').px(x, y, '#c01e3a').px(x + 1, y - 1, '#ff8a6a');
}

// ------------------------------------------------------------------ árvores

function jequitiba(p: Painter): void {
  shadow(p, 40, 124, 28, 4.6, 0.42, SHADE);
  // sapopemas (raízes tabulares) e tronco liso, cinza esverdeado
  const roots = new Body(80, 128);
  for (let y = 100; y <= 125; y++) {
    const t = (y - 100) / 25;
    for (const [dir, reach] of [[-1, 12], [1, 12], [-1, 7], [1, 7]] as const) {
      const w = reach * t * t + 1;
      const cx = 40 + dir * (5 + (reach - 4) * t * t);
      for (let x = Math.round(cx - w * 0.5); x <= Math.round(cx + w * 0.5); x++) roots.set(x, y, dir * 0.2 + (x - cx) / (w + 1));
    }
  }
  roots.render(p, { ...BARK, m: '#5a6666', l: '#86948a' }, 17, 0.6);
  const b = trunk(80, 128, 40, 44, 124, 4.2, 8.6, 88, 1, 0.5);
  b.render(p, BARK, 31, 0.5);
  // líquen claro, cipós e texturas verticais
  const r = rng(212);
  for (let i = 0; i < 40; i++) {
    const y = 48 + Math.floor(r() * 70);
    const x = 33 + Math.floor(r() * 14);
    if (b.has(x, y) && b.has(x + 1, y) && b.has(x, y + 1)) p.px(x, y, i % 3 ? '#8ab890' : '#dce8c0').px(x + 1, y, '#5a8a6a');
  }
  for (let y = 50; y < 120; y += 5) if (b.has(40, y)) p.px(40 + (y % 3), y, '#2a3440');
  // galhos mestres
  branch(p, 40, 56, 16, 36, BARK);
  branch(p, 41, 54, 66, 34, BARK);
  branch(p, 40, 50, 40, 26, BARK);
  canopy(p, 40, 34, 36, 28, 52, 733, 6, 10.5, MATA, true);
  // epífitas nos galhos e barbas-de-velho
  epiphyte(p, 22, 41);
  epiphyte(p, 56, 40);
  epiphyte(p, 36, 53);
  for (const [x, y, len] of [[14, 52, 20], [26, 58, 28], [58, 52, 24], [66, 48, 14], [46, 62, 22]] as const) {
    for (let k = 0; k < len; k++) p.px(x + Math.round(Math.sin(k * 0.4 + x) * 1.2), y + k, k % 4 === 3 ? '#8ac8a0' : k < len - 3 ? '#2c6a58' : '#6ab890');
  }
  p.px(40, 92, '#ff8aa0').px(41, 92, '#ffd0d8');
}

function palmitoJucara(p: Painter): void {
  shadow(p, 20, 85, 11, 2.8, 0.38, SHADE);
  const b = trunk(40, 88, 20, 30, 86, 2.1, 2.8, 78, 1.2, 0.3);
  b.render(p, PALM_TRUNK, 41, 0.35);
  // anéis das folhas caídas
  for (let y = 34; y < 84; y += 4) for (let x = 15; x < 27; x++) if (b.has(x, y) && b.has(x - 1, y) && b.has(x + 1, y)) p.px(x, y, '#3a4a50');
  // bainha verde-arroxeada (coroa)
  for (let y = 22; y < 32; y++) {
    const hw = 2 + (y < 26 ? 0 : 0.3);
    for (let x = Math.round(20 - hw); x <= Math.round(20 + hw); x++) p.px(x, y, x < 20 ? '#7acc7a' : x === 20 ? '#3a9a58' : '#1c6a48');
  }
  p.px(19, 22, '#b8f090');
  // cacho de frutos roxo-escuros (juçara)
  for (const [x, y] of [[17, 34], [19, 35], [22, 34], [18, 37], [21, 37], [20, 39]] as const) disc(p, x, y, 1.3, 1.3, '#2a1448'), p.px(x - 1, y - 1, '#7a50b0');
  // folhas pinadas, arqueadas e caídas
  for (const [dir, len, lift, droop] of [
    [-1, 17, 0.5, 1.0],
    [1, 17, 0.5, 1.0],
    [-0.75, 15, 1.5, 0.9],
    [0.75, 15, 1.5, 0.9],
    [-0.3, 13, 2.0, 0.7],
    [0.3, 13, 2.0, 0.7],
    [-0.98, 11, -0.2, 2.2],
    [0.98, 11, -0.2, 2.2],
  ] as const) {
    frond(p, 20, 22, dir, len, lift, droop, PALM, 3);
    frond(p, 20, 21, dir * 0.96, len - 1, lift, droop, PALM, 2);
  }
  p.px(20, 15, '#e0ffb0').px(19, 16, '#8ee070');
}

function blossomTree(p: Painter, w: number, h: number, cx: number, topY: number, rx: number, ry: number, n: number, pals: CanopyPals, seed: number, petals: [string, string]): void {
  shadow(p, cx, h - 3, rx * 0.65, 3.6, 0.4, SHADE);
  const b = trunk(w, h, cx, Math.round(topY + ry * 0.6), h - 4, 2.1, 3.9, h - 18, -1.5, 0.9);
  b.render(p, BARK, seed % 40, 0.5);
  branch(p, cx, topY + ry * 0.9, cx - rx * 0.7, topY + ry * 0.4, BARK);
  branch(p, cx, topY + ry * 0.8, cx + rx * 0.7, topY + ry * 0.3, BARK);
  canopy(p, cx, topY + ry * 0.5, rx, ry, n, seed, 4.4, 7.4, pals, false);
  // chuva de flores
  const r = rng(seed + 5);
  for (let i = 0; i < 34; i++) {
    const a = r() * 6.283;
    const d = Math.sqrt(r()) * 0.92;
    const x = Math.round(cx + Math.cos(a) * d * rx);
    const y = Math.round(topY + ry * 0.5 + Math.sin(a) * d * ry);
    p.px(x, y, petals[1]).px(x + 1, y, petals[0]).px(x, y + 1, petals[0]);
  }
  for (let i = 0; i < 8; i++) p.px(Math.round(cx - rx * 0.8 + r() * rx * 1.6), Math.round(h - 18 + r() * 12), petals[i % 2]);
}

const quaresmeira = (p: Painter) => blossomTree(p, 56, 68, 28, 8, 24, 22, 32, QUARESMA, 511, ['#c070e8', '#f0b8ff']);
const ipeRoxo = (p: Painter) => blossomTree(p, 64, 80, 32, 6, 28, 26, 38, IPE_ROXO, 611, ['#e078d0', '#ffc0ec']);

function xaxim(p: Painter): void {
  shadow(p, 16, 37, 10, 2.4, 0.36, SHADE);
  // caule fibroso de raízes aéreas, escuro e peludo
  const b = trunk(32, 40, 16, 15, 38, 3.2, 4.2, 34, 0.8, 0.5);
  b.render(p, { o: '#1c1418', d: '#3a2a26', m: '#5a4234', l: '#826450', h: '#b08e6c' }, 51, 0.9);
  const r = rng(77);
  for (let i = 0; i < 26; i++) p.px(12 + Math.floor(r() * 9), 18 + Math.floor(r() * 18), r() < 0.5 ? '#150f14' : '#9a7c5c');
  // frondes
  for (const [dir, len, lift, droop] of [
    [-1, 15, 0.7, 1.1],
    [1, 15, 0.7, 1.1],
    [-0.65, 14, 1.7, 0.9],
    [0.65, 14, 1.7, 0.9],
    [-0.2, 12, 2.1, 0.6],
    [0.2, 12, 2.1, 0.6],
    [-0.95, 10, 0.1, 1.9],
    [0.95, 10, 0.1, 1.9],
  ] as const) {
    frond(p, 16, 15, dir, len, lift, droop, FERN, 3);
  }
  p.px(16, 11, '#e4ffc0').px(15, 12, '#a0e080').px(17, 12, '#a0e080');
}

function araucaria(p: Painter): void {
  shadow(p, 32, 109, 16, 3.4, 0.42, SHADE);
  const b = trunk(64, 112, 32, 28, 108, 2.4, 4.6, 98, 0.5, 0.35);
  b.render(p, BARK_RED, 71, 0.55);
  // anéis das cicatrizes de galhos
  for (let y = 34; y < 104; y += 3) for (let x = 27; x < 38; x++) if (b.has(x, y) && b.has(x - 1, y) && b.has(x + 1, y) && hash2(x, y, 4) < 0.7) p.px(x, y, hash2(x, y, 9) < 0.5 ? '#3a1e24' : '#c48c64');
  const r = rng(91);
  // braços ascendentes (candelabro) terminados em tufos de folhas rígidas
  const tuft = (x: number, y: number, s: number) => {
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI + (i / 10) * Math.PI;
      const len = s * (0.8 + hash2(i, x, 3) * 0.5);
      const x1 = x + Math.cos(a) * len * 1.25;
      const y1 = y + Math.sin(a) * len * 0.8;
      line(p, x, y, x1, y1 + 1, SPIKE.o);
      line(p, x, y, x1, y1, i % 3 === 0 ? SPIKE.l : i % 3 === 1 ? SPIKE.m : SPIKE.d);
    }
    disc(p, x, y, s * 0.55, s * 0.4, SPIKE.d);
    disc(p, x - 1, y - 1, s * 0.4, s * 0.28, SPIKE.m);
    p.px(x - 2, y - 2, SPIKE.h);
  };
  const arms: [number, number, number, number][] = [
    [-1, 40, 17, 20],
    [1, 38, 18, 21],
    [-1, 50, 13, 22],
    [1, 52, 14, 23],
    [-1, 60, 10, 20],
    [1, 62, 11, 21],
    [-1, 72, 7, 16],
    [1, 74, 8, 15],
  ];
  for (const [dir, y0, dx, rise] of arms) {
    const x1 = 32 + dir * dx;
    const y1 = y0 - rise + 6;
    // braço curvo: sobe e depois se abre
    line(p, 32, y0 + 4, 32 + dir * dx * 0.5, y0 + 1, BARK_RED.o);
    line(p, 32 + dir * dx * 0.5, y0 + 1, x1, y1 + 4, BARK_RED.m);
    tuft(x1, y1, 5.5 + (y0 < 56 ? 1 : 0));
  }
  // copa em taça no topo
  for (const [dx, y, s] of [[-14, 20, 6.5], [14, 21, 6.5], [-7, 14, 7], [7, 14, 7], [0, 9, 7], [-20, 28, 5.5], [20, 29, 5.5], [0, 22, 7.5]] as const) tuft(32 + dx, y, s);
  // pinhas verdes
  for (const [x, y] of [[22, 30], [43, 31], [32, 26]] as const) disc(p, x, y, 2, 2.4, '#3a5a2e'), p.px(x - 1, y - 1, '#8ab050'), p.px(x + 1, y + 1, '#244a2a');
  void r;
}

function jeriva(p: Painter): void {
  shadow(p, 24, 85, 12, 3, 0.38, SHADE);
  const b = trunk(48, 88, 24, 30, 86, 2.5, 3.4, 78, -1, 0.5);
  b.render(p, PALM_TRUNK, 91, 0.35);
  for (let y = 34; y < 84; y += 3) for (let x = 19; x < 30; x++) if (b.has(x, y) && b.has(x - 1, y) && b.has(x + 1, y)) p.px(x, y, '#4a5a5a');
  for (const [dir, len, lift, droop] of [
    [-1, 22, 0.5, 1.0],
    [1, 22, 0.5, 1.0],
    [-0.8, 19, 1.6, 0.9],
    [0.8, 19, 1.6, 0.9],
    [-0.4, 15, 2.2, 0.7],
    [0.4, 15, 2.2, 0.7],
    [-0.98, 14, -0.2, 2.0],
    [0.98, 14, -0.2, 2.0],
    [0, 12, 2.6, 0.3],
  ] as const) {
    frond(p, 24, 28, dir, len, lift, droop, PALM, 4);
    frond(p, 24, 27, dir * 0.97, len - 1, lift, droop, PALM, 3);
  }
  // cachos de coquinhos alaranjados
  for (const [x, y] of [[21, 31], [23, 33], [26, 32], [24, 35], [20, 34], [27, 35]] as const) disc(p, x, y, 1.4, 1.4, '#c85a18'), p.px(x - 1, y - 1, '#ffc060');
}

function manguevermelho(p: Painter): void {
  shadow(p, 24, 45, 18, 2.6, 0.38, SHADE);
  const ROOT = { o: '#2a1218', d: '#5a2a28', m: '#8a4a38', l: '#b87650', h: '#e8b078' };
  // raízes-escora em arco
  const rr = rng(11);
  for (const [dir, span, top] of [
    [-1, 20, 24],
    [1, 20, 24],
    [-1, 13, 20],
    [1, 13, 20],
    [-1, 6, 18],
    [1, 6, 18],
  ] as const) {
    let px = 24 + dir * 2;
    let py: number = top;
    for (let t = 1; t <= 18; t++) {
      const u = t / 18;
      const x = 24 + dir * (2 + span * Math.sin(u * 1.45));
      const y = top + (46 - top) * (u * u * 0.4 + u * 0.6) - Math.sin(u * 3.14) * 5;
      line(p, px, py, x, y, ROOT.o);
      line(p, px - 1, py, x - 1, y, u < 0.5 ? ROOT.l : ROOT.m);
      px = x;
      py = y;
    }
    p.px(Math.round(px), 46, '#2a2418');
  }
  const b = trunk(48, 48, 24, 14, 40, 3, 4.2, 30, 0, 0.6);
  b.render(p, ROOT, 33, 0.6);
  // copa de folhas grossas e brilhantes
  canopy(p, 24, 12, 19, 11, 20, 441, 4.4, 6.4, { gold: MATA.gold, lime: MATA.lime, teal: MATA.teal, dark: MATA.dark }, true);
  // propágulos pendurados
  for (const [x, y] of [[14, 20], [30, 22], [20, 23], [34, 18]] as const) {
    for (let k = 0; k < 7; k++) p.px(x, y + k, k < 5 ? '#4a7a2a' : '#7a9a3a');
    p.px(x, y + 7, '#a0b848');
  }
  void rr;
}

// ------------------------------------------------------------------ cenário

function cascata(p: Painter): void {
  // paredão de gnaisse com saliências e musgo; a água cai ao centro até o poço
  const b = new Body(48, 64);
  for (let y = 0; y < 64; y++) {
    const jag = Math.round((hash2(y, 3, 1) - 0.5) * 3);
    b.span(y, 1 + (y < 6 ? 3 : 0) + jag, 46 - (y < 8 ? 2 : 0) - jag);
  }
  b.render(p, ROCK, 61, 0.6);
  const r = rng(62);
  // estratos e fendas
  for (const y of [12, 22, 31, 41, 52]) for (let x = 2; x < 46; x++) if (b.has(x, y) && b.has(x, y - 1)) p.px(x, y, hash2(x, y, 3) < 0.7 ? '#2a4258' : '#a8c4d4');
  // musgo nas saliências
  for (let i = 0; i < 26; i++) {
    const x = 3 + Math.floor(r() * 42);
    const y = 6 + Math.floor(r() * 52);
    if (Math.abs(x - 24) < 7 || !b.has(x, y)) continue;
    p.px(x, y, i % 3 ? '#4a9a58' : '#78c870').px(x + 1, y, '#2e7a48').px(x, y + 1, '#2e7a48');
  }
  // véu de água: coluna branco-azulada com filetes
  for (let y = 3; y < 64; y++) {
    const w = 5 + Math.round(y * 0.07) + Math.round(Math.sin(y * 0.3) * 0.8);
    const cx = 24 + Math.round(Math.sin(y * 0.13) * 1.2);
    for (let x = cx - w; x <= cx + w; x++) {
      const u = (x - cx) / w;
      const streak = hash2(x, Math.floor(y / 4), 5);
      let c = Math.abs(u) > 0.78 ? '#6cc0cc' : u < -0.35 ? '#f0ffff' : u < 0.35 ? (streak < 0.35 ? '#b8ece8' : '#e0faf8') : streak < 0.4 ? '#7ccfd0' : '#a4e2dc';
      if (hash2(x, y, 8) < 0.1) c = '#ffffff';
      p.px(x, y, c);
    }
  }
  // filetes laterais
  for (const x0 of [10, 38]) for (let y = 14; y < 58; y++) if (hash2(x0, y, 2) < 0.8) p.px(x0 + Math.round(Math.sin(y * 0.2 + x0) * 1), y, y % 5 < 3 ? '#cdf4f0' : '#8ad6d4');
  // samambaias na borda e espuma/névoa na base
  for (const [x, y, d] of [[6, 14, -1], [41, 22, 1], [8, 32, -1], [40, 44, 1]] as const) frond(p, x, y, d, 7, 0.6, 1.1, FERN, 2);
  for (let i = 0; i < 16; i++) {
    const x = 12 + Math.floor(r() * 24);
    const y = 54 + Math.floor(r() * 10);
    disc(p, x, y, 2.5 + r() * 2, 1.4, i % 2 ? 'rgba(240,255,255,0.8)' : 'rgba(180,240,236,0.7)');
  }
  for (let i = 0; i < 9; i++) p.px(14 + Math.floor(r() * 20), 46 + Math.floor(r() * 12), 'rgba(255,255,255,0.55)');
}

function pedraMusgosa(p: Painter): void {
  shadow(p, 16, 21, 14, 2.8, 0.4, SHADE);
  const b = new Body(32, 24);
  for (let y = 4; y < 22; y++) {
    const t = (y - 4) / 17;
    const hw = 6 + Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.5) * 9 + (hash2(y, 3, 1) - 0.5) * 1.6;
    b.span(y, Math.round(15 - hw + (y < 9 ? 3 : 0)), Math.round(16 + hw - (y < 9 ? 2 : 0)));
  }
  b.render(p, ROCK, 81, 0.45);
  // manto de musgo no topo e veios de água escorrida
  const r = rng(82);
  for (let i = 0; i < 20; i++) {
    const x = 6 + Math.floor(r() * 20);
    const y = 4 + Math.floor(r() * 9);
    if (b.has(x, y) && b.has(x + 1, y)) p.px(x, y, i % 3 ? '#4a9a58' : '#7ac872').px(x + 1, y, '#2e7a48').px(x, y - 1, '#a0e090');
  }
  for (let x = 4; x < 28; x++) if (b.has(x, 6) && hash2(x, 6, 2) < 0.5) p.px(x, 6, '#6ab868');
  p.px(8, 15, '#3a8a50').px(9, 16, '#3a8a50').px(22, 13, '#3a8a50');
}

function orquidea(p: Painter): void {
  const r = rng(910);
  for (let k = 0; k < 4; k++) line(p, 2 + k * 3, 15, 1 + k * 4, 11, k % 2 ? '#2e8a50' : '#58b868');
  for (const [x, c] of [[4, ['#a040d8', '#e8a8ff']], [9, ['#fff0f8', '#ffd0ec']], [12, ['#ffb82a', '#fff0a0']]] as const) {
    const y = 4 + Math.floor(r() * 3);
    for (let k = 0; k < 7 - y / 2; k++) p.px(x + (k > 3 ? 1 : 0), y + 7 - k, '#2e7a48');
    p.px(x - 1, y, c[0]).px(x + 1, y, c[0]).px(x, y - 1, c[0]).px(x, y + 1, c[0]).px(x, y, c[1]).px(x + 2, y + 1, c[0]);
  }
}

function musgo(p: Painter): void {
  const r = rng(920);
  for (let i = 0; i < 4; i++) {
    const cx = 3 + i * 3.4;
    const cy = 11 + (i % 2);
    disc(p, cx, cy, 3, 2.2, '#1e6a40');
    disc(p, cx - 0.5, cy - 0.7, 2.4, 1.6, i % 2 ? '#4aa258' : '#62b868');
    p.px(Math.round(cx) - 1, Math.round(cy) - 2, '#b8f090');
  }
  for (let i = 0; i < 3; i++) {
    const x = 3 + Math.floor(r() * 10);
    frond(p, x, 10, i % 2 ? 1 : -1, 5, 0.8, 1.2, FERN, 1);
  }
  for (const [x, y] of [[2, 9], [8, 8], [13, 10]] as const) p.px(x, y, '#e8f8c0');
}

function capimFrio(p: Painter): void {
  const r = rng(930);
  for (const pass of [0, 1]) {
    for (let i = 0; i < 9; i++) {
      const x0 = 3 + i * 1.1;
      const lean = (i - 4) * 0.8 + (r() - 0.5) * 0.4;
      const h = 6 + Math.floor(hash2(i, 1, 4) * 5);
      for (let k = 0; k <= h; k++) {
        const t = k / h;
        const x = Math.round(x0 + lean * t * 1.6);
        const y = 14 - k;
        if (pass === 0) p.px(x - 1, y, '#1e4a3a');
        else p.px(x, y, t < 0.3 ? '#2e6a4c' : t < 0.7 ? '#58a070' : t < 1 ? '#9cd0a0' : '#f0fae0');
      }
    }
  }
  p.px(5, 4, '#e8c8f4').px(4, 4, '#c898e0').px(6, 4, '#c898e0');
}

function floresCampo(p: Painter): void {
  const r = rng(940);
  for (let i = 0; i < 5; i++) {
    const x = 2 + Math.floor(r() * 11);
    const y = 8 + Math.floor(r() * 6);
    for (let k = 0; k < 4; k++) p.px(x, y - k, k < 2 ? '#2e6a4c' : '#58a070');
    const c = [['#fff4f8', '#ffe070'], ['#d880f0', '#fff0ff'], ['#ffd23a', '#fff4b0'], ['#ff6a8a', '#ffd0dc'], ['#b0c8ff', '#ffffff']][i];
    p.px(x - 1, y - 4, c[0]).px(x + 1, y - 4, c[0]).px(x, y - 5, c[0]).px(x, y - 3, c[0]).px(x, y - 4, c[1]);
  }
}

function restinga(p: Painter): void {
  const r = rng(950);
  for (let b = 0; b < 8; b++) {
    const x0 = 3 + b * 1.3;
    const h = 5 + Math.floor(hash2(b, 2, 9) * 5);
    const lean = (b - 3.5) * 0.7;
    for (let k = 0; k <= h; k++) {
      const t = k / h;
      p.px(Math.round(x0 + lean * t * 1.4), 14 - k, t < 0.3 ? '#4a7a3c' : t < 0.8 ? '#8cbc58' : '#e0f0a0');
    }
  }
  // ipomeia rasteira: folhas redondas e flor lilás-rosada
  for (const [x, y] of [[2, 14], [12, 14], [7, 15]] as const) disc(p, x, y, 1.6, 1.2, '#3a8a40'), p.px(x, y - 1, '#6cc060');
  p.px(3, 12, '#e868b0').px(4, 12, '#ffb0dc').px(3, 11, '#ffb0dc').px(11, 12, '#d878e8').px(12, 12, '#f8c0ff');
  void r;
}

export const PAINTERS: Record<string, PropPainter> = {
  mat_jequitiba: jequitiba,
  mat_palmito_jucara: palmitoJucara,
  mat_quaresmeira: quaresmeira,
  mat_ipe_roxo: ipeRoxo,
  mat_xaxim: xaxim,
  mat_araucaria: araucaria,
  mat_bromelia_grande: bromeliaGrande,
  mat_mangue_vermelho: manguevermelho,
  mat_cascata: cascata,
  mat_pedra_musgosa: pedraMusgosa,
  mat_jeriva: jeriva,
  mat_orquidea: orquidea,
  mat_musgo: musgo,
  mat_capim_frio: capimFrio,
  mat_flores_campo: floresCampo,
  mat_restinga: restinga,
};

function bromeliaGrande(p: Painter): void {
  shadow(p, 12, 19, 9, 2, 0.36, SHADE);
  const LEAFS = [{ c: '#14583c', l: '#2e9a58' }, { c: '#1c6a48', l: '#58c070' }];
  // roseta de lâminas largas, mais escuras por fora
  for (let i = 0; i < 11; i++) {
    const a = -Math.PI + (i / 10) * Math.PI;
    const len = 8 + (i % 2) * 1.5;
    const x1 = 12 + Math.cos(a) * len * 1.15;
    const y1 = 16 + Math.sin(a) * len * 0.9;
    const pl = LEAFS[i % 2];
    line(p, 12, 17, x1, y1 + 1, '#0a2c2a');
    line(p, 12, 17, x1, y1, pl.c);
    line(p, 12, 16, x1 - 0.5, y1 - 0.5, pl.l);
  }
  // miolo vermelho e inflorescência
  disc(p, 12, 15, 3, 2.2, '#b81e3a');
  disc(p, 12, 14.5, 2, 1.4, '#ff4a5a');
  line(p, 12, 14, 12, 5, '#e0402a');
  for (const [x, y] of [[12, 4], [10, 7], [14, 7], [11, 9], [13, 9]] as const) p.px(x, y, '#ffb02a').px(x + (x < 12 ? -1 : 1), y, '#ff6a3a');
  p.px(12, 3, '#fff0a0');
}
