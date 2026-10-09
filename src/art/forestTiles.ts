import type Phaser from 'phaser';
import { Painter, TILE, rng } from './canvas';
import { blob, hash2, rgba, type Pal5 } from './draw';

// Pisos da floresta: variações por posição e autotile (trilha, areia, igarapé) pelos vizinhos.
// O registro de quadros é montado uma vez, na ordem em que os quadros entram no spritesheet.

export type Draw = (p: Painter) => void;

/** Registro de quadros de um spritesheet de chão: cada quadro tem um nome e entra na ordem de registro. */
export class TileRegistry {
  readonly draws: Draw[] = [];
  readonly names: string[] = [];
  private readonly reg = new Map<string, number>();

  frame(key: string, draw: Draw): number {
    let i = this.reg.get(key);
    if (i === undefined) {
      i = this.draws.length;
      this.draws.push(draw);
      this.names.push(key);
      this.reg.set(key, i);
    }
    return i;
  }

  idx(key: string): number {
    const i = this.reg.get(key);
    if (i === undefined) throw new Error(`Quadro de chão inexistente: ${key}`);
    return i;
  }

  /** Gera o spritesheet em grade de TILE_COLS colunas; o quadro i fica em (i % cols, i / cols). */
  build(scene: Phaser.Scene, key: string): void {
    if (scene.textures.exists(key)) return;
    const rows = Math.ceil(this.draws.length / TILE_COLS);
    const tex = scene.textures.createCanvas(key, TILE_COLS * TILE, rows * TILE);
    if (!tex) throw new Error(`Não foi possível criar a textura ${key}`);
    const ctx = tex.getContext();
    this.draws.forEach((draw, i) => {
      const ox = (i % TILE_COLS) * TILE;
      const oy = Math.floor(i / TILE_COLS) * TILE;
      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, oy, TILE, TILE);
      ctx.clip();
      ctx.translate(ox, oy);
      draw(new Painter(ctx, TILE, TILE));
      ctx.restore();
      tex.add(i, 0, ox, oy, TILE, TILE);
    });
    tex.refresh();
  }
}

const R = new TileRegistry();
const frame = (key: string, draw: Draw) => R.frame(key, draw);
const idx = (key: string) => R.idx(key);

/** Nome de cada quadro do spritesheet, na ordem (para a galeria). */
export const TILE_FRAME_NAMES = R.names;
export const TILE_COLS = 32;

// ------------------------------------------------------------------ chão de folhas

const FL = {
  base: '#2f6234',
  dk: '#17413e',
  lt: '#5a9238',
  hi: '#d8c850',
  teal: '#12384a',
  o1: '#e07a24',
  o2: '#f4b43c',
  o3: '#a8481e',
  o4: '#7a3418',
  twig: '#6c4126',
  twigL: '#b07840',
  gr: '#80d84a',
  gr2: '#3f9c38',
  stone: '#8c94b8',
  stoneL: '#c4cce8',
};

function deadLeaf(p: Painter, x: number, y: number, c: string, l: string, d: string, flip: boolean): void {
  if (!flip) {
    p.px(x + 1, y, l).px(x + 2, y, c).px(x, y + 1, c).px(x + 1, y + 1, c).px(x + 2, y + 1, d);
  } else {
    p.px(x, y, c).px(x + 1, y, l).px(x, y + 1, d).px(x + 1, y + 1, c).px(x + 2, y + 1, c);
  }
}

const FLOOR_VARIANTS = 6;
/** Tom de fundo de cada variação: do sombreado azul-esverdeado ao banhado de sol. */
const FLOOR_BASE = ['#2f6234', '#295c3a', '#376832', '#265840', '#427030', '#2c6038'];
/** Peso de cada variação (a 0 é a mais calma e a mais comum). */
const FLOOR_WEIGHTS = [0.34, 0.2, 0.14, 0.12, 0.12, 0.08];

function drawFloor(p: Painter, v: number, wallMask = 0, fv = 0): void {
  const r = rng(1000 + v * 31);
  p.rect(0, 0, TILE, TILE, FLOOR_BASE[v % FLOOR_BASE.length]);
  for (let i = 0; i < 10; i++) p.rect(Math.floor(r() * 16), Math.floor(r() * 16), 2 + Math.floor(r() * 3), 1 + Math.floor(r() * 2), r() < 0.55 ? FL.dk : FL.lt);
  p.speckle(0, 0, TILE, TILE, [FL.dk, FL.teal, FL.lt], 0.12, r);
  p.speckle(0, 0, TILE, TILE, [FL.hi, '#f0a040', '#8cc844'], 0.03, r);
  const f = () => r() < 0.5;
  switch (v) {
    case 0:
      deadLeaf(p, 3 + Math.floor(r() * 8), 3 + Math.floor(r() * 9), FL.o3, FL.o1, FL.o4, f());
      break;
    case 1:
      deadLeaf(p, 1, 2, FL.o1, FL.o2, FL.o3, false);
      deadLeaf(p, 9, 6, FL.o3, FL.o1, FL.o4, true);
      deadLeaf(p, 4, 11, FL.o2, '#ffe07a', FL.o1, f());
      p.px(13, 12, FL.o1);
      break;
    case 2:
      // galho caído com ponta clara
      p.hline(3, 9, 7, FL.twig).hline(4, 10, 6, FL.o4).px(2, 8, FL.twig).px(10, 8, FL.twig).px(5, 9, FL.twigL).px(8, 9, FL.twigL).px(11, 7, FL.twigL);
      deadLeaf(p, 9, 2, FL.o1, FL.o2, FL.o3, true);
      break;
    case 3:
      // mancha de musgo vivo e uma pedrinha
      p.rect(2, 3, 6, 3, FL.gr2).rect(3, 2, 4, 1, FL.gr2).rect(3, 3, 3, 1, FL.gr).px(4, 2, '#b8f060');
      p.speckle(2, 2, 7, 4, [FL.gr, '#b8f060'], 0.18, r);
      p.px(11, 11, FL.stone).px(12, 11, FL.stoneL).px(11, 12, '#5c6490').px(12, 12, '#5c6490');
      break;
    case 4:
      // pilha de folhas secas
      deadLeaf(p, 5, 5, FL.o3, FL.o1, FL.o4, false);
      deadLeaf(p, 7, 6, FL.o1, FL.o2, FL.o3, true);
      deadLeaf(p, 4, 8, FL.o2, '#ffe07a', FL.o1, true);
      deadLeaf(p, 8, 9, FL.o3, FL.o1, FL.o4, false);
      deadLeaf(p, 11, 3, FL.o4, FL.o3, '#4a1c10', true);
      break;
    default:
      // brotinho e folhas
      p.vline(10, 8, 4, FL.gr2).px(9, 8, FL.gr).px(11, 7, FL.gr).px(10, 7, '#b8f060').px(8, 9, FL.gr2).px(12, 9, FL.gr2);
      deadLeaf(p, 2, 3, FL.o1, FL.o2, FL.o3, false);
      deadLeaf(p, 3, 11, FL.o3, FL.o1, FL.o4, true);
  }
  if (wallMask) wallFringe(p, wallMask, fv);
}

// ------------------------------------------------------------------ mata fechada

const WALL_PAL: Pal5[] = [
  { o: '#031620', d: '#07303c', m: '#0e5446', l: '#1f8a46', h: '#d8d868' },
  { o: '#04121e', d: '#062a3a', m: '#0c4a4a', l: '#1a7c48', h: '#a8d860' },
];

function drawWall(p: Painter, v: number): void {
  p.rect(0, 0, TILE, TILE, '#062630');
  const r = rng(500 + v * 17);
  for (let i = 0; i < 7; i++) {
    const cx = r() * 16;
    const cy = r() * 16;
    const rad = 3.6 + r() * 2.2;
    for (const ox of [-16, 0, 16]) {
      for (const oy of [-16, 0, 16]) {
        if (cx + ox < -7 || cx + ox > 23 || cy + oy < -7 || cy + oy > 23) continue;
        blob(p, cx + ox, cy + oy, rad, rad * 0.85, WALL_PAL[i % 2], 40 + i * 7 + v * 3, { lobes: 5, amp: 0.22, bias: 0.2, noise: 0.5 });
      }
    }
  }
  // folhas que pegam um resto de sol dourado
  for (let i = 0; i < 6; i++) {
    const x = 1 + Math.floor(r() * 13);
    const y = 1 + Math.floor(r() * 12);
    p.px(x, y, i % 2 ? '#ffd27a' : '#c8e060').px(x + 1, y, '#3fb347').px(x, y + 1, '#1f8a46');
  }
}

/** Franja de folhagem da mata que invade o chão vizinho (3 a 7 px), com sombra azulada projetada. */
function wallFringe(p: Painter, mask: number, fv: number): void {
  [0.55, 0.42, 0.3, 0.2, 0.12, 0.06].forEach((a, d) => {
    const c = rgba('#04243a', a);
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
    const prof = profile(900 + si * 17 + fv * 101, 4, 2.6, 2, 7);
    const at = (pos: number, depth: number): [number, number] => (si === 0 ? [pos, depth] : si === 1 ? [TILE - 1 - depth, pos] : si === 2 ? [pos, TILE - 1 - depth] : [depth, pos]);
    for (let pos = 0; pos < TILE; pos++) {
      for (let d = 0; d < Math.min(2, prof[pos]); d++) {
        const [x, y] = at(pos, d);
        p.px(x, y, hash2(x, y, 3) < 0.5 ? WALL_PAL[0].d : WALL_PAL[1].m);
      }
    }
    for (let k = 0; k < 6; k++) {
      const pos = Math.round(k * 3.2 + hash2(k, si, fv) * 2 - 0.5);
      const rad = 2.4 + hash2(k, si + 5, fv) * 1.6;
      const depth = Math.max(0.5, prof[Math.min(TILE - 1, Math.max(0, pos))] - rad * 0.85);
      const [cx, cy] = at(pos, depth);
      blob(p, cx, cy, rad, rad * 0.85, WALL_PAL[(k + fv) % 2], 300 + k * 7 + si * 3 + fv, { lobes: 5, amp: 0.25, bias: 0.15, noise: 0.5 });
    }
    // folhas soltas no chão, passando da franja
    for (let k = 0; k < 3; k++) {
      const pos = Math.floor(hash2(k, si + 9, fv) * TILE);
      const depth = prof[pos] + 1 + Math.floor(hash2(k, si + 2, fv) * 2);
      const [x, y] = at(pos, depth);
      p.px(x, y, k === 0 ? '#c8e060' : '#2fa046').px(x + 1, y, '#0e5446');
    }
  }
}

// ------------------------------------------------------------------ sub-bosque alto

function drawTall(p: Painter, v: number): void {
  const r = rng(2000 + v * 53);
  p.rect(0, 0, TILE, TILE, '#114238');
  p.speckle(0, 0, TILE, TILE, ['#0a3040', '#1a5a3c'], 0.2, r);
  const tufts = [
    { x: 3, y: 6 },
    { x: 11, y: 5 },
    { x: 7, y: 11 },
    { x: 15, y: 12 },
    { x: -1, y: 12 },
  ];
  for (const t of tufts) {
    const nb = 4 + Math.floor(r() * 2);
    const blades: { x: number; lean: number; h: number }[] = [];
    for (let i = 0; i < nb; i++) blades.push({ x: t.x + i - Math.floor(nb / 2) + Math.round((r() - 0.5) * 2), lean: (i - (nb - 1) / 2) * 0.9 + (r() - 0.5), h: 5 + Math.floor(r() * 4) });
    // contorno escuro, depois lâminas coloridas do pé (escuro) até a ponta (claro)
    for (const pass of [0, 1]) {
      for (const b of blades) {
        for (let k = 0; k <= b.h; k++) {
          const tt = k / b.h;
          const x = Math.round(b.x + b.lean * tt * 1.6);
          const y = t.y + 3 - k;
          if (pass === 0) {
            p.px(x - 1, y, '#08283a');
            if (k === b.h) p.px(x, y - 1, '#08283a');
          } else {
            p.px(x, y, tt < 0.3 ? '#12685a' : tt < 0.7 ? '#2ea840' : tt < 1 ? '#8ad84a' : '#f4e888');
          }
        }
      }
    }
  }
  if (v === 3) {
    for (const [x, y, c] of [
      [4, 9, '#ffd23a'],
      [12, 8, '#ff7ab0'],
      [9, 3, '#ffffff'],
    ] as const) {
      p.px(x, y, c).px(x - 1, y, c).px(x + 1, y, c).px(x, y - 1, c).px(x, y + 1, c).px(x, y, '#ff8a1a');
    }
  }
  if (v === 1) p.px(8, 6, '#ff5a3a').px(7, 6, '#ffb03a').px(9, 6, '#ffb03a').px(8, 5, '#ffb03a').px(8, 7, '#ffb03a');
}

// ------------------------------------------------------------------ autotile

export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;
export const NE = 16;
export const SE = 32;
export const SW = 64;
export const NW = 128;

/** Zera os bits de canto que não têm os dois lados vizinhos. */
export function norm(m: number): number {
  if (!(m & N && m & E)) m &= ~NE;
  if (!(m & S && m & E)) m &= ~SE;
  if (!(m & S && m & W)) m &= ~SW;
  if (!(m & N && m & W)) m &= ~NW;
  return m;
}

export const ALL_MASKS: number[] = [];
for (let s = 0; s < 16; s++) {
  for (let d = 0; d < 16; d++) {
    const m = s | (d << 4);
    if (norm(m) === m) ALL_MASKS.push(m);
  }
}
export const FULL = 255;

export interface Prof {
  n: number[];
  s: number[];
  w: number[];
  e: number[];
}

/** Perfil de borda suave e periódico: vale `base` nas pontas (emenda com o tile vizinho) e ondula até ±amp no meio. */
export function profile(seed: number, base: number, amp: number, lo: number, hi: number): number[] {
  const r = rng(seed);
  const p1 = r() * 6.283;
  const p2 = r() * 6.283;
  const a1 = 0.6 + r() * 0.4;
  const a2 = 0.3 + r() * 0.5;
  const f = (i: number) => a1 * Math.sin((i / TILE) * 6.283 + p1) + a2 * Math.sin((i / TILE) * 12.566 + p2);
  const out: number[] = [];
  for (let i = 0; i < TILE; i++) {
    const w = Math.sin((Math.PI * (i + 0.5)) / TILE) ** 0.7;
    out.push(Math.round(Math.min(hi, Math.max(lo, base + (f(i) - f(0)) * amp * w))));
  }
  return out;
}
export const makeProf = (seed: number, base: number, amp: number, lo = 0, hi = 7): Prof => ({
  n: profile(seed, base, amp, lo, hi),
  s: profile(seed + 1, base, amp, lo, hi),
  w: profile(seed + 2, base, amp, lo, hi),
  e: profile(seed + 3, base, amp, lo, hi),
});

/** Grade 16×16: true onde o pixel está FORA do grupo (lado sem vizinho), com bordas orgânicas. */
export function outGrid(mask: number, pr: Prof, cut: number): boolean[] {
  const g: boolean[] = [];
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      let o = false;
      if (!(mask & N) && y < pr.n[x]) o = true;
      if (!(mask & S) && TILE - 1 - y < pr.s[x]) o = true;
      if (!(mask & W) && x < pr.w[y]) o = true;
      if (!(mask & E) && TILE - 1 - x < pr.e[y]) o = true;
      // cantos externos arredondados
      if (!(mask & N) && !(mask & W) && x + y < cut) o = true;
      if (!(mask & N) && !(mask & E) && TILE - 1 - x + y < cut) o = true;
      if (!(mask & S) && !(mask & W) && x + TILE - 1 - y < cut) o = true;
      if (!(mask & S) && !(mask & E) && TILE - 1 - x + TILE - 1 - y < cut) o = true;
      // cantos internos (diagonal ausente com os dois lados presentes)
      const nub = (cx: number, cy: number) => (x - cx) ** 2 + (y - cy) ** 2 < 19;
      if (mask & N && mask & E && !(mask & NE) && nub(TILE - 1, 0)) o = true;
      if (mask & S && mask & E && !(mask & SE) && nub(TILE - 1, TILE - 1)) o = true;
      if (mask & S && mask & W && !(mask & SW) && nub(0, TILE - 1)) o = true;
      if (mask & N && mask & W && !(mask & NW) && nub(0, 0)) o = true;
      g.push(o);
    }
  }
  return g;
}

/** Distância (Manhattan, até maxd) do pixel ao pixel mais próximo cujo tipo é `target`. */
export function distTo(g: boolean[], x: number, y: number, target: boolean, maxd: number): number {
  let best = maxd + 1;
  for (let dy = -maxd; dy <= maxd; dy++) {
    for (let dx = -maxd; dx <= maxd; dx++) {
      const d = Math.abs(dx) + Math.abs(dy);
      if (d >= best || d === 0) continue;
      const nx = Math.min(TILE - 1, Math.max(0, x + dx));
      const ny = Math.min(TILE - 1, Math.max(0, y + dy));
      if (g[ny * TILE + nx] === target) best = d;
    }
  }
  return best;
}

// ------------------------------------------------------------------ trilha de terra

/** Variações de borda por tile: nenhuma sequência de tiles repete o mesmo contorno. */
export const EDGE_VARIANTS = 3;
const TRAIL_PROFS = Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(300 + v * 41, 3, 3.2));

function dirtColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 60 + v);
  if (h < 0.1) return '#a2602c';
  if (h < 0.19) return '#e0a458';
  if (h < 0.215) return '#ffd890';
  if (h < 0.235) return '#6a3a2a';
  // marcas leves de passos: faixas mais escuras horizontais
  if ((y + v * 5) % 8 === 3 && hash2(x, y, 9) < 0.5) return '#b06c34';
  return '#c68644';
}

/** Pinta o grupo sobre o chão com borda pontilhada: grãos escapam para fora, o chão invade para dentro. */
export function paintGroup(p: Painter, g: boolean[], inside: (x: number, y: number) => string, edgeIn: (x: number, y: number) => string, rim: (x: number, y: number) => string | null, seed: number): void {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const h = hash2(x, y, seed);
      if (g[y * TILE + x]) {
        const d = distTo(g, x, y, false, 3);
        if (d === 1 && h < 0.45) p.px(x, y, inside(x, y));
        else if (d === 2 && h < 0.2) p.px(x, y, inside(x, y));
        else if (d === 3 && h < 0.06) p.px(x, y, edgeIn(x, y));
        else if (d === 1 || (d === 2 && h > 0.8)) {
          const c = rim(x, y);
          if (c) p.px(x, y, c);
        }
        continue;
      }
      const dIn = distTo(g, x, y, true, 3);
      if (dIn === 1) {
        if (h > 0.62) continue; // o chão invade
        p.px(x, y, edgeIn(x, y));
      } else if (dIn === 2 && h > 0.88) continue;
      else p.px(x, y, inside(x, y));
    }
  }
}

function drawTrail(p: Painter, mask: number, v: number): void {
  drawFloor(p, (v + 2) % FLOOR_VARIANTS);
  const g = outGrid(mask, TRAIL_PROFS[v % EDGE_VARIANTS], 8);
  paintGroup(
    p,
    g,
    (x, y) => dirtColor(x, y, v),
    (x, y) => (hash2(x, y, 5) < 0.2 ? '#e0792b' : hash2(x, y, 6) < 0.4 ? '#a86a2e' : '#8a5428'),
    (x, y) => (hash2(x, y, 4) < 0.3 ? '#4a3a24' : '#10383a'),
    21 + v,
  );
}

// ------------------------------------------------------------------ margem de areia e lama

const SAND_PROFS = Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(400 + v * 43, 3, 3.2));

function sandColor(x: number, y: number, v: number): string {
  const h = hash2(x, y, 80 + v);
  if (h < 0.12) return '#d4ae6c';
  if (h < 0.22) return '#f8e4aa';
  if (h < 0.235) return '#fff8e0';
  if (h < 0.255) return '#9a7650';
  if ((x + y * 2 + v * 3) % 9 === 0 && h < 0.6) return '#e0bd7c';
  return '#ecd08e';
}

function drawSand(p: Painter, mask: number, v: number): void {
  drawFloor(p, (v + 4) % FLOOR_VARIANTS);
  const g = outGrid(mask, SAND_PROFS[v % EDGE_VARIANTS], 8);
  paintGroup(
    p,
    g,
    (x, y) => sandColor(x, y, v),
    (x, y) => (hash2(x, y, 5) < 0.4 ? '#b88c50' : '#d2aa66'),
    (x, y) => (hash2(x, y, 4) < 0.3 ? '#6a5430' : '#10383a'),
    33 + v,
  );
}

// ------------------------------------------------------------------ água do igarapé (3 quadros)

export const WATER_FRAMES = 3;
const WATER_PROFS = Array.from({ length: EDGE_VARIANTS }, (_, v) => makeProf(100 + v * 47, 4, 3.4));
const SHIFTS = [0, 5, 11];

/** Cor da água aberta no pixel (x,y) do quadro f; padrão periódico em 16 px para emendar entre tiles. */
function waterGrid(v: number, f: number): string[] {
  const g: string[] = new Array(TILE * TILE).fill('#0e82a4');
  const r = rng(700 + v * 41);
  const at = (x: number, y: number, c: string) => {
    g[(((y % TILE) + TILE) % TILE) * TILE + (((x % TILE) + TILE) % TILE)] = c;
  };
  // manchas fundas (reflexo escuro da copa), deslocam devagar
  for (let i = 0; i < 4; i++) {
    const sx = Math.floor(r() * 16);
    const sy = Math.floor(r() * 16);
    const len = 4 + Math.floor(r() * 4);
    for (let k = 0; k < len; k++) at(sx + k + Math.floor(SHIFTS[f] * 0.5), sy, '#0a5e86');
    for (let k = 1; k < len - 1; k++) at(sx + k + Math.floor(SHIFTS[f] * 0.5), sy + 1, '#0c6c92');
  }
  // fios de brilho claros, correm mais rápido
  for (let i = 0; i < 6; i++) {
    const sx = Math.floor(r() * 16);
    const sy = Math.floor(r() * 16);
    const len = 3 + Math.floor(r() * 3);
    const dir = i % 2 === 0 ? 1 : -1;
    for (let k = 0; k < len; k++) at(sx + k + dir * SHIFTS[f], sy, k === len - 1 ? '#a4f4ea' : '#4ccdd0');
    if (r() < 0.6) at(sx + 1 + dir * SHIFTS[f], sy + 1, '#0a5e86');
  }
  // reflexos dourados do sol que cintilam (um quadro sim, outro não)
  for (let i = 0; i < 3; i++) {
    if (hash2(i, f, v + 17) < 0.7) at(Math.floor(hash2(i, f, v) * 16), Math.floor(hash2(i, f, v + 3) * 16), i === 0 ? '#fff6c0' : '#ffe08a');
  }
  return g;
}
const WATER_GRIDS = new Map<string, string[]>();
const waterBase = (v: number, f: number) => {
  const k = `${v}:${f}`;
  let g = WATER_GRIDS.get(k);
  if (!g) WATER_GRIDS.set(k, (g = waterGrid(v, f)));
  return g;
};

function drawWater(p: Painter, mask: number, v: number, f: number): void {
  const base = waterBase(v, f);
  const g = outGrid(mask, WATER_PROFS[v % EDGE_VARIANTS], 9);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (!g[y * TILE + x]) {
        const dOut = distTo(g, x, y, true, 2);
        if (dOut === 1) p.px(x, y, (x + y + f * 2) % 4 < 2 ? '#f4fffa' : '#9ee8e2');
        else if (dOut === 2) p.px(x, y, hash2(x, y, f + 3) < 0.4 ? '#46c8c6' : base[y * TILE + x]);
        else p.px(x, y, base[y * TILE + x]);
      } else {
        const d = distTo(g, x, y, false, 5);
        const h = hash2(x, y, 11);
        if (d === 1) p.px(x, y, h < 0.4 ? '#1a1a2a' : '#2c2430');
        else if (d === 2) p.px(x, y, h < 0.3 ? '#7a5636' : '#5c3e2a');
        else if (d === 3 && h < 0.25) p.px(x, y, '#7a5636');
        else p.px(x, y, h < 0.2 ? '#e0b86c' : h < 0.4 ? '#a47c44' : '#c09858');
      }
    }
  }
}

// ------------------------------------------------------------------ ponte de tábuas

function drawBridge(p: Painter, vertical: boolean, railA: boolean, railB: boolean): void {
  // u corre ao longo da travessia; w corre atravessado nela
  const put = (u: number, w: number, c: string) => (vertical ? p.px(w, u, c) : p.px(u, w, c));
  const r = rng(vertical ? 91 : 77);
  const joints: number[] = [];
  for (let i = 0; i < 4; i++) joints.push(Math.floor(r() * 16));
  for (let w = 0; w < TILE; w++) {
    const band = Math.floor(w / 4);
    const baseC = band % 2 === 0 ? '#d8985a' : '#c88848';
    for (let u = 0; u < TILE; u++) {
      let c = baseC;
      if (w % 4 === 0) c = '#f2bc70';
      else if (w % 4 === 3) c = '#7e4a28';
      else if (hash2(u, w, 31) < 0.12) c = '#b0702e';
      if (w % 4 !== 3 && u === joints[band]) c = '#7e4a28';
      put(u, w, c);
    }
  }
  const rail = (top: boolean) => {
    const ws = top ? [0, 1, 2] : [13, 14, 15];
    const cols = top ? ['#3a2016', '#f6c474', '#a2602c'] : ['#7e4a28', '#e8a858', '#3a2016'];
    ws.forEach((w, i) => {
      for (let u = 0; u < TILE; u++) put(u, w, cols[i]);
    });
    // mourões a cada 8 px
    for (const u of [2, 10]) {
      for (const w of top ? [0, 1, 2, 3] : [12, 13, 14, 15]) {
        put(u, w, '#3a2016');
        put(u + 1, w, w === (top ? 1 : 13) ? '#ffd88a' : '#c47c3a');
        put(u + 2, w, '#3a2016');
      }
    }
  };
  if (railA) rail(true);
  if (railB) rail(false);
}

// ------------------------------------------------------------------ registro dos quadros

// Os 7 primeiros seguem a ordem de GROUND: # . , " ~ = _
frame('wall:0', (p) => drawWall(p, 0));
frame('floor:0', (p) => drawFloor(p, 0));
frame(`trail:${FULL}:0`, (p) => drawTrail(p, FULL, 0));
frame('tall:0', (p) => drawTall(p, 0));
frame(`water:${FULL}:0:0`, (p) => drawWater(p, FULL, 0, 0));
frame('bridge:h:1:1', (p) => drawBridge(p, false, true, true));
frame(`sand:${FULL}:0`, (p) => drawSand(p, FULL, 0));

for (let v = 1; v < FLOOR_VARIANTS; v++) frame(`floor:${v}`, (p) => drawFloor(p, v));
for (let v = 1; v < 3; v++) frame(`wall:${v}`, (p) => drawWall(p, v));
// chão ao lado da mata: franja de folhagem por cima, para cada combinação de lados
for (let m = 1; m < 16; m++) for (let v = 0; v < 3; v++) frame(`floorwall:${m}:${v}`, (p) => drawFloor(p, (v * 2 + m) % FLOOR_VARIANTS, m, v));
for (let v = 1; v < 4; v++) frame(`tall:${v}`, (p) => drawTall(p, v));
// franja da mata sobre fundo transparente: sobreposta à trilha, à areia e ao sub-bosque colados na mata
for (let m = 1; m < 16; m++) for (let v = 0; v < 3; v++) frame(`fringe:${m}:${v}`, (p) => wallFringe(p, m, v));
for (const m of ALL_MASKS) for (let v = 0; v < 3; v++) frame(`trail:${m}:${v}`, (p) => drawTrail(p, m, v));
for (const m of ALL_MASKS) for (let v = 0; v < 3; v++) frame(`sand:${m}:${v}`, (p) => drawSand(p, m, v));
for (const m of ALL_MASKS) {
  for (let v = 0; v < 3; v++) for (let f = 0; f < WATER_FRAMES; f++) frame(`water:${m}:${v}:${f}`, (p) => drawWater(p, m, v, f));
}
for (const vertical of [false, true]) for (const a of [false, true]) for (const b of [false, true]) frame(`bridge:${vertical ? 'v' : 'h'}:${a ? 1 : 0}:${b ? 1 : 0}`, (p) => drawBridge(p, vertical, a, b));

// ------------------------------------------------------------------ spritesheet e escolha de quadros

export function buildTileSheet(scene: Phaser.Scene, key: string): void {
  R.build(scene, key);
}

export type Cell = string | undefined;
const isWater = (c: Cell) => c === '~' || c === '=';
const isTrail = (c: Cell) => c === ',' || c === '=' || c === '_';
const isSand = (c: Cell) => c === '_' || c === '~' || c === '=' || c === ',';

/** Máscara de vizinhos do mesmo grupo; fora do mapa conta como do grupo (o grupo "continua"). */
export function maskOf(map: string[], x: number, y: number, inGroup: (c: Cell) => boolean): number {
  const g = (xx: number, yy: number) => inGroup(map[yy]?.[xx] ?? undefined) || map[yy]?.[xx] === undefined;
  let m = 0;
  if (g(x, y - 1)) m |= N;
  if (g(x + 1, y)) m |= E;
  if (g(x, y + 1)) m |= S;
  if (g(x - 1, y)) m |= W;
  if (g(x + 1, y - 1)) m |= NE;
  if (g(x + 1, y + 1)) m |= SE;
  if (g(x - 1, y + 1)) m |= SW;
  if (g(x - 1, y - 1)) m |= NW;
  return norm(m);
}

export function pick(weights: number[], h: number): number {
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (h < acc) return i;
  }
  return weights.length - 1;
}

/** Quadros estáticos desenhados por cima do chão: a franja da mata sobre trilha, areia e sub-bosque. */
export function tileOverlaysFor(map: string[], x: number, y: number): number[] {
  const ch = map[y][x];
  if (ch !== ',' && ch !== '_' && ch !== '"') return [];
  const at = (xx: number, yy: number): Cell => map[yy]?.[xx];
  const wm = (at(x, y - 1) === '#' ? N : 0) | (at(x + 1, y) === '#' ? E : 0) | (at(x, y + 1) === '#' ? S : 0) | (at(x - 1, y) === '#' ? W : 0);
  return wm ? [idx(`fringe:${wm}:${Math.floor(hash2(x, y, 3) * 3)}`)] : [];
}

export function tileFramesFor(map: string[], x: number, y: number): number[] {
  const ch = map[y][x];
  const at = (xx: number, yy: number): Cell => map[yy]?.[xx];
  const h = hash2(x, y, 1);
  switch (ch) {
    case '#':
      return [idx(`wall:${Math.floor(hash2(x, y, 2) * 3)}`)];
    case '.': {
      const wm = (at(x, y - 1) === '#' ? N : 0) | (at(x + 1, y) === '#' ? E : 0) | (at(x, y + 1) === '#' ? S : 0) | (at(x - 1, y) === '#' ? W : 0);
      if (wm) return [idx(`floorwall:${wm}:${Math.floor(hash2(x, y, 3) * 3)}`)];
      return [idx(`floor:${pick(FLOOR_WEIGHTS, h)}`)];
    }
    case ',': {
      const m = maskOf(map, x, y, isTrail);
      return [idx(`trail:${m}:${Math.floor(h * 3)}`)];
    }
    case '"':
      return [idx(`tall:${Math.floor(h * 4)}`)];
    case '~': {
      const m = maskOf(map, x, y, isWater);
      const v = Math.floor(h * 3);
      return Array.from({ length: WATER_FRAMES }, (_, f) => idx(`water:${m}:${v}:${f}`));
    }
    case '=': {
      const wN = isWater(at(x, y - 1)) && at(x, y - 1) !== '=';
      const wS = isWater(at(x, y + 1)) && at(x, y + 1) !== '=';
      const wW = isWater(at(x - 1, y)) && at(x - 1, y) !== '=';
      const wE = isWater(at(x + 1, y)) && at(x + 1, y) !== '=';
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
      return [idx(`bridge:${vertical ? 'v' : 'h'}:${a ? 1 : 0}:${b ? 1 : 0}`)];
    }
    case '_': {
      const m = maskOf(map, x, y, isSand);
      return [idx(`sand:${m}:${Math.floor(h * 3)}`)];
    }
    default:
      return [idx('floor:0')];
  }
}
