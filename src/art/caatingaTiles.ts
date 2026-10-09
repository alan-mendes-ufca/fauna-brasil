import type Phaser from 'phaser';
import { TILE, rng, type Painter } from './canvas';
import { blob, frond, hash2, rgba, type Pal5 } from './draw';
import { ALL_MASKS, E, EDGE_VARIANTS, FULL, N, S, TileRegistry, W, distTo, makeProf, maskOf, outGrid, paintGroup, pick, profile, type Cell } from './forestTiles';

// Chão da Caatinga (e da faixa de transição: mata dos cocais e cerrado).
// Sol forte: terra clara ocre e terracota, verde-acinzentado na vegetação e sombras violeta-azuladas.

/**
 * Legenda do mapa da Caatinga (uma letra por tile de 16×16):
 *   #  caatinga fechada: garranchos e arbustos espinhentos (sólido)
 *   %  mata dos cocais fechada: babaçus e palmeiras (sólido)
 *   .  terra rachada
 *   :  capim do cerrado e dos cocais (andável)
 *   ,  trilha de areia (andável)
 *   "  capim seco e macambiral (andável; esconderijo dos bichos pequenos)
 *   r  lajedo: laje de granito (andável)
 *   s  leito seco do riacho temporário: areia e seixos (andável)
 *   ~  água do açude (sólido)
 *   _  margem de lama rachada (andável)
 */
export const CAATINGA_GROUND = ['#', '%', '.', ':', ',', '"', 'r', 's', '~', '_'] as const;

export const CAATINGA_TILES_KEY = 'caatinga_tiles';

const R = new TileRegistry();
export const CAATINGA_FRAME_NAMES = R.names;

export function buildCaatingaSheet(scene: Phaser.Scene): void {
  R.build(scene, CAATINGA_TILES_KEY);
}

// ------------------------------------------------------------------ terra rachada

const EARTH = {
  base: ['#d6a66a', '#d09e62', '#dbae76', '#cc985e', '#d8a86c', '#d2a266'],
  dk: '#b4824c',
  lt: '#e6be86',
  hi: '#f4d8a2',
  crack: '#7e4c3c',
  crackV: '#6a4a62',
  lip: '#f0cc94',
  pebble: '#ece0c8',
  pebbleD: '#8c7a80',
  twig: '#6a4232',
  twigL: '#a8784c',
  straw: '#ecd27c',
  strawD: '#b08a48',
};

const EARTH_VARIANTS = 6;
const EARTH_WEIGHTS = [0.3, 0.22, 0.16, 0.12, 0.12, 0.08];

/** Rachaduras em placas (Voronoi periódico de 16 px, para emendar com os tiles vizinhos). */
function cracks(p: Painter, seed: number, cells: number, strength: number): void {
  const r = rng(seed);
  const pts: [number, number][] = [];
  for (let i = 0; i < cells; i++) pts.push([r() * TILE, r() * TILE]);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      let d1 = Infinity;
      let d2 = Infinity;
      for (const [px, py] of pts) {
        for (const ox of [-TILE, 0, TILE]) {
          for (const oy of [-TILE, 0, TILE]) {
            const d = Math.hypot(x + 0.5 - px - ox, y + 0.5 - py - oy);
            if (d < d1) {
              d2 = d1;
              d1 = d;
            } else if (d < d2) d2 = d;
          }
        }
      }
      const h = hash2(x, y, seed);
      if (d2 - d1 < 0.9 && h < strength) p.px(x, y, h < strength * 0.25 ? EARTH.crackV : EARTH.crack);
      else if (d2 - d1 < 1.9 && h < strength * 0.5) p.px(x, y, EARTH.lip);
    }
  }
}

function pebble(p: Painter, x: number, y: number, c = EARTH.pebble): void {
  p.px(x, y, c).px(x + 1, y, c).px(x, y + 1, EARTH.pebbleD).px(x + 1, y + 1, EARTH.pebbleD).px(x, y, '#fffaf0');
}

function drawEarth(p: Painter, v: number): void {
  const r = rng(3000 + v * 37);
  p.rect(0, 0, TILE, TILE, EARTH.base[v % EARTH.base.length]);
  for (let i = 0; i < 8; i++) p.rect(Math.floor(r() * 16), Math.floor(r() * 16), 2 + Math.floor(r() * 3), 1, r() < 0.5 ? EARTH.dk : EARTH.lt);
  p.speckle(0, 0, TILE, TILE, [EARTH.dk, EARTH.lt, '#c88c58'], 0.1, r);
  p.speckle(0, 0, TILE, TILE, [EARTH.hi, '#bc7a4a'], 0.03, r);
  switch (v) {
    case 0:
      cracks(p, 41, 4, 0.7);
      break;
    case 1:
      cracks(p, 57, 6, 0.9);
      pebble(p, 3 + Math.floor(r() * 8), 4 + Math.floor(r() * 8));
      break;
    case 2:
      // galho seco caído
      cracks(p, 63, 3, 0.45);
      p.hline(3, 10, 8, EARTH.twig).hline(4, 9, 3, EARTH.twigL).px(10, 9, EARTH.twig).px(11, 8, EARTH.twigL).px(6, 11, EARTH.twig);
      break;
    case 3:
      // tufinho de capim seco
      cracks(p, 71, 5, 0.6);
      for (const [x, h] of [
        [9, 3],
        [10, 4],
        [11, 3],
        [12, 2],
      ] as const) p.vline(x, 12 - h, h, EARTH.straw).px(x, 12, EARTH.strawD);
      break;
    case 4:
      // seixos claros
      pebble(p, 2, 3);
      pebble(p, 11, 9);
      pebble(p, 6, 12, '#d8c8b0');
      cracks(p, 83, 4, 0.5);
      break;
    default:
      // areia lisa com marcas de vento
      for (let y = 2; y < TILE; y += 5) for (let x = 0; x < TILE; x++) if (hash2(x, y, v) < 0.55) p.px(x, y + (x % 7 < 3 ? 0 : 1), EARTH.lt);
  }
}

// ------------------------------------------------------------------ paredes (sólidas)

const SCRUB_PAL: Pal5[] = [
  { o: '#2c2240', d: '#4c4660', m: '#74805c', l: '#a8ac72', h: '#ecdc98' },
  { o: '#2a2036', d: '#5a4a5e', m: '#8a7a60', l: '#bea474', h: '#f4dca4' },
];
const COCAIS_PAL: Pal5[] = [
  { o: '#0c2a26', d: '#18503a', m: '#348a3c', l: '#7cc04a', h: '#e4e07a' },
  { o: '#0e2620', d: '#1c4632', m: '#2a7a3e', l: '#64ac46', h: '#cce070' },
];

function drawScrub(p: Painter, v: number): void {
  p.rect(0, 0, TILE, TILE, '#5a4a62');
  const r = rng(5100 + v * 19);
  // galhos cinzentos por baixo
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(r() * 16);
    const y = Math.floor(r() * 16);
    for (let k = 0; k < 5; k++) p.px((x + k) % 16, (y + (k >> 1)) % 16, k % 2 ? '#c4b4a8' : '#8a7a80');
  }
  for (let i = 0; i < 7; i++) {
    const cx = r() * 16;
    const cy = r() * 16;
    const rad = 3 + r() * 2.2;
    for (const ox of [-16, 0, 16]) {
      for (const oy of [-16, 0, 16]) {
        if (cx + ox < -7 || cx + ox > 23 || cy + oy < -7 || cy + oy > 23) continue;
        blob(p, cx + ox, cy + oy, rad, rad * 0.85, SCRUB_PAL[i % 2], 60 + i * 7 + v * 3, { lobes: 7, amp: 0.3, bias: 0.05, noise: 0.6 });
      }
    }
  }
  // espinhos e florzinhas amarelas da catingueira
  for (let i = 0; i < 5; i++) {
    const x = 1 + Math.floor(r() * 14);
    const y = 1 + Math.floor(r() * 14);
    p.px(x, y, i % 3 === 0 ? '#ffd23a' : '#f4ecd8');
  }
}

function drawCocais(p: Painter, v: number): void {
  p.rect(0, 0, TILE, TILE, '#173c2c');
  const r = rng(5300 + v * 23);
  for (let i = 0; i < 5; i++) {
    const cx = r() * 16;
    const cy = r() * 16;
    for (const ox of [-16, 0, 16]) {
      for (const oy of [-16, 0, 16]) {
        if (cx + ox < -8 || cx + ox > 24 || cy + oy < -8 || cy + oy > 24) continue;
        blob(p, cx + ox, cy + oy, 3.6, 3, COCAIS_PAL[i % 2], 90 + i * 5 + v, { lobes: 5, amp: 0.25, bias: 0.2 });
      }
    }
  }
  // folíolos de babaçu em leque por cima
  for (let i = 0; i < 4; i++) {
    const x = 2 + r() * 12;
    const y = 4 + r() * 10;
    frond(p, x, y, r() < 0.5 ? -1 : 1, 6 + r() * 3, 1.2, 1.4, COCAIS_PAL[0], 2);
  }
}

/** Franja da vegetação fechada que invade o chão vizinho, com sombra violeta (cerrado/caatinga) ou teal (cocais). */
function fringe(p: Painter, kind: 'scrub' | 'cocais', mask: number, fv: number): void {
  const pals = kind === 'scrub' ? SCRUB_PAL : COCAIS_PAL;
  const shade = kind === 'scrub' ? '#3a2458' : '#0e3a40';
  [0.42, 0.32, 0.22, 0.14, 0.08].forEach((a, d) => {
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
    const prof = profile(1900 + si * 17 + fv * 101 + (kind === 'scrub' ? 0 : 7), 4, 2.6, 2, 7);
    const at = (pos: number, depth: number): [number, number] => (si === 0 ? [pos, depth] : si === 1 ? [TILE - 1 - depth, pos] : si === 2 ? [pos, TILE - 1 - depth] : [depth, pos]);
    for (let pos = 0; pos < TILE; pos++) {
      for (let d = 0; d < Math.min(2, prof[pos]); d++) {
        const [x, y] = at(pos, d);
        p.px(x, y, hash2(x, y, 3) < 0.5 ? pals[0].d : pals[1].m);
      }
    }
    for (let k = 0; k < 6; k++) {
      const pos = Math.round(k * 3.2 + hash2(k, si, fv) * 2 - 0.5);
      const rad = 2.3 + hash2(k, si + 5, fv) * 1.5;
      const depth = Math.max(0.5, prof[Math.min(TILE - 1, Math.max(0, pos))] - rad * 0.85);
      const [cx, cy] = at(pos, depth);
      blob(p, cx, cy, rad, rad * 0.85, pals[(k + fv) % 2], 700 + k * 7 + si * 3 + fv, { lobes: kind === 'scrub' ? 7 : 5, amp: 0.28, bias: 0.1, noise: 0.5 });
    }
    // folhas e gravetos soltos no chão, passando da franja
    for (let k = 0; k < 3; k++) {
      const pos = Math.floor(hash2(k, si + 9, fv) * TILE);
      const depth = prof[pos] + 1 + Math.floor(hash2(k, si + 2, fv) * 2);
      const [x, y] = at(pos, depth);
      p.px(x, y, kind === 'scrub' ? (k === 0 ? '#c4b4a8' : '#8a7060') : k === 0 ? '#c8e060' : '#3a8a3c').px(x + 1, y, kind === 'scrub' ? '#6a5a62' : '#18503a');
    }
  }
}

// ------------------------------------------------------------------ capim seco (andável, esconderijo)

function drawDryGrass(p: Painter, v: number): void {
  drawEarth(p, (v + 3) % EARTH_VARIANTS);
  const r = rng(6000 + v * 53);
  const tufts = [
    { x: 3, y: 5 },
    { x: 11, y: 4 },
    { x: 7, y: 10 },
    { x: 14, y: 12 },
    { x: 0, y: 13 },
  ];
  for (const t of tufts) {
    const nb = 4 + Math.floor(r() * 3);
    const green = r() < 0.3;
    const blades: { x: number; lean: number; h: number }[] = [];
    for (let i = 0; i < nb; i++) blades.push({ x: t.x + i - Math.floor(nb / 2) + Math.round((r() - 0.5) * 2), lean: (i - (nb - 1) / 2) * 0.9 + (r() - 0.5), h: 4 + Math.floor(r() * 4) });
    for (const pass of [0, 1]) {
      for (const b of blades) {
        for (let k = 0; k <= b.h; k++) {
          const tt = k / b.h;
          const x = Math.round(b.x + b.lean * tt * 1.5);
          const y = t.y + 3 - k;
          if (pass === 0) {
            p.px(x - 1, y, '#6a4a3e');
            if (k === b.h) p.px(x, y - 1, '#6a4a3e');
          } else if (green) {
            p.px(x, y, tt < 0.35 ? '#5e6a40' : tt < 0.75 ? '#8e9a58' : tt < 1 ? '#c0c47c' : '#f0ecb0');
          } else {
            p.px(x, y, tt < 0.3 ? '#9a6e3c' : tt < 0.7 ? '#cfa44e' : tt < 1 ? '#ecd07a' : '#fff4c0');
          }
        }
      }
    }
  }
  if (v === 2) p.px(8, 6, '#ffd23a').px(7, 6, '#ffe890').px(9, 6, '#ffe890').px(8, 5, '#ffe890').px(8, 7, '#e0a020');
  if (v === 3) p.px(4, 9, '#e85a8a').px(5, 9, '#ff9ac0').px(4, 8, '#ff9ac0');
}

// ------------------------------------------------------------------ grupos com borda orgânica

const GRASS_PROFS = Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(1300 + v * 41, 3, 3.4));
const TRACK_PROFS = Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(1400 + v * 43, 3, 3.0));
const ROCK_PROFS = Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(1500 + v * 47, 3, 3.6, 1, 7));
const BED_PROFS = Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(1600 + v * 53, 3, 3.0));
const MUD_PROFS = Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(1700 + v * 59, 3, 3.2));
const POND_PROFS = Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(1800 + v * 61, 4, 3.4));

function grassColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 140 + v);
  // lâminas: traços verticais mais claros
  if ((x * 5 + v) % 4 === 0 && hash2(x, y >> 1, 9 + v) < 0.5) return h < 0.5 ? '#c4c460' : '#a4b04c';
  if (h < 0.12) return '#6c7e34';
  if (h < 0.2) return '#b8b856';
  if (h < 0.225) return '#e4d878';
  if (h < 0.25) return '#58682c';
  return '#8e9c40';
}

function drawGrass(p: Painter, mask: number, v: number): void {
  drawEarth(p, (v * 2 + 1) % EARTH_VARIANTS);
  paintGroup(
    p,
    outGrid(mask, GRASS_PROFS[v % EDGE_VARIANTS], 8),
    (x, y) => grassColor(x, y, v),
    (x, y) => (hash2(x, y, 5) < 0.35 ? '#a4a84a' : '#7c8a38'),
    (x, y) => (hash2(x, y, 4) < 0.4 ? '#c8b060' : null),
    51 + v,
  );
}

function trackColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 160 + v);
  if (h < 0.1) return '#dcbe88';
  if (h < 0.2) return '#fcecc4';
  if (h < 0.215) return '#fffaea';
  if (h < 0.235) return '#b8946a';
  // marcas de rodas e pegadas
  if ((y + v * 5) % 7 === 2 && hash2(x, y, 9) < 0.55) return '#d8bc88';
  return '#eedaaa';
}

function drawTrack(p: Painter, mask: number, v: number): void {
  drawEarth(p, (v + 2) % EARTH_VARIANTS);
  paintGroup(
    p,
    outGrid(mask, TRACK_PROFS[v % EDGE_VARIANTS], 8),
    (x, y) => trackColor(x, y, v),
    (x, y) => (hash2(x, y, 5) < 0.4 ? '#e4c890' : '#d2b07a'),
    (x, y) => (hash2(x, y, 4) < 0.3 ? '#a87c56' : null),
    61 + v,
  );
}

/** Laje de granito: topo-esquerda iluminado, contorno violeta e sombra projetada embaixo. */
function drawRock(p: Painter, mask: number, v: number): void {
  drawEarth(p, (v + 4) % EARTH_VARIANTS);
  const g = outGrid(mask, ROCK_PROFS[v % EDGE_VARIANTS], 9);
  const out = (x: number, y: number) => x < 0 || y < 0 || x >= TILE || y >= TILE || g[y * TILE + x];
  const outAt = (x: number, y: number) => {
    // fora do tile segue o lado da máscara (vizinho do mesmo grupo = dentro)
    if (x < 0) return !(mask & W);
    if (x >= TILE) return !(mask & E);
    if (y < 0) return !(mask & N);
    if (y >= TILE) return !(mask & S);
    return g[y * TILE + x];
  };
  const r = rng(7000 + v);
  const lichen: [number, number, string][] = [];
  for (let i = 0; i < 4; i++) lichen.push([Math.floor(r() * 14) + 1, Math.floor(r() * 14) + 1, ['#e8943c', '#d8c050', '#9aa682', '#f2ece0'][i]]);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (out(x, y)) {
        // sombra violeta projetada pela laje logo abaixo da borda
        if (!outAt(x, y - 1) || !outAt(x - 1, y - 1)) p.px(x, y, rgba('#3a2a5a', 0.45));
        else if (!outAt(x, y - 2)) p.px(x, y, rgba('#3a2a5a', 0.2));
        continue;
      }
      const h = hash2(x, y, 170 + v);
      const top = outAt(x, y - 1);
      const bottom = outAt(x, y + 1);
      const left = outAt(x - 1, y);
      const right = outAt(x + 1, y);
      if (bottom || right) {
        p.px(x, y, bottom && hash2(x, y, 3) < 0.6 ? '#4e3e62' : '#6a5878');
        continue;
      }
      if (top || left) {
        p.px(x, y, h < 0.5 ? '#f2eade' : '#e2d6ca');
        continue;
      }
      if (outAt(x, y + 2) || outAt(x + 1, y + 1)) {
        p.px(x, y, '#9c8c98');
        continue;
      }
      if (outAt(x, y - 2) || outAt(x - 1, y - 1)) {
        p.px(x, y, '#d8ccc0');
        continue;
      }
      p.px(x, y, h < 0.14 ? '#c8bcb4' : h < 0.26 ? '#a8999a' : h < 0.3 ? '#d8cec4' : '#bcaea8');
    }
  }
  // fendas finas e liquens
  if (v !== 1) {
    let x = 3 + Math.floor(r() * 6);
    for (let y = 2; y < 14; y++) {
      if (!out(x, y) && !out(x, y + 1) && !out(x + 1, y)) p.px(x, y, '#7a6a7c').px(x + 1, y, '#e2d8cc');
      if (r() < 0.35) x += r() < 0.5 ? -1 : 1;
    }
  }
  for (const [lx, ly, c] of lichen) {
    if (out(lx, ly) || out(lx + 1, ly) || out(lx, ly + 1)) continue;
    p.px(lx, ly, c).px(lx + 1, ly, c);
    if (hash2(lx, ly, 2) < 0.5) p.px(lx, ly + 1, c);
  }
}

function bedColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 180 + v);
  if (h < 0.1) return '#d2b68a';
  if (h < 0.18) return '#f6e8c4';
  if (h < 0.2) return '#a8927c';
  // ondulações deixadas pela última cheia
  if ((x + y * 3 + v * 4) % 11 < 2 && h < 0.7) return '#dcc496';
  return '#ead6a8';
}

function drawBed(p: Painter, mask: number, v: number): void {
  drawEarth(p, (v + 1) % EARTH_VARIANTS);
  const g = outGrid(mask, BED_PROFS[v % EDGE_VARIANTS], 8);
  paintGroup(
    p,
    g,
    (x, y) => bedColor(x, y, v),
    (x, y) => (hash2(x, y, 5) < 0.4 ? '#b08c64' : '#c4a274'),
    (x, y) => (hash2(x, y, 4) < 0.5 ? '#7c5a48' : '#9a7458'),
    71 + v,
  );
  // seixos rolados
  const r = rng(7300 + v * 7 + mask);
  for (let i = 0; i < 4; i++) {
    const x = 1 + Math.floor(r() * 13);
    const y = 1 + Math.floor(r() * 13);
    if (g[y * TILE + x] || g[y * TILE + x + 1] || g[(y + 1) * TILE + x]) continue;
    const c = ['#c8bcb0', '#b0a49c', '#d8b48c', '#e8e0d0'][i];
    p.px(x, y, c).px(x + 1, y, c).px(x, y + 1, '#8a7a7e').px(x + 1, y + 1, '#8a7a7e').px(x, y, '#fffaf0');
  }
}

function mudColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 190 + v);
  if (h < 0.1) return '#7c5a44';
  if (h < 0.18) return '#b88e66';
  if (h < 0.2) return '#d8b080';
  return '#9c7454';
}

function drawMud(p: Painter, mask: number, v: number): void {
  drawEarth(p, (v + 5) % EARTH_VARIANTS);
  const g = outGrid(mask, MUD_PROFS[v % EDGE_VARIANTS], 8);
  paintGroup(
    p,
    g,
    (x, y) => mudColor(x, y, v),
    (x, y) => (hash2(x, y, 5) < 0.4 ? '#8a6448' : '#a07a58'),
    (x, y) => (hash2(x, y, 4) < 0.4 ? '#6a4a3c' : null),
    81 + v,
  );
  // placas de lama seca: rachaduras só por dentro
  const r = rng(7500 + v);
  const pts: [number, number][] = [];
  for (let i = 0; i < 5; i++) pts.push([r() * TILE, r() * TILE]);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (g[y * TILE + x] || distTo(g, x, y, true, 1) === 1) continue;
      let d1 = Infinity;
      let d2 = Infinity;
      for (const [px, py] of pts) {
        for (const ox of [-TILE, 0, TILE]) {
          for (const oy of [-TILE, 0, TILE]) {
            const d = Math.hypot(x + 0.5 - px - ox, y + 0.5 - py - oy);
            if (d < d1) {
              d2 = d1;
              d1 = d;
            } else if (d < d2) d2 = d;
          }
        }
      }
      if (d2 - d1 < 0.9) p.px(x, y, '#5a3c36');
      else if (d2 - d1 < 1.8 && hash2(x, y, 7) < 0.5) p.px(x, y, '#c09670');
    }
  }
}

// ------------------------------------------------------------------ água do açude (3 quadros)

const WATER_FRAMES = 3;
const SHIFTS = [0, 5, 11];

function pondGrid(v: number, f: number): string[] {
  const g: string[] = new Array(TILE * TILE).fill('#2c8c98');
  const r = rng(7700 + v * 41);
  const at = (x: number, y: number, c: string) => {
    g[(((y % TILE) + TILE) % TILE) * TILE + (((x % TILE) + TILE) % TILE)] = c;
  };
  for (let i = 0; i < 4; i++) {
    const sx = Math.floor(r() * 16);
    const sy = Math.floor(r() * 16);
    const len = 4 + Math.floor(r() * 4);
    for (let k = 0; k < len; k++) at(sx + k + Math.floor(SHIFTS[f] * 0.4), sy, '#1f6e84');
    for (let k = 1; k < len - 1; k++) at(sx + k + Math.floor(SHIFTS[f] * 0.4), sy + 1, '#247a8c');
  }
  for (let i = 0; i < 6; i++) {
    const sx = Math.floor(r() * 16);
    const sy = Math.floor(r() * 16);
    const len = 3 + Math.floor(r() * 3);
    const dir = i % 2 === 0 ? 1 : -1;
    for (let k = 0; k < len; k++) at(sx + k + dir * SHIFTS[f], sy, k === len - 1 ? '#c8f6e4' : '#5cc4c0');
  }
  // o sol forte cintila na água
  for (let i = 0; i < 4; i++) {
    if (hash2(i, f, v + 17) < 0.75) at(Math.floor(hash2(i, f, v) * 16), Math.floor(hash2(i, f, v + 3) * 16), i === 0 ? '#ffffff' : '#fff0b0');
  }
  return g;
}
const POND_GRIDS = new Map<string, string[]>();
const pondBase = (v: number, f: number) => {
  const k = `${v}:${f}`;
  let g = POND_GRIDS.get(k);
  if (!g) POND_GRIDS.set(k, (g = pondGrid(v, f)));
  return g;
};

function drawPond(p: Painter, mask: number, v: number, f: number): void {
  const base = pondBase(v, f);
  const g = outGrid(mask, POND_PROFS[v % EDGE_VARIANTS], 9);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (!g[y * TILE + x]) {
        const dOut = distTo(g, x, y, true, 2);
        if (dOut === 1) p.px(x, y, (x + y + f * 2) % 4 < 2 ? '#f0fff4' : '#a8e8d8');
        else if (dOut === 2) p.px(x, y, hash2(x, y, f + 3) < 0.4 ? '#4cb4b0' : base[y * TILE + x]);
        else p.px(x, y, base[y * TILE + x]);
      } else {
        const d = distTo(g, x, y, false, 4);
        const h = hash2(x, y, 11);
        if (d === 1) p.px(x, y, h < 0.4 ? '#3a2a34' : '#4a3438');
        else if (d === 2) p.px(x, y, h < 0.3 ? '#6a4a3c' : '#5a3e36');
        else p.px(x, y, mudColor(x, y, v));
      }
    }
  }
}

// ------------------------------------------------------------------ registro dos quadros

for (let v = 0; v < EARTH_VARIANTS; v++) R.frame(`earth:${v}`, (p) => drawEarth(p, v));
for (let v = 0; v < 3; v++) R.frame(`scrub:${v}`, (p) => drawScrub(p, v));
for (let v = 0; v < 3; v++) R.frame(`cocais:${v}`, (p) => drawCocais(p, v));
for (let v = 0; v < 4; v++) R.frame(`dry:${v}`, (p) => drawDryGrass(p, v));
const GROUPS: [string, (p: Painter, m: number, v: number) => void][] = [
  ['grass', drawGrass],
  ['track', drawTrack],
  ['rock', drawRock],
  ['bed', drawBed],
  ['mud', drawMud],
];
for (const [name, draw] of GROUPS) {
  R.frame(`${name}:${FULL}:0`, (p) => draw(p, FULL, 0));
  for (const m of ALL_MASKS) for (let v = 0; v < 3; v++) R.frame(`${name}:${m}:${v}`, (p) => draw(p, m, v));
}
for (const m of ALL_MASKS) for (let v = 0; v < 3; v++) for (let f = 0; f < WATER_FRAMES; f++) R.frame(`pond:${m}:${v}:${f}`, (p) => drawPond(p, m, v, f));
for (const kind of ['scrub', 'cocais'] as const) for (let m = 1; m < 16; m++) for (let v = 0; v < 3; v++) R.frame(`fringe-${kind}:${m}:${v}`, (p) => fringe(p, kind, m, v));

// ------------------------------------------------------------------ escolha de quadros

const IN: Record<string, (c: Cell) => boolean> = {
  // o capim continua sob a mata dos cocais (sem borda contra ela)
  grass: (c) => c === ':' || c === '%',
  track: (c) => c === ',',
  rock: (c) => c === 'r',
  bed: (c) => c === 's',
  mud: (c) => c === '_' || c === '~',
  pond: (c) => c === '~',
};
const GROUP_OF: Record<string, string> = { ':': 'grass', ',': 'track', r: 'rock', s: 'bed', _: 'mud' };

export function caatingaFrames(map: string[], x: number, y: number): number[] {
  const ch = map[y][x];
  const h = hash2(x, y, 1);
  const v3 = Math.floor(h * 3);
  switch (ch) {
    case '#':
      return [R.idx(`scrub:${Math.floor(hash2(x, y, 2) * 3)}`)];
    case '%':
      return [R.idx(`cocais:${Math.floor(hash2(x, y, 2) * 3)}`)];
    case '"':
      return [R.idx(`dry:${Math.floor(h * 4)}`)];
    case '~': {
      const m = maskOf(map, x, y, IN.pond);
      return Array.from({ length: WATER_FRAMES }, (_, f) => R.idx(`pond:${m}:${v3}:${f}`));
    }
    case '.':
      return [R.idx(`earth:${pick(EARTH_WEIGHTS, h)}`)];
    default: {
      const group = GROUP_OF[ch];
      if (!group) return [R.idx('earth:0')];
      return [R.idx(`${group}:${maskOf(map, x, y, IN[group])}:${v3}`)];
    }
  }
}

/** Franjas da caatinga fechada e da mata dos cocais sobre o chão andável vizinho. */
export function caatingaOverlays(map: string[], x: number, y: number): number[] {
  const ch = map[y][x];
  if (ch === '#' || ch === '%' || ch === '~') return [];
  const at = (xx: number, yy: number): Cell => map[yy]?.[xx];
  const out: number[] = [];
  for (const [wall, kind] of [
    ['#', 'scrub'],
    ['%', 'cocais'],
  ] as const) {
    const m = (at(x, y - 1) === wall ? N : 0) | (at(x + 1, y) === wall ? E : 0) | (at(x, y + 1) === wall ? S : 0) | (at(x - 1, y) === wall ? W : 0);
    if (m) out.push(R.idx(`fringe-${kind}:${m}:${Math.floor(hash2(x, y, 3) * 3)}`));
  }
  return out;
}
