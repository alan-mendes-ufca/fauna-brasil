import { rng } from '../../art/canvas';
import { cap, type Drawer, ell, eye, fuzz, path, poly, ramp, rect, water, wingPoly, type Pt } from '../../art/animals/kit';
import { drawWing, tailWedge, type WingSpec } from '../../art/animals/wing';

// Aves do Pampa na captura (64×64): quero-quero, joão-de-barro, cisne-de-pescoço-preto e cardeal-amarelo.

const WHITE = ramp('#F8F4EA', { hi: '#FFFFFF', rim: '#FFFFFF', sh: '#D6CCC0', dp: '#A09098', ol: '#3A2C34' });
const BLK = ramp('#26242C', { hi: '#4A4654', rim: '#8A869A', sh: '#18161E', dp: '#100E16', ol: '#06040A' });
const RED = ramp('#D8342E', { hi: '#F26048', rim: '#FFB090', sh: '#A81E30', dp: '#6A1030', ol: '#2A0A1A' });

// ------------------------------------------------------------------ quero-quero
const QB = ramp('#B0A48E', { hi: '#CCC0A8', rim: '#EEE4CC', sh: '#82766E', dp: '#58485A', ol: '#241A28' });
const QBRZ = ramp('#8A7A52', { hi: '#A8A06A', rim: '#D8D098', sh: '#625444', dp: '#42343E', ol: '#1C1420' });
const QLEG = ramp('#E0605A', { hi: '#F88A78', rim: '#FFC0A8', sh: '#B03E48', dp: '#702438', ol: '#2E1020' });
const QWING: WingSpec = {
  S: [39, 31],
  S2: [39, 40],
  feathers: [[30, -0.4], [32, -0.16], [31, 0.08], [27, 0.32], [22, 0.54]],
  outer: BLK,
  bands: [[20, WHITE], [11, QBRZ]],
  sep: BLK.dp,
};

export const queroquero: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const fly = f >= 2;
  const dy = fly ? (f === 2 ? -6 : -3) : 0;
  const theta = f === 2 ? -1.0 : 0.7;
  if (fly) {
    drawWing(s, QWING, theta, -1);
    drawWing(s, QWING, theta, 1);
    tailWedge(s, 32, 46 + dy, 10, 61 + dy, 0, WHITE, BLK, 5);
  } else {
    tailWedge(s, 32, 45, 10, 61, 0, WHITE, BLK, 5);
    // pernas longas e finas
    for (const sx of [-1, 1]) {
      const x = 32 + sx * 4;
      s.fill(cap(x, 47, 1.7, x + sx * 0.4, 56, 1.2), QLEG, { n: 1 });
      s.fill(ell(x + sx * 0.6, 57.6, 3.6, 1.4), QLEG, { n: 1 });
    }
  }
  const body = ell(32, 36 + dy + b * 0.4, 10.4, 13);
  s.fill(body, QB);
  s.fill(ell(32, 41 + dy, 7, 9), WHITE, { ol: false, rim: false });
  // babador preto no peito, colar branco no pescoço
  s.fill(ell(32, 30 + dy, 6.4, 5.6), BLK, { ol: false });
  if (!fly) {
    for (const sx of [-1, 1]) {
      const w = ell(32 + sx * 9.2, 38, 3.8, 10.4);
      s.fill(w, QBRZ);
      s.paintIn(w, ell(32 + sx * 9.2, 29, 2.6, 2.4), QB.hi);
      s.paintIn(w, rect(0, 45, 64, 6), BLK.md);
      s.dots('#F4D030', [32 + sx * 11.6, 27], [32 + sx * 11.6, 28]);
    }
  }
  // cabeça: boné preto com crista fina, rosto e bochechas brancas
  const hy = 21 + dy + b;
  s.fill(ell(32, hy + 6, 4.4, 4), WHITE, { ol: false, rim: false });
  const head = ell(32, hy, 7, 6.4);
  s.fill(head, QB);
  s.paintIn(head, ell(32, hy - 2, 6, 4), BLK.md);
  for (const sx of [-1, 1]) s.paintIn(head, ell(32 + sx * 5.2, hy + 2.6, 2.8, 2.6), WHITE.md);
  s.paintIn(head, rect(30, hy + 3, 4, 4), BLK.md);
  s.line(32, hy - 6, 36, hy - 15, BLK.md).line(33, hy - 6, 38, hy - 14, BLK.hi);
  s.line(31, hy - 6, 33, hy - 14, BLK.md);
  // bico curto, vermelho com ponta preta
  s.fill(poly([[29.6, hy + 1.8], [34.4, hy + 1.8], [33.4, hy + 6], [32, hy + 7.4], [30.6, hy + 6]]), RED);
  s.paint(poly([[30.6, hy + 5], [33.4, hy + 5], [32, hy + 7.4]]), BLK.md);
  for (const sx of [-1, 1]) {
    s.paint(ell(32 + sx * 4.4, hy - 0.4, 2.6, 2.4), '#E04A3A');
    eye(s, 32 + sx * 4.4 - 1.6, hy - 2, 3.2, 3.2, '#8A2A22', b === 1);
  }
  if (fly) s.dots('#E8D8B8', [10, 56], [12, 58], [52, 57], [54, 55]);
};

// ------------------------------------------------------------------ joão-de-barro
const JR = ramp('#B8703A', { hi: '#D8925A', rim: '#F8C890', sh: '#8A4A2E', dp: '#56303A', ol: '#26141C' });
const JB = ramp('#EDD0A4', { hi: '#FAE8C8', sh: '#C8A07C', dp: '#8A6A64', ol: '#3A2630' });
const CLAY = ramp('#B87848', { hi: '#D49A64', rim: '#F4C890', sh: '#8A5440', dp: '#583238', ol: '#241218' });

export const joaodebarro: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const crouch = f === 2;
  const hop = f === 3;
  // a casinha de barro: forno com a porta lateral
  const oven = ell(32, 53, 22, 11);
  s.fill(oven, CLAY);
  for (let yy = 44; yy < 62; yy += 3) s.paintIn(oven, rect(0, yy, 64, 0.8), CLAY.sh);
  for (let xx = 14; xx < 52; xx += 6) s.dots(CLAY.hi, [xx + (xx % 4), 48], [xx + 2, 54]);
  s.fill(poly([[14, 59], [14, 53], [17, 49.6], [21, 49.6], [24, 53], [24, 59]]), ramp('#2E1C1C', { hi: '#4E3030', ol: '#1A0E10', sh: '#1A0E10', dp: '#100808' }), { rim: false, n: 1 });
  s.dots(CLAY.rim, [30, 45], [38, 46]);
  const y = (hop ? -9 : crouch ? 4 : 0) + 3;
  // pernas
  if (!hop) {
    for (const sx of [-1, 1]) {
      s.fill(cap(32 + sx * 3.6, 40 + y, 1.5, 32 + sx * 4, 43.6 + 0, 1.2), JB, { n: 1 });
      s.fill(ell(32 + sx * 4.4, 44.4, 3, 1.1), JB, { n: 1 });
    }
  }
  tailWedge(s, 32, 36 + y, 9, 49 + y - (crouch ? 2 : 0), 0, JR, ramp('#8A4426'), 5);
  const body = ell(32, 30 + y + b * 0.4, 9.2, 10.6);
  s.fill(body, JR);
  s.fill(ell(32, 34 + y, 6, 7.4), JB, { ol: false, rim: false });
  for (const sx of [-1, 1]) {
    const w = ell(32 + sx * 8, 30 + y, hop ? 5.4 : 3.2, hop ? 5 : 8);
    s.fill(w, JR);
    s.paintIn(w, rect(0, 33 + y, 64, 2), ramp('#8A4426').md);
    if (hop) s.dots(JR.rim, [32 + sx * 10, 27 + y]);
  }
  const hy = 17 + y + b;
  const head = ell(32, hy, 7, 6.4);
  s.fill(head, JR);
  s.fill(ell(32, hy + 4.4, 3.8, 3.4), WHITE, { ol: false, rim: false });
  s.paintIn(head, ell(32, hy + 4.4, 3, 2.6), JB.md);
  for (const sx of [-1, 1]) s.line(32 + sx * 2, hy - 2.6, 32 + sx * 6.6, hy - 1, JB.md);
  // bico fino e reto
  s.fill(poly([[30.4, hy + 1.6], [33.6, hy + 1.6], [32.8, hy + 7], [31.2, hy + 7]]), ramp('#8A6A58', { hi: '#B8967C', ol: '#2A1C20' }), { n: 1 });
  for (const sx of [-1, 1]) eye(s, 32 + sx * 3.8 - 1.5, hy - 1.6, 3, 3, '#3A2418', b === 1);
  if (hop) s.dots(CLAY.rim, [20, 40], [44, 40], [24, 36], [40, 36]);
};

// ------------------------------------------------------------------ cisne-de-pescoço-preto
const SW = ramp('#F6F4EE', { hi: '#FFFFFF', rim: '#FFFFFF', sh: '#CCC8DC', dp: '#8E8AAA', ol: '#2E2A48' });
const SN = ramp('#2E2C36', { hi: '#524E60', rim: '#9894AC', sh: '#1C1A24', dp: '#100E18', ol: '#06040A' });
const SBILL = ramp('#A8A4B4', { hi: '#D0CCDA', rim: '#EEECF4', sh: '#7C788A', dp: '#524E66', ol: '#1C1A2C' });

export const cisne: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const wing = f === 2 ? 1 : f === 3 ? 2 : 0;
  // cauda curta
  s.fill(poly([[48, 46], [58, 42 - wing], [56, 51], [48, 54]]), SW);
  // asa por trás do corpo quando aberta
  if (wing) {
    const sh: Pt = [38, 46];
    const up = wing === 2 ? 1 : 0.7;
    const tips: Pt[] = [[22, 46 - 26 * up], [30, 46 - 30 * up], [38, 46 - 31 * up], [46, 46 - 29 * up], [54, 46 - 24 * up]];
    s.fill(poly(wingPoly(sh, tips, [48, 48], 0.2)), SW);
    for (const t of tips) s.line(sh[0] + (t[0] - sh[0]) * 0.5, sh[1] + (t[1] - sh[1]) * 0.5, sh[0] + (t[0] - sh[0]) * 0.9, sh[1] + (t[1] - sh[1]) * 0.9, SW.sh);
    s.paintIn(poly(wingPoly(sh, tips, [48, 48], 0.2)), rect(0, 0, 64, 46 - 22 * up), SW.sh);
  }
  const body = ell(36, 50, 17, wing ? 8 : 9);
  s.fill(body, SW);
  if (!wing) {
    // asa dobrada, ponta erguida
    const w = poly([[26, 46], [46, 40 - b], [55, 41], [48, 49], [30, 52]]);
    s.fill(w, SW);
    for (const x of [34, 40, 46]) s.line(x, 47, x + 7, 44, SW.sh);
    s.paintIn(w, ell(30, 51, 5, 2), SW.sh);
  }
  // pescoço negro em S, cabeça com a carúncula vermelha
  const neck = path([[24, 47, 5], [19, 38 - b, 3.6], [20, 29 - b, 3.1], [17, 22 - b, 3]]);
  s.fill(neck, SN);
  s.paintIn(neck, ell(23, 45, 4, 3), SN.hi);
  const hx = 15;
  const hy = 19 - b;
  s.fill(ell(hx, hy, 4.6, 4.2), SN);
  s.line(hx - 4, hy - 2, hx + 2, hy - 2.4, SW.md);
  s.line(hx - 4, hy - 1, hx + 2, hy - 1.4, SW.sh);
  s.fill(poly([[hx - 3, hy], [hx - 12, hy + 1.2], [hx - 12.4, hy + 3.4], [hx - 3, hy + 4]]), SBILL);
  s.fill(ell(hx - 3, hy - 1, 2.6, 2.4), RED);
  s.dots(RED.rim, [hx - 4, hy - 2]);
  s.dots(SBILL.dp, [hx - 11, hy + 2], [hx - 8, hy + 2.6]);
  eye(s, hx - 0.4, hy - 0.8, 3, 3, '#6A2A22', b === 1);
  water(s, 34, 24, f, wing);
  if (wing) s.dots('#E8FCFF', [10, 50], [58, 50], [14, 46], [54, 46]);
};

// ------------------------------------------------------------------ cardeal-amarelo
const CY = ramp('#F2C81E', { hi: '#FFE250', rim: '#FFF6A8', sh: '#CE9A1C', dp: '#8A5C24', ol: '#3A2214' });
const CG = ramp('#8A9068', { hi: '#AAB080', rim: '#D2D8A4', sh: '#646A52', dp: '#424640', ol: '#1C1E1C' });
const CK = ramp('#1E1C20', { hi: '#403C46', rim: '#7C788A', sh: '#121014', dp: '#0A080C', ol: '#030204' });
const BRANCH = ramp('#7A5A3E', { hi: '#A27E58', rim: '#CCA67E', sh: '#563C34', dp: '#3A2630', ol: '#1A1018' });
const CWING: WingSpec = {
  S: [38, 33],
  S2: [38, 41],
  feathers: [[26, -0.4], [28, -0.16], [27, 0.08], [24, 0.32], [20, 0.52]],
  outer: CK,
  bands: [[17, CG], [9, CY]],
  sep: CK.dp,
};

export const cardeal: Drawer = (s, f) => {
  const rand = rng(67);
  const b = f === 1 ? 1 : 0;
  const fly = f >= 2;
  const dy = fly ? (f === 2 ? -6 : -3) : 0;
  const theta = f === 2 ? -1.0 : 0.7;
  if (!fly) {
    s.fill(path([[8, 58.6, 1.8], [32, 58, 2.2], [56, 58.6, 1.8]]), BRANCH, { n: 1 });
    s.dots(BRANCH.dp, [20, 58], [44, 59]);
  }
  if (fly) {
    drawWing(s, CWING, theta, -1);
    drawWing(s, CWING, theta, 1);
  }
  // cauda longa, cinza-escura
  tailWedge(s, 32, 46 + dy, 9, 63 + dy * 0.5, 0, CG, CK, 6);
  if (!fly) {
    for (const sx of [-1, 1]) {
      const x = 32 + sx * 3.6;
      s.fill(cap(x, 51, 1.4, x, 56, 1.2), ramp('#8A7A82', { ol: '#2A1C26' }), { n: 1 });
      s.fill(ell(x + sx * 0.6, 57.4, 3, 1.1), ramp('#8A7A82', { ol: '#2A1C26' }), { n: 1 });
    }
  }
  const body = ell(32, 38 + dy + b * 0.4, 9.4, 13.6);
  s.fill(body, CY);
  fuzz(s, body, CY.hi, rand, 0.12);
  s.fill(ell(32, 44 + dy, 6.2, 8.4), ramp('#FFE250', { hi: '#FFF6A8', sh: '#E8B01E' }), { ol: false, rim: false });
  // babador preto do queixo ao peito
  s.fill(poly([[26, 26 + dy], [38, 26 + dy], [36, 36 + dy], [32, 40 + dy], [28, 36 + dy]]), CK, { ol: false });
  if (!fly) {
    for (const sx of [-1, 1]) {
      const w = ell(32 + sx * 8.6, 39, 3.6, 10);
      s.fill(w, CG);
      for (const yy of [32, 36, 40, 44]) s.paintIn(w, rect(0, yy, 64, 0.8), CG.dp);
      s.paintIn(w, ell(32 + sx * 8.6, 31, 3, 2), CY.md);
    }
  }
  // cabeça amarela: máscara e crista pretas, sobrancelha amarela
  const hy = 22 + dy + b;
  const head = ell(32, hy, 7.6, 6.8);
  s.fill(head, CY);
  s.paintIn(head, ell(32, hy + 2.4, 5.2, 3.2), CK.md);
  for (const sx of [-1, 1]) s.paintIn(head, rect(32 + sx * 2.6 + (sx < 0 ? -4 : 0), hy - 1.4, 4, 2.6), CK.md);
  for (const sx of [-1, 1]) s.paintIn(head, rect(32 + sx * 2.4 + (sx < 0 ? -4.4 : 0), hy - 2.4, 4.4, 1.8), CY.hi);
  const crest = poly([[28.5, hy - 4], [30, hy - 11], [33, hy - 8], [36, hy - 12], [36.5, hy - 4]]);
  s.fill(crest, CK);
  s.dots(CK.rim, [30, hy - 10], [36, hy - 11]);
  s.paintIn(head, ell(32, hy - 2.4, 5.4, 2.4), CK.md);
  // bico cônico, cinza-claro
  s.fill(poly([[29.4, hy + 1.4], [34.6, hy + 1.4], [33.4, hy + 6], [32, hy + 7.4], [30.6, hy + 6]]), ramp('#C0BCC4', { hi: '#E8E4EC', sh: '#908CA0', dp: '#5C586C', ol: '#1C1A28' }), { n: 1 });
  for (const sx of [-1, 1]) eye(s, 32 + sx * 4.2 - 1.6, hy - 1.2, 3.2, 3.2, '#5A2A18', b === 1);
  s.dots(CY.rim, [28, hy - 5], [29, hy - 4]);
  if (fly) s.dots('#FFF6A8', [14, 56], [50, 57], [18, 60], [46, 60]);
};
