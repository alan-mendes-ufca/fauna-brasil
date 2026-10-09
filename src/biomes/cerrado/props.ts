import { rng, type Painter } from '../../art/canvas';
import { Body, blob, canopy, disc, frond, hash2, line, shadow, type CanopyPals, type Pal5 } from '../../art/draw';
import type { PropSpec } from '../../art/forest';
import type { PropPainter } from '../types';

// Objetos do Cerrado. Mesmo contrato da floresta: textura `prop_<tipo>`, centrada na largura da base e apoiada no fundo.
// Sol forte do alto à esquerda; sombras projetadas frias (verde-azuladas).

export const PROPS: Record<string, PropSpec> = {
  cer_buriti: { w: 56, h: 104, fw: 1, fh: 1, canopy: true },
  cer_ipe_amarelo: { w: 64, h: 72, fw: 1, fh: 1, canopy: true },
  cer_pau_terra: { w: 56, h: 60, fw: 1, fh: 1, canopy: true },
  cer_barbatimao: { w: 48, h: 52, fw: 1, fh: 1, canopy: true },
  cer_canela_de_ema: { w: 24, h: 32, fw: 1, fh: 1 },
  cer_lobeira: { w: 32, h: 28, fw: 1, fh: 1 },
  cer_capim_dourado: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
  cer_flores: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
  cer_arenito: { w: 32, h: 24, fw: 2, fh: 1 },
};

const SHADE = '#10303a';

const BARK: Pal5 = { o: '#22181e', d: '#4a3430', m: '#765848', l: '#a48468', h: '#d8bc90' };
const BARK_RED: Pal5 = { o: '#2a161c', d: '#5a2e2c', m: '#8a5040', l: '#b87858', h: '#e8b080' };
const BURITI: Pal5 = { o: '#0a2a22', d: '#17583a', m: '#2e9042', l: '#74c64e', h: '#e8f088' };
const PALM_TRUNK: Pal5 = { o: '#2a2230', d: '#564c4a', m: '#8a7a68', l: '#bcaa88', h: '#ece0b8' };
const SANDSTONE: Pal5 = { o: '#4a2a40', d: '#8a5254', m: '#c08068', l: '#e8b890', h: '#fbe2bc' };

const IPE: CanopyPals = {
  gold: { o: '#6a4a10', d: '#c08a18', m: '#f0b82a', l: '#ffd84a', h: '#fff6b0' },
  lime: { o: '#6a3a10', d: '#b87818', m: '#e8a622', l: '#ffcc3a', h: '#fff0a0' },
  teal: { o: '#2a3a1a', d: '#58702a', m: '#8aa034', l: '#bccb4a', h: '#f0f08a' },
  dark: { o: '#1a3020', d: '#355c2c', m: '#5a8a34', l: '#8cb446', h: '#d8e888' },
};
const TWISTED: CanopyPals = {
  gold: { o: '#2e3a1a', d: '#68782c', m: '#a0aa3c', l: '#d4d05a', h: '#fff4a8' },
  lime: { o: '#1c3220', d: '#3c6a2c', m: '#689638', l: '#a4c452', h: '#eaf49a' },
  teal: { o: '#14302a', d: '#26503c', m: '#3a7442', l: '#5c9c4a', h: '#a4cc68' },
  dark: { o: '#122a2a', d: '#1e4436', m: '#2e623c', l: '#468848', h: '#bcd878' },
};

/** Tronco recortado, com leve ondulação; lean desloca o topo. */
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

/** Galho grosso e torto: segmentos com desvios, típico das árvores do cerrado. */
function crooked(p: Painter, x0: number, y0: number, x1: number, y1: number, pal: Pal5, seed: number): void {
  const r = rng(seed);
  const n = 3;
  let px = x0;
  let py = y0;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const nx = x0 + (x1 - x0) * t + (i < n ? (r() - 0.5) * 8 : 0);
    const ny = y0 + (y1 - y0) * t + (i < n ? (r() - 0.5) * 6 : 0);
    branch(p, px, py, nx, ny, pal);
    px = nx;
    py = ny;
  }
}

// ------------------------------------------------------------------ árvores

function buriti(p: Painter): void {
  shadow(p, 28, 101, 12, 3, 0.36, SHADE);
  const b = trunk(56, 104, 28, 40, 102, 2.6, 3.4, 92, 1.5, 0.5);
  b.render(p, PALM_TRUNK, 17, 0.3);
  // anéis das bases de folhas caídas
  for (let y = 44; y < 100; y += 4) for (let x = 22; x < 36; x++) if (b.has(x, y) && b.has(x - 1, y) && b.has(x + 1, y)) p.px(x, y, '#5a4a44');
  // folhas secas penduradas sob a coroa
  for (const dir of [-1, -0.5, 0.5, 1]) frond(p, 29, 40, dir, 8, -0.5, 2.8, { o: '#3a2a22', d: '#7a5434', m: '#b07c44', l: '#d8a85c', h: '#f4d48a' }, 2);
  // coroa grande de palmas em leque, verde-vivas
  for (const [dir, len, lift, droop] of [
    [-1, 25, 0.5, 0.9],
    [1, 25, 0.5, 0.9],
    [-0.8, 22, 1.4, 0.9],
    [0.8, 22, 1.4, 0.9],
    [-0.45, 19, 1.9, 0.6],
    [0.45, 19, 1.9, 0.6],
    [-0.98, 17, -0.2, 2.2],
    [0.98, 17, -0.2, 2.2],
  ] as const) {
    frond(p, 29, 36, dir, len, lift, droop, BURITI, 4);
    frond(p, 29, 35, dir * 0.97, len - 1, lift, droop, BURITI, 3);
  }
  disc(p, 29, 36, 2.4, 1.8, '#2e5a3a');
  // cacho de frutos vermelho-acastanhados
  for (const [x, y] of [[26, 41], [27, 43], [25, 43], [28, 41]] as const) p.px(x, y, '#a83a2a').px(x + 1, y, '#e0704a');
  p.px(29, 33, '#f0f4a0').px(28, 34, '#b8e46a');
}

function ipeAmarelo(p: Painter): void {
  shadow(p, 32, 69, 24, 4.2, 0.4, SHADE);
  const b = trunk(64, 72, 32, 36, 69, 2.8, 5.2, 58, 3);
  b.render(p, BARK, 11, 0.5);
  for (let y = 38; y < 66; y += 3) p.px(30 + (y % 3), y, '#3a2a30').px(34, y + 1, '#c4a888');
  branch(p, 32, 42, 16, 28, BARK);
  branch(p, 33, 40, 48, 26, BARK);
  canopy(p, 32, 24, 27, 18, 38, 515, 4.6, 7.6, IPE, false);
  // chuva de flores amarelas
  const r = rng(61);
  for (let i = 0; i < 26; i++) {
    const a = r() * 6.283;
    const d = Math.sqrt(r()) * 0.9;
    const x = Math.round(32 + Math.cos(a) * d * 28);
    const y = Math.round(24 + Math.sin(a) * d * 19);
    p.px(x, y, '#fff2a0').px(x + 1, y, '#ffd23a').px(x, y + 1, '#e8a418');
  }
  for (let i = 0; i < 6; i++) p.px(14 + Math.round(r() * 38), 46 + Math.round(r() * 22), '#ffd23a');
}

function pauTerra(p: Painter): void {
  shadow(p, 28, 57, 18, 3.6, 0.38, SHADE);
  const b = trunk(56, 60, 28, 28, 57, 2.6, 4.4, 48, -3, 1.2);
  b.render(p, BARK_RED, 21, 0.6);
  for (let y = 30; y < 56; y += 2) {
    const x = 26 + Math.round(hash2(y, 2, 9) * 4) - Math.round(Math.sin(y * 0.35) * 0.0);
    if (b.has(x, y) && b.has(x, y + 1)) p.px(x, y, '#2e1a1e');
  }
  crooked(p, 27, 36, 8, 22, BARK_RED, 3);
  crooked(p, 29, 32, 46, 16, BARK_RED, 8);
  crooked(p, 28, 30, 30, 10, BARK_RED, 12);
  // copa em camadas, achatada, com tufos soltos e espaços de céu
  const r = rng(77);
  for (let i = 0; i < 20; i++) {
    const anchor = [[10, 18], [46, 14], [30, 8], [20, 20], [38, 22]][i % 5];
    const x = anchor[0] + (r() - 0.5) * 16;
    const y = anchor[1] + (r() - 0.5) * 8;
    const pal = y < 14 && x < 30 ? TWISTED.gold : y > 20 ? TWISTED.teal : TWISTED.lime;
    blob(p, x, y, 4 + r() * 2.6, 2.8 + r() * 1.2, pal, 140 + i * 9, { lobes: 6, amp: 0.3, bias: (y - 14) * 0.03, noise: 0.5 });
  }
  for (let i = 0; i < 5; i++) p.px(Math.round(10 + r() * 36), Math.round(8 + r() * 14), '#ffe45a').px(Math.round(10 + r() * 36) + 1, 12, '#fff4b8');
}

function barbatimao(p: Painter): void {
  shadow(p, 24, 49, 15, 3.2, 0.36, SHADE);
  const b = trunk(48, 52, 24, 24, 49, 2.2, 3.6, 40, 4, 1.4);
  b.render(p, BARK, 33, 0.5);
  crooked(p, 24, 30, 8, 18, BARK, 21);
  crooked(p, 25, 28, 40, 14, BARK, 29);
  const r = rng(95);
  for (let i = 0; i < 16; i++) {
    const x = 24 + (r() - 0.5) * 34;
    const y = 17 + (r() - 0.5) * 12;
    const pal = x < 22 && y < 15 ? TWISTED.gold : y > 19 ? TWISTED.dark : TWISTED.lime;
    blob(p, x, y, 3.4 + r() * 1.8, 2.6 + r() * 1.2, pal, 300 + i * 7, { lobes: 6, amp: 0.3, noise: 0.5 });
  }
  // vagens escuras penduradas
  for (const [x, y] of [[12, 24], [30, 26], [38, 23]] as const) p.px(x, y, '#5a2e28').px(x, y + 1, '#8a4a3a');
}

// ------------------------------------------------------------------ plantas baixas

function canelaDeEma(p: Painter): void {
  shadow(p, 12, 29, 9, 2.2, 0.34, SHADE);
  // caule fino, escamoso e acastanhado (as "canelas de ema")
  const stems: [number, number, number][] = [
    [9, 12, -1],
    [12, 8, 0],
    [15, 13, 1],
  ];
  for (const [x, top, lean] of stems) {
    for (let y = top; y < 29; y++) {
      const xx = x + Math.round(lean * (28 - y) * 0.04);
      p.px(xx, y, y % 3 === 0 ? '#3a2a28' : '#8a6a48').px(xx + 1, y, y % 3 === 0 ? '#5a4234' : '#c09a68');
    }
  }
  // tufos de folhas estreitas no topo de cada caule
  for (const [x, top] of stems) {
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const len = 5 + hash2(i, x, 6) * 3;
      const x1 = x + 1 + Math.cos(a) * len;
      const y1 = top + 1 + Math.sin(a) * len * 0.8 + 1;
      line(p, x + 1, top + 1, x1, y1 + 1, '#2a4a2c');
      line(p, x + 1, top + 1, x1, y1, i % 2 ? '#7a9a48' : '#a8c05c');
    }
  }
  // flor lilás-clara
  p.px(12, 6, '#e8c8f8').px(13, 6, '#d098e8').px(12, 5, '#fff0ff').px(11, 7, '#d098e8');
}

function lobeira(p: Painter): void {
  shadow(p, 16, 25, 12, 2.6, 0.36, SHADE);
  const r = rng(131);
  for (let i = 0; i < 9; i++) {
    const x = 16 + (r() - 0.5) * 20;
    const y = 12 + (r() - 0.3) * 10;
    const pal = x < 14 && y < 12 ? TWISTED.gold : y > 15 ? TWISTED.teal : TWISTED.lime;
    blob(p, x, y, 4.2 + r() * 1.6, 3 + r(), pal, 400 + i * 5, { lobes: 6, amp: 0.3, noise: 0.5 });
  }
  // lobo-fruta: bolas verde-amareladas
  for (const [x, y] of [[9, 17], [18, 19], [24, 15], [14, 21]] as const) {
    disc(p, x, y, 2.4, 2.4, '#4a5a1c');
    disc(p, x - 0.4, y - 0.4, 1.9, 1.9, '#9ab43a');
    p.px(x - 1, y - 1, '#e8f08a');
  }
  p.px(12, 7, '#b078e0').px(20, 8, '#c898f0').px(26, 11, '#b078e0');
}

function capimDourado(p: Painter): void {
  const r = rng(517);
  for (const pass of [0, 1]) {
    for (let i = 0; i < 9; i++) {
      const x0 = 3 + i * 1.1;
      const lean = (i - 4) * 0.8 + (r() - 0.5) * 0.4;
      const h = 7 + Math.floor(hash2(i, 1, 4) * 6);
      for (let k = 0; k <= h; k++) {
        const t = k / h;
        const x = Math.round(x0 + lean * t * 1.6);
        const y = 14 - k;
        if (pass === 0) p.px(x - 1, y, '#8a5a30');
        else p.px(x, y, t < 0.3 ? '#b88a3c' : t < 0.7 ? '#e0b44e' : t < 1 ? '#f6dc84' : '#fffcd8');
      }
    }
  }
  // sempre-vivas: botões brilhantes
  p.px(5, 3, '#fffcd8').px(4, 3, '#ffe890').px(6, 3, '#ffe890').px(5, 2, '#ffe890').px(5, 4, '#ffd050');
}

function flores(p: Painter): void {
  const r = rng(718);
  for (let i = 0; i < 5; i++) {
    const x = 2 + Math.floor(r() * 11);
    const y = 6 + Math.floor(r() * 8);
    for (let k = 0; k < 4; k++) p.px(x, y - k, k < 2 ? '#2e6a3a' : '#5aa044');
    const c = [['#ff7ab0', '#ffc0dc'], ['#ffb02a', '#ffe08a'], ['#c070f0', '#e8b8ff'], ['#ff5a4a', '#ffa890'], ['#fff4d8', '#ffffff']][i];
    p.px(x - 1, y - 4, c[0]).px(x + 1, y - 4, c[0]).px(x, y - 5, c[0]).px(x, y - 3, c[0]).px(x, y - 4, c[1]);
  }
}

function arenito(p: Painter): void {
  shadow(p, 16, 21, 14, 2.8, 0.38, SHADE);
  const b = new Body(32, 24);
  for (let y = 4; y < 22; y++) {
    const t = (y - 4) / 17;
    const hw = 6 + Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.5) * 9 + (hash2(y, 3, 1) - 0.5) * 1.6;
    b.span(y, Math.round(15 - hw + (y < 9 ? 3 : 0)), Math.round(16 + hw - (y < 9 ? 2 : 0)));
  }
  b.render(p, SANDSTONE, 41, 0.45);
  // estratos
  for (const y of [9, 13, 17]) for (let x = 3; x < 30; x++) if (b.has(x, y) && b.has(x, y - 1) && b.has(x - 1, y) && b.has(x + 1, y)) p.px(x, y, hash2(x, y, 3) < 0.7 ? '#a86c60' : '#e4b08c');
  p.px(10, 7, '#e8c040').px(11, 7, '#e8c040').px(21, 12, '#9ab060').px(22, 12, '#9ab060');
}

export const PAINTERS: Record<string, PropPainter> = {
  cer_buriti: buriti,
  cer_ipe_amarelo: ipeAmarelo,
  cer_pau_terra: pauTerra,
  cer_barbatimao: barbatimao,
  cer_canela_de_ema: canelaDeEma,
  cer_lobeira: lobeira,
  cer_capim_dourado: capimDourado,
  cer_flores: flores,
  cer_arenito: arenito,
};
