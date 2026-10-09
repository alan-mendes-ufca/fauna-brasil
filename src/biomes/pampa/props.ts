import { rng, type Painter } from '../../art/canvas';
import { Body, blob, canopy, disc, frond, hash2, line, shadow, type CanopyPals, type Pal5 } from '../../art/draw';
import type { PropSpec } from '../../art/forest';
import type { PropPainter } from '../types';

// Objetos do Pampa. Mesmo contrato dos demais biomas: textura `prop_<tipo>`, centrada na largura da base e apoiada no fundo.
// Luz suave do alto à esquerda; sombras projetadas azul-acinzentadas.

export const PROPS: Record<string, PropSpec> = {
  pam_butia: { w: 56, h: 64, fw: 1, fh: 1, canopy: true },
  pam_umbu: { w: 80, h: 72, fw: 1, fh: 1, canopy: true },
  pam_corticeira: { w: 56, h: 68, fw: 1, fh: 1, canopy: true },
  pam_araucaria_jovem: { w: 40, h: 72, fw: 1, fh: 1, canopy: true },
  pam_capao: { w: 40, h: 32, fw: 2, fh: 1 },
  pam_junco: { w: 16, h: 24, fw: 1, fh: 1, walkable: true },
  pam_macega: { w: 24, h: 28, fw: 1, fh: 1, walkable: true },
  pam_cerca_pedra: { w: 32, h: 20, fw: 2, fh: 1 },
  pam_porteira: { w: 48, h: 36, fw: 1, fh: 1 },
  pam_cupim_campo: { w: 16, h: 20, fw: 1, fh: 1 },
  pam_flores_campo: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
  pam_pedra: { w: 16, h: 16, fw: 1, fh: 1 },
};

const SHADE = '#1c3040';

const BARK: Pal5 = { o: '#262024', d: '#4e4244', m: '#7a6a62', l: '#a8988a', h: '#d8ccb8' };
const BARK_CORK: Pal5 = { o: '#2a2220', d: '#5a4a44', m: '#8c786a', l: '#b8a490', h: '#e4d6bc' };
const PALM_TRUNK: Pal5 = { o: '#2e262a', d: '#5c5048', m: '#8e7e68', l: '#bcae8c', h: '#ece0bc' };
const BUTIA: Pal5 = { o: '#10303a', d: '#2a6258', m: '#4c9a74', l: '#8cc896', h: '#dcf2c0' };
const BUTIA_B: Pal5 = { o: '#12303a', d: '#2c6a66', m: '#5aa886', l: '#a4d8a8', h: '#ecfad0' };
const ARAU: Pal5 = { o: '#0c2a26', d: '#1c4a3a', m: '#2e6e48', l: '#58a05a', h: '#a8d484' };
const STONE: Pal5 = { o: '#262e3a', d: '#4e5a66', m: '#7c8a92', l: '#aab6b8', h: '#e0eaea' };
const WOOD: Pal5 = { o: '#2a2022', d: '#523e38', m: '#80645a', l: '#b09478', h: '#e4d0ac' };

const UMBU: CanopyPals = {
  gold: { o: '#2a4a24', d: '#5a8a38', m: '#92bc46', l: '#c8dc64', h: '#f2f8a8' },
  lime: { o: '#14402c', d: '#2e7040', m: '#58a048', l: '#92c85a', h: '#d8ee98' },
  teal: { o: '#0c2c30', d: '#1c5444', m: '#38804c', l: '#62a85a', h: '#a8d48a' },
  dark: { o: '#0a2428', d: '#184238', m: '#2a6844', l: '#4a9050', h: '#98c882' },
};
const FIG: CanopyPals = {
  gold: { o: '#2a4020', d: '#587a34', m: '#8aae48', l: '#bad466', h: '#eaf4a4' },
  lime: { o: '#14382a', d: '#2c6444', m: '#4e9650', l: '#84c05e', h: '#cce896' },
  teal: { o: '#0c2a2c', d: '#1a4a40', m: '#2e7248', l: '#52a058', h: '#9ccc84' },
  dark: { o: '#0a2024', d: '#163c34', m: '#265e40', l: '#42884e', h: '#8cc07c' },
};

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

// ------------------------------------------------------------------ árvores

/** Butiá (Butia odorata): palmeira de tronco grosso e curto, folhas azuladas arqueadas e cachos de frutos alaranjados. */
function butia(p: Painter): void {
  shadow(p, 28, 61, 14, 3, 0.34, SHADE);
  const b = trunk(56, 64, 28, 28, 62, 4.4, 5.4, 52, 1.2, 0.5);
  b.render(p, PALM_TRUNK, 17, 0.35);
  // restos das bases de folhas: losangos em espiral no tronco
  for (let y = 31; y < 60; y += 4) {
    for (let x = 24; x < 33; x++) {
      if (!(b.has(x, y) && b.has(x - 1, y) && b.has(x + 1, y))) continue;
      if ((x + (y >> 2) * 2) % 4 === 0) p.px(x, y, '#4a3e3c').px(x + 1, y + 1, '#c8b890');
    }
  }
  // fronds de trás (escuras) e da frente: arcos largos que caem nas pontas
  for (const [dir, len, lift, droop] of [
    [-1, 25, 0.9, 1.7],
    [1, 25, 0.9, 1.7],
    [-0.7, 23, 1.5, 1.5],
    [0.7, 23, 1.5, 1.5],
    [-0.25, 20, 1.9, 1.2],
    [0.25, 20, 1.9, 1.2],
  ] as const) {
    frond(p, 29, 26, dir, len, lift, droop, BUTIA, 4);
  }
  for (const [dir, len, lift, droop] of [
    [-0.9, 21, 0.4, 2.3],
    [0.9, 21, 0.4, 2.3],
    [-0.45, 18, 1.1, 1.8],
    [0.45, 18, 1.1, 1.8],
  ] as const) {
    frond(p, 29, 29, dir, len, lift, droop, BUTIA_B, 3);
  }
  disc(p, 29, 29, 3.2, 2.2, '#2a5a44');
  // cachos de butiá, amarelo-alaranjados, junto ao tronco
  for (const [x, y] of [[25, 33], [27, 35], [24, 36], [31, 34], [33, 36], [29, 37], [26, 38]] as const) {
    p.px(x, y, '#d87a1c').px(x + 1, y, '#f6b43a').px(x, y + 1, '#a8501a').px(x, y, '#ffe488');
  }
  p.vline(29, 30, 4, '#5a3e2a');
}

/** Umbu (Phytolacca dioica): copa imensa em guarda-chuva, tronco gordo e baixo. A árvore solitária da coxilha. */
function umbu(p: Painter): void {
  shadow(p, 40, 69, 32, 4.4, 0.4, SHADE);
  const b = trunk(80, 72, 40, 34, 70, 6, 10.5, 54, 2.2, 1.0);
  b.render(p, BARK, 11, 0.5);
  // sulcos e raízes tabulares
  for (let y = 38; y < 68; y += 3) for (const dx of [-3, 0, 3]) p.px(40 + dx + Math.round(Math.sin(y * 0.4)), y, '#2e2428');
  for (const [x0, x1] of [[28, 14], [52, 66]] as const) {
    branch(p, x0 < 40 ? 34 : 46, 66, x1, 70, BARK);
  }
  branch(p, 38, 44, 18, 30, BARK);
  branch(p, 42, 44, 62, 30, BARK);
  branch(p, 40, 42, 40, 26, BARK);
  canopy(p, 40, 26, 36, 19, 48, 611, 5, 8.4, UMBU, true);
  // brilho do dia nas folhas de cima
  const r = rng(61);
  for (let i = 0; i < 18; i++) p.px(Math.round(14 + r() * 52), Math.round(8 + r() * 12), '#f4fbc0');
}

/** Corticeira-do-banhado (Erythrina crista-galli): copa aberta e tronco rugoso, com cachos de flores vermelhas. */
function corticeira(p: Painter): void {
  shadow(p, 28, 65, 17, 3.4, 0.36, SHADE);
  const b = trunk(56, 68, 28, 30, 66, 3, 5.6, 54, -2.5, 1.3);
  b.render(p, BARK_CORK, 21, 0.7);
  for (let y = 32; y < 64; y += 2) {
    const x = 26 + Math.round(hash2(y, 2, 9) * 4);
    if (b.has(x, y) && b.has(x, y + 1)) p.px(x, y, '#3a2c2c').px(x + 1, y + 1, '#c8b49a');
  }
  branch(p, 27, 40, 9, 26, BARK_CORK);
  branch(p, 29, 36, 47, 22, BARK_CORK);
  branch(p, 28, 34, 30, 16, BARK_CORK);
  const r = rng(77);
  for (let i = 0; i < 18; i++) {
    const anchor = [[10, 24], [46, 20], [28, 14], [18, 28], [40, 28], [28, 24]][i % 6];
    const x = anchor[0] + (r() - 0.5) * 16;
    const y = anchor[1] + (r() - 0.5) * 8;
    blob(p, x, y, 4.2 + r() * 2.4, 2.8 + r() * 1.2, y > 24 ? FIG.teal : FIG.lime, 140 + i * 9, { lobes: 6, amp: 0.3, bias: (y - 20) * 0.03, noise: 0.5 });
  }
  // cachos de flores vermelhas em forma de crista de galo
  for (let i = 0; i < 16; i++) {
    const x = Math.round(8 + r() * 42);
    const y = Math.round(10 + r() * 20);
    p.px(x, y, '#c4281e').px(x + 1, y, '#f04a34').px(x, y - 1, '#ff7a5a').px(x + 1, y + 1, '#8a1820');
  }
}

/** Araucária jovem: tronco reto e camadas de ramos em candelabro, mais estreita no alto. */
function araucariaJovem(p: Painter): void {
  shadow(p, 20, 69, 11, 2.6, 0.36, SHADE);
  const b = trunk(40, 72, 20, 12, 70, 1.6, 3, 62, 0, 0.2);
  b.render(p, BARK, 31, 0.5);
  const tiers = [18, 25, 32, 39, 46, 53, 60];
  tiers.forEach((y, i) => {
    const w = 5 + i * 2.1;
    for (const side of [-1, 1]) {
      const x1 = 20 + side * w;
      const y1 = y + 3;
      branch(p, 20, y, x1, y1, BARK);
      // pontas levantadas, cobertas de folhas em escamas
      line(p, x1, y1, x1 + side * 1.5, y1 - 3, BARK.m);
      for (let k = 0; k < 4; k++) {
        const t = (k + 0.5) / 4;
        blob(p, 20 + side * w * t * 0.95 + side * 1, y + 3 * t - 1.2, 3 + t * 1.3, 2 + t * 0.4, ARAU, 400 + i * 9 + k + (side > 0 ? 50 : 0), { lobes: 5, amp: 0.3, bias: 0.05, noise: 0.5 });
      }
    }
  });
  blob(p, 20, 9, 3, 3.6, ARAU, 411, { lobes: 5, amp: 0.25 });
  p.px(18, 6, ARAU.h).px(19, 5, ARAU.h);
}

/** Capão de mato: moita densa de árvores baixas, com folhagem de vários verdes e flores vermelhas de corticeira. */
function capao(p: Painter): void {
  shadow(p, 20, 29, 19, 3, 0.36, SHADE);
  const r = rng(131);
  const blobs: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < 12; i++) blobs.push({ x: 20 + (r() - 0.5) * 28, y: 13 + (r() - 0.2) * 12, r: 4.4 + r() * 2.2 });
  blobs.sort((a, b2) => a.y - b2.y);
  for (const [i, b] of blobs.entries()) {
    const fy = (b.y - 13) / 12;
    const fx = (b.x - 20) / 14;
    const pal = fx < -0.1 && fy < 0.2 ? FIG.gold : fy > 0.45 ? FIG.dark : i % 3 === 0 ? FIG.teal : FIG.lime;
    blob(p, b.x, b.y, b.r, b.r * 0.82, pal, 500 + i * 7, { lobes: 6, amp: 0.26, bias: fy * 0.3 + fx * 0.1, noise: 0.5 });
  }
  for (const [x, y, c] of [[10, 12, '#f04a34'], [28, 9, '#f04a34'], [33, 17, '#ff7a5a'], [17, 20, '#e8503a']] as const) p.px(x, y, c).px(x + 1, y, '#c4281e');
  // troncos aparecendo embaixo
  for (const x of [11, 19, 27, 32]) p.vline(x, 24, 5, '#3a2c2c').vline(x + 1, 24, 5, '#6a5648');
}

// ------------------------------------------------------------------ plantas e pequenos elementos

function junco(p: Painter): void {
  const r = rng(517);
  for (const pass of [0, 1]) {
    for (let i = 0; i < 11; i++) {
      const x0 = 3 + i * 0.95;
      const lean = (i - 5) * 0.55 + (r() - 0.5) * 0.4;
      const h = 12 + Math.floor(hash2(i, 1, 4) * 10);
      for (let k = 0; k <= h; k++) {
        const t = k / h;
        const x = Math.round(x0 + lean * t * 1.5);
        const y = 22 - k;
        if (pass === 0) p.px(x - 1, y, '#1e4a3a');
        else p.px(x, y, t < 0.25 ? '#2c6a48' : t < 0.7 ? '#4e9a56' : t < 1 ? '#86c46a' : '#c8e49a');
      }
    }
  }
  // espiguetas marrons (flor do junco) e uma taboa
  for (const [x, y] of [[6, 7], [10, 9], [13, 12]] as const) p.px(x, y, '#8a5a34').px(x + 1, y, '#b88a54').px(x, y + 1, '#6a4028');
}

/** Capim-dos-pampas (macega): touceira alta e arqueada com plumas claras. */
function macega(p: Painter): void {
  shadow(p, 12, 26, 8, 1.8, 0.28, SHADE);
  const r = rng(803);
  for (const pass of [0, 1]) {
    for (let i = 0; i < 12; i++) {
      const x0 = 6 + i * 0.9;
      const lean = (i - 5.5) * 0.85 + (r() - 0.5) * 0.5;
      const h = 10 + Math.floor(hash2(i, 3, 4) * 8);
      for (let k = 0; k <= h; k++) {
        const t = k / h;
        const x = Math.round(x0 + lean * t * 1.7 + t * t * (i % 2 ? 2 : -2));
        const y = 26 - k;
        if (pass === 0) p.px(x - 1, y, '#3a5e34');
        else p.px(x, y, t < 0.3 ? '#4e8040' : t < 0.65 ? '#86b050' : t < 1 ? '#c4cc78' : '#f0ecc0');
      }
    }
  }
  // plumas
  for (const [x, top] of [[8, 4], [14, 6], [17, 9]] as const) {
    for (let k = 4; k < 14; k++) p.px(x + (k > 9 ? 1 : 0), top + k, '#88a050');
    for (const [dx, dy, c] of [[0, 0, '#ffffff'], [1, 0, '#f4f0dc'], [-1, 1, '#e8e4c8'], [0, 1, '#ffffff'], [1, 1, '#d8d4b8'], [0, 2, '#f4f0dc'], [1, 2, '#e8e4c8'], [0, 3, '#d8d4b8']] as const) {
      p.px(x + dx, top + dy, c);
    }
  }
}

/** Taipa de pedra: muro de pedras de basalto empilhadas sem argamassa, com musgo e capim no topo. */
function cercaPedra(p: Painter): void {
  shadow(p, 16, 18, 15, 2.2, 0.32, SHADE);
  const r = rng(907);
  const rows = [
    { y: 13, h: 5 },
    { y: 8, h: 5 },
    { y: 3, h: 5 },
  ];
  rows.forEach((row, ri) => {
    let x = ri % 2 ? -2 : 1;
    while (x < 32) {
      const w = 5 + Math.floor(r() * 4);
      const b = new Body(32, 20);
      for (let yy = row.y; yy < row.y + row.h; yy++) {
        const inset = yy === row.y || yy === row.y + row.h - 1 ? 1 : 0;
        b.span(yy, Math.max(0, x + inset), Math.min(31, x + w - 1 - inset));
      }
      b.render(p, STONE, 100 + ri * 13 + x, 0.55);
      x += w;
    }
  });
  // musgo e capim crescendo nas frestas e no topo
  for (let x = 1; x < 31; x += 2) if (hash2(x, 5, 7) < 0.55) p.px(x, 3, '#5a8a48').px(x, 2, '#86b45a');
  for (const [x, y] of [[4, 11], [14, 16], [22, 9], [27, 14]] as const) p.px(x, y, '#6a9a58').px(x + 1, y, '#8cba68');
  for (const x of [5, 12, 20, 26]) {
    p.px(x, 1, '#4e8040').px(x + 1, 0, '#a8d070').px(x - 1, 1, '#4e8040');
  }
}

/** Porteira de estância: mourões de madeira e a porteira de varas aberta, encostada na cerca (o mourão de dobradiça fica no tile). */
function porteira(p: Painter): void {
  shadow(p, 24, 34, 21, 2.4, 0.3, SHADE);
  for (const x of [22, 3]) {
    const b = new Body(48, 36);
    for (let y = 6; y < 34; y++) b.span(y, x, x + 3);
    b.span(5, x + 1, x + 2);
    b.render(p, WOOD, x, 0.5);
    p.px(x + 1, 5, WOOD.h);
  }
  for (const y of [11, 19, 27]) {
    p.hline(7, y, 15, WOOD.o);
    p.hline(7, y - 1, 15, WOOD.m);
    p.hline(7, y - 2, 15, WOOD.l);
  }
  for (const x of [10, 15, 19]) p.vline(x, 9, 20, WOOD.o).vline(x + 1, 9, 20, WOOD.m);
  line(p, 8, 28, 20, 10, WOOD.d);
  line(p, 8, 27, 20, 9, WOOD.l);
  p.px(21, 11, '#2e3438').px(21, 19, '#2e3438').px(21, 27, '#2e3438');
  p.px(8, 17, '#c8a860').px(8, 16, '#e8d090');
}

function cupimCampo(p: Painter): void {
  shadow(p, 8, 18, 7, 1.8, 0.3, SHADE);
  const b = new Body(16, 20);
  for (let y = 4; y < 18; y++) {
    const t = (y - 4) / 13;
    const hw = 1.5 + Math.sin(Math.min(1, t * 1.1) * Math.PI * 0.5) * 5.4;
    b.span(y, Math.round(8 - hw), Math.round(8 + hw));
  }
  b.render(p, { o: '#3a2c2a', d: '#6a5648', m: '#9a8268', l: '#c8b08c', h: '#ecdcb8' }, 55, 0.7);
  for (const [x, y] of [[6, 11], [10, 9], [8, 14], [4, 15]] as const) p.px(x, y, '#4a3a30');
  // capim no topo
  p.px(7, 3, '#4e8040').px(8, 2, '#86b050').px(9, 3, '#4e8040').px(8, 3, '#a4cc6a');
}

function floresCampo(p: Painter): void {
  const r = rng(718);
  const cols = [
    ['#ffffff', '#fff2a0'],
    ['#f6c43a', '#fff0a0'],
    ['#b078e0', '#e6c8ff'],
    ['#e84a4a', '#ffa8a0'],
    ['#ff9ac8', '#ffe0ee'],
  ];
  for (let i = 0; i < 5; i++) {
    const x = 2 + Math.floor(r() * 11);
    const y = 7 + Math.floor(r() * 8);
    for (let k = 0; k < 4; k++) p.px(x, y - k, k < 2 ? '#3a7040' : '#6aa850');
    const c = cols[i];
    p.px(x - 1, y - 4, c[0]).px(x + 1, y - 4, c[0]).px(x, y - 5, c[0]).px(x, y - 3, c[0]).px(x, y - 4, c[1]);
  }
}

function pedra(p: Painter): void {
  shadow(p, 8, 14, 7, 1.8, 0.3, SHADE);
  const b = new Body(16, 16);
  for (let y = 4; y < 14; y++) {
    const t = (y - 4) / 9;
    const hw = 3 + Math.sin(Math.min(1, t * 1.2) * Math.PI * 0.5) * 3.8 + (hash2(y, 1, 5) - 0.5);
    b.span(y, Math.round(8 - hw + (y < 7 ? 1 : 0)), Math.round(8 + hw));
  }
  b.render(p, STONE, 71, 0.5);
  p.px(5, 7, '#c8d890').px(6, 7, '#98b868').px(11, 10, '#e8c870');
  p.px(7, 3, '#4e8040').px(8, 3, '#86b050').px(9, 4, '#4e8040');
}

export const PAINTERS: Record<string, PropPainter> = {
  pam_butia: butia,
  pam_umbu: umbu,
  pam_corticeira: corticeira,
  pam_araucaria_jovem: araucariaJovem,
  pam_capao: capao,
  pam_junco: junco,
  pam_macega: macega,
  pam_cerca_pedra: cercaPedra,
  pam_porteira: porteira,
  pam_cupim_campo: cupimCampo,
  pam_flores_campo: floresCampo,
  pam_pedra: pedra,
};
