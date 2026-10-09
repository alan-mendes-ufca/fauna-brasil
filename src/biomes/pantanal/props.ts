import { rng, type Painter } from '../../art/canvas';
import { Body, blob, canopy, frond, hash2, line, shadow, type CanopyPals, type Pal5 } from '../../art/draw';
import type { PropSpec } from '../../art/forest';
import type { PropPainter } from '../types';

// Objetos do Pantanal (prefixo pan_). Mesmo contrato da floresta: textura `prop_<tipo>`, centrada na base e apoiada no fundo.
// Sol forte do alto à esquerda; sombras projetadas teal-esverdeadas. Reaproveita placa, vitoria_regia e cupinzeiro.

export const PROPS: Record<string, PropSpec> = {
  pan_caranda: { w: 40, h: 80, fw: 1, fh: 1, canopy: true },
  pan_paratudo: { w: 56, h: 64, fw: 1, fh: 1, canopy: true },
  pan_ipe_rosa: { w: 56, h: 64, fw: 1, fh: 1, canopy: true },
  pan_capao: { w: 64, h: 84, fw: 1, fh: 1, canopy: true },
  pan_acuri: { w: 64, h: 44, fw: 1, fh: 1, canopy: true },
  pan_aguape: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
  pan_ninho_tuiuiu: { w: 48, h: 76, fw: 1, fh: 1, canopy: true },
  pan_cerca: { w: 16, h: 16, fw: 1, fh: 1 },
  pan_porteira: { w: 48, h: 32, fw: 3, fh: 1, walkable: true, canopy: true },
  pan_tronco_seco: { w: 32, h: 16, fw: 2, fh: 1 },
  pan_capim_alto: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
};

const SHADE = '#0c3a30';

const CARANDA: Pal5 = { o: '#1e3a30', d: '#3a6a50', m: '#6a9a64', l: '#a4c47e', h: '#e0eca8' };
const CARANDA_TRUNK: Pal5 = { o: '#3c4a3e', d: '#7e8a78', m: '#b4bca4', l: '#dcdcc4', h: '#f6f4e0' };
const ACURI: Pal5 = { o: '#0a2c26', d: '#14563a', m: '#2a8e40', l: '#6cc84c', h: '#e0f48a' };
const BARK_GREY: Pal5 = { o: '#2a2a2a', d: '#585048', m: '#8e8474', l: '#c0b49c', h: '#ece0c4' };
const BARK_DARK: Pal5 = { o: '#201810', d: '#46321e', m: '#76583a', l: '#a88458', h: '#d8b484' };
const WOOD: Pal5 = { o: '#2a2018', d: '#5e4a34', m: '#9a8062', l: '#cdb28a', h: '#f0dcb4' };

const TREE_GREEN = (flower: Pal5): CanopyPals => ({
  gold: flower,
  lime: { o: '#0e3426', d: '#1e5c36', m: '#3a8c3c', l: '#82c04a', h: '#d8ec80' },
  teal: { o: '#08241f', d: '#10443a', m: '#1e6c44', l: '#3a9a4c', h: '#96d460' },
  dark: { o: '#061e1c', d: '#0c3a34', m: '#175a3c', l: '#2c8446', h: '#7ac45a' },
});
const YELLOW: CanopyPals = TREE_GREEN({ o: '#6a4a10', d: '#c48a10', m: '#f0b820', l: '#ffe048', h: '#fff8b0' });
const PINK: CanopyPals = TREE_GREEN({ o: '#6a1a40', d: '#b03070', m: '#e86098', l: '#ff9cc4', h: '#ffe4f0' });
const FIG: CanopyPals = {
  gold: { o: '#1e3a1c', d: '#44742a', m: '#8cb42c', l: '#d0d44a', h: '#fff0a8' },
  lime: { o: '#0c3024', d: '#1c5a36', m: '#2e8c3e', l: '#74c44a', h: '#d8f08a' },
  teal: { o: '#06241f', d: '#0c423a', m: '#1a6a44', l: '#32984c', h: '#8ad05e' },
  dark: { o: '#051c1c', d: '#0a3632', m: '#14583a', l: '#287e44', h: '#6cc058' },
};

/** Tronco curvo de (x0, yBase) até yTop, que se inclina `lean` px; hw no pé e no topo. */
function trunkBody(b: Body, x0: number, yBase: number, yTop: number, lean: number, hwBase: number, hwTop: number): void {
  for (let y = yTop; y <= yBase; y++) {
    const t = (yBase - y) / (yBase - yTop);
    const cx = x0 + lean * t * t;
    const hw = hwTop + (hwBase - hwTop) * (1 - t) ** 2.2;
    for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) b.set(x, y, (x - cx) / hw);
  }
}

function furrows(p: Painter, b: Body, seed: number, dark: string, light: string): void {
  const r = rng(seed);
  for (let i = 0; i < b.w * b.h * 0.05; i++) {
    const x = Math.floor(r() * b.w);
    const y = Math.floor(r() * b.h);
    if (!b.has(x, y) || !b.has(x - 1, y) || !b.has(x + 1, y) || !b.has(x, y + 2)) continue;
    p.px(x, y, dark).px(x, y + 1, dark);
    if (b.has(x + 1, y)) p.px(x + 1, y, light);
  }
}

// ------------------------------------------------------------------ palmeiras

function caranda(p: Painter): void {
  shadow(p, 20, 77, 11, 3, 0.36, SHADE);
  const b = new Body(40, 80);
  trunkBody(b, 20, 78, 22, 1, 2.6, 1.8);
  b.render(p, CARANDA_TRUNK, 3, 0.3);
  // anéis das cicatrizes das folhas
  for (let y = 26; y < 74; y += 3) for (let x = 0; x < 40; x++) if (b.has(x, y) && b.has(x - 1, y) && b.has(x + 1, y)) p.px(x, y, hash2(x, y, 1) < 0.5 ? '#8a9486' : '#a6ae98');
  // saia de folhas secas penduradas sob a copa
  for (const [dx, len] of [[-3, 9], [-1, 11], [1, 10], [3, 8], [-4, 6]] as const) {
    for (let k = 0; k < len; k++) p.px(20 + dx + Math.round(Math.sin(k * 0.4 + dx) * 0.7), 24 + k, k < len - 2 ? '#a08a52' : '#6a5832');
  }
  // copa em leque: cada folha é um feixe de folíolos que saem do mesmo ponto
  const cx = 20.5;
  const cy = 20;
  const fans: [number, number][] = [
    [-90, 15], [-68, 15], [-112, 15], [-46, 14], [-134, 14], [-22, 13], [-158, 13], [4, 11], [176, 11], [28, 8], [152, 8],
  ];
  for (const [deg, L] of fans) {
    const a = (deg * Math.PI) / 180;
    for (let s = -3; s <= 3; s++) {
      const aa = a + s * 0.085;
      const len = L * (1 - Math.abs(s) * 0.045);
      for (let t = 3; t <= len; t += 0.5) {
        const droop = deg > -30 || deg < -150 ? (t / L) ** 2 * 5 : (t / L) ** 3 * 2;
        const x = Math.round(cx + Math.cos(aa) * t);
        const y = Math.round(cy + Math.sin(aa) * t * 0.9 + droop);
        const lit = -Math.cos(aa) * 0.6 - Math.sin(aa) * 0.8 + (s === 0 ? 0.15 : 0);
        p.px(x, y, t > len - 1.5 ? CARANDA.h : lit > 0.45 ? CARANDA.l : lit > -0.15 ? CARANDA.m : CARANDA.d);
      }
    }
  }
  blob(p, cx, cy + 1, 3.2, 2.6, CARANDA, 77, { lobes: 5, amp: 0.2 });
  p.px(19, 19, CARANDA.h).px(20, 18, CARANDA.h);
}

function acuri(p: Painter): void {
  shadow(p, 32, 41, 22, 3.6, 0.36, SHADE);
  // base do estipe curto, escondido pelas folhas
  const b = new Body(64, 44);
  trunkBody(b, 32, 42, 30, 0, 4, 3);
  b.render(p, BARK_DARK, 6, 0.4);
  const fronds: [number, number, number, number][] = [
    [-1, 28, 1.4, 1.6],
    [-0.85, 27, 2.4, 1.0],
    [-0.5, 25, 3.2, 0.7],
    [-0.2, 22, 3.8, 0.4],
    [0.2, 22, 3.8, 0.4],
    [0.5, 25, 3.2, 0.7],
    [0.85, 27, 2.4, 1.0],
    [1, 28, 1.4, 1.6],
  ];
  for (const [dir, len, lift, droop] of fronds) frond(p, 32, 36, dir, len, lift, droop, ACURI, 4);
  // cacho de cocos marrons sob as folhas
  for (const [x, y] of [[30, 37], [33, 38], [35, 36], [28, 39]] as const) p.px(x, y, '#5a3a1c').px(x + 1, y, '#8a5a2c').px(x, y + 1, '#2e1c0c');
  p.px(32, 36, ACURI.h).px(31, 37, ACURI.l);
}

// ------------------------------------------------------------------ árvores

function flowerTree(p: Painter, pals: CanopyPals, seed: number, lean: number): void {
  shadow(p, 28, 61, 16, 3.8, 0.36, SHADE);
  const b = new Body(56, 64);
  trunkBody(b, 28, 62, 26, lean, 3.6, 2.2);
  // dois galhos que abrem a copa
  for (let t = 0; t < 14; t++) {
    b.set(28 + lean + Math.round(-t * 0.6), 30 - t, -0.4);
    b.set(29 + lean + Math.round(-t * 0.6), 30 - t, 0.3);
    b.set(28 + lean + Math.round(t * 0.7), 30 - t, -0.2);
    b.set(29 + lean + Math.round(t * 0.7), 30 - t, 0.4);
  }
  b.render(p, BARK_GREY, 8, 0.4);
  furrows(p, b, seed, '#4a4238', '#d8cdb4');
  canopy(p, 28, 22, 26, 18, 38, seed, 4.5, 8, pals);
  // cachos de flores por cima da copa
  const rf = rng(seed + 9);
  for (let i = 0; i < 26; i++) {
    const a = rf() * 6.283;
    const d = Math.sqrt(rf());
    const x = Math.round(28 + Math.cos(a) * d * 22);
    const y = Math.round(20 + Math.sin(a) * d * 14 - 2);
    p.px(x, y, pals.gold.l).px(x + 1, y, pals.gold.h).px(x, y + 1, pals.gold.m);
  }
  // pétalas no chão
  const r = rng(seed + 5);
  const c = pals.gold.l;
  for (let i = 0; i < 8; i++) p.px(14 + Math.floor(r() * 28), 58 + Math.floor(r() * 4), i % 2 ? c : pals.gold.m);
}

function capao(p: Painter): void {
  shadow(p, 32, 81, 20, 4.2, 0.38, SHADE);
  const b = new Body(64, 84);
  trunkBody(b, 32, 82, 36, 0, 5, 3.2);
  // raízes tabulares curtas
  for (const X of [-9, 9, -5, 5]) {
    for (let y = 70; y < 83; y++) {
      const t = (y - 70) / 12;
      const cx = 32 + X * t * t;
      const hw = 1 + 1.6 * t;
      for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) b.set(x, y, (x - cx) / hw);
    }
  }
  b.render(p, BARK_DARK, 9, 0.45);
  furrows(p, b, 91, '#2a1c10', '#b08a5a');
  // cipós e samambaias no tronco
  for (const x0 of [28, 36]) for (let y = 38; y < 70; y++) if (b.has(x0 + Math.round(Math.sin(y / 5)), y)) p.px(x0 + Math.round(Math.sin(y / 5)), y, y % 5 === 0 ? '#7ad04a' : '#2a6a2e');
  canopy(p, 32, 30, 30, 26, 52, 5151, 5.5, 9.5, FIG);
  for (const [x, y] of [[10, 52], [22, 58], [44, 58], [54, 50]] as const) blob(p, x, y, 4.2, 3.2, FIG.teal, x * 3, { bias: 0.25, amp: 0.2 });
}

function ninhoTuiuiu(p: Painter): void {
  shadow(p, 24, 73, 12, 3.2, 0.36, SHADE);
  const b = new Body(48, 76);
  trunkBody(b, 24, 74, 30, 0, 3.4, 2.4);
  b.render(p, BARK_GREY, 12, 0.4);
  furrows(p, b, 121, '#4a4238', '#d8cdb4');
  // galhos nus em garfo
  for (const [x1, y1] of [[8, 14], [40, 12], [14, 24], [36, 24], [24, 8]] as const) {
    line(p, 24, 34, x1, y1, '#4a4034');
    line(p, 25, 34, x1 + 1, y1, '#8e8474');
  }
  // folhinhas verdes nas pontas
  for (const [x, y] of [[8, 14], [40, 12], [24, 8], [14, 24], [36, 24]] as const) blob(p, x, y, 3.6, 2.8, ACURI, x + y, { bias: 0.1, amp: 0.25 });
  // o ninho: montanha de gravetos trançados
  const r = rng(808);
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    const x = 24 + Math.cos(a) * d * 11;
    const y = 26 + Math.sin(a) * d * 4.5;
    const l = 3 + r() * 4;
    const ang = (r() - 0.5) * 1.1;
    line(p, x, y, x + Math.cos(ang) * l, y + Math.sin(ang) * l * 0.6, r() < 0.5 ? '#6a4c2c' : r() < 0.5 ? '#a47c4c' : '#3e2a18');
  }
  for (let i = 0; i < 10; i++) p.px(14 + Math.floor(r() * 20), 27 + Math.floor(r() * 5), r() < 0.5 ? '#e6e2d4' : '#cfc9b4');
  line(p, 13, 29, 35, 29, '#3e2a18');
}

// ------------------------------------------------------------------ plantas d'água e capim

function aguape(p: Painter): void {
  const r = rng(515);
  const clump = (cx: number, cy: number, big: number) => {
    // folhas redondas e brilhantes em roseta
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 6.283 + r();
      const x = cx + Math.cos(a) * big * 2.2;
      const y = cy + Math.sin(a) * big * 1.2;
      blob(p, x, y, big * 1.5, big, { o: '#0c3a26', d: '#1a6a34', m: '#38a044', l: '#7cd05a', h: '#d0f890' }, i + cx * 3, { lobes: 4, amp: 0.15, bias: 0.05 });
    }
    // espiga lilás
    const x = cx + 1;
    p.vline(x, cy - 6, 5, '#2e8a3a');
    for (const [dx, dy, c] of [[0, -8, '#e0b8f8'], [-1, -7, '#b27ad8'], [1, -7, '#d8a8f0'], [0, -6, '#8a52b8'], [1, -6, '#fff0a0']] as const) p.px(x + dx, cy + dy + 2, c);
  };
  clump(5, 11, 1.7);
  clump(11, 12, 1.3);
}

function capimAlto(p: Painter): void {
  const r = rng(616);
  shadow(p, 8, 14, 6, 1.6, 0.25, SHADE);
  for (let i = 0; i < 9; i++) {
    const x0 = 2 + Math.floor(r() * 12);
    const h = 8 + Math.floor(r() * 6);
    const lean = (r() - 0.5) * 3;
    for (let k = 0; k < h; k++) {
      const t = k / h;
      const x = Math.round(x0 + lean * t);
      p.px(x, 15 - k, t < 0.3 ? '#2e6a30' : t < 0.7 ? '#4a9a3a' : '#86cc4a');
    }
    if (i % 3 === 0) {
      const x = Math.round(x0 + lean);
      p.px(x, 15 - h, '#fff6c0').px(x + 1, 16 - h, '#e8dc90').px(x - 1, 16 - h, '#e8dc90');
    }
  }
}

// ------------------------------------------------------------------ obras da fazenda

function cerca(p: Painter): void {
  shadow(p, 8, 15, 8, 1.4, 0.3, SHADE);
  // mourão de madeira de lei com a ponta clareada
  p.rect(6, 3, 4, 13, '#6a4a2a').vline(6, 3, 13, '#b08a56').vline(9, 3, 13, '#3a2814').hline(6, 3, 4, '#d8b480').px(7, 5, '#3a2814').px(8, 9, '#3a2814');
  // três fios de arame liso
  for (const y of [5, 8, 11]) {
    p.hline(0, y, 6, '#c8c4b8').hline(10, y, 6, '#c8c4b8');
    p.hline(0, y + 1, 6, 'rgba(20,50,40,0.4)').hline(10, y + 1, 6, 'rgba(20,50,40,0.4)');
    p.px(5, y, '#8a8678').px(10, y, '#8a8678');
  }
  // capim no pé
  p.px(4, 15, '#4a9a3a').px(4, 14, '#86cc4a').px(12, 15, '#4a9a3a').px(13, 14, '#86cc4a');
}

function porteira(p: Painter): void {
  shadow(p, 24, 30, 22, 2.2, 0.28, SHADE);
  const post = (x: number) => {
    p.rect(x, 4, 4, 28, '#6a4a2a').vline(x, 4, 28, '#b08a56').vline(x + 3, 4, 28, '#3a2814').hline(x, 3, 4, '#d8b480');
  };
  post(3);
  post(41);
  // viga de cima com a tábua da fazenda pendurada
  p.rect(2, 2, 44, 4, '#7a5632').hline(2, 2, 44, '#c89a62').hline(2, 5, 44, '#3a2814');
  for (const x of [8, 18, 30, 38]) p.px(x, 3, '#3a2814');
  p.rect(14, 6, 20, 7, '#d8b480').frame(14, 6, 20, 7, '#3a2814').vline(17, 6, 1, '#3a2814').vline(30, 6, 1, '#3a2814');
  // marca de ferro: uma estrela e um traço queimados
  p.px(24, 8, '#4a2a14').px(23, 9, '#4a2a14').px(25, 9, '#4a2a14').px(24, 10, '#4a2a14').px(24, 9, '#4a2a14').hline(19, 9, 3, '#4a2a14').hline(27, 9, 3, '#4a2a14');
  // a porteira aberta, encostada no mourão da esquerda
  for (const y of [14, 19, 24]) p.hline(7, y, 12, '#c89a62').hline(7, y + 1, 12, '#6a4a2a').hline(7, y + 2, 12, '#3a2814');
  p.vline(18, 14, 13, '#6a4a2a').vline(8, 14, 13, '#6a4a2a');
  line(p, 8, 26, 18, 14, '#a07844');
  // capim no pé dos mourões
  for (const x of [2, 7, 40, 45]) p.px(x, 31, '#4a9a3a').px(x, 30, '#86cc4a');
}

function troncoSeco(p: Painter): void {
  shadow(p, 16, 14, 14, 2.4, 0.34, SHADE);
  const b = new Body(32, 16);
  for (let x = 2; x < 30; x++) {
    const hw = 4.2 - (x < 6 ? (6 - x) * 0.3 : 0) + Math.sin(x * 0.7) * 0.4;
    const cy = 9 + Math.sin(x * 0.2) * 0.8;
    for (let y = Math.round(cy - hw); y <= Math.round(cy + hw); y++) b.set(x, y, (y - cy) / hw);
  }
  b.render(p, WOOD, 4, 0.35);
  // fissuras e anéis na ponta cortada
  const r = rng(95);
  for (let i = 0; i < 14; i++) {
    const x = 5 + Math.floor(r() * 22);
    const y = 6 + Math.floor(r() * 6);
    if (b.has(x, y) && b.has(x + 2, y)) p.hline(x, y, 2, '#4a3a2a');
  }
  p.px(3, 9, '#6a5238').px(4, 8, '#8a6c48').px(4, 10, '#6a5238');
  // galho quebrado, musgo e bromélia
  line(p, 22, 6, 27, 1, '#5e4a34');
  line(p, 23, 6, 28, 1, '#a08a62');
  for (const x of [9, 10, 15, 24]) p.px(x, 5, '#4a9a3a').px(x + 1, 5, '#86cc4a');
  p.px(17, 4, '#ff6a8a').px(18, 4, '#ffa0b8').px(16, 5, '#2a8a44').px(17, 5, '#ff6a8a').px(18, 5, '#2a8a44');
}

export const PAINTERS: Record<string, PropPainter> = {
  pan_caranda: caranda,
  pan_paratudo: (p) => flowerTree(p, YELLOW, 4711, 2),
  pan_ipe_rosa: (p) => flowerTree(p, PINK, 5822, -2),
  pan_capao: capao,
  pan_acuri: acuri,
  pan_aguape: aguape,
  pan_ninho_tuiuiu: ninhoTuiuiu,
  pan_cerca: cerca,
  pan_porteira: porteira,
  pan_tronco_seco: troncoSeco,
  pan_capim_alto: capimAlto,
};
