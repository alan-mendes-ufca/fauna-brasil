import { cap, type Drawer, ell, eye, INK, path, poly, ramp, rect, uni } from '../../art/animals/kit';
import { drawWing, flapAngles, tailWedge, type WingSpec } from '../../art/animals/wing';
import { branch } from './shared';

// Aves da Mata Atlântica na captura (64×64): tucano-de-bico-verde, saíra-sete-cores, jacutinga,
// papagaio-de-cara-roxa e gralha-azul.

const FOOT = ramp('#7E8CA0', { hi: '#A8B4C8', ol: '#1C2236' });

// ------------------------------------------------------------------ tucano-de-bico-verde (pula)
const TK = ramp('#2A2430', { hi: '#4C4458', rim: '#7E7690', sh: '#1A141E', dp: '#100A14', ol: '#06040A' });
const TYEL = ramp('#F4D03A', { hi: '#FFEC70', rim: '#FFF8C0', sh: '#D0982A', dp: '#8E5A24', ol: '#3A2214' });
const TRED = ramp('#D8322B', { hi: '#FF6A4A', sh: '#A01E38', dp: '#620E34', ol: '#2A0A1E' });
const TBILL = ramp('#8CC03A', { hi: '#B8E060', rim: '#E4FFA0', sh: '#5E9A2E', dp: '#356A2A', ol: '#122A18' });

export const tucanoverde: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const hop = f === 3;
  const crouch = f === 2;
  const y = hop ? -7 : crouch ? 2 : 0;
  const lift = hop ? 9 : 0;
  branch(s, 57);
  // cauda com a cobertura vermelha
  s.fill(path([[22, 50 + y, 4.4], [18, 56 + y, 3.6], [16, 61 + y * 0.3, 3]]), TK);
  s.fill(ell(22, 52 + y, 4, 3.2), TRED, { n: 1 });
  // pés
  if (!hop) {
    for (const x of [28, 35]) {
      s.fill(cap(x, 52, 2, x, 56.5, 1.6), FOOT, { n: 1 });
      s.fill(ell(x + 1, 57.6, 3.2, 1.3), FOOT, { n: 1 });
    }
  } else {
    for (const x of [28, 35]) s.fill(cap(x, 50 + y, 2, x - 1, 55 + y, 1.4), FOOT, { n: 1 });
  }
  // corpo escuro, asa dobrada
  const body = ell(28, 40 + y + b * 0.4, 11, 14);
  s.fill(body, TK);
  s.paintIn(body, ell(21, 38 + y, 6, 10), TK.hi);
  s.dots(TK.rim, [17, 36 + y], [19, 31 + y], [20, 45 + y]);
  // peito amarelo com faixa vermelha
  s.fill(ell(34, 32 + y, 7, 8), TYEL, { ol: false });
  s.paint(ell(34, 40 + y, 5.6, 2), TRED.md);
  s.dots(TYEL.rim, [32, 27 + y], [34, 26 + y], [31, 29 + y]);
  // pescoço e cabeça
  s.fill(cap(33, 28 + y, 6, 33, 22 + y, 5.4), TK);
  const hx = 34;
  const hy = 21 + y + b;
  s.fill(ell(hx, hy, 6.8, 6.4), TK);
  s.fill(ell(hx + 1, hy + 4, 4.6, 3), TYEL, { ol: false, rim: false });
  s.paint(ell(hx + 3, hy - 0.8, 3.2, 2.8), '#4C9AD8');
  // bico gigante, verde com a base laranja e a ponta escura
  const tipY = hy + 8 - lift;
  const bill = poly([[hx + 4, hy - 3.5], [hx + 12, hy - 5 - lift * 0.2], [hx + 22, tipY - 5.5], [hx + 29, tipY - 1.5], [hx + 29, tipY + 2.2], [hx + 22, tipY + 5], [hx + 12, hy + 5 - lift * 0.3], [hx + 4, hy + 4]]);
  s.fill(bill, TBILL);
  s.paintIn(bill, rect(hx + 3, 0, 4, 64), TRED.md);
  s.paintIn(bill, rect(hx + 7, 0, 2, 64), TBILL.dp);
  s.paintIn(bill, rect(hx + 26, 0, 6, 64), TK.md);
  s.paintIn(bill, rect(hx + 8, hy - 6, 22, 2), TBILL.rim);
  s.line(hx + 5, hy + 1.5, hx + 29, tipY + 0.2, TBILL.dp);
  s.dots(INK, [hx + 12, hy - 2]);
  eye(s, hx + 1, hy - 2.5, 4, 4, '#3A2418', b === 1);
};

// ------------------------------------------------------------------ saíra-sete-cores (voa)
const SBLUE = ramp('#2E9AD8', { hi: '#62C8F4', rim: '#C0F0FF', sh: '#1E68B0', dp: '#14408A', ol: '#081A44' });
const SBLK = ramp('#242030', { hi: '#463E58', rim: '#7A708C', sh: '#16121E', dp: '#0E0A14', ol: '#06040A' });
const SGRN = ramp('#4CC070', { hi: '#80E896', rim: '#D0FFC8', sh: '#2E9050', dp: '#1A6044', ol: '#08281E' });
const SORG = ramp('#F29A28', { hi: '#FFC858', rim: '#FFEAA0', sh: '#C8641E', dp: '#8A3820', ol: '#3A1A14' });
const SYEL = '#F2D030';

const SAIRA_WING: WingSpec = {
  S: [38, 33],
  S2: [38, 40],
  feathers: [[21, -0.4], [23, -0.15], [22, 0.1], [19, 0.35], [15, 0.55]],
  outer: SBLK,
  bands: [[14, SBLUE], [8, SGRN]],
  sep: SBLK.dp,
};

export const saira: Drawer = (s, f) => {
  const a = flapAngles(f, -1.0, 0.7);
  drawWing(s, SAIRA_WING, a.l, -1);
  drawWing(s, SAIRA_WING, a.r, 1);
  const { dy, lean } = a;
  tailWedge(s, 32, 44 + dy, 7, 57, lean, SBLK);
  // corpo: costas pretas com a garupa amarela, peito azul-turquesa
  s.fill(ell(32 + lean * 0.5, 37 + dy, 8, 11), SBLUE);
  s.paint(ell(32, 46 + dy, 5, 3), SYEL);
  s.paint(ell(32, 42 + dy, 4.8, 3.6), SGRN.md);
  s.dots(SBLUE.hi, [29, 33 + dy], [30, 36 + dy], [35, 34 + dy]);
  s.dots(SBLK.md, [27, 41 + dy], [37, 41 + dy], [28, 45 + dy], [36, 45 + dy]);
  // cabeça verde com testa laranja e máscara preta
  const hx = 32 + lean;
  s.fill(ell(hx, 22 + dy, 8, 7.4), SGRN);
  s.paint(ell(hx, 17 + dy, 5.6, 2.6), SORG.md);
  s.dots(SORG.hi, [hx - 2, 16 + dy], [hx - 1, 15.6 + dy]);
  s.fill(uni(ell(hx - 4, 23 + dy, 3.6, 3), ell(hx + 4, 23 + dy, 3.6, 3), ell(hx, 27 + dy, 3.8, 2.2)), SBLK, { ol: false, rim: false });
  for (const sx of [-1, 1]) eye(s, hx + sx * 4 - 1.5, 21.5 + dy, 3, 3, '#6A3A22', f === 1, '#FFFFFF');
  s.fill(poly([[hx - 2.4, 25 + dy], [hx + 2.4, 25 + dy], [hx + 0.6, 29.5 + dy], [hx - 0.6, 29.5 + dy]]), ramp('#8A8490', { hi: '#C0BAC8', ol: '#1C1824' }), { n: 1 });
  s.dots(SGRN.rim, [hx - 5, 17 + dy], [hx + 5, 18 + dy]);
  // pezinhos
  s.dots(SBLK.dp, [30, 48 + dy], [34, 48 + dy]);
};

// ------------------------------------------------------------------ jacutinga (calmo)
const JK = ramp('#2A2830', { hi: '#48465A', rim: '#7C7A92', sh: '#1A1820', dp: '#100E16', ol: '#06040A' });
const JSHEEN = ramp('#2E4A58', { hi: '#4C7488', rim: '#8CB4C8', sh: '#1E3040', dp: '#12202E', ol: '#06101A' });
const JWH = ramp('#F2F0EA', { hi: '#FFFFFF', sh: '#CCC8D0', dp: '#9490A4', ol: '#2E2A3A' });
const JRED = ramp('#D8322B', { hi: '#FF6A4A', rim: '#FFB890', sh: '#A01E38', dp: '#620E34', ol: '#2A0A1E' });
const JBLUE = ramp('#3A6ED8', { hi: '#6EA0F4', sh: '#2446A0', dp: '#182C6E', ol: '#0A1236' });

export const jacutinga: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const peck = f === 2;
  const crest = f === 3;
  // folhas caídas no chão
  s.dots('#7A5A3A', [10, 59], [14, 60], [48, 60], [52, 59]);
  s.dots('#3E7A44', [18, 60], [44, 59]);
  // cauda longa e escura
  s.fill(poly([[16, 38], [8, 44], [4, 56], [10, 58], [18, 50], [24, 46]]), JK);
  s.paintIn(poly([[16, 38], [8, 44], [4, 56], [10, 58], [18, 50], [24, 46]]), rect(0, 50, 64, 12), JK.sh);
  // pernas vermelhas
  for (const x of [28, 36]) {
    s.fill(cap(x, 48, 1.9, x, 57, 1.6), JRED, { n: 1 });
    s.fill(ell(x + 1, 58, 4, 1.5), JRED, { n: 1 });
    s.dots(JRED.dp, [x - 3, 59], [x + 1, 59.4], [x + 5, 59]);
  }
  // corpo
  const body = uni(ell(30, 40 + b * 0.4, 17, 11), ell(38, 36, 10, 10));
  s.fill(body, JK);
  s.paintIn(body, ell(28, 34, 11, 4), JSHEEN.md);
  s.paintIn(body, ell(22, 33, 4, 1), JSHEEN.hi);
  // listras brancas no peito e mancha branca na asa
  for (let i = 0; i < 6; i++) s.paintIn(body, rect(36 + i * 1.6, 32 + (i % 2) * 3, 1, 5), JWH.md);
  const wing = ell(24, 40, 9, 5);
  s.fill(wing, JK, { n: 1 });
  for (const x of [17, 20, 23, 26]) s.paintIn(wing, rect(x, 36.5, 1, 4), JWH.md);
  s.line(14, 42, 32, 43, JK.dp);
  // pescoço fino e cabeça
  const hx = peck ? 50 : 46;
  const hy = peck ? 44 : 15 + b;
  const neckPts: [number, number, number][] = peck ? [[40, 30, 5], [48, 38, 3.6], [hx, hy, 3.2]] : [[40, 32, 5.2], [44, 24, 3.6], [hx, hy + 2, 3.2]];
  s.fill(path(neckPts), JK);
  s.fill(ell(hx, hy, 5.4, 4.6), JK);
  // topete branco
  const cr = crest ? 4 : 0;
  const tuft = poly([[hx - 4, hy - 2], [hx - 8, hy - 8 - cr], [hx - 4, hy - 5], [hx - 3, hy - 11 - cr], [hx - 1, hy - 5], [hx + 1, hy - 10 - cr], [hx + 2, hy - 4], [hx + 3, hy - 2]]);
  s.fill(tuft, JWH);
  s.dots(JWH.sh, [hx - 3, hy - 6], [hx, hy - 6]);
  // pele azul no rosto, bico curto e papo vermelho
  s.paint(ell(hx + 2.4, hy + 0.4, 2.8, 2.4), JBLUE.md);
  s.fill(poly([[hx + 4, hy - 0.5], [hx + 9, hy + 0.5], [hx + 8, hy + 2.5], [hx + 4, hy + 2.5]]), ramp('#B8B2A8', { hi: '#E0DAD0', ol: '#2E2A30' }), { n: 1 });
  s.fill(ell(hx + 3, hy + 6.4, 2.2, peck ? 2 : 3.6), JRED, { n: 1 });
  eye(s, hx + 1, hy - 1, 3, 3, '#F2E6A0', b === 1 && !peck);
  if (peck) s.dots('#E8D8B0', [hx + 10, 58], [hx + 12, 59]);
};

// ------------------------------------------------------------------ papagaio-de-cara-roxa (voa)
const PG = ramp('#3EA84A', { hi: '#74D468', rim: '#C0FFA0', sh: '#26783E', dp: '#164E34', ol: '#06240F' });
const PGDK = ramp('#2A7A3A', { hi: '#4CA050', rim: '#98D88A', sh: '#1A5430', dp: '#103822', ol: '#04180C' });
const PRED = ramp('#D8322B', { hi: '#FF6A4A', sh: '#A01E38', dp: '#620E34', ol: '#2A0A1E' });
const PVIO = ramp('#8A5ABA', { hi: '#B088DC', rim: '#E4CCFF', sh: '#5E3A92', dp: '#3C2468', ol: '#1A0E3A' });
const PBLUE = ramp('#2E5AC0', { hi: '#5C8AE8', sh: '#1E3C94', dp: '#142668', ol: '#080E38' });
const PBILL = ramp('#C8B898', { hi: '#E8DCC0', rim: '#FFF4DC', sh: '#9A8870', dp: '#6A5850', ol: '#2A1E22' });

const PG_WING: WingSpec = {
  S: [38, 31],
  S2: [38, 41],
  feathers: [[30, -0.42], [33, -0.17], [32, 0.08], [28, 0.33], [22, 0.55]],
  outer: PBLUE,
  bands: [[20, PGDK], [12, PG]],
  sep: PBLUE.dp,
};

export const cararoxa: Drawer = (s, f) => {
  const a = flapAngles(f);
  drawWing(s, PG_WING, a.l, -1);
  drawWing(s, PG_WING, a.r, 1);
  const { dy, lean } = a;
  tailWedge(s, 32, 44 + dy, 10, 58, lean, PG, PGDK, 5);
  for (const sx of [-1, 1]) {
    s.fill(ell(32 + sx * 4, 49 + dy, 2.4, 2), FOOT, { n: 1 });
  }
  s.fill(ell(32 + lean * 0.5, 37 + dy, 9.4, 12.5), PG);
  s.paint(ell(32, 41 + dy, 6, 8), PG.hi);
  s.dots(PGDK.md, [29, 38 + dy], [34, 40 + dy], [31, 44 + dy], [36, 36 + dy], [28, 43 + dy]);
  s.paint(ell(32, 47 + dy, 4, 1.6), PRED.md);
  const hx = 32 + lean;
  s.fill(ell(hx, 20 + dy, 9.6, 8.6), PG);
  // testa vermelha e bochechas roxas
  s.paint(ell(hx, 14 + dy, 4.6, 2.2), PRED.md);
  s.dots(PRED.hi, [hx - 1, 13 + dy], [hx, 13 + dy]);
  s.fill(uni(ell(hx - 5.4, 22.5 + dy, 4.4, 4.4), ell(hx + 5.4, 22.5 + dy, 4.4, 4.4)), PVIO, { ol: false, rim: false });
  s.dots(PVIO.rim, [hx - 7, 20 + dy], [hx + 7, 20 + dy]);
  eye(s, hx - 7.5, 17.5 + dy, 4, 4, '#E8A030', f === 1);
  eye(s, hx + 3.5, 17.5 + dy, 4, 4, '#E8A030', f === 1);
  s.fill(poly([[hx - 3.8, 20.5 + dy], [hx + 3.8, 20.5 + dy], [hx + 3.4, 25 + dy], [hx + 0.8, 29.5 + dy], [hx - 1, 28 + dy], [hx - 3.2, 25 + dy]]), PBILL);
  s.line(hx - 2.5, 25 + dy, hx + 2.5, 25 + dy, PBILL.sh);
  s.dots(PBILL.rim, [hx - 2, 21.5 + dy], [hx - 1, 21.5 + dy]);
  s.dots(INK, [hx - 1, 22.5 + dy], [hx + 1, 22.5 + dy]);
};

// ------------------------------------------------------------------ gralha-azul (voa)
const GB = ramp('#2E44D4', { hi: '#5C78F4', rim: '#B8CCFF', sh: '#1E2C9E', dp: '#141C6A', ol: '#080A34' });
const GDK = ramp('#1A2070', { hi: '#3446B0', rim: '#7C90E0', sh: '#10144E', dp: '#0A0C34', ol: '#04041C' });
const GHEAD = ramp('#181430', { hi: '#34305A', rim: '#7470A0', sh: '#100C22', dp: '#0A0816', ol: '#04020C' });
const GLIGHT = '#8AAAF8';

const GRALHA_WING: WingSpec = {
  S: [38, 31],
  S2: [38, 41],
  feathers: [[29, -0.42], [32, -0.17], [31, 0.08], [27, 0.33], [21, 0.55]],
  outer: GDK,
  bands: [[19, GB], [11, ramp('#4A66E4', { hi: '#7C96FA', sh: '#2C40B4', dp: '#1C2A82', ol: '#080A34' })]],
  sep: GDK.dp,
};

export const gralhaazul: Drawer = (s, f) => {
  const a = flapAngles(f);
  drawWing(s, GRALHA_WING, a.l, -1);
  drawWing(s, GRALHA_WING, a.r, 1);
  const { dy, lean } = a;
  tailWedge(s, 32, 44 + dy, 10, 60, lean, GB, GDK, 6);
  for (const sx of [-1, 1]) s.fill(ell(32 + sx * 4, 49 + dy, 2.2, 1.8), GHEAD, { n: 1 });
  s.fill(ell(32 + lean * 0.5, 37 + dy, 9, 12.5), GB);
  s.paint(ell(32, 41 + dy, 5.6, 8), GB.hi);
  s.dots(GLIGHT, [29, 36 + dy], [34, 39 + dy], [31, 44 + dy], [36, 35 + dy]);
  // cabeça e papo pretos, topete alto
  const hx = 32 + lean;
  s.fill(ell(hx, 28 + dy, 7.4, 4.4), GHEAD);
  const crest = poly([[hx - 7, 18 + dy], [hx - 6, 9 + dy], [hx - 2.4, 4 + dy - (f === 4 ? 2 : 0)], [hx + 1.4, 3 + dy], [hx + 5, 7 + dy], [hx + 7, 14 + dy], [hx + 8, 20 + dy]]);
  s.fill(crest, GHEAD);
  s.fill(ell(hx, 20 + dy, 9, 8), GHEAD);
  s.dots(GHEAD.rim, [hx - 4, 7 + dy], [hx - 3, 9 + dy], [hx - 1, 5 + dy]);
  // riscos azul-claros na testa
  for (const x of [-4, -1.5, 1.5, 4]) s.line(hx + x, 14 + dy, hx + x * 1.2, 17 + dy, GLIGHT);
  for (const sx of [-1, 1]) {
    s.paint(ell(hx + sx * 5, 20.5 + dy, 3.2, 3), GB.sh);
    eye(s, hx + sx * 5 - 2, 18.5 + dy, 4, 4, '#4A3A28', f === 1, '#FFFFFF');
  }
  const bill = poly([[hx - 3.6, 22 + dy], [hx + 3.6, 22 + dy], [hx + 3, 26 + dy], [hx + 0.6, 30 + dy], [hx - 0.6, 30 + dy], [hx - 3, 26 + dy]]);
  s.fill(bill, ramp('#2E2C34', { hi: '#5E5A68', rim: '#8E8A98', sh: '#1C1A22', ol: '#08060E' }));
  s.dots('#8E8A98', [hx - 2, 23 + dy], [hx - 1, 23 + dy]);
};
