import { rng, type Painter } from './canvas';
import { Body, blob, canopy, dapples, disc, frond, hash2, leaf, line, rgba, shadow, LEAF, type Pal5 } from './draw';

// Desenho de cada objeto da floresta. Cada função recebe um Painter do tamanho da textura
// e desenha com o centro da base (o tronco) no centro horizontal da textura.

const BARK_PALE: Pal5 = { o: '#2a2038', d: '#5a4658', m: '#b08c68', l: '#e4c898', h: '#ffe8b0' };
const BARK_WARM: Pal5 = { o: '#2a1630', d: '#5e3040', m: '#b06a3a', l: '#e49a52', h: '#ffcf80' };
const BARK_PALM: Pal5 = { o: '#2e2438', d: '#5e5058', m: '#b0a070', l: '#e0d098', h: '#fff0b8' };
const BARK_GREY: Pal5 = { o: '#241c30', d: '#4e4458', m: '#8c8478', l: '#c4b898', h: '#f4e8b8' };
const BARK_EMB: Pal5 = { o: '#1e3a3a', d: '#4a7872', m: '#a8c0a0', l: '#dcecc0', h: '#ffffdc' };
const FERN: Pal5 = { o: '#06303a', d: '#0d5a4c', m: '#2aa844', l: '#7cd84c', h: '#e8f48a' };
const PALM: Pal5 = { o: '#052a34', d: '#0a4c44', m: '#189a3e', l: '#52d048', h: '#d8f46c' };
const BROM: Pal5 = { o: '#06303a', d: '#0c4a5a', m: '#1a9a5a', l: '#58d874', h: '#d0fa9c' };
const SILVER: Pal5 = { o: '#1c4a52', d: '#6a9aa0', m: '#a8d0c8', l: '#dcf4e8', h: '#ffffff' };

type Painters = Record<string, (p: Painter) => void>;

// ------------------------------------------------------------------ árvores

function sumauma(p: Painter): void {
  shadow(p, 32, 91, 30, 5.5, 0.36);
  const b = new Body(64, 96);
  for (let y = 36; y < 92; y++) {
    const hw = 5.5 + (y > 60 ? ((y - 60) / 31) ** 2 * 5 : 0);
    for (let x = Math.ceil(32 - hw); x <= Math.floor(32 + hw); x++) b.set(x, y, (x - 32) / hw);
  }
  // raízes tabulares: abas que descem do tronco e se abrem pelo chão
  for (const X of [-27, 27, -16, 16, -6, 6]) {
    for (let y = 56; y < 92; y++) {
      const t = (y - 56) / 35;
      const cx = 32 + X * t ** 1.5;
      const hw = 1.4 + 2.6 * t + (Math.abs(X) < 10 ? 0.5 : 0);
      for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) b.set(x, y, (x - cx) / hw);
    }
  }
  // vãos em arco entre as raízes
  for (const Xm of [-21.5, -11, 11, 21.5]) {
    for (let y = 80; y < 92; y++) {
      for (let x = 0; x < 64; x++) {
        const dx = (x - (32 + Xm)) / 3.4;
        const dy = (y - 92.5) / 8;
        if (dx * dx + dy * dy < 1) b.m[y * 64 + x] = 0;
      }
    }
  }
  b.render(p, BARK_PALE, 5, 0.5);
  // fissuras verticais e liquens
  const r = rng(808);
  for (let i = 0; i < 70; i++) {
    const x = 20 + Math.floor(r() * 24);
    const y = 38 + Math.floor(r() * 50);
    if (!b.has(x, y) || !b.has(x, y - 1) || !b.has(x - 1, y) || !b.has(x + 1, y)) continue;
    const len = 2 + Math.floor(r() * 4);
    for (let k = 0; k < len; k++) if (b.has(x, y + k) && b.has(x + 1, y + k)) p.px(x, y + k, '#5a4036');
  }
  for (let i = 0; i < 26; i++) {
    const x = 22 + Math.floor(r() * 16);
    const y = 46 + Math.floor(r() * 30);
    if (b.has(x, y) && b.has(x - 1, y) && b.has(x + 1, y) && b.has(x, y + 1)) p.px(x, y, r() < 0.5 ? '#6cb04a' : '#8ad45a');
  }
  // bromélias nas dobras do tronco
  for (const [x, y] of [
    [27, 56],
    [37, 49],
    [30, 70],
  ] as const) {
    p.px(x, y, '#ff4f8a').px(x + 1, y, '#ff9ac0').px(x - 1, y + 1, '#1fa45c').px(x, y + 1, '#ff4f8a').px(x + 1, y + 1, '#1fa45c').px(x, y + 2, '#0f6a54');
  }
  // cipós pendurados
  for (const [x0, y1] of [
    [18, 56],
    [47, 62],
    [24, 50],
  ] as const) {
    for (let y = 36; y < y1; y++) {
      const x = x0 + Math.round(Math.sin(y / 5 + x0) * 1.2);
      p.px(x, y, '#2a5a2a');
      if (y % 6 === 0) p.px(x + 1, y, '#58c050').px(x - 1, y + 1, '#3a9a40');
    }
  }
  canopy(p, 32, 25, 30.5, 20.5, 46, 4242, 5.5, 9.5);
  // franjas de folhas caindo sobre a base da copa
  for (const [x, y] of [
    [10, 40],
    [20, 44],
    [44, 45],
    [54, 40],
  ] as const) blob(p, x, y, 4.2, 3.2, LEAF.teal, x * 3, { bias: 0.25, amp: 0.2 });
}

function acai(p: Painter): void {
  shadow(p, 16, 61, 9, 3.2, 0.34);
  const b = new Body(32, 64);
  for (let y = 22; y < 62; y++) {
    const cx = 16 + Math.round(Math.sin(((61 - y) / 40) * Math.PI * 0.9) * 1.5);
    const hw = y > 56 ? 1.6 + (y - 56) * 0.55 : 1.5;
    for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) b.set(x, y, (x - cx) / hw);
  }
  b.render(p, BARK_PALM, 3, 0.3);
  for (let y = 25; y < 57; y += 3) for (let x = 0; x < 32; x++) if (b.has(x, y) && b.has(x - 1, y) && b.has(x + 1, y)) p.px(x, y, '#7a6a4c');
  // bainha verde sob a coroa e cacho de frutos roxos
  p.rect(14, 20, 5, 6, '#4a9a34').rect(14, 20, 2, 6, '#7ad04a').vline(18, 20, 6, '#1e6a2e');
  for (const [x, y] of [
    [12, 26],
    [14, 28],
    [17, 27],
    [19, 25],
    [15, 25],
    [18, 29],
    [13, 30],
  ] as const) p.px(x, y, '#4a1a7a').px(x + 1, y, '#6a2eaa').px(x, y - 1, '#a468dc').px(x + 1, y + 1, '#2e0e52');
  // fronda: arcos finos que pendem
  const fronds: [number, number, number, number][] = [
    [-1, 16, 0.8, 2.0],
    [-0.9, 15, 1.5, 1.4],
    [-0.62, 14, 2.3, 0.9],
    [-0.3, 13, 3.0, 0.5],
    [0.3, 13, 3.0, 0.5],
    [0.62, 14, 2.3, 0.9],
    [0.9, 15, 1.5, 1.4],
    [1, 16, 0.8, 2.0],
    [0, 11, 3.6, 0.2],
  ];
  for (const [dir, len, lift, droop] of fronds) frond(p, 16, 18, dir, len, lift, droop, PALM, 3);
  p.px(16, 18, '#e0fa90').px(15, 19, '#b8f46a').px(16, 19, '#6ee450');
}

function arvore(p: Painter): void {
  shadow(p, 24, 61, 14, 4, 0.34);
  const b = new Body(48, 64);
  for (let y = 34; y < 62; y++) {
    const hw = 3.4 + (y > 54 ? (y - 54) * 0.55 : 0);
    for (let x = Math.ceil(24 - hw); x <= Math.floor(24 + hw); x++) b.set(x, y, (x - 24) / hw);
  }
  // raízes laterais
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) for (let k = 0; k < 2; k++) b.set(24 + s * (7 + i), 61 - Math.round(i * 0.4) - k + (i > 3 ? 1 : 0), s);
  b.render(p, BARK_WARM, 9, 0.5);
  for (let y = 40; y < 60; y += 4) {
    const x = 22 + (y % 3);
    if (b.has(x, y) && b.has(x + 1, y)) p.vline(x, y, 3, '#5a301e');
  }
  line(p, 22, 38, 12, 26, '#6a3a28');
  line(p, 23, 38, 13, 26, '#a8683a');
  line(p, 26, 38, 36, 27, '#6a3a28');
  line(p, 25, 38, 35, 27, '#a8683a');
  canopy(p, 24, 22, 22.5, 17.5, 26, 777, 4.6, 7.8);
  // flores amarelas e laranja entre as folhas
  const r = rng(321);
  for (let i = 0; i < 16; i++) {
    const a = r() * 6.283;
    const d = Math.sqrt(r()) * 0.85;
    const x = Math.round(24 + Math.cos(a) * d * 21);
    const y = Math.round(22 + Math.sin(a) * d * 16);
    const c = r() < 0.6 ? '#ffd23a' : '#ff9a2a';
    p.px(x, y, c).px(x + 1, y, '#fff2a0');
  }
}

// ------------------------------------------------------------------ outras árvores

/** Tronco recortado: de y0 a y1, largura hwTop no alto, alargando até hwBase a partir de flareFrom; lean desloca o topo. */
function trunkBody(w: number, h: number, cx: number, y0: number, y1: number, hwTop: number, hwBase: number, flareFrom: number, lean = 0): Body {
  const b = new Body(w, h);
  for (let y = y0; y <= y1; y++) {
    const t = y > flareFrom ? (y - flareFrom) / (y1 - flareFrom) : 0;
    const hw = hwTop + (hwBase - hwTop) * t * t;
    const c = cx + (lean * (y1 - y)) / (y1 - y0);
    for (let x = Math.ceil(c - hw); x <= Math.floor(c + hw); x++) b.set(x, y, (x - c) / hw);
  }
  return b;
}

function cracks(p: Painter, b: Body, seed: number, count: number, color: string): void {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(r() * b.w);
    const y = Math.floor(r() * b.h);
    if (!b.has(x, y) || !b.has(x - 1, y) || !b.has(x + 1, y)) continue;
    const len = 2 + Math.floor(r() * 4);
    for (let k = 0; k < len; k++) if (b.has(x, y + k) && b.has(x + 1, y + k) && b.has(x - 1, y + k)) p.px(x, y + k, color);
  }
}

function arvoreLarga(p: Painter): void {
  shadow(p, 32, 77, 28, 5, 0.36);
  const b = trunkBody(64, 80, 32, 46, 77, 6.5, 11, 66, 0);
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) for (let k = 0; k < 3; k++) b.set(32 + s * (9 + i), 75 - Math.round(i * 0.35) - k + (i > 5 ? 1 : 0), s);
  b.render(p, BARK_WARM, 31, 0.5);
  cracks(p, b, 5, 60, '#4a2438');
  // galhos grossos para os dois lados
  for (const [x1, y1] of [
    [14, 34],
    [50, 32],
    [22, 30],
    [42, 28],
  ] as const) {
    line(p, 32, 52, x1, y1, '#2a1630');
    line(p, 31, 52, x1 - 1, y1, '#b06a3a');
    line(p, 32, 51, x1, y1 - 1, '#e49a52');
  }
  canopy(p, 13, 38, 13, 10, 14, 51, 4, 6.5);
  canopy(p, 51, 36, 13, 10, 14, 52, 4, 6.5);
  canopy(p, 32, 27, 30.5, 18.5, 44, 53, 5.2, 8.6);
  // bromélia laranja pendurada no tronco
  p.px(28, 60, '#ff6a2a').px(29, 60, '#ffb03a').px(27, 61, '#1a9a5a').px(28, 61, '#ff6a2a').px(29, 61, '#1a9a5a');
}

function arvoreAlta(p: Painter): void {
  shadow(p, 24, 85, 12, 3.4, 0.34);
  const b = trunkBody(48, 88, 24, 30, 85, 2.9, 5.6, 76, 2);
  b.render(p, BARK_PALE, 41, 0.4);
  cracks(p, b, 8, 40, '#4a3a54');
  for (let y = 40; y < 80; y += 9) if (b.has(22, y)) p.px(22, y, '#6cc04a').px(23, y, '#a8e060');
  line(p, 25, 44, 36, 33, '#2a2038');
  line(p, 24, 44, 35, 33, '#b08c68');
  line(p, 23, 52, 12, 42, '#2a2038');
  line(p, 24, 52, 13, 42, '#b08c68');
  canopy(p, 12, 42, 9, 7, 9, 61, 3.6, 5.2);
  canopy(p, 37, 34, 9, 7, 9, 62, 3.6, 5.2);
  canopy(p, 25, 18, 16.5, 17.5, 26, 63, 4.6, 7.6);
  // cipó caindo pela lateral
  for (let y = 30; y < 62; y++) {
    const x = 33 + Math.round(Math.sin(y / 4) * 1.2);
    p.px(x, y, '#1e5a3a');
    if (y % 7 === 0) p.px(x + 1, y, '#58c050').px(x - 1, y + 1, '#2fa046');
  }
}

function arvoreJovem(p: Painter): void {
  shadow(p, 16, 37, 9, 2.8, 0.32);
  const b = trunkBody(32, 40, 16, 22, 38, 1.8, 3.4, 34, -1);
  b.render(p, BARK_WARM, 71, 0.3);
  line(p, 16, 28, 9, 22, '#2a1630');
  line(p, 16, 28, 23, 21, '#2a1630');
  canopy(p, 16, 14, 12.5, 11.5, 14, 73, 3.4, 5.6);
  p.px(8, 36, '#6cd048').px(9, 35, '#9be85a').px(24, 37, '#6cd048').px(25, 36, '#44b83c');
}

function palmate(p: Painter, cx: number, cy: number, R: number): void {
  const lobes = 9;
  // lobos de trás (verdes) primeiro; os da frente mostram o verso prateado
  const order = Array.from({ length: lobes }, (_, i) => i).sort((a, b) => Math.sin((a / lobes) * 6.283) - Math.sin((b / lobes) * 6.283));
  for (const i of order) {
    const a = (i / lobes) * 6.283 + 0.2;
    const x = cx + Math.cos(a) * R;
    const y = cy + Math.sin(a) * R * 0.62;
    leaf(p, cx, cy, x, y, R * 0.5, Math.sin(a) > 0.55 ? SILVER : i % 2 ? LEAF.lime : LEAF.dark, 0.45);
  }
  p.px(cx, cy, '#ffe08a').px(cx - 1, cy, '#d8d040');
}

function embauba(p: Painter): void {
  shadow(p, 16, 69, 9, 2.8, 0.34);
  const b = trunkBody(32, 72, 16, 18, 70, 2.2, 3.6, 62, 0);
  b.render(p, BARK_EMB, 81, 0.25);
  // nós e anéis do tronco segmentado
  for (let y = 24; y < 66; y += 5) for (let x = 0; x < 32; x++) if (b.has(x, y) && b.has(x - 1, y) && b.has(x + 1, y)) p.px(x, y, '#3e6a62').px(x, y + 1, '#f4ffd0');
  // raízes-escora
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) p.px(16 + s * (3 + i), 69 - Math.floor(i * 0.9), i < 3 ? '#8a6a48' : '#4a3a38').px(16 + s * (3 + i), 70 - Math.floor(i * 0.9), '#2a2038');
  // galhos em candelabro
  line(p, 16, 30, 7, 22, '#1e3a3a');
  line(p, 17, 30, 25, 24, '#1e3a3a');
  line(p, 16, 20, 16, 12, '#1e3a3a');
  palmate(p, 8, 21, 8);
  palmate(p, 24, 23, 8);
  palmate(p, 16, 11, 12);
  dapples(p, 91, 3, 6, 4, 20, 14);
}

function castanheira(p: Painter): void {
  shadow(p, 40, 117, 30, 5, 0.38);
  const b = trunkBody(80, 120, 40, 40, 117, 6.2, 10, 96, 0);
  for (const X of [-17, 17, -9, 9]) {
    for (let y = 100; y < 118; y++) {
      const t = (y - 100) / 17;
      const cx = 40 + X * t ** 1.4;
      const hw = 1.2 + 2.2 * t;
      for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) b.set(x, y, (x - cx) / hw);
    }
  }
  b.render(p, BARK_GREY, 91, 0.45);
  cracks(p, b, 12, 140, '#3a3048');
  // placas de líquen e brotos
  const r = rng(77);
  for (let i = 0; i < 22; i++) {
    const x = 34 + Math.floor(r() * 12);
    const y = 54 + Math.floor(r() * 56);
    if (b.has(x, y) && b.has(x - 1, y) && b.has(x + 1, y)) p.px(x, y, r() < 0.5 ? '#6cb04a' : '#c8d860');
  }
  // galhos que abrem para a copa
  for (const [x1, y1] of [
    [16, 36],
    [64, 34],
    [28, 28],
    [52, 26],
    [40, 24],
  ] as const) {
    line(p, 40, 52, x1, y1, '#241c30');
    line(p, 39, 52, x1 - 1, y1, '#8c8478');
    line(p, 41, 50, x1 + 1, y1 - 1, '#c4b898');
  }
  canopy(p, 14, 40, 14, 10, 16, 101, 4.6, 7);
  canopy(p, 66, 38, 14, 10, 16, 102, 4.6, 7);
  canopy(p, 40, 27, 38.5, 24.5, 70, 103, 6, 10.5);
  // cipós longos descendo do tronco
  for (const [x0, y1] of [
    [33, 86],
    [48, 96],
  ] as const) {
    for (let y = 44; y < y1; y++) {
      const x = x0 + Math.round(Math.sin(y / 5 + x0) * 1.3);
      p.px(x, y, '#1e5a3a');
      if (y % 6 === 0) p.px(x + 1, y, '#58c050').px(x - 1, y + 1, '#2fa046');
    }
  }
}

// ------------------------------------------------------------------ plantas rasteiras

function samambaia(p: Painter): void {
  shadow(p, 8, 14, 7, 2, 0.3);
  const fronds: [number, number, number, number][] = [
    [-1, 7.5, 2.0, 0.7],
    [1, 7.5, 2.0, 0.7],
    [-0.65, 7.5, 2.8, 0.5],
    [0.65, 7.5, 2.8, 0.5],
    [-0.28, 6.5, 3.2, 0.2],
    [0.28, 6.5, 3.2, 0.2],
  ];
  for (const [dir, len, lift, droop] of fronds) frond(p, 8, 14, dir, len, lift, droop, FERN, 2);
  p.px(8, 14, '#17803a').px(7, 14, '#0a4222').px(9, 14, '#0a4222');
}

function bromelia(p: Painter): void {
  shadow(p, 8, 14, 7, 2, 0.3);
  const tips: [number, number][] = [
    [1, 6],
    [15, 6],
    [4, 3],
    [12, 3],
    [8, 2],
    [1, 11],
    [15, 11],
    [5, 15],
    [11, 15],
  ];
  for (const [x, y] of tips) leaf(p, 8, 10, x, y, 3.4, BROM, 0.3);
  disc(p, 8, 9.5, 2.8, 2, '#a01450');
  disc(p, 8, 9.5, 2, 1.4, '#ff4f8a');
  p.px(7, 9, '#ffc4dc').px(8, 8, '#ff8ab8').px(9, 10, '#d02868');
}

function heliconia(p: Painter): void {
  shadow(p, 8, 29, 7, 2.4, 0.32);
  // folhas largas na base
  leaf(p, 8, 28, 1, 17, 6, BROM, 0.45);
  leaf(p, 8, 28, 15, 18, 6, BROM, 0.45);
  leaf(p, 8, 29, 3, 24, 4, FERN, 0.4);
  // haste
  p.vline(8, 8, 21, '#1e7a34').vline(7, 9, 20, '#3cb444').vline(9, 12, 17, '#0f5a2a').px(8, 7, '#1e7a34');
  // brácteas vermelhas em zigue-zague, pontas amarelas
  const bract = (x: number, y: number, dir: number) => {
    leaf(p, x, y, x + dir * 7, y + 4, 3.8, { o: '#6a0c1c', d: '#c01428', m: '#ff2e2a', l: '#ff7a38', h: '#ffd24a' }, 0.4);
    p.px(x + dir * 7, y + 4, '#ffe24a').px(x + dir * 6, y + 4, '#ffb02a').px(x + dir * 6, y + 3, '#ffb02a');
  };
  bract(8, 8, 1);
  bract(8, 12, -1);
  bract(8, 16, 1);
  bract(8, 20, -1);
  p.px(8, 7, '#ff2e2a').px(8, 6, '#ffd24a');
}

function cogumelo(p: Painter): void {
  // brilho no chão (a luz de verdade é feita pelo sistema de luz)
  disc(p, 8, 12, 8, 3.2, rgba('#3affd8', 0.16));
  disc(p, 8, 12, 5.2, 2, rgba('#3affd8', 0.2));
  shadow(p, 8, 14, 6, 1.6, 0.25, '#03202a');
  const dome = (cx: number, base: number, w: number, h: number) => {
    // haste
    p.rect(cx - 1, base - 3, 2, 4, '#c8f8ec').px(cx - 1, base - 1, '#90e4d8').px(cx, base, '#5ab8b0');
    for (let r = 0; r < h; r++) {
      const hw = Math.round((w / 2) * Math.sqrt(1 - ((h - 1 - r) / h) ** 2) + 0.4);
      const y = base - 3 - h + 1 + r;
      for (let x = cx - hw; x < cx + hw; x++) {
        const lit = x < cx - hw * 0.3 && r < h * 0.7;
        const edge = x === cx - hw || x === cx + hw - 1 || r === 0;
        p.px(x, y, edge ? (lit ? '#7affee' : '#0a7a92') : lit ? '#8afff0' : r > h * 0.65 ? '#14a8b4' : '#2ee0d0');
      }
    }
    p.px(cx - 1, base - 3 - h + 2, '#e8fffa');
    p.px(cx + 1, base - 3 - h + 3, '#e8fffa');
  };
  dome(7, 13, 8, 5);
  dome(12, 14, 5, 3);
  dome(3, 14, 4, 3);
  // esporos flutuando
  p.px(6, 2, '#b8fff4').px(11, 4, '#7affee').px(3, 6, '#7affee').px(14, 8, '#b8fff4');
}

function folhagem(p: Painter): void {
  shadow(p, 8, 14, 7, 2, 0.3);
  leaf(p, 8, 14, 1, 7, 7, FERN, 0.5);
  leaf(p, 8, 14, 15, 8, 7, FERN, 0.5);
  leaf(p, 8, 14, 8, 1, 7, LEAF.lime, 0.5);
  line(p, 8, 13, 8, 4, '#c0fa84');
  line(p, 8, 13, 3, 9, '#9be85a');
  line(p, 8, 13, 13, 9, '#9be85a');
}

function flores(p: Painter): void {
  shadow(p, 8, 14, 7, 2, 0.28);
  for (const [x, y] of [
    [3, 11],
    [6, 13],
    [10, 12],
    [13, 10],
    [8, 9],
  ] as const) leaf(p, x, y + 2, x + (x < 8 ? -2 : 2), y - 2, 2.6, FERN, 0.4);
  const flower = (x: number, y: number, c: string, c2: string, core: string) => {
    p.px(x - 1, y, c).px(x + 1, y, c).px(x, y - 1, c2).px(x, y + 1, c).px(x, y, core);
  };
  flower(4, 6, '#ff3a3a', '#ff7a5a', '#ffe04a');
  flower(11, 5, '#ff9a2a', '#ffc45a', '#fff2a0');
  flower(8, 9, '#ff5aa8', '#ff9ac8', '#ffe04a');
  flower(13, 10, '#ffd23a', '#fff08a', '#ff8a1a');
  flower(3, 11, '#ffffff', '#fff8e0', '#ffc23a');
}

// ------------------------------------------------------------------ troncos, pedras, cupim

function tronco(p: Painter): void {
  shadow(p, 17, 14, 15.5, 2.8, 0.34);
  // corpo cilíndrico, luz no topo
  for (let x = 4; x < 31; x++) {
    const sag = x > 18 ? 1 : 0;
    for (let y = 3 + sag; y < 13; y++) {
      const t = (y - 3 - sag) / 9;
      let c = t < 0.12 ? '#e8a65e' : t < 0.35 ? '#c2804a' : t < 0.7 ? '#9a5e38' : t < 0.92 ? '#5a3040' : '#3a2236';
      if ((x * 7 + y * 3) % 11 === 0 && t > 0.2) c = '#6a3a28';
      p.px(x, y, c);
    }
    p.px(x, 2 + sag, '#2a1630');
    p.px(x, 13, '#2a1630');
  }
  // frestas da casca
  for (const [x, y, l] of [
    [8, 6, 5],
    [16, 8, 6],
    [22, 5, 4],
    [12, 10, 5],
    [26, 8, 4],
  ] as const) p.hline(x, y, l, '#52301f');
  // face cortada à esquerda com anéis
  disc(p, 5, 8, 3.2, 5.3, '#2a1630');
  disc(p, 5, 8, 2.4, 4.4, '#e8c488');
  disc(p, 5, 8, 1.6, 3.2, '#c89a60');
  disc(p, 5, 8, 0.8, 1.6, '#e8c488');
  p.px(4, 5, '#fff0c8').px(4, 6, '#fff0c8');
  // musgo vivo por cima e caído do lado
  const r = rng(55);
  for (let x = 9; x < 30; x++) {
    if (r() < 0.7) {
      const sag = x > 18 ? 1 : 0;
      const d = 1 + Math.floor(r() * 3);
      for (let k = 0; k < d; k++) p.px(x, 2 + sag + k, k === 0 ? '#9be85a' : k === 1 ? '#44b83c' : '#1e7a34');
      if (r() < 0.2) p.px(x, 2 + sag - 1, '#c4f870');
    }
  }
  // cogumelinho de orelha-de-pau
  p.px(24, 9, '#ff9a3a').px(25, 9, '#ffc45a').px(26, 9, '#ff9a3a').px(25, 10, '#b8541a');
}

function pedra(p: Painter): void {
  shadow(p, 8, 14, 7.5, 2.4, 0.34);
  const pal: Pal5 = { o: '#26264a', d: '#505684', m: '#8088b8', l: '#bcc6ee', h: '#f0f4ff' };
  blob(p, 8, 9, 6.6, 5.2, pal, 21, { lobes: 3, amp: 0.1, noise: 0.35 });
  // fissura e musgo no topo/esquerda
  p.px(9, 9, '#3a3a68').px(10, 10, '#3a3a68').px(10, 11, '#3a3a68');
  blob(p, 6, 5.5, 3.4, 1.8, { o: '#164a1e', d: '#2a8a30', m: '#44b83c', l: '#86e050', h: '#c8f870' }, 3, { lobes: 4, amp: 0.2, noise: 0.5 });
  p.px(11, 7, '#44b83c').px(12, 8, '#2a8a30').px(4, 10, '#44b83c');
}

function cupinzeiro(p: Painter): void {
  shadow(p, 8, 30, 8, 2.6, 0.34);
  const b = new Body(16, 32);
  for (let y = 3; y < 31; y++) {
    const t = (y - 3) / 27;
    const bump = Math.round((hash2(y, 4, 2) - 0.5) * 1.6 + Math.sin(y * 0.9) * 0.6);
    const hw = 1.4 + t ** 0.8 * 6.0 + bump * 0.4 + (y > 27 ? (y - 27) * 0.5 : 0);
    const cx = 8 + (y < 16 ? 0 : 0);
    for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw - 0.01); x++) b.set(x, y, (x - cx) / hw);
  }
  b.render(p, { o: '#3a1a2c', d: '#823248', m: '#c8683a', l: '#f09a58', h: '#ffd090' }, 2, 0.45);
  // sulcos, buraquinhos e grãos
  for (const [x, y, l] of [
    [6, 8, 2],
    [9, 12, 3],
    [5, 17, 3],
    [10, 21, 3],
    [4, 25, 4],
  ] as const) p.hline(x, y, l, '#6a2a22');
  for (const [x, y] of [
    [7, 14],
    [9, 18],
    [6, 22],
    [10, 26],
  ] as const) p.px(x, y, '#3a1618').px(x, y - 1, '#a04a30');
  // capim na base
  for (const [x, h] of [
    [1, 3],
    [3, 2],
    [12, 3],
    [14, 2],
  ] as const) p.vline(x, 30 - h, h, '#44b83c').px(x, 30 - h, '#9be85a');
}

function vitoriaRegia(p: Painter): void {
  const cx = 8;
  const cy = 8;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = (x + 0.5 - cx) / 7.4;
      const dy = (y + 0.5 - cy) / 5.8;
      const d = dx * dx + dy * dy;
      // entalhe típico da folha
      if (dx > 0.2 && Math.abs(dy - 0.1) < 0.12 * (dx + 0.2) * 1.4 && d < 1.3) continue;
      if (d > 1.12) continue;
      if (d > 0.98) {
        p.px(x, y, '#0c4a28');
      } else if (d > 0.74) {
        // borda erguida: rosada embaixo, clara em cima
        p.px(x, y, dy > 0.15 ? '#b8305a' : dy < -0.3 ? '#a8f060' : '#5ac84a');
      } else {
        const veins = Math.abs(Math.atan2(dy, dx) * 3.2 - Math.round(Math.atan2(dy, dx) * 3.2)) < 0.12;
        p.px(x, y, veins ? '#1e8a34' : dx + dy < -0.3 ? '#58d052' : dy > 0.4 ? '#2a9c3c' : '#3cb844');
      }
    }
  }
  p.px(7, 7, '#c8f8a0').px(8, 7, '#a8f060').px(7, 8, '#a8f060');
  // gota e pequeno botão de flor
  p.px(11, 5, '#ff7ab0').px(10, 5, '#ffb0d0').px(12, 5, '#ffb0d0').px(11, 4, '#ffe0ec');
}

// ------------------------------------------------------------------ novos objetos

function cipo(p: Painter): void {
  for (const [x0, len, dark] of [
    [5, 30, false],
    [11, 22, true],
    [8, 14, false],
  ] as const) {
    for (let y = 0; y < len; y++) {
      const x = x0 + Math.round(Math.sin(y / 4 + x0) * 1.4);
      p.px(x, y, dark ? '#2a5a2a' : '#4a3a1e');
      p.px(x + 1, y, dark ? '#58a840' : '#7a6030');
      if (y % 7 === 3) {
        const s = y % 14 === 3 ? 1 : -1;
        leaf(p, x, y, x + s * 4, y + 3, 3, LEAF.lime, 0.4);
      }
    }
    // ponta com folha
    leaf(p, x0, len - 1, x0 + 1, len + 2, 3, LEAF.lime, 0.4);
  }
  p.px(13, 24, '#ff7a2a').px(12, 24, '#ffb03a').px(14, 24, '#ffb03a').px(13, 23, '#ffd23a');
  dapples(p, 17, 2, 3, 2, 12, 12);
}

function raiz(p: Painter): void {
  shadow(p, 16, 14, 14, 2.4, 0.3);
  const pal = BARK_WARM;
  const arch = (x0: number, x1: number, h: number) => {
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / (x1 - x0);
      const y = Math.round(13 - Math.sin(t * Math.PI) ** 0.8 * h);
      const thick = t < 0.2 || t > 0.8 ? 4 : 3;
      for (let k = 0; k < thick; k++) p.px(x, y + k, k === 0 ? pal.l : k === thick - 1 ? pal.o : pal.m);
      p.px(x, y + thick - 1, pal.d);
      p.px(x, y - 1, pal.o);
    }
  };
  arch(1, 14, 9);
  arch(10, 22, 6);
  arch(18, 30, 10);
  p.px(4, 5, '#6cd048').px(5, 5, '#9be85a').px(20, 8, '#6cd048').px(23, 4, '#44b83c').px(24, 4, '#9be85a');
}

// ------------------------------------------------------------------ placa de trilha (saídas entre regiões)

/** Poste com tábua em seta; `left` aponta para a esquerda. */
function placa(p: Painter, left = false): void {
  shadow(p, 8, 30, 6, 1.8, 0.34);
  p.rect(7, 12, 3, 19, '#5a3420').vline(7, 12, 19, '#a8683a').vline(9, 12, 19, '#3a2016');
  // tábua em forma de seta, apontando para o destino
  const rows = ['ooooooooooo...', 'oLLLLLLLLLLo..', 'oLmmmmmmhmmmo.', 'oLmhhhhhhhhmmo', 'oLmmmmmmhmmdo.', 'oddddddddddo..', 'ooooooooooo...'];
  p.template(rows, { o: '#2a1810', L: '#f6c474', m: '#d0904a', d: '#7e4a28', h: '#fff2c0' }, 1, 6, left);
  p.px(8, 4, '#3a9a40').px(9, 3, '#7ad04a').px(10, 4, '#3a9a40');
}

// ------------------------------------------------------------------ registro

export const PROP_PAINTERS: Painters = {
  placa: (p) => placa(p, false),
  placa_esq: (p) => placa(p, true),
  sumauma,
  acai,
  arvore,
  samambaia,
  bromelia,
  heliconia,
  cogumelo,
  tronco,
  pedra,
  cupinzeiro,
  vitoria_regia: vitoriaRegia,
  cipo,
  arvore_larga: arvoreLarga,
  arvore_alta: arvoreAlta,
  arvore_jovem: arvoreJovem,
  embauba,
  castanheira,
  raiz,
  flores,
  folhagem,
};
