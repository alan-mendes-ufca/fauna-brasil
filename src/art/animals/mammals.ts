import { cap, type Drawer, ell, eye, fuzz, INK, type Mask, path, poly, ramp, Spr, uni, water, type Pt } from './kit';
import { rng } from '../canvas';

// ------------------------------------------------------------------ onça-pintada
const GOLD = ramp('#E0A532', { hi: '#F6CE5C', rim: '#FFEFA8', sh: '#B2672A', dp: '#7A3A2C', ol: '#2E1424' });
const CREAM = ramp('#F6E9CB', { sh: '#D7B9A0', dp: '#A98A8A', ol: '#4A2C3A' });
const SPOT = '#2B1423';
const SPOT_IN = '#9A5A26';

/** Roseta: anel escuro aberto com miolo mais escuro que o fundo. */
function rosette(s: Spr, clip: Mask, x: number, y: number, k = 1): void {
  s.paintIn(clip, ell(x, y, 3.6 * k, 3 * k), SPOT);
  s.paintIn(clip, ell(x + 0.2, y + 0.3, 1.7 * k, 1.3 * k), SPOT_IN);
  s.paintIn(clip, ell(x - 0.6, y - 0.4, 0.8, 0.6), '#D9983A');
}

export const onca: Drawer = (s, f) => {
  const pounce = f >= 2;
  const g = f === 3 ? 1 : 0;
  const b = f === 1 ? 1 : 0;

  // cauda
  const tail = path(pounce ? [[50, 50, 3], [57, 47, 3], [60, 38, 2.5], [57, 30, 2.5]] : [[48, 52, 3], [56, 52, 3], [60, 44, 2.5], [58, 35, 2.5]]);
  s.fill(tail, GOLD);
  for (const [tx, ty] of pounce ? ([[58, 45], [60, 40], [59, 35], [57, 31]] as Pt[]) : ([[57, 52], [60, 47], [60, 42], [59, 37]] as Pt[]))
    s.paintIn(tail, ell(tx, ty, 1.5, 2), SPOT);

  // corpo
  const body = ell(32, pounce ? 49 : 46, pounce ? 22 : 21, pounce ? 11 : 13 + b * 0.5);
  s.fill(body, GOLD);

  // patas
  if (!pounce) {
    for (const sx of [-1, 1]) {
      const leg = uni(cap(32 + sx * 11, 42, 6, 32 + sx * 11.5, 55, 5), ell(32 + sx * 11.5, 55.3, 6.5, 3.2));
      s.fill(leg, GOLD);
      s.dots(INK, [32 + sx * 13.5, 57], [32 + sx * 11.5, 57], [32 + sx * 9.5, 57]);
      rosette(s, leg, 32 + sx * 11, 46, 0.8);
    }
    s.fill(ell(32, 50, 7, 8), CREAM, { ol: false });
  } else {
    const leg = uni(cap(44, 44, 6, 45, 56, 5), ell(45, 55.3, 7, 3.2));
    s.fill(leg, GOLD);
    s.dots('#FFFFFF', [41, 58], [44, 58], [47, 58]);
    s.fill(cap(21, 43, 6, 12, 35 - g * 2, 5), GOLD);
    const paw = ell(10, 32 - g * 2, 7, 6);
    s.fill(paw, GOLD);
    s.paintIn(paw, ell(10, 32 - g * 2, 2, 1.6), SPOT);
    for (const k of [-4, -1, 2, 5]) s.line(10 + k, 36 - g * 2, 9 + k, 40 - g * 2, '#FFF7E0');
  }

  // rosetas do corpo
  const R: Pt[] = pounce ? [[13, 50], [52, 52], [50, 44], [24, 54], [40, 55], [14, 42], [30, 46]] : [[14, 44], [50, 44], [12, 52], [52, 52], [21, 40], [43, 40], [32, 56]];
  for (const [rx, ry] of R) rosette(s, body, rx, ry);

  // orelhas
  const ey = pounce ? 15 + g : 12 + b;
  const ex = pounce ? 15 : 14.5;
  for (const sx of [-1, 1]) {
    s.fill(ell(32 + sx * ex, ey, pounce ? 5.5 : 5, pounce ? 4.2 : 5), GOLD);
    s.paint(ell(32 + sx * ex, ey + 1, pounce ? 3 : 2.6, pounce ? 2 : 3), '#3A1B2A');
    s.dots('#E8B9A8', [32 + sx * ex + (sx < 0 ? 1 : -1), ey + 1]);
  }

  // cabeça
  const hy = pounce ? 26 + g : 23 + b;
  s.fill(ell(32, hy, pounce ? 18 : 16, pounce ? 14 : 12.5), GOLD);
  s.fill(uni(ell(23, hy + 7, 8, 5), ell(41, hy + 7, 8, 5)), CREAM, { ol: false, rim: false });
  s.fill(ell(32, hy + 6.5, 8, pounce ? 5 : 6), CREAM, { ol: false, rim: false });
  s.dots(SPOT, [29, hy - 8], [33, hy - 9], [31, hy - 6], [36, hy - 6], [26, hy - 7], [38, hy - 8], [22, hy + 1], [42, hy + 1], [20, hy + 4], [44, hy + 4], [24, hy - 4], [40, hy - 4]);
  s.line(17, hy + 3, 21, hy + 4, SPOT);
  s.line(47, hy + 3, 43, hy + 4, SPOT);
  s.line(18, hy + 7, 22, hy + 7, SPOT);
  s.line(46, hy + 7, 42, hy + 7, SPOT);

  if (!pounce) {
    eye(s, 21, hy - 5, 6, 6, '#D8D83A', b === 1);
    eye(s, 37, hy - 5, 6, 6, '#D8D83A', b === 1);
    s.line(20, hy - 7, 26, hy - 6, SPOT);
    s.line(44, hy - 7, 38, hy - 6, SPOT);
    s.paint(poly([[29, hy + 1.5], [35, hy + 1.5], [32, hy + 5]]), '#E0707E');
    s.dots('#FFB4B8', [30, hy + 2]);
    s.line(29, hy + 1, 35, hy + 1, INK);
    s.dots(INK, [32, hy + 6], [32, hy + 7], [26, hy + 6], [38, hy + 6], [25, hy + 8], [39, hy + 8], [27, hy + 9], [37, hy + 9]);
    s.line(32, hy + 7, 28, hy + 9, INK);
    s.line(32, hy + 7, 36, hy + 9, INK);
    s.dots('#FFFFFF', [14, hy + 8], [50, hy + 8], [13, hy + 10], [51, hy + 10]);
  } else {
    s.fill(ell(32, hy + 8, 10, 5 + g * 1.5), ramp('#9A1F3B', { ol: '#2B0F1E' }), { rim: false });
    s.paint(ell(32, hy + 10 + g, 5, 2), '#EE7C8E');
    s.paint(poly([[24, hy + 4], [27, hy + 4], [25.5, hy + 8]]), '#FFFFFF');
    s.paint(poly([[37, hy + 4], [40, hy + 4], [38.5, hy + 8]]), '#FFFFFF');
    s.paint(poly([[26, hy + 12 + g], [28.5, hy + 12 + g], [27.5, hy + 8.5]]), '#FFF2D8');
    s.paint(poly([[35.5, hy + 12 + g], [38, hy + 12 + g], [36.5, hy + 8.5]]), '#FFF2D8');
    s.paint(poly([[29, hy + 1], [35, hy + 1], [32, hy + 4.5]]), '#E0707E');
    s.line(29, hy, 35, hy, INK);
    for (const sx of [-1, 1]) {
      const x = 32 + sx * 9.5;
      s.paint(ell(x, hy - 4, 3.6, 2.8), INK);
      s.paint(ell(x, hy - 3.7, 2.6, 1.9), '#F2E640');
      s.paint(ell(x, hy - 3.6, 0.9, 1.5), INK);
      s.put(x - 1, hy - 4.6, '#FFFFFF');
      s.line(x - sx * 4, hy - 8, x + sx * 3, hy - 5.5, SPOT);
      s.line(x - sx * 4, hy - 7, x + sx * 2, hy - 4.8, SPOT);
    }
  }
};

// ------------------------------------------------------------------ preguiça
const FUR = ramp('#B8A27A', { hi: '#DCCFA2', rim: '#F6EDCB', sh: '#8E7058', dp: '#5C4458', ol: '#2E2030' });
const FACE = ramp('#EADDB8', { sh: '#C4AC94', dp: '#8E7A82', ol: '#4A3640' });
const CLAW = ramp('#F2EACB', { sh: '#C9B79A', dp: '#8E7A82', ol: '#3A2A36' });
const MASK = '#4B3A40';

export const preguica: Drawer = (s, f) => {
  const rand = rng(11);
  const b = f === 1 ? 1 : 0;
  const turn = f === 2 ? -4 : 0;
  const yawn = f === 3;
  const hy = yawn ? 24 : 25 + b;

  // braços erguidos com garras longas
  const furAll: Mask[] = [];
  for (const sx of [-1, 1]) {
    const arm = cap(32 + sx * 15, 47, 5.5, 32 + sx * 23, 31 - (f >= 2 ? sx * 0 : 0), 4.5);
    s.fill(arm, FUR);
    furAll.push(arm);
    const hand = ell(32 + sx * 23.5, 29, 4.2, 3.4);
    s.fill(hand, FUR);
    furAll.push(hand);
    for (const k of [-3, 0, 3]) {
      const cx0 = 32 + sx * 23.5 + k;
      s.fill(cap(cx0, 27, 1.1, cx0 + sx * 1.4 + (k === 0 ? 0 : k * 0.3), 18 - Math.abs(k) * -0.6, 0.5), CLAW, { n: 1 });
    }
  }
  // pés
  for (const sx of [-1, 1]) {
    s.fill(ell(32 + sx * 10, 56.5, 7, 3.3), FUR);
    for (const k of [-3, 0, 3]) s.line(32 + sx * 10 + k, 58, 32 + sx * 10 + k + sx, 60, '#F2EACB');
  }
  const body = ell(32, 45, 17.5, 14 + b * 0.5);
  s.fill(body, FUR);
  s.fill(ell(32, 50, 9, 8), ramp('#D8C99C', { sh: '#B09478', ol: '#5C4458' }), { ol: false, rim: false });

  // cabeça
  const head = ell(32 + turn, hy, 14, 11.5);
  s.fill(head, FUR);
  const face = ell(32 + turn * 1.3, hy + 1.5, 10.5, 8.5);
  s.fill(face, FACE, { ol: false, rim: false });
  for (const sx of [-1, 1]) {
    const mx = 32 + turn * 1.3 + sx * 5.5;
    s.paint(ell(mx, hy + 0.5, 4.6, 3.4), MASK);
    s.paint(ell(mx + sx * 3.2, hy + 2.4, 2.4, 1.8), MASK);
    s.paint(ell(mx - sx * 0.5, hy - 1.3, 3.4, 1.4), MASK);
    if (yawn) s.line(mx - 2, hy + 1, mx + 2, hy + 1, '#E8D8A8');
    else eye(s, mx - 1.5, hy - 1, 3, 3, '#F2D88A', false, '#FFFFFF');
  }
  // nariz e boca
  const nx = 32 + turn * 1.6;
  s.paint(ell(nx, hy + 4.6, 2.8, 2), '#2A2024');
  s.put(nx - 1, hy + 4, '#8A7A86');
  if (yawn) {
    s.fill(ell(32, hy + 8.5, 4.5, 3.6), ramp('#8A2E48', { ol: '#2A1020' }), { rim: false });
    s.paint(ell(32, hy + 10, 2.6, 1.3), '#E8788C');
  } else {
    s.dots(INK, [nx - 4, hy + 7], [nx - 3, hy + 8], [nx - 2, hy + 8], [nx - 1, hy + 8], [nx, hy + 8], [nx + 1, hy + 8], [nx + 2, hy + 8], [nx + 3, hy + 8], [nx + 4, hy + 7]);
  }
  // pelagem: ruído claro, escuro e esverdeado (algas)
  const fur = uni(body, head, ...furAll);
  fuzz(s, fur, '#CDBE94', rand, 0.28);
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rand() * 64);
    const y = Math.floor(rand() * 64);
    if (fur[y * 64 + x] && !(and2(face, x, y))) s.put(x, y, i % 5 === 0 ? '#8FA062' : i % 2 ? '#D8C99A' : '#8E7058');
  }
};
const and2 = (m: Mask, x: number, y: number) => m[y * 64 + x] === 1;

// ------------------------------------------------------------------ uacari
const WHITE = ramp('#F8F3E8', { hi: '#FFFFFF', rim: '#FFFFFF', sh: '#CDBDC8', dp: '#9484A8', ol: '#4B3A5C' });
const RED = ramp('#E8484A', { hi: '#FF7A62', rim: '#FFC0A0', sh: '#B82C54', dp: '#7C1A4C', ol: '#3C0F2B' });
const BROWN = ramp('#8A6E55', { hi: '#B8946A', sh: '#5C4448', dp: '#3A2A3A', ol: '#241626' });

function uacariHead(s: Spr, cx: number, cy: number, blink: boolean, happy: boolean): void {
  // capuz de pelos brancos e orelhas
  s.fill(ell(cx, cy - 1, 15.5, 13), WHITE);
  for (const sx of [-1, 1]) s.fill(ell(cx + sx * 14, cy + 3, 3, 3.8), RED, { n: 1 });
  s.fill(ell(cx, cy + 2, 11, 10), RED);
  // costeletas e franja
  for (const sx of [-1, 1]) s.fill(ell(cx + sx * 12, cy + 6, 4.5, 6), WHITE, { ol: false });
  const fringe: Pt[] = [[cx - 14, cy - 2], [cx - 12, cy - 12], [cx, cy - 15], [cx + 12, cy - 12], [cx + 14, cy - 2], [cx + 10, cy - 5], [cx + 7, cy - 1], [cx + 4, cy - 6], [cx, cy - 2], [cx - 4, cy - 6], [cx - 7, cy - 1], [cx - 10, cy - 5]];
  s.fill(poly(fringe), WHITE, { ol: false });
  s.line(cx - 10, cy - 4, cx - 6, cy - 2, '#CDBDC8');
  s.line(cx + 10, cy - 4, cx + 6, cy - 2, '#CDBDC8');
  // olhos, nariz e boca
  eye(s, cx - 9, cy - 0.5, 6, 6, '#6A3A24', blink);
  eye(s, cx + 3, cy - 0.5, 6, 6, '#6A3A24', blink);
  s.line(cx - 9, cy - 2, cx - 4, cy - 3, '#7C1A4C');
  s.line(cx + 8, cy - 2, cx + 3, cy - 3, '#7C1A4C');
  s.paint(ell(cx, cy + 6.5, 2.4, 1.6), '#F58A78');
  s.dots('#7C1A4C', [cx - 1, cy + 6], [cx + 1, cy + 6]);
  s.line(cx, cy + 7, cx, cy + 8, '#7C1A4C');
  if (happy) {
    s.paint(ell(cx, cy + 10, 4, 2.4), '#5A1236');
    s.paint(ell(cx, cy + 10.8, 2.4, 1), '#EE7C8E');
  } else {
    s.dots('#7C1A4C', [cx - 4, cy + 9], [cx - 3, cy + 10], [cx - 2, cy + 10], [cx - 1, cy + 10], [cx, cy + 10], [cx + 1, cy + 10], [cx + 2, cy + 10], [cx + 3, cy + 10], [cx + 4, cy + 9]);
  }
  s.dots('#FF9A86', [cx - 7, cy + 7], [cx + 7, cy + 7]);
}

export const uacari: Drawer = (s, f) => {
  const rand = rng(23);
  const b = f === 1 ? 1 : 0;
  const air = f >= 2;
  const g = f === 3 ? 1 : 0;

  if (!air) {
    s.fill(path([[44, 55, 3], [53, 52, 3], [57, 45, 2.5]]), BROWN);
    for (const sx of [-1, 1]) {
      s.fill(cap(32 + sx * 15, 38, 5, 32 + sx * 18, 51, 4.5), WHITE);
      s.fill(ell(32 + sx * 18.5, 53, 4, 3.2), BROWN);
      s.fill(ell(32 + sx * 9, 56.5, 7, 3.3), BROWN);
    }
    const body = ell(32, 44, 17, 14 + b * 0.5);
    s.fill(body, WHITE);
    fuzz(s, body, '#E8E0F0', rand, 0.3);
    uacariHead(s, 32, 23 + b, b === 1, false);
  } else {
    const dy = -5 - g * 2;
    s.fill(path([[36, 48 + dy, 3], [46, 56 + dy, 3], [52, 62 + dy, 2.5]]), BROWN);
    for (const sx of [-1, 1]) {
      s.fill(cap(32 + sx * 8, 50 + dy, 5, 32 + sx * (17 + g * 2), 64 + dy - 1, 4.5), WHITE);
      s.fill(ell(32 + sx * (18 + g * 2), 63 + dy, 4.5, 3), BROWN);
      s.fill(cap(32 + sx * 12, 33 + dy, 4.5, 32 + sx * (22 - g * 2), 17 + dy + g * 2, 4), WHITE);
      s.fill(ell(32 + sx * (23 - g * 2), 15 + dy + g * 2, 4, 3.5), BROWN);
    }
    const body = ell(32, 42 + dy, 13, 14);
    s.fill(body, WHITE);
    fuzz(s, body, '#E8E0F0', rand, 0.3);
    uacariHead(s, 32, 22 + dy, false, true);
  }
};

// ------------------------------------------------------------------ ariranha
const OTTER = ramp('#7A4C2E', { hi:'#A87850', rim: '#E8B888', sh: '#4C2E2E', dp: '#2E1C2E', ol: '#190F20' });
const BIB = ramp('#F6EBCF', { sh: '#D3B79E', dp: '#9A7A86', ol: '#3A2430' });

export const ariranha: Drawer = (s, f) => {
  const rand = rng(31);
  const b = f === 1 ? 1 : 0;
  if (f < 2) {
    const body = ell(32, 47, 14, 15 + b * 0.5);
    s.fill(body, OTTER);
    // pata dianteiras junto ao peito
    for (const sx of [-1, 1]) {
      s.fill(cap(32 + sx * 12, 40, 4.5, 32 + sx * 8, 47, 3.8), OTTER);
      s.fill(ell(32 + sx * 7.5, 47.5, 3.8, 3), OTTER);
      s.dots('#F2E8D0', [32 + sx * 9, 50], [32 + sx * 7, 50.5], [32 + sx * 5, 50]);
    }
    // mancha clara da garganta, única de cada animal
    s.fill(uni(ell(31, 36 + b, 7.5, 5), ell(30, 42, 5, 4.5), ell(36, 40, 3.5, 3), ell(26, 35, 3, 2.5)), BIB, { ol: false, rim: false });
    s.dots('#7A4C2E', [28, 40], [33, 43], [35, 38], [27, 44]);
    // cabeça larga e achatada
    for (const sx of [-1, 1]) s.fill(ell(32 + sx * 13.5, 14 + b, 3, 3), OTTER, { n: 1 });
    s.fill(ell(32, 22 + b, 14.5, 11), OTTER);
    s.fill(ell(32, 28 + b, 9.5, 6.5), ramp('#B88A5C', { sh: '#8E5E48', dp: '#5C3A44' }), { ol: false });
    s.paint(ell(32, 25.5 + b, 4.2, 2.6), '#2A1820');
    s.paint(ell(31, 24.8 + b, 1.2, 0.7), '#8A7A8A');
    s.line(32, 28 + b, 32, 30 + b, INK);
    s.dots(INK, [28, 31 + b], [29, 32 + b], [30, 32 + b], [31, 31 + b], [33, 31 + b], [34, 32 + b], [35, 32 + b], [36, 31 + b]);
    eye(s, 21, 17 + b, 5, 5, '#8A5A2E', b === 1);
    eye(s, 38, 17 + b, 5, 5, '#8A5A2E', b === 1);
    // bigodes e brilho de pelo molhado
    for (const sx of [-1, 1]) {
      s.line(32 + sx * 7, 28 + b, 32 + sx * 13, 28 + b, '#F2E8D0');
      s.line(32 + sx * 7, 30 + b, 32 + sx * 13, 32 + b, '#F2E8D0');
      s.dots('#C99A68', [32 + sx * 9, 14 + b], [32 + sx * 5, 13 + b], [32 + sx * 12, 17 + b]);
    }
    fuzz(s, body, '#A87850', rand, 0.22);
    water(s, 32, 23, f);
  } else {
    const k = f === 3 ? 2 : 0;
    // cauda achatada e dorso arqueado por cima da água
    s.fill(path([[12 + k, 58, 4], [7 + k, 54, 3], [3 + k, 49, 2]]), OTTER);
    s.fill(ell(24 + k, 60, 13, 11), OTTER);
    s.dots('#A87850', [19 + k, 52], [23 + k, 50], [27 + k, 51], [15 + k, 55], [30 + k, 54]);
    // cabeça com olhos e focinho para fora
    const hx = 42 + k;
    s.fill(ell(hx, 56, 8.5, 6.5), OTTER);
    s.paint(ell(hx + 3, 55, 3.5, 2.4), '#2A1820');
    s.put(hx + 2, 54, '#8A7A8A');
    eye(s, hx - 6, 50, 4, 4, '#8A5A2E');
    eye(s, hx - 1, 49, 4, 4, '#8A5A2E');
    s.dots('#F2E8D0', [hx + 8, 56], [hx + 10, 58], [hx + 9, 54]);
    water(s, 28 + k, 28, f, 3);
  }
};
