import type Phaser from 'phaser';
import { TILE, rng, type Painter } from '../../art/canvas';
import { blob, hash2, rgba, type Pal5 } from '../../art/draw';
import type { Tileset } from '../../art/forest';
import { ALL_MASKS, E, EDGE_VARIANTS, FULL, N, S, TileRegistry, W, distTo, makeProf, maskOf, outGrid, paintGroup, pick, profile, type Cell } from '../../art/forestTiles';

// Chão do Pampa: coxilhas de campo nativo (verde fresco e baixo), banhados com juncal e lagoa, butiazais e capões.
// Luz suave e fria do sul: sombras azul-acinzentadas, nada de terra vermelha.

/**
 * Legenda do mapa do Pampa (uma letra por tile de 16×16):
 *   #  capão de mato fechado: copas de espinilho, corticeira e figueira (sólido)
 *   .  campo nativo: grama baixa e ondulante das coxilhas (andável)
 *   "  macega: touceiras altas de capim e capim-dos-pampas (andável; esconderijo)
 *   ,  trilha de terra batida, cor de argila clara (andável)
 *   c  campo de altitude: grama fresca azulada com pedrinhas e liquens (andável; Campos de Cima da Serra)
 *   b  chão de butiazal: musgo, folhas de butiá e frutos caídos (andável; esconderijo)
 *   j  juncal: junco e tiririca sobre solo encharcado (andável; esconderijo)
 *   ~  água da lagoa e do banhado (sólido)
 *   _  margem de lama e areia fina junto da água (andável)
 */
export const PAMPA_GROUND = ['#', '.', '"', ',', 'c', 'b', 'j', '~', '_'] as const;

const R = new TileRegistry();

// ------------------------------------------------------------------ grama das coxilhas

const GRASS = {
  base: ['#6c9a46', '#659342', '#74a24c', '#5f8c40', '#70a048', '#68964a'],
  dk: '#4a7a3c',
  lt: '#8cb85a',
  hi: '#b8d880',
  straw: '#c4b66c',
  strawD: '#8e8a4c',
};
const GRASS_VARIANTS = 6;
const GRASS_WEIGHTS = [0.3, 0.22, 0.16, 0.12, 0.12, 0.08];

/** Lâmina fina: base escura, miolo verde e ponta clara (ou palha). */
function blade(p: Painter, x: number, y: number, h: number, lean: number, straw = false): void {
  for (let k = 0; k <= h; k++) {
    const t = k / h;
    const xx = Math.round(x + lean * t * 1.3);
    const yy = y - k;
    p.px(xx - 1, yy, straw ? GRASS.strawD : '#3c6a38');
    p.px(xx, yy, straw ? (t < 0.5 ? '#b0a45c' : '#dcd08c') : t < 0.3 ? '#4e8040' : t < 0.7 ? '#7cae4c' : t < 1 ? '#a4d06c' : '#d4ec9c');
  }
}

function drawGrass(p: Painter, v: number): void {
  const r = rng(8100 + v * 37);
  p.rect(0, 0, TILE, TILE, GRASS.base[v % GRASS.base.length]);
  // ondulação suave: faixas largas de tom mais claro/escuro
  for (let i = 0; i < 4; i++) p.rect(Math.floor(r() * 12), Math.floor(r() * 16), 3 + Math.floor(r() * 4), 1, r() < 0.5 ? GRASS.dk : GRASS.lt);
  p.speckle(0, 0, TILE, TILE, [GRASS.dk, GRASS.lt, '#587f3c'], 0.12, r);
  p.speckle(0, 0, TILE, TILE, [GRASS.hi, GRASS.straw], 0.03, r);
}

/** Campo nativo: grama baixa com tufinhos e uma ou outra florzinha (trevo, margarida-do-campo). */
function drawCampo(p: Painter, v: number): void {
  drawGrass(p, (v * 2 + 1) % GRASS_VARIANTS);
  const r = rng(8300 + v * 29);
  const n = 3 + (v % 3);
  for (let i = 0; i < n; i++) {
    const x = 1 + Math.floor(r() * 13);
    const y = 5 + Math.floor(r() * 10);
    const straw = r() < 0.22;
    for (let b = 0; b < 3; b++) blade(p, x + b, y, 3 + Math.floor(r() * 3), b - 1 + (r() - 0.5), straw);
    p.hline(x - 1, y + 1, 5, rgba('#2c4a48', 0.2));
  }
  if (v === 2) p.px(10, 4, '#fff8dc').px(9, 4, '#ffffff').px(11, 4, '#ffffff').px(10, 3, '#ffffff').px(10, 5, '#ffffff');
  if (v === 5) p.px(5, 9, '#f6d03c').px(6, 9, '#fff0a0').px(5, 8, '#fff0a0');
  if (v === 3) p.px(12, 11, '#c8a0e8').px(13, 11, '#e6d0f8').px(12, 10, '#e6d0f8');
}

/** Macega: touceiras altas e arqueadas, palha dourada misturada ao verde, com plumas de capim-dos-pampas. */
function drawMacega(p: Painter, v: number): void {
  drawGrass(p, (v + 3) % GRASS_VARIANTS);
  const r = rng(8500 + v * 53);
  const tufts = [
    { x: 3, y: 8 },
    { x: 10, y: 7 },
    { x: 6, y: 13 },
    { x: 13, y: 14 },
    { x: 0, y: 15 },
  ];
  for (const t of tufts) {
    const nb = 5 + Math.floor(r() * 3);
    const straw = r() < 0.4;
    for (let i = 0; i < nb; i++) {
      const x = t.x + i - Math.floor(nb / 2);
      const lean = (i - (nb - 1) / 2) * 0.95 + (r() - 0.5);
      blade(p, x, t.y, 6 + Math.floor(r() * 5), lean, straw && i % 3 !== 0);
    }
    p.hline(t.x - 3, t.y + 1, 7, rgba('#26404a', 0.26));
  }
  // pluma do capim-dos-pampas: espiga clara que balança acima da touceira
  if (v % 2 === 1) {
    const x = 5 + v;
    for (let k = 0; k < 6; k++) p.px(x + (k > 3 ? 1 : 0), 6 - k, '#8a9a58');
    p.px(x + 1, 0, '#f8f4e0').px(x, 0, '#fff').px(x + 2, 1, '#e8e4c8').px(x + 1, 1, '#fff').px(x, 1, '#e8e4c8');
  }
}

/** Campo de altitude: grama fria azulada com pedrinhas, liquens e florzinhas brancas e lilases. */
function drawAltitude(p: Painter, v: number): void {
  const r = rng(8700 + v * 41);
  p.rect(0, 0, TILE, TILE, ['#5a8e64', '#548a5e', '#62966c', '#4e8258'][v % 4]);
  for (let i = 0; i < 4; i++) p.rect(Math.floor(r() * 12), Math.floor(r() * 16), 3 + Math.floor(r() * 4), 1, r() < 0.5 ? '#3e7050' : '#7cb08a');
  p.speckle(0, 0, TILE, TILE, ['#3e7050', '#7cb08a', '#4a7a60'], 0.14, r);
  p.speckle(0, 0, TILE, TILE, ['#b4d8bc', '#c8c890'], 0.03, r);
  for (let i = 0; i < 3; i++) {
    const x = 1 + Math.floor(r() * 12);
    const y = 6 + Math.floor(r() * 9);
    for (let b = 0; b < 3; b++) {
      for (let k = 0; k <= 3; k++) p.px(x + b - 1 + (b - 1 > 0 && k > 2 ? 1 : 0), y - k, k < 2 ? '#34664a' : k < 3 ? '#5a9a62' : '#a8d4a8');
    }
  }
  // pedrinha de basalto com líquen
  if (v % 2 === 0) {
    const x = 3 + Math.floor(r() * 8);
    const y = 4 + Math.floor(r() * 7);
    p.px(x, y, '#8a98a0').px(x + 1, y, '#a6b2b6').px(x, y + 1, '#4a5864').px(x + 1, y + 1, '#5e6c76').px(x, y, '#d8e2e6');
    p.px(x + 1, y, '#c8d890');
  }
  if (v === 1) p.px(11, 5, '#ffffff').px(10, 5, '#d8e8ff').px(12, 5, '#d8e8ff').px(11, 4, '#d8e8ff').px(11, 6, '#d8e8ff').px(11, 5, '#ffe890');
  if (v === 3) p.px(4, 11, '#d8a8e8').px(5, 11, '#f0d8fa').px(4, 10, '#f0d8fa');
}

// ------------------------------------------------------------------ capão de mato (sólido)

const TREE_PAL: Pal5[] = [
  { o: '#0e2a2a', d: '#1e4a3a', m: '#34723e', l: '#6ea450', h: '#c4dc84' },
  { o: '#0e2630', d: '#1c4440', m: '#2e6a48', l: '#5c9858', h: '#b0d08c' },
  { o: '#14301e', d: '#2c5a34', m: '#4a8040', l: '#86ac52', h: '#dce49a' },
];

function drawTreeWall(p: Painter, v: number): void {
  p.rect(0, 0, TILE, TILE, '#12302a');
  const r = rng(9200 + v * 19);
  for (let i = 0; i < 3; i++) {
    let x = Math.floor(r() * 16);
    for (let y = 0; y < 16; y++) {
      p.px(x, y, '#2e2a2c').px((x + 1) % 16, y, '#5a4a40');
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
        blob(p, cx + ox, cy + oy, rad, rad * 0.85, TREE_PAL[i % 3], 90 + i * 7 + v * 3, { lobes: 6, amp: 0.3, bias: 0.05 + (i % 3) * 0.05, noise: 0.6 });
      }
    }
  }
  // flores vermelhas de corticeira e barbas-de-pau penduradas
  for (let i = 0; i < 3; i++) {
    const x = 1 + Math.floor(r() * 14);
    const y = 1 + Math.floor(r() * 14);
    p.px(x, y, i % 2 ? '#e8503a' : '#ff8a68');
  }
  for (let i = 0; i < 2; i++) {
    const x = 1 + Math.floor(r() * 14);
    const y = 2 + Math.floor(r() * 8);
    p.px(x, y, '#c8d8c0').px(x, y + 1, '#a8bca8');
  }
}

/** Franja do capão sobre o chão vizinho: sombra azul-esverdeada e folhas que invadem. */
function fringe(p: Painter, mask: number, fv: number): void {
  const shade = '#12303c';
  [0.4, 0.3, 0.2, 0.12, 0.06].forEach((a, d) => {
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
      blob(p, cx, cy, rad, rad * 0.85, TREE_PAL[(k + fv) % 3], 800 + k * 7 + si * 3 + fv, { lobes: 6, amp: 0.28, bias: 0.1, noise: 0.5 });
    }
    for (let k = 0; k < 3; k++) {
      const pos = Math.floor(hash2(k, si + 9, fv) * TILE);
      const depth = prof[pos] + 1 + Math.floor(hash2(k, si + 2, fv) * 2);
      const [x, y] = at(pos, depth);
      p.px(x, y, k === 0 ? '#e86a40' : '#4e7a3c').px(x + 1, y, '#2a3a30');
    }
  }
}

// ------------------------------------------------------------------ grupos com borda orgânica

const mk = (seed: number, amp: number, lo = 0) => Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(seed + v * 41, 3, amp, lo, 7));
const TRACK_PROFS = mk(2400, 3.0);
const BUTIA_PROFS = mk(2500, 3.6);
const JUNC_PROFS = mk(2300, 3.6);
const MUD_PROFS = mk(2600, 3.0);
const POND_PROFS = Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(2800 + v * 61, 4, 3.4));

function trackColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 260 + v);
  if (h < 0.1) return '#c8b080';
  if (h < 0.2) return '#e0cca0';
  if (h < 0.215) return '#f6ecd0';
  if (h < 0.235) return '#9a8460';
  if ((y + v * 5) % 7 === 2 && hash2(x, y, 9) < 0.55) return '#bca678';
  return '#d0ba8a';
}

function drawTrack(p: Painter, mask: number, v: number): void {
  drawGrass(p, (v + 2) % GRASS_VARIANTS);
  paintGroup(
    p,
    outGrid(mask, TRACK_PROFS[v % EDGE_VARIANTS], 8),
    (x, y) => trackColor(x, y, v),
    (x, y) => (hash2(x, y, 5) < 0.4 ? '#dcc898' : '#b89e70'),
    (x, y) => (hash2(x, y, 4) < 0.3 ? '#4a6a3a' : null),
    81 + v,
  );
  // capim que nasce no meio da trilha
  if (mask === FULL && v === 1) blade(p, 8, 10, 3, 0.5);
}

function buttiaColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 240 + v);
  if (h < 0.12) return '#2a5a3a';
  if (h < 0.22) return '#4e8a4e';
  if (h < 0.24) return '#d8a040';
  if (h < 0.27) return '#a8c070';
  return '#3a7442';
}

/** Chão do butiazal: musgo verde-escuro, folhas arqueadas de butiá caídas e frutos alaranjados. */
function drawButia(p: Painter, mask: number, v: number): void {
  drawGrass(p, (v + 5) % GRASS_VARIANTS);
  const g = outGrid(mask, BUTIA_PROFS[v % EDGE_VARIANTS], 8);
  paintGroup(
    p,
    g,
    (x, y) => buttiaColor(x, y, v),
    (x, y) => (hash2(x, y, 5) < 0.35 ? '#5e9a54' : '#2e6040'),
    (x, y) => (hash2(x, y, 4) < 0.4 ? '#1e4430' : null),
    91 + v,
  );
  const r = rng(9400 + v * 13 + mask);
  const free = (x: number, y: number) => x >= 0 && y >= 0 && x < TILE && y < TILE && !g[y * TILE + x];
  // folha de butiá caída (arco com folíolos) e frutos
  for (let i = 0; i < 2; i++) {
    const x = 2 + Math.floor(r() * 9);
    const y = 4 + Math.floor(r() * 9);
    if (!free(x, y) || !free(x + 5, y - 1)) continue;
    for (let k = 0; k < 6; k++) p.px(x + k, y - (k > 3 ? 1 : 0), k < 3 ? '#8cb84e' : '#6a9c40').px(x + k, y + 1 - (k > 3 ? 1 : 0), '#2e6038');
    p.px(x + 2, y - 1, '#a8d468').px(x + 4, y + 2, '#2e6038');
  }
  for (let i = 0; i < 2; i++) {
    const x = 2 + Math.floor(r() * 12);
    const y = 2 + Math.floor(r() * 12);
    if (!free(x, y) || !free(x + 1, y + 1)) continue;
    p.px(x, y, '#f0a830').px(x + 1, y, '#d88020').px(x, y + 1, '#b0601a').px(x, y, '#ffe090');
  }
}

function juncColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 220 + v);
  if ((x * 5 + v) % 4 === 0 && hash2(x, y >> 1, 9 + v) < 0.5) return h < 0.5 ? '#7cb058' : '#5e9a4c';
  if (h < 0.12) return '#2c5e44';
  if (h < 0.2) return '#4c8c58';
  if (h < 0.225) return '#b4d890';
  if (h < 0.26) return '#355c50';
  return '#3a7450';
}

/** Juncal: chão encharcado, verde-azulado, com hastes finas de junco e lampejos de água. */
function drawJunc(p: Painter, mask: number, v: number): void {
  drawGrass(p, (v + 1) % GRASS_VARIANTS);
  const g = outGrid(mask, JUNC_PROFS[v % EDGE_VARIANTS], 8);
  paintGroup(
    p,
    g,
    (x, y) => juncColor(x, y, v),
    (x, y) => (hash2(x, y, 5) < 0.35 ? '#5a9a58' : '#2c6048'),
    (x, y) => (hash2(x, y, 4) < 0.4 ? '#244a3c' : null),
    101 + v,
  );
  const r = rng(9600 + v * 11 + mask);
  const free = (x: number, y: number) => x >= 0 && y >= 0 && x < TILE && y < TILE && !g[y * TILE + x];
  for (let i = 0; i < 5; i++) {
    const x = 2 + Math.floor(r() * 12);
    const y = 4 + Math.floor(r() * 10);
    const h = 4 + Math.floor(r() * 4);
    if (!free(x, y) || !free(x, y - h)) continue;
    for (let k = 0; k <= h; k++) p.px(x + (k > h - 2 ? 1 : 0), y - k, k < 2 ? '#2c5e44' : k < h ? '#74aa58' : '#c8dc98');
    if (i === 0) p.px(x + 1, y - h - 1, '#8a6a44').px(x + 1, y - h, '#a88858'); // espiga marrom
  }
  if (v === 1 && free(6, 12) && free(8, 12)) p.px(6, 12, '#5aa0b8').px(7, 12, '#a0d4e0').px(8, 12, '#5aa0b8');
}

function mudColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 250 + v);
  if (h < 0.1) return '#5e5648';
  if (h < 0.18) return '#9a8e74';
  if (h < 0.2) return '#c4baa0';
  return '#7c7258';
}

/** Margem lamacenta: barro cinza-pardo, areia fina e pegadas de aves. */
function drawMud(p: Painter, mask: number, v: number): void {
  drawGrass(p, (v + 4) % GRASS_VARIANTS);
  const g = outGrid(mask, MUD_PROFS[v % EDGE_VARIANTS], 8);
  paintGroup(
    p,
    g,
    (x, y) => {
      const h = hash2(x, y, 270 + v);
      if (h < 0.12) return '#b8ac90';
      if (h < 0.2) return '#e0d6b8';
      if (h < 0.24) return '#6e644e';
      return '#cabf9e';
    },
    (x, y) => (hash2(x, y, 5) < 0.4 ? '#9a8e72' : '#b4a888'),
    (x, y) => (hash2(x, y, 4) < 0.5 ? '#5a5240' : '#6e6450'),
    111 + v,
  );
  const r = rng(9800 + v * 7 + mask);
  const free = (x: number, y: number) => x >= 0 && y >= 0 && x < TILE && y < TILE && !g[y * TILE + x];
  for (let i = 0; i < 3; i++) {
    const x = 2 + Math.floor(r() * 11);
    const y = 2 + Math.floor(r() * 11);
    if (!free(x, y) || !free(x + 2, y + 2)) continue;
    // pegada de ave (três dedos)
    p.px(x, y, '#6e644e').px(x + 1, y + 1, '#6e644e').px(x + 2, y, '#6e644e').px(x + 1, y + 2, '#6e644e');
  }
}

// ------------------------------------------------------------------ água da lagoa (3 quadros)

const WATER_FRAMES = 3;
const SHIFTS = [0, 5, 11];

function pondGrid(v: number, f: number): string[] {
  const g: string[] = new Array(TILE * TILE).fill('#3e7e98');
  const r = rng(9900 + v * 41);
  const at = (x: number, y: number, c: string) => {
    g[(((y % TILE) + TILE) % TILE) * TILE + (((x % TILE) + TILE) % TILE)] = c;
  };
  for (let i = 0; i < 4; i++) {
    const sx = Math.floor(r() * 16);
    const sy = Math.floor(r() * 16);
    const len = 4 + Math.floor(r() * 4);
    for (let k = 0; k < len; k++) at(sx + k + Math.floor(SHIFTS[f] * 0.4), sy, '#2c6684');
    for (let k = 1; k < len - 1; k++) at(sx + k + Math.floor(SHIFTS[f] * 0.4), sy + 1, '#34728e');
  }
  for (let i = 0; i < 6; i++) {
    const sx = Math.floor(r() * 16);
    const sy = Math.floor(r() * 16);
    const len = 3 + Math.floor(r() * 3);
    const dir = i % 2 === 0 ? 1 : -1;
    for (let k = 0; k < len; k++) at(sx + k + dir * SHIFTS[f], sy, k === len - 1 ? '#e4f4fc' : '#8cc4d8');
  }
  for (let i = 0; i < 4; i++) {
    if (hash2(i, f, v + 17) < 0.75) at(Math.floor(hash2(i, f, v) * 16), Math.floor(hash2(i, f, v + 3) * 16), i === 0 ? '#ffffff' : '#f4f8ff');
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
        if (dOut === 1) p.px(x, y, (x + y + f * 2) % 4 < 2 ? '#f4fbff' : '#bcdcea');
        else if (dOut === 2) p.px(x, y, hash2(x, y, f + 3) < 0.4 ? '#6aa8c0' : base[y * TILE + x]);
        else p.px(x, y, base[y * TILE + x]);
      } else {
        const d = distTo(g, x, y, false, 4);
        const h = hash2(x, y, 11);
        if (d === 1) p.px(x, y, h < 0.4 ? '#2c3438' : '#3a4044');
        else if (d === 2) p.px(x, y, h < 0.3 ? '#585040' : '#4a4436');
        else p.px(x, y, mudColor(x, y, v));
      }
    }
  }
}

// ------------------------------------------------------------------ registro dos quadros

for (let v = 0; v < GRASS_VARIANTS; v++) R.frame(`grass:${v}`, (p) => drawGrass(p, v));
for (let v = 0; v < 6; v++) R.frame(`campo:${v}`, (p) => drawCampo(p, v));
for (let v = 0; v < 4; v++) R.frame(`macega:${v}`, (p) => drawMacega(p, v));
for (let v = 0; v < 4; v++) R.frame(`alt:${v}`, (p) => drawAltitude(p, v));
for (let v = 0; v < 3; v++) R.frame(`tree:${v}`, (p) => drawTreeWall(p, v));
const GROUPS: [string, (p: Painter, m: number, v: number) => void][] = [
  ['track', drawTrack],
  ['butia', drawButia],
  ['junc', drawJunc],
  ['mud', drawMud],
];
for (const [name, draw] of GROUPS) {
  R.frame(`${name}:${FULL}:0`, (p) => draw(p, FULL, 0));
  for (const m of ALL_MASKS) for (let v = 0; v < 3; v++) R.frame(`${name}:${m}:${v}`, (p) => draw(p, m, v));
}
for (const m of ALL_MASKS) for (let v = 0; v < 3; v++) for (let f = 0; f < WATER_FRAMES; f++) R.frame(`pond:${m}:${v}:${f}`, (p) => drawPond(p, m, v, f));
for (let m = 1; m < 16; m++) for (let v = 0; v < 3; v++) R.frame(`fringe:${m}:${v}`, (p) => fringe(p, m, v));

// ------------------------------------------------------------------ escolha de quadros

const IN: Record<string, (c: Cell) => boolean> = {
  // o juncal continua sob a margem e a água (sem borda contra elas)
  junc: (c) => c === 'j' || c === '~' || c === '_',
  track: (c) => c === ',',
  butia: (c) => c === 'b',
  mud: (c) => c === '_' || c === '~',
  pond: (c) => c === '~',
};
const GROUP_OF: Record<string, string> = { ',': 'track', j: 'junc', _: 'mud', b: 'butia' };

function frames(map: string[], x: number, y: number): number[] {
  const ch = map[y][x];
  const h = hash2(x, y, 1);
  const v3 = Math.floor(h * 3);
  switch (ch) {
    case '#':
      return [R.idx(`tree:${Math.floor(hash2(x, y, 2) * 3)}`)];
    case '"':
      return [R.idx(`macega:${Math.floor(h * 4)}`)];
    case 'c':
      return [R.idx(`alt:${Math.floor(h * 4)}`)];
    case '.':
      return [R.idx(`campo:${pick([0.2, 0.2, 0.15, 0.15, 0.15, 0.15], h)}`)];
    case '~': {
      const m = maskOf(map, x, y, IN.pond);
      return Array.from({ length: WATER_FRAMES }, (_, f) => R.idx(`pond:${m}:${v3}:${f}`));
    }
    default: {
      const group = GROUP_OF[ch];
      if (!group) return [R.idx(`grass:${pick(GRASS_WEIGHTS, h)}`)];
      return [R.idx(`${group}:${maskOf(map, x, y, IN[group])}:${v3}`)];
    }
  }
}

/** Franja do capão fechado sobre o chão andável vizinho. */
function overlays(map: string[], x: number, y: number): number[] {
  const ch = map[y][x];
  if (ch === '#' || ch === '~') return [];
  const at = (xx: number, yy: number): Cell => map[yy]?.[xx];
  const m = (at(x, y - 1) === '#' ? N : 0) | (at(x + 1, y) === '#' ? E : 0) | (at(x, y + 1) === '#' ? S : 0) | (at(x - 1, y) === '#' ? W : 0);
  return m ? [R.idx(`fringe:${m}:${Math.floor(hash2(x, y, 3) * 3)}`)] : [];
}

export const TILESET: Tileset = {
  key: 'pampa_tiles',
  ground: PAMPA_GROUND,
  solid: new Set(['#', '~']),
  water: new Set(['~']),
  brush: new Set(['"', 'j', 'b']),
  frames,
  overlays,
  frameNames: R.names,
  paint: (scene: Phaser.Scene) => R.build(scene, 'pampa_tiles'),
};
