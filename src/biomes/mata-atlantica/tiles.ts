import type Phaser from 'phaser';
import { TILE, rng, type Painter } from '../../art/canvas';
import { blob, hash2, rgba, type Pal5 } from '../../art/draw';
import type { Tileset } from '../../art/forest';
import { ALL_MASKS, E, EDGE_VARIANTS, FULL, N, S, TileRegistry, W, distTo, makeProf, maskOf, outGrid, paintGroup, pick, profile, type Cell } from '../../art/forestTiles';

// Chão da Mata Atlântica: floresta de encosta úmida (verdes frios e azulados, musgo, folhas e pétalas de quaresmeira),
// agreste seco ao norte, campo frio com pinhais ao sul e litoral (restinga, manguezal, estuário) a leste.

/**
 * Legenda do mapa da Mata Atlântica (uma letra por tile de 16×16):
 *   #  mata fechada: copas de jequitibás, palmitos e emaranhado de cipós (sólido)
 *   .  chão da floresta ombrófila: folhiço, musgo e pétalas (andável)
 *   "  sub-bosque de samambaias e bromélias (andável; esconderijo)
 *   ,  trilha de terra úmida (andável)
 *   ~  água: riacho, poço da cachoeira, estuário e mar (sólido)
 *   _  areia clara da praia e da restinga (andável)
 *   l  lama escura do manguezal, com pneumatóforos (andável)
 *   g  restinga: capim de duna, bromélias de areia e ipomeias (andável; esconderijo)
 *   r  laje de rocha musgosa da encosta (andável)
 *   a  campo frio de altitude (andável)
 *   q  capim alto do campo (andável; esconderijo)
 *   p  chão do pinhal: acículas e pinhas sob as araucárias (andável)
 *   c  chão do agreste: terra seca clara com folhas secas (andável)
 *   s  arbustos secos do agreste (andável; esconderijo)
 */
export const MATA_GROUND = ['#', '.', '"', ',', '~', '_', 'l', 'g', 'r', 'a', 'q', 'p', 'c', 's'] as const;

const R = new TileRegistry();

// ------------------------------------------------------------------ chão da floresta

const FL = {
  base: ['#27594a', '#235242', '#2e6249', '#21493f', '#356a4a', '#285a47'],
  dk: '#163d3c',
  lt: '#4f9060',
  hi: '#b8d878',
  teal: '#10303e',
  moss: '#5aa860',
  mossL: '#9ad870',
  leaf1: '#a8743a',
  leaf2: '#cc9a4a',
  leaf3: '#7a4a30',
  leaf4: '#4e3028',
  twig: '#5a3c2c',
  twigL: '#9a7448',
  petal: '#a55cd6',
  petalL: '#d49cf0',
  stone: '#8a9cb8',
  stoneL: '#c8d6e8',
};
const FLOOR_VARIANTS = 6;
const FLOOR_WEIGHTS = [0.32, 0.2, 0.15, 0.12, 0.12, 0.09];

function deadLeaf(p: Painter, x: number, y: number, c: string, l: string, d: string, flip: boolean): void {
  if (!flip) p.px(x + 1, y, l).px(x + 2, y, c).px(x, y + 1, c).px(x + 1, y + 1, c).px(x + 2, y + 1, d);
  else p.px(x, y, c).px(x + 1, y, l).px(x, y + 1, d).px(x + 1, y + 1, c).px(x + 2, y + 1, c);
}

function drawFloor(p: Painter, v: number): void {
  const r = rng(8100 + v * 31);
  p.rect(0, 0, TILE, TILE, FL.base[v % FL.base.length]);
  for (let i = 0; i < 10; i++) p.rect(Math.floor(r() * 16), Math.floor(r() * 16), 2 + Math.floor(r() * 3), 1 + Math.floor(r() * 2), r() < 0.55 ? FL.dk : FL.lt);
  p.speckle(0, 0, TILE, TILE, [FL.dk, FL.teal, FL.lt], 0.12, r);
  p.speckle(0, 0, TILE, TILE, [FL.hi, '#7ac8b4'], 0.025, r);
  switch (v) {
    case 0:
      deadLeaf(p, 3 + Math.floor(r() * 8), 3 + Math.floor(r() * 9), FL.leaf3, FL.leaf1, FL.leaf4, r() < 0.5);
      break;
    case 1:
      deadLeaf(p, 1, 2, FL.leaf1, FL.leaf2, FL.leaf3, false);
      deadLeaf(p, 9, 6, FL.leaf3, FL.leaf1, FL.leaf4, true);
      p.px(5, 12, FL.petal).px(6, 12, FL.petalL).px(12, 11, FL.petal);
      break;
    case 2:
      // tronco fino caído coberto de musgo
      p.hline(3, 9, 8, FL.twig).hline(4, 10, 7, FL.leaf4).px(2, 8, FL.twig).px(11, 8, FL.twig).hline(5, 8, 3, FL.moss).px(6, 7, FL.mossL).px(9, 8, FL.moss);
      deadLeaf(p, 10, 2, FL.leaf1, FL.leaf2, FL.leaf3, true);
      break;
    case 3:
      // manchas de musgo e uma pedrinha azulada
      p.rect(2, 3, 6, 3, FL.moss).rect(3, 2, 4, 1, FL.moss).rect(3, 3, 3, 1, FL.mossL);
      p.speckle(2, 2, 7, 4, [FL.mossL, '#c8f090'], 0.2, r);
      p.px(11, 11, FL.stone).px(12, 11, FL.stoneL).px(11, 12, '#506078').px(12, 12, '#506078');
      break;
    case 4:
      // pétalas de quaresmeira e de ipê roxo caídas
      for (const [x, y] of [[4, 5], [8, 9], [11, 4], [6, 12], [13, 10], [2, 9]] as const) p.px(x, y, FL.petal).px(x + 1, y, FL.petalL);
      deadLeaf(p, 7, 3, FL.leaf3, FL.leaf1, FL.leaf4, false);
      break;
    default:
      // brotinho de samambaia e folhas
      p.vline(10, 8, 4, '#3f9c58').px(9, 8, '#6cd078').px(11, 7, '#6cd078').px(10, 7, '#b8f0a0').px(8, 9, '#3f9c58').px(12, 9, '#3f9c58');
      deadLeaf(p, 2, 3, FL.leaf1, FL.leaf2, FL.leaf3, false);
      deadLeaf(p, 3, 11, FL.leaf3, FL.leaf1, FL.leaf4, true);
  }
}

/** Sub-bosque: o chão da floresta coberto de samambaias e pequenas bromélias. */
function drawFern(p: Painter, v: number): void {
  drawFloor(p, (v + 2) % FLOOR_VARIANTS);
  const r = rng(8300 + v * 17);
  const cols = [
    ['#103a34', '#1f7a52', '#48b868', '#a8f090'],
    ['#12303a', '#1c6a58', '#3aa070', '#88e0a0'],
  ];
  const n = 3 + (v % 2);
  for (let k = 0; k < n; k++) {
    const cx = 2 + Math.floor(r() * 12);
    const cy = 8 + Math.floor(r() * 7);
    const c = cols[k % 2];
    for (let i = 0; i < 5; i++) {
      const a = -2.5 + i * 0.6;
      const len = 4 + Math.floor(r() * 3);
      for (let t = 1; t <= len; t++) {
        const x = Math.round(cx + Math.sin(a) * t);
        const y = Math.round(cy - Math.cos(a) * t * 0.9 + (t * t) / (len * 5));
        p.px(x, y + 1, c[0]).px(x, y, t > len - 2 ? c[3] : t > 2 ? c[2] : c[1]);
        if (t > 1 && t < len) p.px(x + (a < 0 ? 1 : -1), y + 1, c[1]);
      }
    }
  }
  if (v === 1) p.px(8, 3, '#ff6a8a').px(9, 3, '#ffb0c0').px(8, 2, '#ffb0c0');
}

// ------------------------------------------------------------------ mata fechada (sólido)

const TREE_PAL: Pal5[] = [
  { o: '#0c2430', d: '#1a4a48', m: '#2e7a56', l: '#62b068', h: '#c0e888' },
  { o: '#0c1e2e', d: '#183c4a', m: '#2a6a5a', l: '#52a070', h: '#a8d890' },
  { o: '#101e34', d: '#233a5a', m: '#35607a', l: '#5c92a0', h: '#a8d4c4' },
  { o: '#1e1638', d: '#4a2a6a', m: '#7a46a0', l: '#b078d0', h: '#e6b8f4' },
];

function drawWall(p: Painter, v: number): void {
  p.rect(0, 0, TILE, TILE, '#0d2a2e');
  const r = rng(8500 + v * 19);
  // troncos finos e cipós entre as copas
  for (let i = 0; i < 3; i++) {
    let x = Math.floor(r() * 16);
    for (let y = 0; y < 16; y++) {
      p.px(x, y, '#23242a').px((x + 1) % 16, y, '#4a4440');
      if (r() < 0.25) x = (x + (r() < 0.5 ? 15 : 1)) % 16;
    }
  }
  for (let i = 0; i < 9; i++) {
    const cx = r() * 16;
    const cy = r() * 16;
    const rad = 3 + r() * 2;
    // a pal. roxa (quaresmeira) só aparece em manchas raras
    const pal = TREE_PAL[i % 3 === 2 && r() < 0.35 && v === 1 ? 3 : i % 3];
    for (const ox of [-16, 0, 16]) {
      for (const oy of [-16, 0, 16]) {
        if (cx + ox < -7 || cx + ox > 23 || cy + oy < -7 || cy + oy > 23) continue;
        blob(p, cx + ox, cy + oy, rad, rad * 0.85, pal, 90 + i * 7 + v * 3, { lobes: 6, amp: 0.3, bias: 0.05 + (i % 3) * 0.05, noise: 0.6 });
      }
    }
  }
  // brilho de orvalho, bromélias e flores na copa
  for (let i = 0; i < 5; i++) {
    const x = 1 + Math.floor(r() * 14);
    const y = 1 + Math.floor(r() * 14);
    p.px(x, y, i % 3 === 0 ? '#e8b4f8' : i % 3 === 1 ? '#ff7a96' : '#d8f4c0');
  }
}

/** Franja da mata sobre o chão vizinho: sombra azulada e folhas que invadem. */
function fringe(p: Painter, mask: number, fv: number): void {
  const shade = '#0a2a3a';
  [0.44, 0.34, 0.24, 0.15, 0.08].forEach((a, d) => {
    const c = rgba(shade, a);
    if (mask & N) p.hline(0, d, TILE, c);
    if (mask & S) p.hline(0, TILE - 1 - d, TILE, c);
    if (mask & W) p.vline(d, 0, TILE, c);
    if (mask & E) p.vline(TILE - 1 - d, 0, TILE, c);
  });
  const sides: [number, number][] = [
    [N, 0],
    [E, 1],
    [S, 2],
    [W, 3],
  ];
  for (const [bit, si] of sides) {
    if (!(mask & bit)) continue;
    const prof = profile(2900 + si * 17 + fv * 101, 4, 2.6, 2, 7);
    const at = (pos: number, depth: number): [number, number] => (si === 0 ? [pos, depth] : si === 1 ? [TILE - 1 - depth, pos] : si === 2 ? [pos, TILE - 1 - depth] : [depth, pos]);
    for (let pos = 0; pos < TILE; pos++) {
      for (let d = 0; d < Math.min(2, prof[pos]); d++) {
        const [x, y] = at(pos, d);
        p.px(x, y, hash2(x, y, 3) < 0.5 ? TREE_PAL[0].d : TREE_PAL[1].m);
      }
    }
    for (let k = 0; k < 6; k++) {
      const pos = Math.round(k * 3.2 + hash2(k, si, fv) * 2 - 0.5);
      const rad = 2.3 + hash2(k, si + 5, fv) * 1.5;
      const depth = Math.max(0.5, prof[Math.min(TILE - 1, Math.max(0, pos))] - rad * 0.85);
      const [cx, cy] = at(pos, depth);
      blob(p, cx, cy, rad, rad * 0.85, TREE_PAL[(k + fv) % 3], 900 + k * 7 + si * 3 + fv, { lobes: 6, amp: 0.28, bias: 0.1, noise: 0.5 });
    }
    for (let k = 0; k < 3; k++) {
      const pos = Math.floor(hash2(k, si + 9, fv) * TILE);
      const depth = prof[pos] + 1 + Math.floor(hash2(k, si + 2, fv) * 2);
      const [x, y] = at(pos, depth);
      p.px(x, y, k === 0 ? '#c07ae0' : '#5aa860').px(x + 1, y, '#3a2c34');
    }
  }
}

// ------------------------------------------------------------------ agreste (norte)

const SOIL = ['#a89464', '#a08c5e', '#b09c6c', '#98845a'];

function drawSoil(p: Painter, v: number): void {
  const r = rng(8700 + v * 23);
  p.rect(0, 0, TILE, TILE, SOIL[v % SOIL.length]);
  for (let i = 0; i < 7; i++) p.rect(Math.floor(r() * 16), Math.floor(r() * 16), 2 + Math.floor(r() * 3), 1, r() < 0.5 ? '#80704a' : '#c4b07c');
  p.speckle(0, 0, TILE, TILE, ['#80704a', '#c8b684', '#6a5c44'], 0.11, r);
}

/** Agreste: terra seca com folhas secas, gravetos e tufinhos de capim ralo. */
function drawAgreste(p: Painter, v: number): void {
  drawSoil(p, v);
  const r = rng(8800 + v * 29);
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(r() * 13);
    const y = Math.floor(r() * 14);
    const c = ['#c89a48', '#9a6a3a', '#6e7a3a', '#d8b86a'][Math.floor(r() * 4)];
    p.px(x, y, c).px(x + 1, y + (r() < 0.5 ? 0 : 1), c).px(x + 2, y, '#5a4a34');
  }
  p.hline(3 + v * 2, 10 - v, 4, '#54402c');
  for (let b = 0; b < 4; b++) {
    const x = 2 + Math.floor(r() * 12);
    const y = 6 + Math.floor(r() * 9);
    for (let k = 0; k < 4; k++) p.px(x + (k > 2 ? 1 : 0), y - k, k < 2 ? '#5e7a3c' : '#a8b660');
  }
  for (let i = 0; i < 3; i++) p.rect(Math.floor(r() * 12), Math.floor(r() * 12), 3, 1, rgba('#1a3040', 0.18));
}

/** Arbustos secos do agreste: moitas de galhos claros com folhas verde-acinzentadas. */
function drawScrub(p: Painter, v: number): void {
  drawSoil(p, (v + 1) % 4);
  const r = rng(8900 + v * 31);
  const pals: Pal5[] = [
    { o: '#2a3a2c', d: '#4c6240', m: '#7a9250', l: '#a8b868', h: '#e4e4a0' },
    { o: '#2c3c32', d: '#46604a', m: '#6e8c5c', l: '#9ab478', h: '#d8e8b0' },
  ];
  for (const [x, y] of [[4, 8], [11, 6], [8, 12], [13, 13]] as const) {
    const px = x + Math.floor(r() * 2);
    p.hline(px - 3, y + 2, 7, rgba('#1a3040', 0.22));
    for (let k = 0; k < 4; k++) p.px(px - 1 + k, y + 2, '#6a5638');
    blob(p, px, y, 2.8 + r() * 0.8, 2.2 + r() * 0.6, pals[(x + v) % 2], 40 + x * 3 + v, { lobes: 5, amp: 0.3, noise: 0.5 });
  }
  if (v === 1) p.px(6, 5, '#f4e870').px(7, 5, '#fff6b8');
  if (v === 2) p.px(12, 3, '#e87a5a').px(13, 3, '#ffb89a');
}

// ------------------------------------------------------------------ campo frio e pinhal (sul)

const CAMPO = ['#4f8e5c', '#4a8758', '#559564', '#468252'];

function drawCampo(p: Painter, v: number): void {
  const r = rng(9100 + v * 37);
  p.rect(0, 0, TILE, TILE, CAMPO[v % CAMPO.length]);
  for (let i = 0; i < 8; i++) p.rect(Math.floor(r() * 16), Math.floor(r() * 16), 2 + Math.floor(r() * 3), 1, r() < 0.5 ? '#3a7048' : '#6aac76');
  p.speckle(0, 0, TILE, TILE, ['#3a7048', '#2e5e48', '#7ab886'], 0.1, r);
  p.speckle(0, 0, TILE, TILE, ['#c8e8d0', '#a0cc9c'], 0.025, r);
  // tufinhos de capim-fino azulado
  const n = 3 + (v % 3);
  for (let i = 0; i < n; i++) {
    const x = 1 + Math.floor(r() * 13);
    const y = 5 + Math.floor(r() * 10);
    for (let b = 0; b < 3; b++) {
      const h = 3 + Math.floor(r() * 3);
      for (let k = 0; k <= h; k++) {
        const t = k / h;
        p.px(x + b + Math.round((b - 1) * t), y - k, t < 0.4 ? '#2e6a4c' : t < 0.8 ? '#6cb07a' : '#c4e4b4');
      }
    }
  }
  if (v === 2) p.px(9, 4, '#fff8e8').px(8, 4, '#f4d0e0').px(10, 4, '#f4d0e0').px(9, 3, '#f4d0e0').px(9, 5, '#f4d0e0');
  if (v === 5 % 4) p.px(5, 9, '#ffe070').px(6, 9, '#fff2b0');
}

/** Capim alto do campo: touceiras longas azul-esverdeadas com plumas claras. */
function drawTall(p: Painter, v: number): void {
  drawCampo(p, (v + 1) % 4);
  const r = rng(9300 + v * 53);
  for (const t of [{ x: 3, y: 8 }, { x: 10, y: 7 }, { x: 6, y: 13 }, { x: 13, y: 14 }]) {
    const nb = 5 + Math.floor(r() * 3);
    for (let i = 0; i < nb; i++) {
      const x = t.x + i - Math.floor(nb / 2);
      const lean = (i - (nb - 1) / 2) * 0.9 + (r() - 0.5);
      const h = 6 + Math.floor(r() * 5);
      for (let k = 0; k <= h; k++) {
        const kk = k / h;
        const xx = Math.round(x + lean * kk * 1.4);
        p.px(xx - 1, t.y - k, '#1e4a3a');
        p.px(xx, t.y - k, kk < 0.3 ? '#2e6a4c' : kk < 0.7 ? '#58a070' : kk < 1 ? '#9cd0a0' : '#eaf6da');
      }
    }
    p.hline(t.x - 3, t.y + 1, 7, rgba('#0a2a3a', 0.25));
  }
  if (v === 1) p.px(8, 4, '#c070e0').px(9, 4, '#e8b0f4');
}

/** Chão do pinhal: acículas avermelhadas, pinhas e gravetos. */
function drawPine(p: Painter, v: number): void {
  const r = rng(9500 + v * 41);
  p.rect(0, 0, TILE, TILE, ['#5a4838', '#524232', '#624e3a'][v % 3]);
  p.speckle(0, 0, TILE, TILE, ['#3e3028', '#7a6048', '#34402e'], 0.2, r);
  p.speckle(0, 0, TILE, TILE, ['#a88458', '#5a7a44'], 0.06, r);
  // acículas: pares de riscos finos
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(r() * 14);
    const y = Math.floor(r() * 14);
    const c = ['#a8703c', '#c89458', '#7a4a2c', '#6a7a3a'][Math.floor(r() * 4)];
    p.px(x, y, c).px(x + 1, y + 1, c).px(x + 2, y + 2, c).px(x + 2, y, c).px(x + 1, y + 1, '#3e3028');
  }
  if (v === 1 || v === 2) {
    // pinha
    const x = 4 + v * 3;
    const y = 8 - v;
    p.rect(x, y, 4, 3, '#6a3a24').px(x, y, '#9a6038').px(x + 1, y, '#9a6038').hline(x, y + 1, 4, '#4a281c').px(x + 3, y + 2, '#2e1c18').px(x + 1, y - 1, '#7a4a2c');
  }
  if (v === 0) p.hline(2, 11, 6, '#3a2a24').px(8, 10, '#3a2a24');
  for (let i = 0; i < 3; i++) p.rect(Math.floor(r() * 12), Math.floor(r() * 12), 3, 1, rgba('#0a2a3a', 0.2));
}

// ------------------------------------------------------------------ restinga (areia com vegetação)

function sandColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 280 + v);
  if (h < 0.1) return '#d8c898';
  if (h < 0.18) return '#faf2d4';
  if (h < 0.2) return '#b6a47c';
  if ((x + y * 3 + v * 4) % 11 < 2 && h < 0.7) return '#e8d8aa';
  return '#f0e2b8';
}

function drawSandFull(p: Painter, v: number): void {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) p.px(x, y, sandColor(x, y, v));
}

function drawRestinga(p: Painter, v: number): void {
  drawSandFull(p, v + 1);
  const r = rng(9700 + v * 43);
  // touceiras de capim de duna e ipomeias rasteiras
  for (let i = 0; i < 3 + (v % 2); i++) {
    const x = 2 + Math.floor(r() * 12);
    const y = 7 + Math.floor(r() * 8);
    p.hline(x - 2, y + 1, 5, rgba('#6a5a3a', 0.25));
    for (let b = 0; b < 5; b++) {
      const h = 4 + Math.floor(r() * 4);
      const lean = (b - 2) * 0.7;
      for (let k = 0; k <= h; k++) {
        const t = k / h;
        p.px(x + b - 2 + Math.round(lean * t), y - k, t < 0.3 ? '#4a7a3c' : t < 0.75 ? '#8cbc58' : '#d4e890');
      }
    }
  }
  // ipomeia: folhas redondas e flor rosa
  const fx = 3 + Math.floor(r() * 9);
  const fy = 3 + Math.floor(r() * 5);
  p.px(fx, fy, '#4a9a48').px(fx + 1, fy, '#6cc060').px(fx - 1, fy + 1, '#4a9a48').px(fx, fy + 1, '#3a8040').px(fx + 1, fy + 1, '#6cc060');
  p.px(fx + 2, fy - 1, '#e868b0').px(fx + 3, fy - 1, '#ffb0dc').px(fx + 2, fy - 2, '#ffb0dc');
  if (v === 2) {
    const c = ['#cbbfae', '#8a7a7e'];
    p.px(11, 4, c[0]).px(12, 4, c[0]).px(11, 5, c[1]).px(12, 5, c[1]);
  }
}

// ------------------------------------------------------------------ grupos com borda orgânica

const mk = (seed: number, amp: number, lo = 0) => Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(seed + v * 41, 3, amp, lo, 7));
const TRACK_PROFS = mk(2400, 3.0);
const SAND_PROFS = mk(2600, 3.0);
const MUD_PROFS = mk(2300, 3.4);
const ROCK_PROFS = mk(2500, 3.6, 1);
const POND_PROFS = Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(2800 + v * 61, 4, 3.4));

function trackColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 260 + v);
  if (h < 0.1) return '#9a6c4a';
  if (h < 0.2) return '#b88660';
  if (h < 0.215) return '#e8d4b4';
  if (h < 0.235) return '#6e4838';
  if ((y + v * 5) % 7 === 2 && hash2(x, y, 9) < 0.5) return '#a87a54';
  return '#a47652';
}

function drawTrack(p: Painter, mask: number, v: number): void {
  drawFloor(p, (v + 3) % FLOOR_VARIANTS);
  paintGroup(
    p,
    outGrid(mask, TRACK_PROFS[v % EDGE_VARIANTS], 8),
    (x, y) => trackColor(x, y, v),
    (x, y) => (hash2(x, y, 5) < 0.4 ? '#b88c64' : '#8a5e42'),
    (x, y) => (hash2(x, y, 4) < 0.3 ? '#3e2a26' : null),
    81 + v,
  );
  // folhas e pétalas que pousam na trilha
  const r = rng(9900 + v * 7 + mask);
  const g = outGrid(mask, TRACK_PROFS[v % EDGE_VARIANTS], 8);
  for (let i = 0; i < 2; i++) {
    const x = 2 + Math.floor(r() * 11);
    const y = 2 + Math.floor(r() * 11);
    if (g[y * TILE + x]) continue;
    p.px(x, y, i ? '#a55cd6' : '#6a8a44').px(x + 1, y, i ? '#d49cf0' : '#a8c060');
  }
}

function drawSand(p: Painter, mask: number, v: number): void {
  drawFloor(p, (v + 1) % FLOOR_VARIANTS);
  const g = outGrid(mask, SAND_PROFS[v % EDGE_VARIANTS], 8);
  paintGroup(
    p,
    g,
    (x, y) => sandColor(x, y, v),
    (x, y) => (hash2(x, y, 5) < 0.4 ? '#bfa97c' : '#d4c08e'),
    (x, y) => (hash2(x, y, 4) < 0.5 ? '#6a5a44' : '#867258'),
    91 + v,
  );
  const r = rng(10100 + v * 7 + mask);
  for (let i = 0; i < 4; i++) {
    const x = 1 + Math.floor(r() * 13);
    const y = 1 + Math.floor(r() * 13);
    if (g[y * TILE + x] || g[y * TILE + x + 1] || g[(y + 1) * TILE + x]) continue;
    const c = ['#cbbfae', '#b4a89c', '#e8b0a0', '#f2ece0'][i];
    p.px(x, y, c).px(x + 1, y, c).px(x, y + 1, '#8a7a7e').px(x + 1, y + 1, '#8a7a7e').px(x, y, '#fffaf0');
  }
}

function mudColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 290 + v);
  if (h < 0.1) return '#4a3e30';
  if (h < 0.18) return '#86704e';
  if (h < 0.2) return '#a89068';
  if ((x + y * 2 + v) % 9 < 2 && h < 0.6) return '#5e5640';
  return '#6c5a3e';
}

/** Lama do manguezal: escura, brilhosa, com pneumatóforos, folhas caídas e propágulos. */
function drawMud(p: Painter, mask: number, v: number): void {
  drawSandFull(p, v);
  const g = outGrid(mask, MUD_PROFS[v % EDGE_VARIANTS], 8);
  paintGroup(
    p,
    g,
    (x, y) => mudColor(x, y, v),
    (x, y) => (hash2(x, y, 5) < 0.4 ? '#86704e' : '#54483a'),
    (x, y) => (hash2(x, y, 4) < 0.5 ? '#36302a' : '#483e30'),
    101 + v,
  );
  const r = rng(10300 + v * 11 + mask);
  const free = (x: number, y: number) => x >= 0 && y >= 0 && x < TILE && y < TILE && !g[y * TILE + x];
  // brilho da lama molhada
  for (let i = 0; i < 3; i++) {
    const x = 1 + Math.floor(r() * 12);
    const y = 2 + Math.floor(r() * 12);
    if (free(x, y) && free(x + 2, y)) p.hline(x, y, 3, '#8a8a7a').px(x + 1, y, '#c4d0c0');
  }
  // pneumatóforos: espetinhos que saem da lama
  for (let i = 0; i < 3; i++) {
    const x = 2 + Math.floor(r() * 12);
    const y = 5 + Math.floor(r() * 9);
    if (!free(x, y) || !free(x, y - 3)) continue;
    p.px(x, y, '#2a2a22').px(x, y - 1, '#4a4a34').px(x, y - 2, '#6a6a46').px(x + 1, y - 1, '#2a2a22');
    p.px(x, y - 3, '#8a9a5a');
  }
  if (v === 1) {
    const x = 6;
    const y = 9;
    if (free(x, y) && free(x + 4, y)) p.hline(x, y, 5, '#3a7a3c').px(x, y, '#2a5a2c').px(x + 4, y, '#a8d060').px(x + 2, y + 1, '#2a5a2c');
  }
}

/** Laje musgosa: gnaisse cinza-azulado, escorrido de água, com musgo e samambaias minúsculas. */
function drawRock(p: Painter, mask: number, v: number): void {
  drawFloor(p, (v + 4) % FLOOR_VARIANTS);
  const g = outGrid(mask, ROCK_PROFS[v % EDGE_VARIANTS], 9);
  const out = (x: number, y: number) => x < 0 || y < 0 || x >= TILE || y >= TILE || g[y * TILE + x];
  const outAt = (x: number, y: number) => {
    if (x < 0) return !(mask & W);
    if (x >= TILE) return !(mask & E);
    if (y < 0) return !(mask & N);
    if (y >= TILE) return !(mask & S);
    return g[y * TILE + x];
  };
  const r = rng(10500 + v);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (out(x, y)) {
        if (!outAt(x, y - 1) || !outAt(x - 1, y - 1)) p.px(x, y, rgba('#0a2438', 0.45));
        else if (!outAt(x, y - 2)) p.px(x, y, rgba('#0a2438', 0.2));
        continue;
      }
      const h = hash2(x, y, 270 + v);
      const top = outAt(x, y - 1);
      const bottom = outAt(x, y + 1);
      const left = outAt(x - 1, y);
      const right = outAt(x + 1, y);
      if (bottom || right) {
        p.px(x, y, bottom && hash2(x, y, 3) < 0.6 ? '#1c2c40' : '#2e4258');
        continue;
      }
      if (top || left) {
        p.px(x, y, h < 0.5 ? '#bcd0dc' : '#a4bccc');
        continue;
      }
      if (outAt(x, y + 2) || outAt(x + 1, y + 1)) {
        p.px(x, y, '#4a6078');
        continue;
      }
      if (outAt(x, y - 2) || outAt(x - 1, y - 1)) {
        p.px(x, y, '#98b0c0');
        continue;
      }
      const band = (y + v * 3) % 5 === 0;
      p.px(x, y, band ? '#58708a' : h < 0.14 ? '#7c94a6' : h < 0.26 ? '#6a8298' : h < 0.3 ? '#a8bccc' : '#7088a0');
    }
  }
  // musgo úmido nas bordas de cima e rachaduras
  for (let i = 0; i < 6; i++) {
    const mx = Math.floor(r() * 14) + 1;
    const my = Math.floor(r() * 14) + 1;
    if (out(mx, my) || out(mx + 1, my)) continue;
    const c = i % 2 ? '#4a9a58' : '#78c870';
    p.px(mx, my, c).px(mx + 1, my, c);
    if (hash2(mx, my, 2) < 0.6) p.px(mx, my + 1, '#2e7a48').px(mx - 1, my, '#2e7a48');
    if (i === 0) p.px(mx, my - 1, '#b8f090');
  }
  if (v !== 1) {
    let x = 3 + Math.floor(r() * 6);
    for (let y = 2; y < 14; y++) {
      if (!out(x, y) && !out(x, y + 1) && !out(x + 1, y)) p.px(x, y, '#2e4258').px(x + 1, y, '#a4bccc');
      if (r() < 0.35) x += r() < 0.5 ? -1 : 1;
    }
  }
}

// ------------------------------------------------------------------ água (3 quadros): riacho e mar

const WATER_FRAMES = 3;
const SHIFTS = [0, 5, 11];

interface WaterPal {
  base: string;
  dk: string;
  md: string;
  hi: string;
  cr: string;
  foam: [string, string];
  mid: string;
  land: (x: number, y: number, v: number) => string;
  rim1: [string, string];
  rim2: [string, string];
}

const STREAM: WaterPal = {
  base: '#1f7478',
  dk: '#134e5c',
  md: '#185f68',
  hi: '#58bca8',
  cr: '#d4fbe8',
  foam: ['#f0fff4', '#a0e8d4'],
  mid: '#3aa8a0',
  land: (x, y, v) => (hash2(x, y, 190 + v) < 0.2 ? '#40382a' : '#33403a'),
  rim1: ['#1e2630', '#2a323a'],
  rim2: ['#3a4a46', '#2e3c3c'],
};
const SEA: WaterPal = {
  base: '#27789c',
  dk: '#175682',
  md: '#1e6a92',
  hi: '#6cc8dc',
  cr: '#e4fcff',
  foam: ['#ffffff', '#b8eef0'],
  mid: '#46a8c8',
  land: (x, y, v) => (hash2(x, y, 190 + v) < 0.25 ? '#a89470' : '#8a7858'),
  rim1: ['#6a5a44', '#7a6a50'],
  rim2: ['#9a8864', '#8a7a58'],
};

function waterGrid(pal: WaterPal, v: number, f: number): string[] {
  const g: string[] = new Array(TILE * TILE).fill(pal.base);
  const r = rng(10700 + v * 41);
  const at = (x: number, y: number, c: string) => {
    g[(((y % TILE) + TILE) % TILE) * TILE + (((x % TILE) + TILE) % TILE)] = c;
  };
  for (let i = 0; i < 4; i++) {
    const sx = Math.floor(r() * 16);
    const sy = Math.floor(r() * 16);
    const len = 4 + Math.floor(r() * 4);
    for (let k = 0; k < len; k++) at(sx + k + Math.floor(SHIFTS[f] * 0.4), sy, pal.dk);
    for (let k = 1; k < len - 1; k++) at(sx + k + Math.floor(SHIFTS[f] * 0.4), sy + 1, pal.md);
  }
  for (let i = 0; i < 6; i++) {
    const sx = Math.floor(r() * 16);
    const sy = Math.floor(r() * 16);
    const len = 3 + Math.floor(r() * 3);
    const dir = i % 2 === 0 ? 1 : -1;
    for (let k = 0; k < len; k++) at(sx + k + dir * SHIFTS[f], sy, k === len - 1 ? pal.cr : pal.hi);
  }
  for (let i = 0; i < 4; i++) {
    if (hash2(i, f, v + 17) < 0.75) at(Math.floor(hash2(i, f, v) * 16), Math.floor(hash2(i, f, v + 3) * 16), i === 0 ? '#ffffff' : '#fff4d0');
  }
  return g;
}
const WATER_GRIDS = new Map<string, string[]>();
const waterBase = (name: string, pal: WaterPal, v: number, f: number) => {
  const k = `${name}:${v}:${f}`;
  let g = WATER_GRIDS.get(k);
  if (!g) WATER_GRIDS.set(k, (g = waterGrid(pal, v, f)));
  return g;
};

function drawWater(p: Painter, name: string, pal: WaterPal, mask: number, v: number, f: number): void {
  const base = waterBase(name, pal, v, f);
  const g = outGrid(mask, POND_PROFS[v % EDGE_VARIANTS], 9);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (!g[y * TILE + x]) {
        const dOut = distTo(g, x, y, true, 2);
        if (dOut === 1) p.px(x, y, (x + y + f * 2) % 4 < 2 ? pal.foam[0] : pal.foam[1]);
        else if (dOut === 2) p.px(x, y, hash2(x, y, f + 3) < 0.4 ? pal.mid : base[y * TILE + x]);
        else p.px(x, y, base[y * TILE + x]);
      } else {
        const d = distTo(g, x, y, false, 4);
        const h = hash2(x, y, 11);
        if (d === 1) p.px(x, y, h < 0.4 ? pal.rim1[0] : pal.rim1[1]);
        else if (d === 2) p.px(x, y, h < 0.3 ? pal.rim2[0] : pal.rim2[1]);
        else p.px(x, y, pal.land(x, y, v));
      }
    }
  }
}

// ------------------------------------------------------------------ registro dos quadros

for (let v = 0; v < FLOOR_VARIANTS; v++) R.frame(`floor:${v}`, (p) => drawFloor(p, v));
for (let v = 0; v < 4; v++) R.frame(`fern:${v}`, (p) => drawFern(p, v));
for (let v = 0; v < 3; v++) R.frame(`wall:${v}`, (p) => drawWall(p, v));
for (let v = 0; v < 4; v++) R.frame(`agreste:${v}`, (p) => drawAgreste(p, v));
for (let v = 0; v < 3; v++) R.frame(`scrub:${v}`, (p) => drawScrub(p, v));
for (let v = 0; v < 6; v++) R.frame(`campo:${v}`, (p) => drawCampo(p, v));
for (let v = 0; v < 3; v++) R.frame(`tall:${v}`, (p) => drawTall(p, v));
for (let v = 0; v < 3; v++) R.frame(`pine:${v}`, (p) => drawPine(p, v));
for (let v = 0; v < 4; v++) R.frame(`restinga:${v}`, (p) => drawRestinga(p, v));
const GROUPS: [string, (p: Painter, m: number, v: number) => void][] = [
  ['track', drawTrack],
  ['sand', drawSand],
  ['mud', drawMud],
  ['rock', drawRock],
];
for (const [name, draw] of GROUPS) {
  R.frame(`${name}:${FULL}:0`, (p) => draw(p, FULL, 0));
  for (const m of ALL_MASKS) for (let v = 0; v < 3; v++) R.frame(`${name}:${m}:${v}`, (p) => draw(p, m, v));
}
for (const [name, pal] of [['stream', STREAM], ['sea', SEA]] as const) {
  for (const m of ALL_MASKS) for (let v = 0; v < 3; v++) for (let f = 0; f < WATER_FRAMES; f++) R.frame(`${name}:${m}:${v}:${f}`, (p) => drawWater(p, name, pal, m, v, f));
}
for (let m = 1; m < 16; m++) for (let v = 0; v < 3; v++) R.frame(`fringe:${m}:${v}`, (p) => fringe(p, m, v));

// ------------------------------------------------------------------ escolha de quadros

const IN: Record<string, (c: Cell) => boolean> = {
  track: (c) => c === ',',
  rock: (c) => c === 'r',
  // a areia continua sob a restinga, a lama e a água
  sand: (c) => c === '_' || c === '~' || c === 'g' || c === 'l',
  mud: (c) => c === 'l' || c === '~',
  water: (c) => c === '~',
};
const GROUP_OF: Record<string, string> = { ',': 'track', _: 'sand', l: 'mud', r: 'rock' };
/** A partir desta coluna a água é o estuário/mar (e não o riacho). */
const SEA_X = 47;

function frames(map: string[], x: number, y: number): number[] {
  const ch = map[y][x];
  const h = hash2(x, y, 1);
  const v3 = Math.floor(h * 3);
  switch (ch) {
    case '#':
      return [R.idx(`wall:${Math.floor(hash2(x, y, 2) * 3)}`)];
    case '"':
      return [R.idx(`fern:${Math.floor(h * 4)}`)];
    case 'c':
      return [R.idx(`agreste:${Math.floor(h * 4)}`)];
    case 's':
      return [R.idx(`scrub:${v3}`)];
    case 'a':
      return [R.idx(`campo:${pick([0.2, 0.2, 0.15, 0.15, 0.15, 0.15], h)}`)];
    case 'q':
      return [R.idx(`tall:${v3}`)];
    case 'p':
      return [R.idx(`pine:${v3}`)];
    case 'g':
      return [R.idx(`restinga:${Math.floor(h * 4)}`)];
    case '.':
      return [R.idx(`floor:${pick(FLOOR_WEIGHTS, h)}`)];
    case '~': {
      const m = maskOf(map, x, y, IN.water);
      const name = x >= SEA_X ? 'sea' : 'stream';
      return Array.from({ length: WATER_FRAMES }, (_, f) => R.idx(`${name}:${m}:${v3}:${f}`));
    }
    default: {
      const group = GROUP_OF[ch];
      if (!group) return [R.idx(`floor:${pick(FLOOR_WEIGHTS, h)}`)];
      return [R.idx(`${group}:${maskOf(map, x, y, IN[group])}:${v3}`)];
    }
  }
}

/** Franja da mata fechada sobre o chão andável vizinho. */
function overlays(map: string[], x: number, y: number): number[] {
  const ch = map[y][x];
  if (ch === '#' || ch === '~') return [];
  const at = (xx: number, yy: number): Cell => map[yy]?.[xx];
  const m = (at(x, y - 1) === '#' ? N : 0) | (at(x + 1, y) === '#' ? E : 0) | (at(x, y + 1) === '#' ? S : 0) | (at(x - 1, y) === '#' ? W : 0);
  return m ? [R.idx(`fringe:${m}:${Math.floor(hash2(x, y, 3) * 3)}`)] : [];
}

export const TILESET: Tileset = {
  key: 'mata_atlantica_tiles',
  ground: MATA_GROUND,
  solid: new Set(['#', '~']),
  water: new Set(['~']),
  brush: new Set(['"', 's', 'q', 'g']),
  frames,
  overlays,
  frameNames: R.names,
  paint: (scene: Phaser.Scene) => R.build(scene, 'mata_atlantica_tiles'),
};
