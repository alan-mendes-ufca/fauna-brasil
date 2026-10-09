import type Phaser from 'phaser';
import { TILE, rng, type Painter } from '../../art/canvas';
import { blob, hash2, rgba, type Pal5 } from '../../art/draw';
import type { Tileset } from '../../art/forest';
import { ALL_MASKS, E, EDGE_VARIANTS, FULL, N, S, TileRegistry, W, WATER_FRAMES, distTo, makeProf, maskOf, outGrid, paintGroup, pick, profile, type Cell, type Prof } from '../../art/forestTiles';

// Chão do Pantanal: campo úmido e esverdeado, água rasa sobre o capim, baías de água clara e mata de cordilheira.
// Sol forte, mas o ar é úmido: verdes vivos, água azul-esverdeada, sombras teal e terra de barro claro.

/**
 * Legenda do mapa do Pantanal (uma letra por tile de 16×16):
 *   #  mata fechada das cordilheiras e capões (sólido; contorna o mapa)
 *   .  chão da mata: folhas, musgo e raízes sob as árvores da cordilheira (andável)
 *   :  campo de capim, o chão comum do pantanal (andável)
 *   "  capim alto e brejo (andável; esconderijo dos bichos pequenos)
 *   s  campo seco de terra firme, capim dourado do cerrado (andável)
 *   ,  aterro e estrada de terra de barro claro (andável)
 *   _  margem de lama úmida das baías (andável)
 *   w  água rasa: lâmina d'água sobre o capim, aguapés (andável; nunca encosta em ~ nem em _)
 *   ~  baía e rio: água aberta e funda (sólido; onde nadam os peixes)
 *   =  ponte de tábuas sobre o rio (andável)
 */
export const PANTANAL_GROUND = ['#', '.', ':', '"', 's', ',', '_', 'w', '~', '='] as const;

const R = new TileRegistry();

// ------------------------------------------------------------------ campo (chão base)

const GRASS = {
  base: ['#6c9c3c', '#669638', '#74a244', '#609034', '#7aa646', '#6a9a3e'],
  dk: '#4a7a2c',
  dk2: '#3a6a2c',
  lt: '#94c250',
  hi: '#cce274',
  gold: '#dcd062',
  stalk: '#a8a850',
};
const GRASS_VARIANTS = 6;
const GRASS_WEIGHTS = [0.3, 0.2, 0.16, 0.12, 0.12, 0.1];

function drawGrass(p: Painter, v: number): void {
  const r = rng(11000 + v * 37);
  p.rect(0, 0, TILE, TILE, GRASS.base[v % GRASS_VARIANTS]);
  for (let i = 0; i < 9; i++) p.rect(Math.floor(r() * 16), Math.floor(r() * 16), 2 + Math.floor(r() * 3), 1, r() < 0.55 ? GRASS.dk : GRASS.lt);
  p.speckle(0, 0, TILE, TILE, [GRASS.dk, GRASS.dk2, GRASS.lt], 0.1, r);
  // lâminas curtas de capim, com sombra embaixo
  for (let i = 0; i < 9; i++) {
    const x = 1 + Math.floor(r() * 14);
    const y = 2 + Math.floor(r() * 12);
    p.px(x, y + 1, GRASS.dk2).px(x, y, GRASS.lt).px(x + (r() < 0.5 ? 1 : -1), y - 1, r() < 0.3 ? GRASS.hi : GRASS.lt);
  }
  switch (v) {
    case 1:
      // florzinhas brancas de campo
      for (const [x, y] of [[3, 4], [10, 9], [6, 12]] as const) p.px(x, y, '#fffaf0').px(x + 1, y, '#fff0a0').px(x, y + 1, '#d8e8c8');
      break;
    case 2:
      // botões amarelos
      for (const [x, y] of [[11, 3], [4, 10]] as const) p.px(x, y, '#ffd23a').px(x + 1, y, '#ffe890').px(x, y - 1, '#ffe890').px(x, y + 1, '#d89a20');
      break;
    case 3:
      // talos secos e uma pedrinha
      p.vline(5, 4, 5, GRASS.stalk).vline(6, 5, 4, '#ccc474').vline(11, 7, 4, GRASS.stalk).px(5, 3, '#f0ecb0').px(11, 6, '#f0ecb0');
      p.px(9, 12, '#c0c4b0').px(10, 12, '#e8ecd8').px(9, 13, '#7a8470').px(10, 13, '#7a8470');
      break;
    case 4:
      // florzinha lilás (lírio do brejo)
      p.px(8, 6, '#b27ad8').px(7, 7, '#d8a8f0').px(9, 7, '#d8a8f0').px(8, 7, '#fff0a0').px(8, 8, '#8a52b8').vline(8, 9, 3, GRASS.dk2);
      break;
    case 5:
      // poça de lama rala com reflexo do céu
      p.rect(4, 9, 6, 2, '#4a8a7a').rect(5, 8, 4, 1, '#4a8a7a').rect(5, 11, 4, 1, '#3a7a6c').px(5, 9, '#b8ecdc').px(6, 9, '#d8f8ec').px(8, 10, '#8cd0c0');
      break;
  }
}

// ------------------------------------------------------------------ capim alto (andável, esconderijo)

function drawTall(p: Painter, v: number): void {
  drawGrass(p, (v + 2) % GRASS_VARIANTS);
  const r = rng(12000 + v * 53);
  const tufts = [
    { x: 3, y: 5 },
    { x: 11, y: 4 },
    { x: 7, y: 10 },
    { x: 14, y: 12 },
    { x: 0, y: 13 },
  ];
  for (const t of tufts) {
    const nb = 4 + Math.floor(r() * 3);
    const gold = r() < 0.3;
    const blades: { x: number; lean: number; h: number }[] = [];
    for (let i = 0; i < nb; i++) blades.push({ x: t.x + i - Math.floor(nb / 2) + Math.round((r() - 0.5) * 2), lean: (i - (nb - 1) / 2) * 0.9 + (r() - 0.5), h: 4 + Math.floor(r() * 4) });
    for (const pass of [0, 1]) {
      for (const b of blades) {
        for (let k = 0; k <= b.h; k++) {
          const tt = k / b.h;
          const x = Math.round(b.x + b.lean * tt * 1.5);
          const y = t.y + 3 - k;
          if (pass === 0) {
            p.px(x - 1, y, '#2a5a2a');
            if (k === b.h) p.px(x, y - 1, '#2a5a2a');
          } else if (gold) {
            p.px(x, y, tt < 0.3 ? '#7a8a34' : tt < 0.7 ? '#b8bc50' : tt < 1 ? '#e0dc78' : '#fff6c0');
          } else {
            p.px(x, y, tt < 0.3 ? '#2e6a30' : tt < 0.7 ? '#4a9a3a' : tt < 1 ? '#86cc4a' : '#d0f08a');
          }
        }
      }
    }
  }
  if (v === 1) p.px(8, 6, '#ff9ac0').px(7, 6, '#ffc8e0').px(9, 6, '#ffc8e0').px(8, 5, '#ffc8e0').px(8, 7, '#d85a8a');
  if (v === 3) p.px(4, 9, '#b27ad8').px(5, 9, '#d8a8f0').px(4, 8, '#d8a8f0');
}

// ------------------------------------------------------------------ mata fechada (sólida)

const MATA_PAL: Pal5[] = [
  { o: '#06241e', d: '#0e4a34', m: '#1f7a3c', l: '#5cb04a', h: '#c8e868' },
  { o: '#08282a', d: '#124638', m: '#2a8446', l: '#72bc4c', h: '#ecf08a' },
];

function drawMata(p: Painter, v: number): void {
  p.rect(0, 0, TILE, TILE, '#0a2e22');
  const r = rng(13000 + v * 23);
  for (let i = 0; i < 6; i++) {
    const cx = r() * 16;
    const cy = r() * 16;
    const rad = 3.2 + r() * 1.6;
    for (const ox of [-16, 0, 16]) {
      for (const oy of [-16, 0, 16]) {
        if (cx + ox < -7 || cx + ox > 23 || cy + oy < -7 || cy + oy > 23) continue;
        blob(p, cx + ox, cy + oy, rad, rad * 0.86, MATA_PAL[i % 2], 900 + i * 11 + v * 5, { lobes: 6, amp: 0.26, bias: 0.1 + (i % 3) * 0.08, noise: 0.55 });
      }
    }
  }
  // flores amarelas e rosas de ipê entre a folhagem
  for (let i = 0; i < 3; i++) {
    const x = 1 + Math.floor(r() * 14);
    const y = 1 + Math.floor(r() * 14);
    const c = v === 1 ? ['#ff9ac0', '#ffd0e4'] : ['#ffd23a', '#fff0a0'];
    if (r() < 0.55) p.px(x, y, c[0]).px(x + 1, y, c[1]);
  }
}

/** Franja da mata que invade o chão vizinho, com sombra teal. */
function fringe(p: Painter, mask: number, fv: number): void {
  const pals = MATA_PAL;
  [0.42, 0.32, 0.22, 0.14, 0.08].forEach((a, d) => {
    const c = rgba('#08322c', a);
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
        p.px(x, y, hash2(x, y, 3) < 0.5 ? pals[0].d : pals[1].m);
      }
    }
    for (let k = 0; k < 6; k++) {
      const pos = Math.round(k * 3.2 + hash2(k, si, fv) * 2 - 0.5);
      const rad = 2.3 + hash2(k, si + 5, fv) * 1.5;
      const depth = Math.max(0.5, prof[Math.min(TILE - 1, Math.max(0, pos))] - rad * 0.85);
      const [cx, cy] = at(pos, depth);
      blob(p, cx, cy, rad, rad * 0.85, pals[(k + fv) % 2], 800 + k * 7 + si * 3 + fv, { lobes: 6, amp: 0.28, bias: 0.1, noise: 0.5 });
    }
    for (let k = 0; k < 3; k++) {
      const pos = Math.floor(hash2(k, si + 9, fv) * TILE);
      const depth = prof[pos] + 1 + Math.floor(hash2(k, si + 2, fv) * 2);
      const [x, y] = at(pos, depth);
      p.px(x, y, k === 0 ? '#c8e060' : '#2e7a38').px(x + 1, y, '#124a34');
    }
  }
}

// ------------------------------------------------------------------ grupos com borda orgânica (sobre o campo)

interface GroupDef {
  profs: Prof[];
  inside: (x: number, y: number, v: number) => string;
  edgeIn: (x: number, y: number) => string;
  rim: (x: number, y: number) => string | null;
  seed: number;
  extra?: (p: Painter, g: boolean[], v: number, mask: number) => void;
}

const prof3 = (seed: number, base: number, amp: number, lo = 0, hi = 7) => Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(seed + v * 43, base, amp, lo, hi));

function drawGroup(p: Painter, def: GroupDef, mask: number, v: number): void {
  drawGrass(p, (v * 2 + 1) % GRASS_VARIANTS);
  const g = outGrid(mask, def.profs[v % EDGE_VARIANTS], 8);
  paintGroup(p, g, (x, y) => def.inside(x, y, v), def.edgeIn, def.rim, def.seed + v);
  def.extra?.(p, g, v, mask);
}

const free = (g: boolean[], x: number, y: number) => x >= 0 && y >= 0 && x < TILE && y < TILE && !g[y * TILE + x];

/** Pontinhos soltos (folhas, seixos...) só dentro do grupo. */
function scatter(p: Painter, g: boolean[], seed: number, n: number, cols: string[], size = 2): void {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = 1 + Math.floor(r() * 13);
    const y = 1 + Math.floor(r() * 13);
    if (!free(g, x, y) || !free(g, x + size - 1, y) || !free(g, x, y + 1)) continue;
    const c = cols[i % cols.length];
    for (let k = 0; k < size; k++) p.px(x + k, y, c);
    p.px(x, y + 1, cols[(i + 1) % cols.length]);
  }
}

const FLOOR_DEF: GroupDef = {
  profs: prof3(3100, 3, 3.2),
  inside: (x, y, v) => {
    const h = hash2(x, y, 300 + v);
    if (h < 0.1) return '#2a4a26';
    if (h < 0.2) return '#4a6a30';
    if (h < 0.235) return '#6e8c3a';
    if (h < 0.25) return '#c8863a';
    if ((x * 3 + y * 5 + v * 7) % 13 < 2 && h < 0.7) return '#335430';
    return '#3c5c2c';
  },
  edgeIn: (x, y) => (hash2(x, y, 5) < 0.4 ? '#5a7a34' : '#2e4c28'),
  rim: (x, y) => (hash2(x, y, 4) < 0.4 ? '#1a3422' : null),
  seed: 31,
  extra: (p, g, v) => {
    scatter(p, g, 3300 + v, 6, ['#c8742c', '#a8501c', '#e8a03c', '#7a3a1c'], 2);
    scatter(p, g, 3400 + v, 3, ['#7cc04a', '#a4dc58'], 1);
    if (v === 1 && free(g, 5, 10) && free(g, 11, 10)) p.hline(5, 10, 7, '#5a3e24').hline(6, 9, 5, '#8a6236').px(11, 10, '#a87c46');
  },
};

const DRY_DEF: GroupDef = {
  profs: prof3(3200, 3, 3.4),
  inside: (x, y, v) => {
    const h = hash2(x, y, 320 + v);
    if ((x * 5 + v) % 4 === 0 && hash2(x, y >> 1, 9 + v) < 0.5) return h < 0.5 ? '#f0e090' : '#dcc868';
    if (h < 0.12) return '#a89440';
    if (h < 0.2) return '#e8d478';
    if (h < 0.225) return '#fff2b0';
    if (h < 0.25) return '#9a7e38';
    return '#c8b055';
  },
  edgeIn: (x, y) => (hash2(x, y, 5) < 0.35 ? '#b09c48' : '#98903c'),
  rim: (x, y) => (hash2(x, y, 4) < 0.35 ? '#7e7030' : null),
  seed: 41,
  extra: (p, g, v) => {
    scatter(p, g, 3500 + v, 3, ['#8a5a30', '#c49a5c'], 1);
    if (v === 2 && free(g, 8, 6) && free(g, 7, 6)) p.px(8, 6, '#ffd23a').px(7, 6, '#ffe890').px(9, 6, '#ffe890').px(8, 5, '#ffe890').px(8, 7, '#d89a20');
  },
};

const ROAD_DEF: GroupDef = {
  profs: prof3(3300, 3, 3.0),
  inside: (x, y, v) => {
    const h = hash2(x, y, 340 + v);
    if (h < 0.1) return '#e0c08c';
    if (h < 0.2) return '#f6e2b2';
    if (h < 0.215) return '#fff6dc';
    if (h < 0.235) return '#b8905e';
    // marcas de rodas e pegadas de gado
    if ((y + v * 5) % 7 === 2 && hash2(x, y, 9) < 0.55) return '#d4b27c';
    return '#ead0a0';
  },
  edgeIn: (x, y) => (hash2(x, y, 5) < 0.4 ? '#d6b684' : '#bc9a68'),
  rim: (x, y) => (hash2(x, y, 4) < 0.3 ? '#8c6a42' : null),
  seed: 51,
  extra: (p, g, v) => scatter(p, g, 3600 + v, 3, ['#c4a070', '#fff0cc', '#a47e52'], 1),
};

const mudColor = (x: number, y: number, v: number) => {
  const h = hash2(x, y, 360 + v);
  if (h < 0.1) return '#4e3e2c';
  if (h < 0.18) return '#8a7452';
  if (h < 0.2) return '#bca47a';
  if ((x + y * 2 + v * 3) % 10 < 2 && h < 0.7) return '#5a4834'; // marcas de enchente
  return '#6a5640';
};

const MUD_DEF: GroupDef = {
  profs: prof3(3400, 3, 3.2),
  inside: (x, y, v) => mudColor(x, y, v),
  edgeIn: (x, y) => (hash2(x, y, 5) < 0.4 ? '#57472f' : '#6e5a42'),
  rim: (x, y) => (hash2(x, y, 4) < 0.4 ? '#34281c' : null),
  seed: 61,
  extra: (p, g, v) => {
    // brilho úmido e pegadas de ave
    scatter(p, g, 3700 + v, 4, ['#9ec4b4', '#c4e0d0'], 2);
    if (v !== 1 && free(g, 6, 7) && free(g, 7, 8) && free(g, 5, 8)) p.px(6, 7, '#34281c').px(5, 8, '#34281c').px(7, 8, '#34281c').px(6, 8, '#34281c');
  },
};

// ------------------------------------------------------------------ água rasa (lâmina d'água sobre o capim; 3 quadros)

const SHIFTS = [0, 5, 11];
const SHALLOW_PROFS = prof3(3800, 3, 3.0);

function shallowGrid(v: number, f: number): string[] {
  const g: string[] = new Array(TILE * TILE).fill('#56ac9c');
  const r = rng(14000 + v * 41);
  const at = (x: number, y: number, c: string) => {
    g[(((y % TILE) + TILE) % TILE) * TILE + (((x % TILE) + TILE) % TILE)] = c;
  };
  // sombras do capim submerso
  for (let i = 0; i < 6; i++) {
    const sx = Math.floor(r() * 16);
    const sy = Math.floor(r() * 16);
    const len = 3 + Math.floor(r() * 3);
    for (let k = 0; k < len; k++) at(sx + k, sy, '#3e8c80');
  }
  // lâminas de capim que furam a água (fixas) com a base escura
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(r() * 16);
    const y = Math.floor(r() * 16);
    at(x, y, '#2e6e50');
    at(x, y - 1, r() < 0.5 ? '#78b83c' : '#a4d44c');
    if (r() < 0.5) at(x + 1, y - 2, '#c8e870');
  }
  // reflexos do céu que correm devagar
  for (let i = 0; i < 6; i++) {
    const sx = Math.floor(r() * 16);
    const sy = Math.floor(r() * 16);
    const len = 3 + Math.floor(r() * 3);
    const dir = i % 2 === 0 ? 1 : -1;
    for (let k = 0; k < len; k++) at(sx + k + dir * SHIFTS[f], sy, k === len - 1 ? '#e8fff0' : '#9ae0cc');
  }
  for (let i = 0; i < 3; i++) if (hash2(i, f, v + 21) < 0.65) at(Math.floor(hash2(i, f, v) * 16), Math.floor(hash2(i, f, v + 3) * 16), i === 0 ? '#ffffff' : '#fff0b0');
  return g;
}
const SHALLOW_GRIDS = new Map<string, string[]>();
const shallowBase = (v: number, f: number) => {
  const k = `${v}:${f}`;
  let g = SHALLOW_GRIDS.get(k);
  if (!g) SHALLOW_GRIDS.set(k, (g = shallowGrid(v, f)));
  return g;
};

function drawShallow(p: Painter, mask: number, v: number, f: number): void {
  drawGrass(p, (v * 2 + 1) % GRASS_VARIANTS);
  const base = shallowBase(v, f);
  const g = outGrid(mask, SHALLOW_PROFS[v % EDGE_VARIANTS], 9);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const h = hash2(x, y, 17);
      if (g[y * TILE + x]) {
        // capim molhado em volta da lâmina d'água
        const d = distTo(g, x, y, false, 2);
        if (d === 1 && h < 0.6) p.px(x, y, h < 0.3 ? '#3e7a3a' : '#4c8a46');
        continue;
      }
      const dOut = distTo(g, x, y, true, 2);
      if (dOut === 1) p.px(x, y, (x + y + f * 2) % 4 < 2 ? '#e0fff0' : '#9ae0cc');
      else if (dOut === 2) p.px(x, y, h < 0.4 ? '#7accb4' : base[y * TILE + x]);
      else p.px(x, y, base[y * TILE + x]);
    }
  }
}

// ------------------------------------------------------------------ água da baía e do rio (3 quadros)

const DEEP_PROFS = prof3(4000, 4, 3.4);

function deepGrid(v: number, f: number): string[] {
  const g: string[] = new Array(TILE * TILE).fill('#188090');
  const r = rng(15000 + v * 41);
  const at = (x: number, y: number, c: string) => {
    g[(((y % TILE) + TILE) % TILE) * TILE + (((x % TILE) + TILE) % TILE)] = c;
  };
  // manchas fundas (reflexo escuro da mata), deslocam devagar
  for (let i = 0; i < 4; i++) {
    const sx = Math.floor(r() * 16);
    const sy = Math.floor(r() * 16);
    const len = 4 + Math.floor(r() * 4);
    for (let k = 0; k < len; k++) at(sx + k + Math.floor(SHIFTS[f] * 0.5), sy, '#0e6678');
    for (let k = 1; k < len - 1; k++) at(sx + k + Math.floor(SHIFTS[f] * 0.5), sy + 1, '#127488');
  }
  // fios de brilho verde-água
  for (let i = 0; i < 6; i++) {
    const sx = Math.floor(r() * 16);
    const sy = Math.floor(r() * 16);
    const len = 3 + Math.floor(r() * 3);
    const dir = i % 2 === 0 ? 1 : -1;
    for (let k = 0; k < len; k++) at(sx + k + dir * SHIFTS[f], sy, k === len - 1 ? '#bef8e0' : '#52c8b8');
    if (r() < 0.6) at(sx + 1 + dir * SHIFTS[f], sy + 1, '#0e6678');
  }
  // reflexos dourados do sol
  for (let i = 0; i < 3; i++) if (hash2(i, f, v + 17) < 0.7) at(Math.floor(hash2(i, f, v) * 16), Math.floor(hash2(i, f, v + 3) * 16), i === 0 ? '#fff8c8' : '#ffe48a');
  return g;
}
const DEEP_GRIDS = new Map<string, string[]>();
const deepBase = (v: number, f: number) => {
  const k = `${v}:${f}`;
  let g = DEEP_GRIDS.get(k);
  if (!g) DEEP_GRIDS.set(k, (g = deepGrid(v, f)));
  return g;
};

function drawDeep(p: Painter, mask: number, v: number, f: number): void {
  const base = deepBase(v, f);
  const g = outGrid(mask, DEEP_PROFS[v % EDGE_VARIANTS], 9);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (!g[y * TILE + x]) {
        const dOut = distTo(g, x, y, true, 2);
        if (dOut === 1) p.px(x, y, (x + y + f * 2) % 4 < 2 ? '#f0fff8' : '#a4ecdc');
        else if (dOut === 2) p.px(x, y, hash2(x, y, f + 3) < 0.4 ? '#46c4bc' : base[y * TILE + x]);
        else p.px(x, y, base[y * TILE + x]);
      } else {
        // margem: lama escura, com capim verde nas pontas
        const d = distTo(g, x, y, false, 4);
        const h = hash2(x, y, 11);
        if (d === 1) p.px(x, y, h < 0.4 ? '#1a2a22' : '#2a3424');
        else if (d === 2) p.px(x, y, h < 0.3 ? '#4e3e2c' : '#3e3424');
        else if (d === 3 && h < 0.25) p.px(x, y, '#3a7a3a');
        else p.px(x, y, mudColor(x, y, v));
      }
    }
  }
}

// ------------------------------------------------------------------ ponte de tábuas

function drawBridge(p: Painter, vertical: boolean, railA: boolean, railB: boolean): void {
  // u corre ao longo da travessia; w corre atravessado nela
  const put = (u: number, w: number, c: string) => (vertical ? p.px(w, u, c) : p.px(u, w, c));
  const r = rng(vertical ? 191 : 177);
  const joints: number[] = [];
  for (let i = 0; i < 4; i++) joints.push(Math.floor(r() * 16));
  for (let w = 0; w < TILE; w++) {
    const band = Math.floor(w / 4);
    const baseC = band % 2 === 0 ? '#c4a06a' : '#b48e58';
    for (let u = 0; u < TILE; u++) {
      let c = baseC;
      if (w % 4 === 0) c = '#e6c88a';
      else if (w % 4 === 3) c = '#5e4a30';
      else if (hash2(u, w, 31) < 0.12) c = '#9a7a46';
      if (w % 4 !== 3 && u === joints[band]) c = '#5e4a30';
      put(u, w, c);
    }
  }
  const rail = (top: boolean) => {
    const ws = top ? [0, 1, 2] : [13, 14, 15];
    const cols = top ? ['#2e2418', '#dcc48c', '#8a6a3c'] : ['#5e4a30', '#d0b078', '#2e2418'];
    ws.forEach((w, i) => {
      for (let u = 0; u < TILE; u++) put(u, w, cols[i]);
    });
    for (const u of [2, 10]) {
      for (const w of top ? [0, 1, 2, 3] : [12, 13, 14, 15]) {
        put(u, w, '#2e2418');
        put(u + 1, w, w === (top ? 1 : 13) ? '#f0dca4' : '#a8844c');
        put(u + 2, w, '#2e2418');
      }
    }
  };
  if (railA) rail(true);
  if (railB) rail(false);
}

// ------------------------------------------------------------------ registro dos quadros

for (let v = 0; v < GRASS_VARIANTS; v++) R.frame(`grass:${v}`, (p) => drawGrass(p, v));
for (let v = 0; v < 3; v++) R.frame(`mata:${v}`, (p) => drawMata(p, v));
for (let v = 0; v < 4; v++) R.frame(`tall:${v}`, (p) => drawTall(p, v));
const GROUPS: [string, GroupDef][] = [
  ['floor', FLOOR_DEF],
  ['dry', DRY_DEF],
  ['road', ROAD_DEF],
  ['mud', MUD_DEF],
];
for (const [name, def] of GROUPS) {
  R.frame(`${name}:${FULL}:0`, (p) => drawGroup(p, def, FULL, 0));
  for (const m of ALL_MASKS) for (let v = 0; v < 3; v++) R.frame(`${name}:${m}:${v}`, (p) => drawGroup(p, def, m, v));
}
for (const m of ALL_MASKS) for (let v = 0; v < 3; v++) for (let f = 0; f < WATER_FRAMES; f++) R.frame(`shallow:${m}:${v}:${f}`, (p) => drawShallow(p, m, v, f));
for (const m of ALL_MASKS) for (let v = 0; v < 3; v++) for (let f = 0; f < WATER_FRAMES; f++) R.frame(`deep:${m}:${v}:${f}`, (p) => drawDeep(p, m, v, f));
for (const vertical of [false, true]) for (const a of [false, true]) for (const b of [false, true]) R.frame(`bridge:${vertical ? 'v' : 'h'}:${a ? 1 : 0}:${b ? 1 : 0}`, (p) => drawBridge(p, vertical, a, b));
for (let m = 1; m < 16; m++) for (let v = 0; v < 3; v++) R.frame(`fringe:${m}:${v}`, (p) => fringe(p, m, v));

// ------------------------------------------------------------------ escolha de quadros

const IN: Record<string, (c: Cell) => boolean> = {
  // o chão da mata continua sob a mata fechada (sem borda contra ela)
  floor: (c) => c === '.' || c === '#',
  dry: (c) => c === 's',
  road: (c) => c === ',' || c === '=',
  // a lama continua sob a água da baía
  mud: (c) => c === '_' || c === '~' || c === '=',
  shallow: (c) => c === 'w',
  deep: (c) => c === '~' || c === '=',
};
const GROUP_OF: Record<string, string> = { '.': 'floor', s: 'dry', ',': 'road', _: 'mud' };

function frames(map: string[], x: number, y: number): number[] {
  const ch = map[y][x];
  const at = (xx: number, yy: number): Cell => map[yy]?.[xx];
  const h = hash2(x, y, 1);
  const v3 = Math.floor(h * 3);
  switch (ch) {
    case '#':
      return [R.idx(`mata:${Math.floor(hash2(x, y, 2) * 3)}`)];
    case ':':
      return [R.idx(`grass:${pick(GRASS_WEIGHTS, h)}`)];
    case '"':
      return [R.idx(`tall:${Math.floor(h * 4)}`)];
    case '~': {
      const m = maskOf(map, x, y, IN.deep);
      return Array.from({ length: WATER_FRAMES }, (_, f) => R.idx(`deep:${m}:${v3}:${f}`));
    }
    case 'w': {
      const m = maskOf(map, x, y, IN.shallow);
      return Array.from({ length: WATER_FRAMES }, (_, f) => R.idx(`shallow:${m}:${v3}:${f}`));
    }
    case '=': {
      const deep = (c: Cell) => c === '~';
      const wN = deep(at(x, y - 1));
      const wS = deep(at(x, y + 1));
      const wW = deep(at(x - 1, y));
      const wE = deep(at(x + 1, y));
      const ns = wN || wS;
      const we = wW || wE;
      // a água corre perpendicular à travessia
      let vertical = false;
      if (ns && !we) vertical = false;
      else if (we && !ns) vertical = true;
      else if (at(x - 1, y) === '=' || at(x + 1, y) === '=') vertical = false;
      else if (at(x, y - 1) === '=' || at(x, y + 1) === '=') vertical = true;
      const a = vertical ? at(x - 1, y) !== '=' : at(x, y - 1) !== '=';
      const b = vertical ? at(x + 1, y) !== '=' : at(x, y + 1) !== '=';
      return [R.idx(`bridge:${vertical ? 'v' : 'h'}:${a ? 1 : 0}:${b ? 1 : 0}`)];
    }
    default: {
      const group = GROUP_OF[ch];
      if (!group) return [R.idx('grass:0')];
      return [R.idx(`${group}:${maskOf(map, x, y, IN[group])}:${v3}`)];
    }
  }
}

/** Franja da mata fechada sobre o chão andável vizinho. */
function overlays(map: string[], x: number, y: number): number[] {
  const ch = map[y][x];
  if (ch === '#' || ch === '~' || ch === 'w' || ch === '=') return [];
  const at = (xx: number, yy: number): Cell => map[yy]?.[xx];
  const m = (at(x, y - 1) === '#' ? N : 0) | (at(x + 1, y) === '#' ? E : 0) | (at(x, y + 1) === '#' ? S : 0) | (at(x - 1, y) === '#' ? W : 0);
  return m ? [R.idx(`fringe:${m}:${Math.floor(hash2(x, y, 3) * 3)}`)] : [];
}

export const TILESET: Tileset = {
  key: 'pantanal_tiles',
  ground: PANTANAL_GROUND,
  solid: new Set(['#', '~']),
  water: new Set(['~']),
  brush: new Set(['"']),
  frames,
  overlays,
  frameNames: R.names,
  paint: (scene: Phaser.Scene) => R.build(scene, 'pantanal_tiles'),
};
