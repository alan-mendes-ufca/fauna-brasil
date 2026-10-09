import type Phaser from 'phaser';
import { TILE, rng, type Painter } from '../../art/canvas';
import { blob, hash2, rgba, type Pal5 } from '../../art/draw';
import type { Tileset } from '../../art/forest';
import { ALL_MASKS, E, EDGE_VARIANTS, FULL, N, S, TileRegistry, W, distTo, makeProf, maskOf, outGrid, paintGroup, pick, profile, type Cell } from '../../art/forestTiles';

// Chão do Cerrado: terra vermelha (latossolo), capim dourado, cerradão de árvores tortas e vereda com água.
// Sol forte, luz quente e sombras frias verde-azuladas.

/**
 * Legenda do mapa do Cerrado (uma letra por tile de 16×16):
 *   #  cerradão fechado: copas de árvores tortas e emaranhado de galhos (sólido)
 *   .  campo limpo: capim ralo sobre terra vermelha (andável)
 *   "  campo sujo: capim alto dourado e arbustos (andável; esconderijo dos bichos pequenos)
 *   m  chão do cerradão: folhas secas à sombra das árvores (andável)
 *   ,  trilha de terra vermelha (andável)
 *   v  vereda: brejo de capim verde e solo encharcado (andável; esconderijo)
 *   ~  água do córrego e da lagoa da vereda (sólido)
 *   _  margem de areia clara e lama junto da água (andável)
 *   r  chapada: afloramento de arenito avermelhado (andável)
 */
export const CERRADO_GROUND = ['#', '.', '"', 'm', ',', 'v', '~', '_', 'r'] as const;

const R = new TileRegistry();

// ------------------------------------------------------------------ terra vermelha

const EARTH = {
  base: ['#c87a4a', '#c27244', '#cf8452', '#bc6c40', '#cc7e4e', '#c47648'],
  dk: '#a2563a',
  lt: '#dc9662',
  hi: '#ecb47c',
  crack: '#7a3c34',
  pebble: '#e8d4b4',
  pebbleD: '#8a6670',
};
const EARTH_VARIANTS = 6;
const EARTH_WEIGHTS = [0.3, 0.22, 0.16, 0.12, 0.12, 0.08];

function pebble(p: Painter, x: number, y: number, c = EARTH.pebble): void {
  p.px(x, y, c).px(x + 1, y, c).px(x, y + 1, EARTH.pebbleD).px(x + 1, y + 1, EARTH.pebbleD).px(x, y, '#fff6e4');
}

/** Lâmina de capim: base escura, miolo verde ou dourado e ponta clara. */
function blade(p: Painter, x: number, y: number, h: number, lean: number, gold: boolean): void {
  for (let k = 0; k <= h; k++) {
    const t = k / h;
    const xx = Math.round(x + lean * t * 1.4);
    const yy = y - k;
    p.px(xx - 1, yy, gold ? '#8a5a34' : '#3e5a30');
    p.px(xx, yy, gold ? (t < 0.3 ? '#a8783c' : t < 0.7 ? '#d8aa4c' : t < 1 ? '#f0d078' : '#fff2b8') : t < 0.3 ? '#4a7032' : t < 0.7 ? '#78a040' : t < 1 ? '#a8c858' : '#dcec90');
  }
}

function drawEarth(p: Painter, v: number): void {
  const r = rng(3100 + v * 37);
  p.rect(0, 0, TILE, TILE, EARTH.base[v % EARTH.base.length]);
  for (let i = 0; i < 8; i++) p.rect(Math.floor(r() * 16), Math.floor(r() * 16), 2 + Math.floor(r() * 3), 1, r() < 0.5 ? EARTH.dk : EARTH.lt);
  p.speckle(0, 0, TILE, TILE, [EARTH.dk, EARTH.lt, '#b6623c'], 0.1, r);
  p.speckle(0, 0, TILE, TILE, [EARTH.hi, '#9a4c36'], 0.03, r);
  if (v === 1) pebble(p, 3 + Math.floor(r() * 8), 4 + Math.floor(r() * 8));
  if (v === 4) {
    pebble(p, 2, 3);
    pebble(p, 11, 9, '#d8c0a0');
  }
  if (v === 2) {
    // fissuras finas do solo seco
    let x = 4 + Math.floor(r() * 6);
    for (let y = 3; y < 13; y++) {
      p.px(x, y, EARTH.crack);
      if (r() < 0.4) x += r() < 0.5 ? -1 : 1;
    }
  }
}

/** Campo limpo: capim ralo e tufinhos sobre terra vermelha. */
function drawCampo(p: Painter, v: number): void {
  drawEarth(p, (v * 2 + 1) % EARTH_VARIANTS);
  const r = rng(3300 + v * 29);
  const n = 3 + (v % 3);
  for (let i = 0; i < n; i++) {
    const x = 1 + Math.floor(r() * 13);
    const y = 5 + Math.floor(r() * 10);
    const gold = r() < 0.65;
    for (let b = 0; b < 3; b++) blade(p, x + b, y, 3 + Math.floor(r() * 3), b - 1 + (r() - 0.5), gold);
  }
  // sombra frias sob os tufos e florzinhas
  if (v === 2) p.px(10, 4, '#fff4d0').px(9, 4, '#f0b0d0').px(11, 4, '#f0b0d0').px(10, 3, '#f0b0d0').px(10, 5, '#f0b0d0');
  if (v === 5) p.px(5, 9, '#ffd23a').px(6, 9, '#ffe890').px(5, 8, '#ffe890');
}

/** Campo sujo: capim alto dourado, sementes claras e arbustinhos. */
function drawCampoSujo(p: Painter, v: number): void {
  drawEarth(p, (v + 3) % EARTH_VARIANTS);
  const r = rng(3500 + v * 53);
  const tufts = [
    { x: 3, y: 7 },
    { x: 10, y: 6 },
    { x: 6, y: 12 },
    { x: 13, y: 13 },
    { x: 0, y: 14 },
  ];
  for (const t of tufts) {
    const nb = 5 + Math.floor(r() * 3);
    const gold = r() < 0.75;
    for (const pass of [0, 1]) {
      for (let i = 0; i < nb; i++) {
        const x = t.x + i - Math.floor(nb / 2);
        const lean = (i - (nb - 1) / 2) * 0.9 + (r() - 0.5);
        const h = 6 + Math.floor(r() * 5);
        if (pass === 1) blade(p, x, t.y, h, lean, gold);
      }
    }
    // sombra fria sob o tufo
    p.hline(t.x - 3, t.y + 1, 7, rgba('#2a3a4a', 0.25));
  }
  if (v === 1) {
    // arbustinho com flor lilás
    blob(p, 8, 7, 2.6, 2, { o: '#2a3a24', d: '#44602c', m: '#6a8a34', l: '#9ab04a', h: '#d8e080' }, 20 + v, { lobes: 5, amp: 0.25 });
    p.px(7, 6, '#d070d8').px(9, 7, '#e8a0f0').px(8, 8, '#d070d8');
  }
  if (v === 3) p.px(4, 5, '#ff8a3a').px(5, 5, '#ffc070').px(4, 4, '#ffc070');
}

/** Chão do cerradão: folhas secas e galhinhos sob a sombra, terra mais escura. */
function drawLitter(p: Painter, v: number): void {
  const r = rng(3700 + v * 41);
  p.rect(0, 0, TILE, TILE, ['#8a5a3c', '#835236', '#926244'][v % 3]);
  p.speckle(0, 0, TILE, TILE, ['#6e4430', '#a67450', '#5c3a30'], 0.2, r);
  p.speckle(0, 0, TILE, TILE, ['#c8a060', '#7a8a3c'], 0.06, r);
  // folhas caídas
  for (let i = 0; i < 6; i++) {
    const x = Math.floor(r() * 14);
    const y = Math.floor(r() * 14);
    const c = ['#d8a448', '#b87a38', '#8aa044', '#e0c070'][Math.floor(r() * 4)];
    p.px(x, y, c).px(x + 1, y + (r() < 0.5 ? 0 : 1), c).px(x + 2, y, '#6a4a30');
  }
  // gravetos
  p.hline(2 + v * 2, 9 - v, 5, '#4a3028').px(8 + v * 2, 8 - v, '#4a3028');
  // manchas de luz que passam pelas copas
  const lx = 3 + Math.floor(r() * 9);
  const ly = 3 + Math.floor(r() * 9);
  p.px(lx, ly, '#f0d890').px(lx + 1, ly, '#e0c070').px(lx, ly + 1, '#e0c070');
  // sombra fria azulada
  for (let i = 0; i < 5; i++) p.rect(Math.floor(r() * 12), Math.floor(r() * 12), 3, 1 + (i % 2), rgba('#1a3040', 0.22));
}

// ------------------------------------------------------------------ cerradão fechado (sólido)

const TREE_PAL: Pal5[] = [
  { o: '#14301e', d: '#2c5a2c', m: '#4e8434', l: '#8cae44', h: '#e0d074' },
  { o: '#122a22', d: '#27503a', m: '#42743c', l: '#7ca44c', h: '#d0d880' },
  { o: '#2a2a1a', d: '#4c5a28', m: '#7a8a34', l: '#b4b848', h: '#f4e48a' },
];

function drawTreeWall(p: Painter, v: number): void {
  p.rect(0, 0, TILE, TILE, '#16301e');
  const r = rng(5200 + v * 19);
  // troncos e galhos tortos entre as copas
  for (let i = 0; i < 4; i++) {
    let x = Math.floor(r() * 16);
    for (let y = 0; y < 16; y++) {
      p.px(x, y, '#3a2a28').px((x + 1) % 16, y, '#6a4a3a');
      if (r() < 0.3) x = (x + (r() < 0.5 ? 15 : 1)) % 16;
    }
  }
  for (let i = 0; i < 8; i++) {
    const cx = r() * 16;
    const cy = r() * 16;
    const rad = 3 + r() * 2;
    for (const ox of [-16, 0, 16]) {
      for (const oy of [-16, 0, 16]) {
        if (cx + ox < -7 || cx + ox > 23 || cy + oy < -7 || cy + oy > 23) continue;
        blob(p, cx + ox, cy + oy, rad, rad * 0.85, TREE_PAL[i % 3], 60 + i * 7 + v * 3, { lobes: 6, amp: 0.3, bias: 0.05 + (i % 3) * 0.05, noise: 0.6 });
      }
    }
  }
  // flores amarelas de ipê e sol filtrado
  for (let i = 0; i < 4; i++) {
    const x = 1 + Math.floor(r() * 14);
    const y = 1 + Math.floor(r() * 14);
    p.px(x, y, i % 2 ? '#ffd23a' : '#fff0a0');
  }
}

/** Franja do cerradão sobre o chão vizinho: sombra fria e folhas que invadem. */
function fringe(p: Painter, mask: number, fv: number): void {
  const shade = '#10303a';
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
    const prof = profile(1900 + si * 17 + fv * 101, 4, 2.6, 2, 7);
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
      blob(p, cx, cy, rad, rad * 0.85, TREE_PAL[(k + fv) % 3], 700 + k * 7 + si * 3 + fv, { lobes: 6, amp: 0.28, bias: 0.1, noise: 0.5 });
    }
    for (let k = 0; k < 3; k++) {
      const pos = Math.floor(hash2(k, si + 9, fv) * TILE);
      const depth = prof[pos] + 1 + Math.floor(hash2(k, si + 2, fv) * 2);
      const [x, y] = at(pos, depth);
      p.px(x, y, k === 0 ? '#e0b050' : '#7a8a3c').px(x + 1, y, '#4a3a2c');
    }
  }
}

// ------------------------------------------------------------------ grupos com borda orgânica

const mk = (seed: number, amp: number, lo = 0) => Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(seed + v * 41, 3, amp, lo, 7));
const TRACK_PROFS = mk(1400, 3.0);
const MARSH_PROFS = mk(1300, 3.6);
const SAND_PROFS = mk(1600, 3.0);
const ROCK_PROFS = mk(1500, 3.6, 1);
const POND_PROFS = Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(1800 + v * 61, 4, 3.4));

function trackColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 160 + v);
  if (h < 0.1) return '#e8a070';
  if (h < 0.2) return '#f6c498';
  if (h < 0.215) return '#fff0d4';
  if (h < 0.235) return '#c0724c';
  if ((y + v * 5) % 7 === 2 && hash2(x, y, 9) < 0.55) return '#e09868';
  return '#dc8c5c';
}

function drawTrack(p: Painter, mask: number, v: number): void {
  drawEarth(p, (v + 2) % EARTH_VARIANTS);
  paintGroup(
    p,
    outGrid(mask, TRACK_PROFS[v % EDGE_VARIANTS], 8),
    (x, y) => trackColor(x, y, v),
    (x, y) => (hash2(x, y, 5) < 0.4 ? '#eaa478' : '#cc8058'),
    (x, y) => (hash2(x, y, 4) < 0.3 ? '#7a3c30' : null),
    61 + v,
  );
}

function marshColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 140 + v);
  if ((x * 5 + v) % 4 === 0 && hash2(x, y >> 1, 9 + v) < 0.5) return h < 0.5 ? '#92d060' : '#70b04c';
  if (h < 0.12) return '#2e7a48';
  if (h < 0.2) return '#6cbc58';
  if (h < 0.225) return '#d8f090';
  if (h < 0.25) return '#1e5e40';
  return '#3e9a50';
}

/** Vereda: capim verde-vivo do brejo, com junquinhos e lampejos de água. */
function drawMarsh(p: Painter, mask: number, v: number): void {
  drawLitter(p, v);
  const g = outGrid(mask, MARSH_PROFS[v % EDGE_VARIANTS], 8);
  paintGroup(
    p,
    g,
    (x, y) => marshColor(x, y, v),
    (x, y) => (hash2(x, y, 5) < 0.35 ? '#5aaa50' : '#2e7a4a'),
    (x, y) => (hash2(x, y, 4) < 0.4 ? '#2a5a3a' : null),
    51 + v,
  );
  // junquinhos e poças
  const r = rng(7100 + v * 11 + mask);
  for (let i = 0; i < 4; i++) {
    const x = 2 + Math.floor(r() * 12);
    const y = 3 + Math.floor(r() * 10);
    if (g[y * TILE + x] || g[(y - 2) * TILE + x]) continue;
    const h = 3 + Math.floor(r() * 3);
    for (let k = 0; k <= h; k++) p.px(x + (k > h - 2 ? 1 : 0), y - k, k < 2 ? '#2e7a48' : k < h ? '#8cd060' : '#e8f0a0');
  }
  if (v === 1) p.px(6, 12, '#48a8b0').px(7, 12, '#7ad0cc').px(8, 12, '#48a8b0');
}

function sandColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 180 + v);
  if (h < 0.1) return '#d6c090';
  if (h < 0.18) return '#faf0cc';
  if (h < 0.2) return '#b09a78';
  if ((x + y * 3 + v * 4) % 11 < 2 && h < 0.7) return '#e4d0a0';
  return '#efdfb0';
}

function drawSand(p: Painter, mask: number, v: number): void {
  drawEarth(p, (v + 1) % EARTH_VARIANTS);
  const g = outGrid(mask, SAND_PROFS[v % EDGE_VARIANTS], 8);
  paintGroup(
    p,
    g,
    (x, y) => sandColor(x, y, v),
    (x, y) => (hash2(x, y, 5) < 0.4 ? '#b89a6c' : '#cdb080'),
    (x, y) => (hash2(x, y, 4) < 0.5 ? '#7e5a44' : '#9a7650'),
    71 + v,
  );
  const r = rng(7300 + v * 7 + mask);
  for (let i = 0; i < 4; i++) {
    const x = 1 + Math.floor(r() * 13);
    const y = 1 + Math.floor(r() * 13);
    if (g[y * TILE + x] || g[y * TILE + x + 1] || g[(y + 1) * TILE + x]) continue;
    const c = ['#cbbfae', '#b4a89c', '#dcb890', '#ece4d4'][i];
    p.px(x, y, c).px(x + 1, y, c).px(x, y + 1, '#8a7a7e').px(x + 1, y + 1, '#8a7a7e').px(x, y, '#fffaf0');
  }
}

function mudColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 190 + v);
  if (h < 0.1) return '#6e4a3a';
  if (h < 0.18) return '#a67c58';
  if (h < 0.2) return '#c8a074';
  return '#8a6246';
}

/** Chapada: arenito avermelhado com luz no topo-esquerdo e sombra fria embaixo. */
function drawRock(p: Painter, mask: number, v: number): void {
  drawEarth(p, (v + 4) % EARTH_VARIANTS);
  const g = outGrid(mask, ROCK_PROFS[v % EDGE_VARIANTS], 9);
  const out = (x: number, y: number) => x < 0 || y < 0 || x >= TILE || y >= TILE || g[y * TILE + x];
  const outAt = (x: number, y: number) => {
    if (x < 0) return !(mask & W);
    if (x >= TILE) return !(mask & E);
    if (y < 0) return !(mask & N);
    if (y >= TILE) return !(mask & S);
    return g[y * TILE + x];
  };
  const r = rng(7000 + v);
  const lichen: [number, number, string][] = [];
  for (let i = 0; i < 4; i++) lichen.push([Math.floor(r() * 14) + 1, Math.floor(r() * 14) + 1, ['#e8c040', '#9ab060', '#f2ece0', '#d87848'][i]]);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (out(x, y)) {
        if (!outAt(x, y - 1) || !outAt(x - 1, y - 1)) p.px(x, y, rgba('#20304a', 0.45));
        else if (!outAt(x, y - 2)) p.px(x, y, rgba('#20304a', 0.2));
        continue;
      }
      const h = hash2(x, y, 170 + v);
      const top = outAt(x, y - 1);
      const bottom = outAt(x, y + 1);
      const left = outAt(x - 1, y);
      const right = outAt(x + 1, y);
      if (bottom || right) {
        p.px(x, y, bottom && hash2(x, y, 3) < 0.6 ? '#5a2c3a' : '#7a4448');
        continue;
      }
      if (top || left) {
        p.px(x, y, h < 0.5 ? '#f8dcb4' : '#ecc89c');
        continue;
      }
      if (outAt(x, y + 2) || outAt(x + 1, y + 1)) {
        p.px(x, y, '#a8665a');
        continue;
      }
      if (outAt(x, y - 2) || outAt(x - 1, y - 1)) {
        p.px(x, y, '#e4b088');
        continue;
      }
      // estratos horizontais do arenito
      const band = (y + v * 3) % 5 === 0;
      p.px(x, y, band ? '#b87464' : h < 0.14 ? '#d8a07c' : h < 0.26 ? '#c08068' : h < 0.3 ? '#e8bc94' : '#cc9074');
    }
  }
  if (v !== 1) {
    let x = 3 + Math.floor(r() * 6);
    for (let y = 2; y < 14; y++) {
      if (!out(x, y) && !out(x, y + 1) && !out(x + 1, y)) p.px(x, y, '#7a4448').px(x + 1, y, '#f0cca4');
      if (r() < 0.35) x += r() < 0.5 ? -1 : 1;
    }
  }
  for (const [lx, ly, c] of lichen) {
    if (out(lx, ly) || out(lx + 1, ly) || out(lx, ly + 1)) continue;
    p.px(lx, ly, c).px(lx + 1, ly, c);
    if (hash2(lx, ly, 2) < 0.5) p.px(lx, ly + 1, c);
  }
}

// ------------------------------------------------------------------ água da vereda (3 quadros)

const WATER_FRAMES = 3;
const SHIFTS = [0, 5, 11];

function pondGrid(v: number, f: number): string[] {
  const g: string[] = new Array(TILE * TILE).fill('#2a8a86');
  const r = rng(7700 + v * 41);
  const at = (x: number, y: number, c: string) => {
    g[(((y % TILE) + TILE) % TILE) * TILE + (((x % TILE) + TILE) % TILE)] = c;
  };
  for (let i = 0; i < 4; i++) {
    const sx = Math.floor(r() * 16);
    const sy = Math.floor(r() * 16);
    const len = 4 + Math.floor(r() * 4);
    for (let k = 0; k < len; k++) at(sx + k + Math.floor(SHIFTS[f] * 0.4), sy, '#1c6a6c');
    for (let k = 1; k < len - 1; k++) at(sx + k + Math.floor(SHIFTS[f] * 0.4), sy + 1, '#227676');
  }
  for (let i = 0; i < 6; i++) {
    const sx = Math.floor(r() * 16);
    const sy = Math.floor(r() * 16);
    const len = 3 + Math.floor(r() * 3);
    const dir = i % 2 === 0 ? 1 : -1;
    for (let k = 0; k < len; k++) at(sx + k + dir * SHIFTS[f], sy, k === len - 1 ? '#d0fbe0' : '#62c8b4');
  }
  for (let i = 0; i < 4; i++) {
    if (hash2(i, f, v + 17) < 0.75) at(Math.floor(hash2(i, f, v) * 16), Math.floor(hash2(i, f, v + 3) * 16), i === 0 ? '#ffffff' : '#fff4b8');
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
        if (dOut === 1) p.px(x, y, (x + y + f * 2) % 4 < 2 ? '#f0fff4' : '#a8ecd8');
        else if (dOut === 2) p.px(x, y, hash2(x, y, f + 3) < 0.4 ? '#4cb8aa' : base[y * TILE + x]);
        else p.px(x, y, base[y * TILE + x]);
      } else {
        const d = distTo(g, x, y, false, 4);
        const h = hash2(x, y, 11);
        if (d === 1) p.px(x, y, h < 0.4 ? '#2a2a2c' : '#3a3236');
        else if (d === 2) p.px(x, y, h < 0.3 ? '#5a4234' : '#4c382e');
        else p.px(x, y, mudColor(x, y, v));
      }
    }
  }
}

// ------------------------------------------------------------------ registro dos quadros

for (let v = 0; v < EARTH_VARIANTS; v++) R.frame(`earth:${v}`, (p) => drawEarth(p, v));
for (let v = 0; v < 6; v++) R.frame(`campo:${v}`, (p) => drawCampo(p, v));
for (let v = 0; v < 4; v++) R.frame(`sujo:${v}`, (p) => drawCampoSujo(p, v));
for (let v = 0; v < 3; v++) R.frame(`litter:${v}`, (p) => drawLitter(p, v));
for (let v = 0; v < 3; v++) R.frame(`tree:${v}`, (p) => drawTreeWall(p, v));
const GROUPS: [string, (p: Painter, m: number, v: number) => void][] = [
  ['track', drawTrack],
  ['marsh', drawMarsh],
  ['sand', drawSand],
  ['rock', drawRock],
];
for (const [name, draw] of GROUPS) {
  R.frame(`${name}:${FULL}:0`, (p) => draw(p, FULL, 0));
  for (const m of ALL_MASKS) for (let v = 0; v < 3; v++) R.frame(`${name}:${m}:${v}`, (p) => draw(p, m, v));
}
for (const m of ALL_MASKS) for (let v = 0; v < 3; v++) for (let f = 0; f < WATER_FRAMES; f++) R.frame(`pond:${m}:${v}:${f}`, (p) => drawPond(p, m, v, f));
for (let m = 1; m < 16; m++) for (let v = 0; v < 3; v++) R.frame(`fringe:${m}:${v}`, (p) => fringe(p, m, v));

// ------------------------------------------------------------------ escolha de quadros

const IN: Record<string, (c: Cell) => boolean> = {
  // a vereda continua sob a margem e a água (sem borda contra elas)
  marsh: (c) => c === 'v' || c === '~' || c === '_',
  track: (c) => c === ',',
  rock: (c) => c === 'r',
  sand: (c) => c === '_' || c === '~',
  pond: (c) => c === '~',
};
const GROUP_OF: Record<string, string> = { ',': 'track', v: 'marsh', _: 'sand', r: 'rock' };

function frames(map: string[], x: number, y: number): number[] {
  const ch = map[y][x];
  const h = hash2(x, y, 1);
  const v3 = Math.floor(h * 3);
  switch (ch) {
    case '#':
      return [R.idx(`tree:${Math.floor(hash2(x, y, 2) * 3)}`)];
    case '"':
      return [R.idx(`sujo:${Math.floor(h * 4)}`)];
    case 'm':
      return [R.idx(`litter:${v3}`)];
    case '.':
      return [R.idx(`campo:${pick([0.2, 0.2, 0.15, 0.15, 0.15, 0.15], h)}`)];
    case '~': {
      const m = maskOf(map, x, y, IN.pond);
      return Array.from({ length: WATER_FRAMES }, (_, f) => R.idx(`pond:${m}:${v3}:${f}`));
    }
    default: {
      const group = GROUP_OF[ch];
      if (!group) return [R.idx(`earth:${pick(EARTH_WEIGHTS, h)}`)];
      return [R.idx(`${group}:${maskOf(map, x, y, IN[group])}:${v3}`)];
    }
  }
}

/** Franja do cerradão fechado sobre o chão andável vizinho. */
function overlays(map: string[], x: number, y: number): number[] {
  const ch = map[y][x];
  if (ch === '#' || ch === '~') return [];
  const at = (xx: number, yy: number): Cell => map[yy]?.[xx];
  const m = (at(x, y - 1) === '#' ? N : 0) | (at(x + 1, y) === '#' ? E : 0) | (at(x, y + 1) === '#' ? S : 0) | (at(x - 1, y) === '#' ? W : 0);
  return m ? [R.idx(`fringe:${m}:${Math.floor(hash2(x, y, 3) * 3)}`)] : [];
}

export const TILESET: Tileset = {
  key: 'cerrado_tiles',
  ground: CERRADO_GROUND,
  solid: new Set(['#', '~']),
  water: new Set(['~']),
  brush: new Set(['"', 'v']),
  frames,
  overlays,
  frameNames: R.names,
  paint: (scene: Phaser.Scene) => R.build(scene, 'cerrado_tiles'),
};
