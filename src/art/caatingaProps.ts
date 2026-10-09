import { rng, type Painter } from './canvas';
import { Body, blob, canopy, disc, frond, hash2, line, shadow, type CanopyPals, type Pal5 } from './draw';
import type { PropSpec } from './forest';

// Objetos da Caatinga e da faixa de transição (mata dos cocais e cerrado).
// Mesmo contrato da floresta: textura `prop_<tipo>`, centrada na largura da base e apoiada no fundo.
// Sol forte do alto à esquerda; sombras projetadas violeta-azuladas.

export const CAATINGA_PROPS: Record<string, PropSpec> = {
  // caatinga
  mandacaru: { w: 48, h: 80, fw: 1, fh: 1, canopy: true },
  facheiro: { w: 32, h: 72, fw: 1, fh: 1, canopy: true },
  xique_xique: { w: 32, h: 24, fw: 2, fh: 1 },
  coroa_de_frade: { w: 16, h: 16, fw: 1, fh: 1 },
  macambira: { w: 24, h: 20, fw: 1, fh: 1 },
  juazeiro: { w: 64, h: 72, fw: 2, fh: 1, canopy: true },
  umbuzeiro: { w: 72, h: 56, fw: 2, fh: 1, canopy: true },
  catingueira: { w: 48, h: 56, fw: 1, fh: 1, canopy: true },
  aroeira: { w: 48, h: 72, fw: 1, fh: 1, canopy: true },
  garrancho: { w: 32, h: 28, fw: 1, fh: 1 },
  matacao: { w: 32, h: 28, fw: 2, fh: 1 },
  seixos: { w: 16, h: 16, fw: 1, fh: 1 },
  // transição: mata dos cocais e cerrado
  babacu: { w: 64, h: 88, fw: 1, fh: 1, canopy: true },
  carnauba: { w: 40, h: 80, fw: 1, fh: 1, canopy: true },
  pequizeiro: { w: 56, h: 60, fw: 1, fh: 1, canopy: true },
  capim: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
};

const SHADE = '#3a2458';

const CACTUS: Pal5 = { o: '#163044', d: '#24606a', m: '#3c8c78', l: '#7cbc8c', h: '#d4f0b0' };
const GLAUCOUS: Pal5 = { o: '#1a2c44', d: '#2c5468', m: '#4c8a90', l: '#8cbcb4', h: '#dcf0e0' };
const XIQUE: Pal5 = { o: '#1e3434', d: '#3a6a50', m: '#6a9a58', l: '#a8c870', h: '#eaf0a8' };
const WOOD_GREY: Pal5 = { o: '#2a2238', d: '#5a5060', m: '#8a8078', l: '#c0b4a4', h: '#ece0cc' };
const WOOD_DARK: Pal5 = { o: '#24182a', d: '#4a2e34', m: '#7a4c3c', l: '#ae7656', h: '#e0a878' };
const CORK: Pal5 = { o: '#2a1e2e', d: '#5a4644', m: '#8a6e5c', l: '#b89878', h: '#e4c8a0' };
const PALM_TRUNK: Pal5 = { o: '#2a2032', d: '#5a4a4a', m: '#8e7a62', l: '#c4ac84', h: '#f0dcb0' };
const STONE: Pal5 = { o: '#3a2a50', d: '#6a5a78', m: '#a8989c', l: '#d4c8c0', h: '#f4ece0' };
const BABACU: Pal5 = { o: '#0c2a26', d: '#1a5236', m: '#349040', l: '#80c64c', h: '#ecec88' };
const CARNAUBA: Pal5 = { o: '#1e3a3a', d: '#3c6a5a', m: '#6a9a7a', l: '#a8ccb0', h: '#eef6e0' };
const DRY_FROND: Pal5 = { o: '#3a2a22', d: '#7a5434', m: '#b07c44', l: '#d8a85c', h: '#f4d48a' };

const JUA: CanopyPals = {
  gold: { o: '#1e3a1c', d: '#3c6a2a', m: '#6a9a34', l: '#b4c84a', h: '#fff0a0' },
  lime: { o: '#123024', d: '#1e5432', m: '#2e8040', l: '#6ab44a', h: '#e8ec8a' },
  teal: { o: '#1a1a3a', d: '#22304e', m: '#24584e', l: '#2e7a50', h: '#7ab45a' },
  dark: { o: '#1a1a36', d: '#202c48', m: '#1e4a44', l: '#2a7048', h: '#c8d880' },
};
const UMBU: CanopyPals = {
  gold: { o: '#3a3a2a', d: '#6a7a48', m: '#9aac5c', l: '#d0d080', h: '#fff4b8' },
  lime: { o: '#2a3028', d: '#4c6044', m: '#76905a', l: '#a8bc78', h: '#eef0b0' },
  teal: { o: '#2a2440', d: '#454860', m: '#5a7062', l: '#7a9274', h: '#b8c890' },
  dark: { o: '#28203c', d: '#3e3c58', m: '#52645a', l: '#72886c', h: '#c8d098' },
};
const DRY: CanopyPals = {
  gold: { o: '#3a3024', d: '#7a7040', m: '#a8a054', l: '#d4c872', h: '#fff0b0' },
  lime: { o: '#2e2c2a', d: '#5a5a44', m: '#848456', l: '#b0ac70', h: '#ece4a8' },
  teal: { o: '#2a2238', d: '#4a4258', m: '#66665e', l: '#8a8a70', h: '#c8c49a' },
  dark: { o: '#261e34', d: '#40384e', m: '#5a5a58', l: '#7c7c68', h: '#c0bc94' },
};
const AROEIRA: CanopyPals = {
  gold: { o: '#3a2a20', d: '#7a5a34', m: '#a8823e', l: '#d4b058', h: '#fff0a8' },
  lime: { o: '#22301e', d: '#405a30', m: '#5e8238', l: '#94b04c', h: '#e4e490' },
  teal: { o: '#241e36', d: '#3a3a50', m: '#44584a', l: '#5c7652', h: '#a8bc80' },
  dark: { o: '#221a30', d: '#363048', m: '#3c4c44', l: '#56704c', h: '#b8c888' },
};

type Painters = Record<string, (p: Painter) => void>;

// ------------------------------------------------------------------ cactos

/** Coluna de cacto de (cx, yTop) até yBot, com topo arredondado, costelas e espinhos. */
function column(b: Body, cx: number, yTop: number, yBot: number, hw: number): void {
  for (let y = yTop; y <= yBot; y++) {
    const t = y - yTop;
    const w = t < hw ? Math.sqrt(Math.max(0, hw * hw - (hw - t) ** 2)) : hw;
    for (let x = Math.ceil(cx - w); x <= Math.floor(cx + w); x++) b.set(x, y, (x - cx) / hw);
  }
}

/** Cotovelo: braço que sai do tronco na horizontal (y) até x1 e sobe até yTop. */
function arm(b: Body, x0: number, x1: number, y: number, yTop: number, hw: number): void {
  const dir = Math.sign(x1 - x0);
  for (let x = x0; x !== x1 + dir; x += dir) {
    for (let yy = Math.round(y - hw); yy <= Math.round(y + hw); yy++) b.set(x, yy, (yy - y) / hw - 0.2);
  }
  // cotovelo arredondado
  for (let yy = Math.floor(y - hw); yy <= Math.ceil(y + hw); yy++) {
    for (let xx = Math.floor(x1 - hw); xx <= Math.ceil(x1 + hw); xx++) if ((xx - x1) ** 2 + (yy - y) ** 2 <= hw * hw) b.set(xx, yy, (xx - x1) / hw);
  }
  column(b, x1, yTop, Math.round(y), hw);
}

/** Costelas verticais (linhas escuras e claras) e espinhos claros nas bordas. */
function ribs(p: Painter, b: Body, seed: number, rib: string, ribL: string, spine: string): void {
  for (let y = 0; y < b.h; y++) {
    for (let x = 0; x < b.w; x++) {
      if (!b.has(x, y) || !b.has(x - 1, y) || !b.has(x + 1, y) || !b.has(x, y - 1)) continue;
      const u = b.u[y * b.w + x];
      if (Math.abs(u) < 0.95 && (x + Math.round(u * 2)) % 3 === 0) p.px(x, y, u < -0.2 ? ribL : rib);
    }
  }
  const r = rng(seed);
  for (let i = 0; i < b.w * b.h * 0.05; i++) {
    const x = Math.floor(r() * b.w);
    const y = Math.floor(r() * b.h);
    if (b.has(x, y) && (!b.has(x - 1, y) || !b.has(x + 1, y))) p.px(!b.has(x - 1, y) ? x - 1 : x + 1, y, spine);
  }
}

function mandacaru(p: Painter): void {
  shadow(p, 24, 77, 13, 3.4, 0.38, SHADE);
  const b = new Body(48, 80);
  column(b, 24, 10, 78, 3.6);
  arm(b, 24, 12, 48, 24, 2.9);
  arm(b, 24, 35, 40, 14, 2.9);
  arm(b, 24, 32, 60, 46, 2.4);
  arm(b, 24, 16, 30, 18, 2.2);
  b.render(p, CACTUS, 21, 0.35);
  ribs(p, b, 33, '#2a6a64', '#a8d8a0', '#fff6d0');
  // tronco lenhoso na base (o mandacaru velho vira madeira)
  for (let y = 68; y < 79; y++) for (let x = 19; x < 30; x++) if (b.has(x, y)) p.px(x, y, (x - 24) / 3.6 < -0.4 ? '#c0aa8a' : (x - 24) / 3.6 > 0.5 ? '#5a4a52' : hash2(x, y, 2) < 0.3 ? '#7a6656' : '#9a8470');
  // flor branca e fruto vermelho-magenta nas pontas
  p.rect(10, 22, 5, 2, '#fffaf0').px(11, 21, '#fffaf0').px(13, 21, '#fffaf0').px(12, 22, '#ffd23a').px(12, 21, '#fff4b0');
  p.rect(34, 11, 3, 3, '#d8306a').px(34, 11, '#ff7aa8').px(36, 13, '#8a1a44');
  p.rect(23, 7, 3, 3, '#d8306a').px(23, 7, '#ff7aa8').px(25, 9, '#8a1a44');
}

function facheiro(p: Painter): void {
  shadow(p, 16, 69, 9, 2.8, 0.36, SHADE);
  const b = new Body(32, 72);
  column(b, 16, 14, 70, 2.6);
  column(b, 10, 26, 62, 2.2);
  column(b, 22, 6, 60, 2.2);
  for (let x = 10; x <= 22; x++) for (let y = 60; y <= 64; y++) b.set(x, y, (y - 62) / 2);
  b.render(p, GLAUCOUS, 5, 0.35);
  ribs(p, b, 7, '#2c5a68', '#b0d8cc', '#fff8e0');
  // cefálio lanoso branco perto das pontas
  for (const [x, y0, n] of [
    [22, 8, 12],
    [16, 16, 9],
    [10, 28, 7],
  ] as const) {
    for (let k = 0; k < n; k++) {
      p.px(x + 1, y0 + k, k % 3 === 0 ? '#e0dcd4' : '#fbf8f2').px(x + 2, y0 + k, '#d0ccc4');
      if (k % 2 === 0) p.px(x + 3, y0 + k, '#f4f0e8');
    }
  }
  p.px(22, 6, '#e8508a').px(21, 5, '#ff9ac0');
}

function xiqueXique(p: Painter): void {
  shadow(p, 16, 21, 15, 3, 0.34, SHADE);
  const b = new Body(32, 24);
  // hastes que se arrastam no chão e sobem nas pontas
  const stems: [number, number, number, number][] = [
    [16, 20, 3, 8],
    [16, 20, 29, 6],
    [14, 19, 8, 3],
    [18, 19, 24, 2],
    [16, 19, 16, 4],
  ];
  for (const [x0, y0, x1, y1] of stems) {
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t * t;
      for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) if (dx * dx + dy * dy <= 4) b.set(Math.round(x + dx), Math.round(y + dy), dx / 2);
    }
  }
  b.render(p, XIQUE, 9, 0.4);
  ribs(p, b, 11, '#3a6a50', '#d0e090', '#ffe890');
  p.px(3, 7, '#9a3ab0').px(4, 7, '#c86ad8').px(29, 5, '#9a3ab0').px(28, 5, '#c86ad8');
}

function coroaDeFrade(p: Painter): void {
  shadow(p, 8, 14, 6.5, 2, 0.36, SHADE);
  const b = new Body(16, 16);
  for (let y = 5; y <= 14; y++) {
    const t = (y - 9.5) / 5;
    const hw = 5.6 * Math.sqrt(Math.max(0, 1 - t * t * 0.8));
    for (let x = Math.ceil(8 - hw); x <= Math.floor(8 + hw); x++) b.set(x, y, (x - 8) / hw);
  }
  b.render(p, CACTUS, 3, 0.3);
  for (let y = 6; y < 14; y++) for (let x = 3; x < 14; x++) if (b.has(x, y) && b.has(x - 1, y) && b.has(x + 1, y) && (x + (y > 9 ? 1 : 0)) % 3 === 0) p.px(x, y, '#2a6a64');
  // cefálio vermelho (a "coroa")
  p.rect(6, 2, 5, 4, '#c8283a').hline(6, 2, 5, '#ff6a6a').px(6, 5, '#7a1028').px(10, 5, '#7a1028').px(7, 3, '#ff9a9a');
  p.px(5, 1, '#ff7aa8').px(11, 2, '#ff7aa8');
  for (const [x, y] of [
    [3, 8],
    [13, 9],
    [4, 12],
    [12, 12],
  ] as const) p.px(x, y, '#fff6d0');
}

function macambira(p: Painter): void {
  shadow(p, 12, 18, 10, 2.4, 0.34, SHADE);
  const cx = 12;
  const cy = 15;
  // folhas estreitas e serrilhadas em roseta; pontas avermelhadas
  const leaves = 13;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < leaves; i++) {
      const a = Math.PI + (i / (leaves - 1)) * Math.PI;
      const len = 7 + hash2(i, 3, 5) * 4;
      const x1 = cx + Math.cos(a) * len * 1.05;
      const y1 = cy + Math.sin(a) * len * 0.9;
      if (pass === 0) {
        line(p, cx, cy, x1, y1 + 1, '#2a2a3a');
      } else {
        line(p, cx, cy, x1, y1, i % 3 === 0 ? '#a8a870' : '#7a8a5a');
        p.px(Math.round(x1), Math.round(y1), '#c84a3a');
        p.px(Math.round((cx + x1) / 2), Math.round((cy + y1) / 2) - 1, '#d8d8a0');
      }
    }
  }
  disc(p, cx, cy - 1, 2.4, 1.6, '#c8283a');
  p.px(cx - 1, cy - 2, '#ff7a6a').px(cx, cy - 2, '#ffb0a0');
}

// ------------------------------------------------------------------ árvores da caatinga

/** Tronco recortado: largura hwTop no alto, alargando até hwBase a partir de flareFrom; lean desloca o topo. */
function trunk(w: number, h: number, cx: number, y0: number, y1: number, hwTop: number, hwBase: number, flareFrom: number, lean = 0): Body {
  const b = new Body(w, h);
  for (let y = y0; y <= y1; y++) {
    const t = y > flareFrom ? (y - flareFrom) / (y1 - flareFrom) : 0;
    const hw = hwTop + (hwBase - hwTop) * t * t;
    const c = cx + (lean * (y1 - y)) / (y1 - y0) + Math.sin(y * 0.35) * 0.6;
    for (let x = Math.ceil(c - hw); x <= Math.floor(c + hw); x++) b.set(x, y, (x - c) / hw);
  }
  return b;
}

/** Galho fino com contorno e luz no lado de cima. */
function branch(p: Painter, x0: number, y0: number, x1: number, y1: number, pal: Pal5): void {
  line(p, x0, y0 + 1, x1, y1 + 1, pal.o);
  line(p, x0, y0, x1, y1, pal.m);
  line(p, x0, y0 - 1, x1, y1 - 1, pal.l);
}

function juazeiro(p: Painter): void {
  shadow(p, 32, 69, 28, 4.6, 0.42, SHADE);
  const b = trunk(64, 72, 32, 38, 69, 3.6, 6.5, 60, -2);
  b.render(p, WOOD_GREY, 41, 0.5);
  branch(p, 31, 44, 18, 30, WOOD_GREY);
  branch(p, 33, 42, 46, 28, WOOD_GREY);
  canopy(p, 32, 25, 30, 20, 40, 9191, 5, 8.6, JUA);
  const r = rng(77);
  for (let i = 0; i < 14; i++) {
    const a = r() * 6.283;
    const d = Math.sqrt(r()) * 0.8;
    const x = Math.round(32 + Math.cos(a) * d * 28);
    const y = Math.round(25 + Math.sin(a) * d * 18);
    p.px(x, y, '#f0c838').px(x + 1, y, '#fff2a0').px(x, y + 1, '#b08a20');
  }
}

function umbuzeiro(p: Painter): void {
  shadow(p, 36, 53, 34, 4.4, 0.42, SHADE);
  const b = trunk(72, 56, 36, 30, 53, 4.6, 7.5, 46, 0);
  b.render(p, WOOD_GREY, 43, 0.5);
  // galhos abertos em guarda-chuva
  branch(p, 34, 36, 12, 24, WOOD_GREY);
  branch(p, 38, 36, 60, 24, WOOD_GREY);
  branch(p, 35, 34, 26, 20, WOOD_GREY);
  branch(p, 37, 34, 48, 19, WOOD_GREY);
  canopy(p, 36, 19, 34, 14, 44, 5151, 4.6, 7.4, UMBU);
  const r = rng(51);
  for (let i = 0; i < 12; i++) {
    const x = Math.round(8 + r() * 56);
    const y = Math.round(22 + r() * 8);
    p.px(x, y, '#c8d860').px(x + 1, y, '#eef4a0').px(x, y + 1, '#7a8a3a');
  }
}

function catingueira(p: Painter): void {
  shadow(p, 24, 53, 16, 3.4, 0.36, SHADE);
  const b = trunk(48, 56, 24, 24, 53, 2.2, 3.6, 46, 1.5);
  b.render(p, WOOD_GREY, 47, 0.45);
  // manchas claras do tronco descascando
  for (let y = 28; y < 52; y += 3) p.px(23 + (y % 2), y, '#e8dccc').px(25, y + 1, '#a89c94');
  for (const [x1, y1] of [
    [8, 18],
    [14, 12],
    [26, 8],
    [38, 12],
    [42, 22],
  ] as const) branch(p, 24, 30, x1, y1, WOOD_GREY);
  // copa rala: tufos pequenos e flores amarelas
  const r = rng(616);
  for (let i = 0; i < 16; i++) {
    const a = r() * 6.283;
    const d = 0.35 + Math.sqrt(r()) * 0.6;
    const x = 24 + Math.cos(a) * d * 19;
    const y = 18 + Math.sin(a) * d * 11;
    const pal = x < 22 && y < 18 ? DRY.gold : y > 22 ? DRY.teal : DRY.lime;
    blob(p, x, y, 3 + r() * 1.6, 2.4 + r(), pal, 600 + i * 7, { lobes: 6, amp: 0.3, noise: 0.5 });
  }
  for (let i = 0; i < 14; i++) {
    const x = Math.round(8 + r() * 32);
    const y = Math.round(8 + r() * 18);
    p.px(x, y, '#ffd23a').px(x + 1, y, '#fff2a0');
  }
}

function aroeira(p: Painter): void {
  shadow(p, 24, 69, 15, 3.6, 0.38, SHADE);
  const b = trunk(48, 72, 24, 30, 69, 2.6, 4.6, 60, -1);
  b.render(p, WOOD_DARK, 49, 0.5);
  // casca escura em placas
  for (let y = 32; y < 68; y += 2) {
    const x = 22 + Math.round(hash2(y, 1, 9) * 4);
    if (b.has(x, y) && b.has(x + 1, y)) p.px(x, y, '#2e1a22').px(x + 1, y + 1, '#2e1a22');
  }
  branch(p, 24, 36, 12, 24, WOOD_DARK);
  branch(p, 24, 34, 36, 22, WOOD_DARK);
  canopy(p, 24, 22, 22, 17, 24, 3131, 4, 6.6, AROEIRA, false);
  // folhas novas avermelhadas
  const r = rng(31);
  for (let i = 0; i < 10; i++) {
    const x = Math.round(6 + r() * 36);
    const y = Math.round(8 + r() * 24);
    p.px(x, y, '#c8503a').px(x + 1, y, '#e88a5a');
  }
}

function garrancho(p: Painter): void {
  shadow(p, 16, 25, 12, 2.6, 0.32, SHADE);
  const r = rng(808);
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * (0.12 + r() * 0.76);
    const len = 9 + r() * 7;
    const x1 = 16 + Math.cos(a) * len;
    const y1 = 25 + Math.sin(a) * len;
    branch(p, 16, 25, x1, y1, WOOD_GREY);
    if (r() < 0.6) branch(p, (16 + x1) / 2, (25 + y1) / 2, x1 + (r() - 0.5) * 8, y1 - 3, WOOD_GREY);
  }
  for (let i = 0; i < 6; i++) blob(p, 6 + r() * 20, 6 + r() * 12, 2.2 + r(), 1.8, i % 2 ? DRY.lime : DRY.teal, 900 + i, { lobes: 6, amp: 0.3 });
  for (let i = 0; i < 14; i++) p.px(Math.floor(3 + r() * 26), Math.floor(4 + r() * 18), '#f4ecd8');
}

// ------------------------------------------------------------------ pedras

function matacao(p: Painter): void {
  shadow(p, 17, 25, 16, 3.4, 0.45, SHADE);
  blob(p, 16, 15, 14, 10.5, STONE, 7, { lobes: 4, amp: 0.08, noise: 0.3, lx: 0.6, ly: 0.9 });
  blob(p, 25, 20, 6.5, 5, STONE, 11, { lobes: 4, amp: 0.1, noise: 0.3, bias: 0.15 });
  // fenda e liquens
  line(p, 12, 8, 15, 17, '#6a5a78');
  line(p, 13, 8, 16, 17, '#e4dad0');
  for (const [x, y, c] of [
    [8, 10, '#e8943c'],
    [9, 10, '#e8943c'],
    [19, 7, '#d8c050'],
    [20, 7, '#d8c050'],
    [22, 12, '#9aa682'],
    [6, 15, '#f2ece0'],
  ] as const) p.px(x, y, c);
}

function seixos(p: Painter): void {
  shadow(p, 8, 13, 7, 2, 0.4, SHADE);
  blob(p, 6, 10, 4.5, 3.4, STONE, 3, { lobes: 4, amp: 0.1, noise: 0.3 });
  blob(p, 11.5, 12, 3, 2.3, STONE, 5, { lobes: 4, amp: 0.1, noise: 0.3, bias: 0.1 });
  p.px(5, 8, '#e8943c');
}

// ------------------------------------------------------------------ transição: cocais e cerrado

function babacu(p: Painter): void {
  shadow(p, 32, 85, 16, 3.6, 0.36, SHADE);
  const b = trunk(64, 88, 32, 34, 86, 3.6, 4.6, 78, -1);
  b.render(p, PALM_TRUNK, 13, 0.35);
  // bases das folhas velhas em escamas diagonais
  for (let y = 36; y < 84; y += 3) {
    for (let x = 28; x < 37; x++) if (b.has(x, y) && b.has(x - 1, y) && b.has(x + 1, y) && (x + y) % 4 === 0) p.px(x, y, '#5a4a4a').px(x + 1, y - 1, '#c4ac84');
  }
  // folhas secas pendendo sob a coroa
  for (const dir of [-1, -0.6, 0.7, 1]) frond(p, 32, 34, dir, 14, -0.4, 2.2, DRY_FROND, 2);
  // cacho de cocos de babaçu
  for (const [x, y] of [
    [28, 36],
    [30, 38],
    [33, 37],
    [35, 35],
  ] as const) {
    p.px(x, y, '#8a5a2a').px(x + 1, y, '#c08040').px(x, y + 1, '#5a3420').px(x + 1, y + 1, '#8a5a2a');
  }
  // folhas enormes, eretas e arqueadas (plumas)
  const fronds: [number, number, number, number][] = [
    [-1, 26, 1.2, 1.6],
    [1, 26, 1.2, 1.6],
    [-0.8, 28, 2.4, 1.0],
    [0.8, 28, 2.4, 1.0],
    [-0.5, 26, 3.4, 0.55],
    [0.5, 26, 3.4, 0.55],
    [-0.2, 24, 4.2, 0.3],
    [0.25, 24, 4.2, 0.3],
  ];
  for (const [dir, len, lift, droop] of fronds) {
    frond(p, 32, 33, dir, len, lift, droop, BABACU, 4);
    frond(p, 32, 32, dir * 0.97, len - 1, lift, droop, BABACU, 3);
  }
  p.px(32, 32, '#f0f4a0').px(31, 33, '#b8e46a');
}

/** Folha em leque (palmeira de folha palmada): setores finos irradiando de (cx, cy). */
function fan(p: Painter, cx: number, cy: number, a0: number, a1: number, r: number, pal: Pal5): void {
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const x1 = cx + Math.cos(a) * r;
    const y1 = cy + Math.sin(a) * r * 0.85;
    line(p, cx, cy, x1, y1 + 1, pal.o);
    line(p, cx, cy, x1, y1, i % 2 ? pal.m : pal.l);
    p.px(Math.round(x1), Math.round(y1), i % 3 === 0 ? pal.h : pal.l);
  }
}

function carnauba(p: Painter): void {
  shadow(p, 20, 77, 11, 3, 0.36, SHADE);
  const b = trunk(40, 80, 20, 22, 78, 2.2, 2.8, 72, 1);
  b.render(p, PALM_TRUNK, 17, 0.3);
  // espiral de bases de folhas na parte de baixo do tronco
  for (let y = 50; y < 78; y++) for (let x = 16; x < 25; x++) if (b.has(x, y) && b.has(x - 1, y) && b.has(x + 1, y) && (x * 2 + y) % 5 === 0) p.px(x, y, '#4a3a3a');
  // saia de folhas secas
  for (const dir of [-1, -0.5, 0.5, 1]) frond(p, 20, 24, dir, 9, -0.6, 2.6, DRY_FROND, 2);
  // coroa redonda de folhas em leque, cerosas e verde-acinzentadas
  const fans: [number, number, number, number, number][] = [
    [20, 18, Math.PI * 0.95, Math.PI * 1.45, 13],
    [20, 18, Math.PI * 1.55, Math.PI * 2.05, 13],
    [20, 17, Math.PI * 1.25, Math.PI * 1.75, 14],
    [19, 20, Math.PI * 0.7, Math.PI * 1.1, 11],
    [21, 20, Math.PI * 1.9, Math.PI * 2.3, 11],
  ];
  for (const [x, y, a0, a1, r] of fans) fan(p, x, y, a0, a1, r, CARNAUBA);
  disc(p, 20, 19, 2, 1.6, '#4a6a52');
}

function pequizeiro(p: Painter): void {
  shadow(p, 28, 57, 20, 3.8, 0.38, SHADE);
  const b = trunk(56, 60, 28, 26, 57, 3, 5, 50, 4);
  b.render(p, CORK, 53, 0.6);
  // casca grossa de cortiça, toda fendida (árvore do cerrado, resistente ao fogo)
  for (let y = 28; y < 56; y += 2) {
    const x = 25 + Math.round(hash2(y, 2, 3) * 6);
    if (b.has(x, y) && b.has(x, y + 1)) p.px(x, y, '#3a2a2e').px(x, y + 1, '#3a2a2e');
  }
  branch(p, 30, 32, 14, 20, CORK);
  branch(p, 31, 30, 44, 18, CORK);
  canopy(p, 28, 18, 25, 14, 28, 2626, 4.4, 7, JUA, false);
  const r = rng(26);
  for (let i = 0; i < 9; i++) {
    const x = Math.round(8 + r() * 40);
    const y = Math.round(8 + r() * 18);
    p.px(x, y, '#f8f0c8').px(x + 1, y, '#fff8e0').px(x, y + 1, '#e8d080');
  }
}

function capim(p: Painter): void {
  const r = rng(404);
  for (const pass of [0, 1]) {
    for (let i = 0; i < 7; i++) {
      const x0 = 5 + i * 1.1;
      const lean = (i - 3) * 0.9 + (r() - 0.5) * 0.4;
      const h = 6 + Math.floor(hash2(i, 1, 4) * 6);
      for (let k = 0; k <= h; k++) {
        const t = k / h;
        const x = Math.round(x0 + lean * t * 1.6);
        const y = 14 - k;
        if (pass === 0) p.px(x - 1, y, '#4a4a2e');
        else p.px(x, y, t < 0.3 ? '#6e7a36' : t < 0.7 ? '#a8b04a' : t < 1 ? '#d8d070' : '#fff4b0');
      }
    }
  }
}

export const CAATINGA_PAINTERS: Painters = {
  mandacaru,
  facheiro,
  xique_xique: xiqueXique,
  coroa_de_frade: coroaDeFrade,
  macambira,
  juazeiro,
  umbuzeiro,
  catingueira,
  aroeira,
  garrancho,
  matacao,
  seixos,
  babacu,
  carnauba,
  pequizeiro,
  capim,
};
