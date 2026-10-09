import { cap, type Drawer, ell, eye, INK, path, ramp, rect, uni } from '../../art/animals/kit';
import { branch, leaf } from './shared';

// Mamíferos da Mata Atlântica na captura (64×64): mico-leão-dourado, muriqui-do-sul e ouriço-cacheiro.

// ------------------------------------------------------------------ mico-leão-dourado
const GOLD = ramp('#F08A24', { hi: '#FFB046', rim: '#FFE29A', sh: '#C8561E', dp: '#8A3220', ol: '#3A1418' });
const MANE = ramp('#FFA52E', { hi: '#FFC858', rim: '#FFEDB0', sh: '#D8681E', dp: '#9A3E20', ol: '#3A1418' });
const FACE = ramp('#5A3A34', { hi: '#7E5648', rim: '#B08470', sh: '#3E262C', dp: '#2A1822', ol: '#140A12' });

export const micoleao: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const jump = f === 3;
  const crouch = f === 2;
  const dy = jump ? -10 : crouch ? 2 : b;
  if (!jump) branch(s);
  else {
    branch(s);
    s.dots('rgba(20,10,30,0.25)', [24, 60], [32, 60], [40, 60]);
  }
  leaf(s, 8, 54, 1);
  // cauda longa que enrola na ponta
  const tail = jump
    ? path([[40, 46 + dy, 2.4], [49, 44 + dy, 2.2], [56, 36 + dy, 2], [55, 26 + dy, 1.8]])
    : path([[40, 52 + dy, 2.4], [50, 54, 2.2], [57, 49, 2], [57, 41, 1.8]]);
  s.fill(tail, GOLD);
  s.dots(GOLD.dp, jump ? [55, 28 + dy] : [57, 43]);
  // pernas
  if (jump) {
    s.fill(cap(26, 52 + dy, 2.8, 22, 57 + dy, 2), GOLD);
    s.fill(cap(38, 52 + dy, 2.8, 42, 57 + dy, 2), GOLD);
  } else {
    s.fill(cap(26, 50 + dy, 3, 24, 56, 2.2), GOLD);
    s.fill(cap(38, 50 + dy, 3, 40, 56, 2.2), GOLD);
    s.dots(FACE.md, [22, 57], [23, 57], [25, 57], [39, 57], [41, 57], [42, 57]);
  }
  // corpo e barriga
  const body = ell(32, 45 + dy, 9, 10.5);
  s.fill(body, GOLD);
  s.paintIn(body, ell(32, 47 + dy, 5.5, 7), GOLD.hi);
  // braços
  if (jump) {
    s.fill(cap(24, 40 + dy, 2.6, 15, 31 + dy, 2), GOLD);
    s.fill(cap(40, 40 + dy, 2.6, 49, 31 + dy, 2), GOLD);
    s.dots(FACE.md, [14, 29 + dy], [15, 29 + dy], [49, 29 + dy], [50, 29 + dy]);
  } else {
    s.fill(cap(24, 40 + dy, 2.6, 22, 51 + dy, 2.2), GOLD);
    s.fill(cap(40, 40 + dy, 2.6, 42, 51 + dy, 2.2), GOLD);
    s.dots(GOLD.rim, [22, 52 + dy], [23, 53 + dy], [41, 52 + dy], [42, 53 + dy]);
  }
  // juba imensa em volta do rostinho
  const mane = uni(ell(32, 28 + dy, 14.5, 13), ell(32, 37 + dy, 11, 5.5), ell(19, 33 + dy, 4.5, 6), ell(45, 33 + dy, 4.5, 6));
  s.fill(mane, MANE);
  for (const [x, y] of [[19, 22], [24, 17], [32, 15], [40, 17], [45, 22], [16, 30], [48, 30], [20, 38], [44, 38]]) {
    s.dots(MANE.rim, [x, y + dy]);
    s.dots(MANE.sh, [x + (x < 32 ? -1 : 1), y + 2 + dy]);
  }
  // rosto escuro
  const face = uni(ell(32, 30 + dy, 7.6, 7), ell(32, 34 + dy, 5.6, 4.6));
  s.fill(face, FACE);
  s.paintIn(face, ell(32, 35.5 + dy, 3.8, 2.6), FACE.hi);
  s.dots(INK, [31, 34 + dy], [33, 34 + dy]);
  s.line(30, 37 + dy, 34, 37 + dy, FACE.dp);
  for (const sx of [-1, 1]) {
    eye(s, 32 + sx * 4 - 2, 26.5 + dy, 4, 4, '#5A3418', b === 1 && !jump);
    s.line(32 + sx * 6, 25 + dy, 32 + sx * 2.5, 24.5 + dy, FACE.dp);
  }
  if (jump) s.dots('#FFE29A', [10, 46], [54, 48], [14, 40], [50, 40]);
};

// ------------------------------------------------------------------ muriqui-do-sul
const MUR = ramp('#B8A27A', { hi: '#D8C69C', rim: '#F4E8C8', sh: '#8A7660', dp: '#5E4C48', ol: '#2A1E26' });
const MBELLY = ramp('#D8C8A0', { hi: '#F0E4C4', sh: '#AC9A80', dp: '#7A6A64', ol: '#2E2226' });
const MFACE = ramp('#4A3A3A', { hi: '#6E5A52', rim: '#A08C7C', sh: '#322628', dp: '#221A22', ol: '#100A12' });
const MPINK = '#D89A94';

export const muriqui: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const wave = f === 2;
  const hug = f === 3;
  branch(s, 57);
  // cauda preênsil, enrolada
  s.fill(path([[44, 53, 3], [54, 54, 2.8], [59, 47, 2.4], [57, 39, 2], [52, 36, 1.6]]), MUR);
  // pernas curtas e pés
  for (const sx of [-1, 1]) {
    s.fill(ell(32 + sx * 9, 54, 5.6, 4.4), MUR);
    s.dots(MFACE.md, [32 + sx * 9 - 2, 58], [32 + sx * 9, 58], [32 + sx * 9 + 2, 58]);
  }
  // corpo de barriga cheia
  const body = uni(ell(32, 40 + b * 0.5, 15, 16), ell(32, 28, 13, 8));
  s.fill(body, MUR);
  s.paintIn(body, ell(32, 46, 9.6, 10.5), MBELLY.md);
  s.paintIn(body, ell(30, 44, 5, 6), MBELLY.hi);
  for (const [x, y] of [[22, 34], [26, 31], [40, 32], [43, 36], [21, 43], [44, 44]]) s.dots(MUR.hi, [x, y], [x + 1, y + 1]);
  // braços compridos
  const armL = hug ? path([[20, 29, 4], [20, 39, 3.4], [29, 45, 2.8]]) : path([[19, 29, 4], [14, 40, 3.4], [13, 51, 2.8]]);
  const armR = wave ? path([[45, 29, 4], [51, 22, 3.4], [52, 12, 2.8]]) : hug ? path([[44, 29, 4], [44, 39, 3.4], [35, 45, 2.8]]) : path([[45, 29, 4], [50, 40, 3.4], [51, 51, 2.8]]);
  s.fill(armL, MUR);
  s.fill(armR, MUR);
  s.dots(MFACE.md, hug ? [29, 46] : [13, 52], hug ? [30, 46] : [14, 52], hug ? [35, 46] : [51, 52], hug ? [34, 46] : [50, 52]);
  if (wave) s.dots(MFACE.md, [52, 10], [53, 10], [51, 10]);
  // cabeça redonda, cara escura de focinho curto
  const head = ell(32, 16 + b, 10.5, 10);
  s.fill(head, MUR);
  s.paintIn(head, rect(21, 5 + b, 22, 4), MUR.hi);
  for (const [x, y] of [[24, 8], [28, 6], [34, 6], [39, 8]]) s.dots(MUR.dp, [x, y + b]);
  const face = uni(ell(32, 18 + b, 7.6, 7), ell(32, 22 + b, 5.6, 4.6));
  s.fill(face, MFACE);
  s.paintIn(face, ell(32, 22.5 + b, 3.8, 2.8), MFACE.hi);
  s.dots(INK, [30, 21.5 + b], [34, 21.5 + b]);
  s.line(29, 25 + b, 35, 25 + b, MFACE.dp);
  s.dots(MPINK, [31, 25.6 + b], [32, 25.8 + b], [33, 25.6 + b]);
  for (const sx of [-1, 1]) {
    eye(s, 32 + sx * 4 - 2, 15.5 + b, 4, 4, '#6A4A2A', hug || b === 1);
    s.fill(ell(32 + sx * 10.6, 18 + b, 1.6, 2.4), MUR, { n: 1 });
  }
  s.line(26.5, 14 + b, 29.5, 14.5 + b, MFACE.dp);
  s.line(37.5, 14 + b, 34.5, 14.5 + b, MFACE.dp);
};

// ------------------------------------------------------------------ ouriço-cacheiro
const OUR = ramp('#5A4636', { hi: '#7E624A', rim: '#B8946A', sh: '#3E3028', dp: '#2A2022', ol: '#120A10' });
const OFACE = ramp('#4A382E', { hi: '#6E5444', rim: '#A88A6C', sh: '#32241E', dp: '#22181A', ol: '#0E0810' });
const SPINE_TIP = '#F0E2A8';
const SPINE_BASE = '#3A2E26';

export const ourico: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const bristle = f >= 2;
  const k = f === 3 ? 1 : 0;
  // espinhos primeiro: saem do corpo em leque
  const cx = 28;
  const cy = 38 + (bristle ? 1 : 0);
  const n = bristle ? 26 : 20;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * 1.02 + (i / (n - 1)) * Math.PI * 1.2;
    const rx = 17;
    const ry = 15;
    const x0 = cx + Math.cos(a) * rx * 0.75;
    const y0 = cy + Math.sin(a) * ry * 0.75;
    const len = (bristle ? 15 + (i % 3) * 2.5 + k * (i % 2) * 2 : 9 + (i % 3) * 2) + (a < -2.2 ? 2 : 0);
    const x1 = cx + Math.cos(a) * (rx + len);
    const y1 = cy + Math.sin(a) * (ry + len);
    const xm = x0 + (x1 - x0) * 0.45;
    const ym = y0 + (y1 - y0) * 0.45;
    s.line(x0, y0, xm, ym, SPINE_BASE);
    s.line(x0 + 1, y0, xm + 1, ym, SPINE_BASE);
    s.line(xm, ym, x1, y1, SPINE_TIP);
    s.line(xm + 1, ym, x1 + 1, y1, SPINE_TIP);
    s.put(x1, y1, '#FFFFFF');
  }
  // cauda preênsil nua na ponta, enrolada à esquerda
  s.fill(path([[14, 48, 3], [7, 52, 2.4], [5, 58, 1.8], [10, 60, 1.4]]), OUR);
  // patas
  for (const x of [22, 36]) {
    s.fill(cap(x, 48, 3.4, x, 56, 2.6), OUR, { n: 1 });
    s.dots('#E8D8B0', [x - 2, 58], [x, 58], [x + 2, 58]);
  }
  // corpo
  const body = ell(28, 40 + b * 0.5, 17, 13);
  s.fill(body, OUR);
  for (let i = 0; i < 9; i++) {
    const x = 14 + ((i * 7) % 30);
    const y = 30 + ((i * 5) % 18);
    s.paintIn(body, rect(x, y, 1, 3), i % 2 ? SPINE_TIP : OUR.hi);
  }
  s.paintIn(body, rect(0, 48, 64, 5), OUR.sh);
  // cabeça: focinho redondo e rosado, olhos pequenos (escondida pelos espinhos ao se eriçar)
  const hx = 46;
  const hy = bristle ? 46 : 44 + b;
  const head = uni(ell(hx, hy, 8.4, 7.4), ell(hx + 6, hy + 2.6, 5, 4));
  s.fill(head, OFACE);
  s.paintIn(head, ell(hx + 8, hy + 3.4, 3, 2.4), OFACE.hi);
  s.fill(ell(hx + 11.5, hy + 1.8, 2.3, 1.8), ramp('#E8A0A0', { sh: '#B87078', dp: '#7A4658', ol: '#2E141E' }), { n: 1 });
  s.line(hx + 4, hy + 6.5, hx + 9, hy + 7, OFACE.dp);
  s.fill(ell(hx - 4, hy - 6, 2.4, 2), OFACE, { n: 1 });
  s.dots(OFACE.rim, [hx - 5, hy - 7]);
  eye(s, hx + 1, hy - 2, 4, 4, '#3A2418', b === 1);
  // bigodes
  s.line(hx + 9, hy + 4, hx + 14, hy + 6, '#E8D8B0');
  s.line(hx + 9, hy + 3, hx + 15, hy + 3, '#E8D8B0');
  if (bristle) s.dots(SPINE_TIP, [hx - 5, hy - 10], [hx - 1, hy - 11], [hx + 3, hy - 10]);
};
