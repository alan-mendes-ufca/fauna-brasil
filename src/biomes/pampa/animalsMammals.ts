import { rng } from '../../art/canvas';
import { cap, type Drawer, ell, eye, fuzz, path, poly, ramp, rect, uni, water, type Pt } from '../../art/animals/kit';

// Mamíferos do Pampa na captura (64×64, base em y = 58): veado-campeiro, graxaim-do-campo, zorrilho,
// tuco-tuco, gato-palheiro, tatu-mulita e ratão-do-banhado.

const CREAM = ramp('#F4EAD8', { hi: '#FFFFFF', sh: '#CDBCA8', dp: '#8E7C80', ol: '#3A2A2E' });
const NOSE = ramp('#2A2024', { hi: '#5A4C52', ol: '#08040A' });
const PINK = ramp('#E8A4A0', { hi: '#F8CCC4', sh: '#B87880', dp: '#7E4E5E', ol: '#3A1E2A' });

// ------------------------------------------------------------------ veado-campeiro
const VD = ramp('#BC8650', { hi: '#D8A872', rim: '#FFE0AC', sh: '#8E5A3E', dp: '#56343A', ol: '#26141E' });
const ANT = ramp('#C8B898', { hi: '#E8DCC0', rim: '#FFF6DC', sh: '#8E7C68', dp: '#54463E', ol: '#241A18' });

export const veadocampeiro: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const leap = f === 3;
  const y = leap ? -9 : 0;
  const alert = f === 2;
  // patas finas: as de trás espiam, mais claras
  for (const sx of [-1, 1]) {
    if (leap) {
      s.fill(cap(32 + sx * 9, 46 + y, 3, 32 + sx * 17, 55, 1.8), VD);
      s.fill(cap(32 + sx * 5, 46 + y, 2.6, 32 + sx * 7, 54 + y, 1.7), VD);
      s.fill(ell(32 + sx * 7, 55 + y, 1.8, 1.4), NOSE, { n: 1 });
    } else {
      s.fill(cap(32 + sx * 10, 44, 3, 32 + sx * 10, 57, 1.8), VD);
      s.fill(cap(32 + sx * 5, 46, 2.8, 32 + sx * 5, 57, 1.7), VD);
      s.fill(ell(32 + sx * 5, 58, 2.4, 1.3), NOSE, { n: 1 });
      s.fill(ell(32 + sx * 10, 58, 2.2, 1.2), NOSE, { n: 1 });
    }
  }
  // cauda curta e branca atrás
  s.fill(ell(32 + 12, 36 + y, 2.8, 3.4), CREAM, { n: 1 });
  const body = ell(32, 41 + y, 12, 9.5);
  s.fill(body, VD);
  s.fill(ell(32, 47 + y, 7, 5.5), CREAM, { ol: false, rim: false });
  // pescoço fino e garganta clara
  const top = alert ? 16 : 20;
  const hy = top - 1 + y + b;
  s.fill(cap(32, 38 + y, 6, 32, hy + 6, 4), VD);
  s.fill(ell(32, hy + 14, 3, 6), CREAM, { ol: false, rim: false, n: 1 });
  // chifres de três pontas
  for (const sx of [-1, 1]) {
    const a: Pt[] = [[32 + sx * 3, hy - 5], [32 + sx * 6, hy - 11], [32 + sx * 5, hy - 17]];
    for (const [dx, col] of [[sx, ANT.ol], [0, ANT.md]] as [number, string][]) {
      s.line(a[0][0] + dx, a[0][1], a[1][0] + dx, a[1][1], col).line(a[1][0] + dx, a[1][1], a[2][0] + dx, a[2][1], col);
      s.line(a[1][0] + dx, a[1][1], 32 + sx * 11 + dx, hy - 13, col);
      s.line(32 + sx * 4.5 + dx, hy - 8, 32 + sx * 9 + dx, hy - 8, col);
    }
    s.dots(ANT.rim, [a[1][0], a[1][1]], [a[2][0], a[2][1] + 1]);
  }
  // orelhas grandes
  for (const sx of [-1, 1]) {
    s.fill(poly([[32 + sx * 4, hy - 1], [32 + sx * 7, hy - 8], [32 + sx * 14, hy - 5], [32 + sx * 9, hy + 2]]), VD);
    s.paint(poly([[32 + sx * 7, hy - 1], [32 + sx * 8.4, hy - 5], [32 + sx * 11.4, hy - 3.6], [32 + sx * 9, hy]]), '#E8B8A4');
  }
  const head = uni(ell(32, hy, 6, 5.6), ell(32, hy + 4, 4, 5));
  s.fill(head, VD);
  s.paintIn(head, ell(32, hy + 6, 3.4, 4), CREAM.md);
  s.fill(ell(32, hy + 9, 2.8, 1.8), NOSE, { n: 1 });
  s.dots(CREAM.hi, [31, hy + 8]);
  eye(s, 25.5, hy - 2, 4, 4, '#4A2E1A', b === 1);
  eye(s, 34.5, hy - 2, 4, 4, '#4A2E1A', b === 1);
  s.dots(VD.rim, [29, hy - 5], [30, hy - 5]);
  if (leap) s.dots('#E8D2A8', [16, 60], [18, 61], [46, 60], [48, 61]);
};

// ------------------------------------------------------------------ graxaim-do-campo
const GX = ramp('#A39078', { hi: '#C4B298', rim: '#EEDFC0', sh: '#7A6A64', dp: '#4E4054', ol: '#241A26' });
const GR = ramp('#C87C42', { hi: '#E4A064', rim: '#FFD8A0', sh: '#9C5A3A', dp: '#5E3238', ol: '#2A1420' });
const GBK = ramp('#2E262C', { hi: '#52464E', ol: '#08040A' });

export const graxaim: Drawer = (s, f) => {
  const rand = rng(61);
  const b = f === 1 ? 1 : 0;
  const crouch = f === 2;
  const air = f === 3;
  const y = air ? -9 : crouch ? 5 : 0;
  // cauda longa, cheia, com faixa escura no dorso e a ponta preta
  const tl: [number, number, number][] = air ? [[41, 46 + y, 3.6], [51, 50 + y, 4.4], [58, 57 + y, 3.4]] : [[41, 50 + y, 3.8], [51, 52 + y, 4.6], [58, 46 + y, 4.2], [60, 37 + y, 3.4]];
  const tail = path(tl);
  s.fill(tail, GX);
  fuzz(s, tail, GX.hi, rand, 0.25);
  const tip = tl[tl.length - 1];
  s.paintIn(tail, ell(tip[0], tip[1], 3.6, 3.6), GBK.md);
  s.dots(GBK.md, [tl[1][0], tl[1][1] - 3], [tl[1][0] + 1, tl[1][1] - 2], [tl[2][0] + 1, tl[2][1] - 3]);
  // patas ruivas
  for (const sx of [-1, 1]) {
    if (air) {
      s.fill(cap(32 + sx * 10, 52 + y, 3.4, 32 + sx * 16, 57 + y * 0.3, 2.2), GR);
      s.fill(cap(32 + sx * 5, 44 + y, 2.8, 32 + sx * 7, 51 + y, 2.2), GR, { n: 1 });
      s.fill(ell(32 + sx * 7.5, 52 + y, 2.4, 1.4), GBK, { n: 1 });
    } else {
      s.fill(cap(32 + sx * 6, 46 + y * 0.5, 3, 32 + sx * 6.4, 57, 2.2), GR);
      s.fill(ell(32 + sx * 6.4, 58, 3, 1.7), GBK, { n: 1 });
    }
  }
  const body = ell(32, 45 + y + b * 0.3, 12, crouch ? 8 : 9.5);
  s.fill(body, GX);
  fuzz(s, body, GX.hi, rand, 0.2);
  s.fill(ell(32, 49 + y, 6, 6.5), CREAM, { ol: false, rim: false });
  // cabeça: orelhas ruivas de ponta fina, focinho afilado
  const hy = 28 + y + b + (crouch ? 2 : 0);
  for (const sx of [-1, 1]) {
    s.fill(poly([[32 + sx * 3, hy - 3], [32 + sx * 6, hy - 17], [32 + sx * 13.5, hy - 11], [32 + sx * 10, hy - 1]]), GR);
    s.paint(poly([[32 + sx * 6, hy - 3], [32 + sx * 7.4, hy - 11], [32 + sx * 10.8, hy - 8.6], [32 + sx * 9, hy - 2]]), '#3A2630');
    s.dots(GBK.md, [32 + sx * 6.6, hy - 15], [32 + sx * 7.4, hy - 14]);
  }
  const head = uni(ell(32, hy, 9.4, 7), ell(32, hy + 5, 5.4, 4.8));
  s.fill(head, GX);
  s.paintIn(head, ell(32, hy - 5, 5, 2.2), GX.sh);
  for (const sx of [-1, 1]) s.paintIn(head, ell(32 + sx * 6.4, hy + 3.8, 3.2, 2.4), CREAM.md);
  s.paintIn(head, rect(30.5, hy + 1, 3, 6), GR.md);
  s.fill(ell(32, hy + 7.4, 3, 2.2), CREAM, { ol: false, rim: false });
  s.fill(ell(32, hy + 5.4, 2.2, 1.5), GBK, { n: 1 });
  s.put(31, hy + 4.8, '#8A7A86');
  s.dots(GBK.md, [32, hy + 7], [32, hy + 8]);
  eye(s, 32 - 8, hy - 3, 4, 4, '#B0702E', b === 1);
  eye(s, 32 + 4, hy - 3, 4, 4, '#B0702E', b === 1);
  if (air) s.dots('#E8D2A8', [14, 61], [16, 62], [48, 61], [50, 62]);
};

// ------------------------------------------------------------------ zorrilho
const ZB = ramp('#2C262C', { hi: '#4C444E', rim: '#8A808E', sh: '#1C161E', dp: '#100A14', ol: '#06040A' });
const ZW = ramp('#F2EEE6', { hi: '#FFFFFF', rim: '#FFFFFF', sh: '#CCC4CC', dp: '#948C9C', ol: '#2E2832' });

export const zorrilho: Drawer = (s, f) => {
  const rand = rng(62);
  const b = f === 1 ? 1 : 0;
  const warn = f >= 2;
  const y = f === 2 ? 3 : 0;
  // cauda enorme, branca e preta, que se ergue atrás
  const up = warn ? 1 : 0;
  const tl: [number, number, number][] = [[42, 48 + y, 5], [51, 40 - up * 3 + y, 6.4], [54, 27 - up * 4 + y, 6.2], [50, 15 - up * 5 + y, 4.4]];
  const tail = path(tl);
  s.fill(tail, ZB);
  fuzz(s, tail, ZB.hi, rand, 0.3);
  s.paintIn(tail, path([[tl[1][0] - 1, tl[1][1] - 1, 3.4], [tl[2][0] - 1, tl[2][1], 3.4], [tl[3][0] - 1, tl[3][1], 2]]), ZW.md);
  s.dots(ZW.hi, [tl[2][0] - 2, tl[2][1] - 2], [tl[1][0] - 2, tl[1][1] - 3]);
  // patas curtas com garras claras
  for (const sx of [-1, 1]) {
    const lift = f === 3 && sx === 1 ? 5 : 0;
    s.fill(cap(32 + sx * 9, 50 + y, 3.4, 32 + sx * 9.5, 56.5 - lift, 2.8), ZB);
    s.fill(ell(32 + sx * 9.5, 57.5 - lift, 4, 2), ZB, { n: 1 });
    s.dots(ZW.md, [32 + sx * 9.5 - 2, 59 - lift], [32 + sx * 9.5, 59.4 - lift], [32 + sx * 9.5 + 2, 59 - lift]);
  }
  const body = ell(32, 46 + y, 14.5, 10.5 - (warn ? 0 : 0) + b * 0.4);
  s.fill(body, ZB);
  fuzz(s, body, ZB.hi, rand, 0.18);
  // faixa branca larga no dorso, vista de frente como cunha
  s.paintIn(body, poly([[32, 31 + y], [48, 38 + y], [44, 46 + y], [32, 42 + y], [20, 46 + y], [16, 38 + y]]), ZW.md);
  s.paintIn(body, poly([[32, 31 + y], [40, 34 + y], [32, 37 + y], [24, 34 + y]]), ZW.hi);
  s.dots(ZW.sh, [22, 44 + y], [42, 44 + y], [32, 41 + y]);
  // cabeça pequena e baixa: focinho nu e rosado, orelhas redondas
  const hy = 33 + y + b + (f === 3 ? 2 : 0);
  for (const sx of [-1, 1]) s.fill(ell(32 + sx * 8.4, hy - 4, 3.2, 3), ZB);
  const head = ell(32, hy, 9, 7);
  s.fill(head, ZB);
  s.paintIn(head, poly([[32, hy - 8], [36, hy - 7], [34, hy + 1], [30, hy + 1], [28, hy - 7]]), ZW.md);
  s.paintIn(head, poly([[32, hy - 8], [34.5, hy - 7.4], [33, hy - 2], [31, hy - 2], [29.5, hy - 7.4]]), ZW.hi);
  const snout = ell(32, hy + 5.4, 4.6, 3.4);
  s.fill(snout, PINK);
  s.dots(PINK.dp, [30.4, hy + 5.4], [33.6, hy + 5.4]);
  s.dots(PINK.hi, [30, hy + 4], [31, hy + 3.6]);
  if (f === 3) {
    // boca aberta: grunhido de aviso
    s.fill(ell(32, hy + 8.8, 3.6, 2), ramp('#9A1F3B', { ol: '#2B0F1E' }), { rim: false, n: 1 });
    s.dots('#FFFFFF', [30, hy + 7.8], [34, hy + 7.8]);
  }
  eye(s, 32 - 7.5, hy - 2.4, 3.6, 3.6, '#7A4A22', b === 1);
  eye(s, 32 + 3.9, hy - 2.4, 3.6, 3.6, '#7A4A22', b === 1);
};

// ------------------------------------------------------------------ tuco-tuco
const TC = ramp('#9A7650', { hi: '#BC9870', rim: '#EBCFA0', sh: '#6E5038', dp: '#43303A', ol: '#1E141C' });
const SAND = ramp('#D8BE88', { hi: '#F0DCA8', rim: '#FFF2CC', sh: '#AC8C62', dp: '#7A5E52', ol: '#3A2A28' });

export const tucotuco: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const up = f === 2 ? -3 : f === 3 ? 1 : 0;
  // monte de areia e a boca da toca
  s.fill(ell(32, 55, 25, 7.5), SAND);
  s.dots(SAND.sh, [14, 58], [20, 60], [44, 59], [50, 57]);
  s.dots(SAND.rim, [18, 51], [46, 52], [26, 49]);
  const hole = ell(32, 49, 14, 6);
  s.fill(hole, ramp('#3A2418', { hi: '#5A3A28', sh: '#24140E', dp: '#150A08', ol: '#150A08' }), { rim: false });
  // corpo e cabeça saindo da toca
  const hy = 36 + up + b;
  s.fill(ell(32, hy + 9, 11, 10), TC);
  s.fill(ell(32, hy + 12, 6, 6), ramp('#D8BE98', { hi: '#F0DCC0', ol: '#6E5038' }), { ol: false, rim: false });
  for (const sx of [-1, 1]) s.fill(ell(32 + sx * 9.6, hy - 3.6, 2.6, 2.6), TC, { n: 1 });
  const head = ell(32, hy, 10.4, 9.2);
  s.fill(head, TC);
  s.paintIn(head, ell(32, hy + 5, 7, 5), ramp('#C8A67C').md);
  for (const sx of [-1, 1]) s.paintIn(head, ell(32 + sx * 7, hy + 3, 3.2, 3), TC.hi);
  s.fill(ell(32, hy + 4.6, 2.6, 1.8), PINK, { n: 1 });
  s.put(31, hy + 4, '#FFFFFF');
  // dentões laranja
  const open = f >= 2 ? 1 : 0;
  s.fill(rect(29.6, hy + 6.4, 2.6, 3 + open), ramp('#F4B03A', { hi: '#FFE08A', sh: '#D07A22', dp: '#8E4A22', ol: '#3A1E10' }), { n: 1 });
  s.fill(rect(32.8, hy + 6.4, 2.6, 3 + open), ramp('#F4B03A', { hi: '#FFE08A', sh: '#D07A22', dp: '#8E4A22', ol: '#3A1E10' }), { n: 1 });
  s.dots(TC.dp, [28, hy + 6], [36, hy + 6]);
  eye(s, 32 - 8, hy - 3, 3, 3.4, '#2A1810', b === 1);
  eye(s, 32 + 5, hy - 3, 3, 3.4, '#2A1810', b === 1);
  // beira da toca na frente e patas com garras
  s.fill(ell(32, 56, 21, 4.4), SAND, { ol: false });
  s.dots(SAND.rim, [20, 54], [26, 55], [40, 54], [46, 55]);
  for (const sx of [-1, 1]) {
    const px = 32 + sx * (f === 3 ? 12 : 8);
    s.fill(ell(px, 53, 4, 2.4), TC, { n: 1 });
    s.dots('#F6EEDC', [px - 2, 55], [px, 55.4], [px + 2, 55]);
  }
  if (f === 3) s.dots(SAND.hi, [10, 48], [8, 52], [54, 48], [56, 52], [14, 44], [50, 44]);
};

// ------------------------------------------------------------------ gato-palheiro
const GP = ramp('#C8A878', { hi: '#E0C498', rim: '#FFEBC0', sh: '#9A7650', dp: '#5E4440', ol: '#2A1C24' });
const GP_ST = '#6E4A34';

export const gatopalheiro: Drawer = (s, f) => {
  const rand = rng(63);
  const b = f === 1 ? 1 : 0;
  const crouch = f === 2;
  const air = f === 3;
  const y = air ? -9 : crouch ? 6 : 0;
  // cauda anelada
  const tl: [number, number, number][] = air ? [[42, 46 + y, 3], [52, 48 + y, 3.4], [58, 54 + y, 2.8]] : crouch ? [[42, 54 + y, 3], [52, 56, 3.4], [59, 52, 3]] : [[41, 52, 3.5], [51, 56, 3.9], [58, 50, 3.5], [57, 43, 3.2]];
  const tail = path(tl);
  s.fill(tail, GP);
  for (const [x, yy] of [[tl[1][0] + 1, tl[1][1]], [tl[2][0] + 1, tl[2][1]]]) s.paintIn(tail, ell(x, yy, 1.3, 5), GP_ST);
  const tp = tl[tl.length - 1];
  s.paintIn(tail, ell(tp[0], tp[1], 3.4, 3.4), '#3A2C26');
  // patas dianteiras
  for (const sx of [-1, 1]) {
    if (air) {
      s.fill(cap(32 + sx * 5, 44 + y, 2.8, 32 + sx * 9, 54 + y, 2.2), GP);
      s.fill(ell(32 + sx * 9.5, 55 + y, 2.6, 1.7), GP, { n: 1 });
      s.fill(cap(32 + sx * 10, 52 + y, 3.4, 32 + sx * 17, 55 + y * 0.4, 2.2), GP);
    } else {
      s.fill(cap(32 + sx * 5.4, 46 + y, 3, 32 + sx * 5.6, 56.6, 2.4), GP);
      s.fill(ell(32 + sx * 5.8, 57.6, 3.3, 1.7), GP, { n: 1 });
      s.line(32 + sx * 5.4 - 1, 52, 32 + sx * 5.4 + 2, 52, GP_ST);
      s.line(32 + sx * 5.4 - 1, 54, 32 + sx * 5.4 + 2, 54, GP_ST);
    }
  }
  const body = ell(32, 46 + y, 12.4, crouch ? 8.4 : 10.4 + b * 0.4);
  s.fill(body, GP);
  fuzz(s, body, GP.hi, rand, 0.2);
  s.fill(ell(32, 50 + y, 6, 6.6), CREAM, { ol: false, rim: false });
  for (const [x, yy] of [[22, 40], [25, 45], [39, 45], [42, 40], [21, 47]] as Pt[]) s.line(x, yy + y, x + 3, yy + 1 + y, GP_ST);
  // cabeça redonda, orelhas arredondadas, listras nas bochechas
  const hy = 28 + y + b + (crouch ? 1 : 0);
  for (const sx of [-1, 1]) {
    s.fill(poly([[32 + sx * 3, hy - 4], [32 + sx * 5.6, hy - 14], [32 + sx * 13, hy - 9], [32 + sx * 11, hy - 1]]), GP);
    s.paint(poly([[32 + sx * 6, hy - 4], [32 + sx * 7, hy - 10], [32 + sx * 10.4, hy - 8], [32 + sx * 9.4, hy - 3]]), '#3A2630');
    s.dots('#2A1E1E', [32 + sx * 6.6, hy - 13], [32 + sx * 7.4, hy - 12.4]);
  }
  const head = uni(ell(32, hy, 10.4, 8), ell(32, hy + 4, 7.6, 5.4));
  s.fill(head, GP);
  for (const sx of [-1, 1]) {
    s.paintIn(head, ell(32 + sx * 6, hy + 4.4, 3.4, 2.4), CREAM.md);
    s.line(32 + sx * 5, hy + 1, 32 + sx * 10, hy + 3, GP_ST);
    s.line(32 + sx * 4.4, hy + 3, 32 + sx * 9.4, hy + 5.4, GP_ST);
    s.line(32 + sx * 2.6, hy - 6, 32 + sx * 3.6, hy - 3, GP_ST);
  }
  s.paintIn(head, rect(31, hy - 8, 2, 4), GP_ST);
  s.fill(ell(32, hy + 7.6, 3.4, 2.2), CREAM, { ol: false, rim: false });
  s.fill(poly([[30, hy + 3.4], [34, hy + 3.4], [32, hy + 6]]), PINK, { n: 1 });
  s.dots(GP_ST, [32, hy + 6.6], [31, hy + 7.4], [33, hy + 7.4]);
  eye(s, 32 - 8.4, hy - 2.6, 4.4, 4.4, '#C89A2E', b === 1);
  eye(s, 32 + 4, hy - 2.6, 4.4, 4.4, '#C89A2E', b === 1);
  if (air) s.dots('#E8D2A8', [16, 61], [18, 62], [46, 61], [48, 62]);
};

// ------------------------------------------------------------------ tatu-mulita
const MS = ramp('#9C8C7C', { hi: '#BCAC98', rim: '#E4D4BC', sh: '#72645E', dp: '#4A3E48', ol: '#1E141C' });
const MK = ramp('#CDB098', { hi: '#E6D0BA', rim: '#F8E8D4', sh: '#A08678', dp: '#6E5658', ol: '#2E1E26' });

export const mulita: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const k = f === 2 ? 1 : f === 3 ? 2 : 0; // 0 aberto, 1 recolhendo, 2 fechado
  // patas curtas e garras na frente do casco
  if (k < 2) {
    for (const sx of [-1, 1]) {
      s.fill(ell(32 + sx * 13, 56, 4.4, 2.8), MK, { n: 1 });
      s.dots('#F6EEDC', [32 + sx * 13 - 2, 58.6], [32 + sx * 13, 59], [32 + sx * 13 + 2, 58.6]);
    }
  }
  // carapaça em domo, com cintas
  const shell = ell(32, k === 2 ? 43 : 40, k === 2 ? 20 : 18.4, k === 2 ? 16.4 : 14.6 + b * 0.4);
  s.fill(shell, MS);
  const topY = k === 2 ? 27 : 25;
  for (let yy = topY + 3; yy < 59; yy += 3.4) {
    s.paintIn(shell, rect(0, yy, 64, 1), MS.dp);
    s.paintIn(shell, rect(0, yy - 1, 64, 1), MS.hi);
  }
  for (let xx = 14; xx < 52; xx += 4) s.paintIn(shell, rect(xx + ((xx * 7) % 3), topY, 0.8, 36), MS.sh);
  s.paintIn(shell, ell(26, topY + 6, 7, 2.2), MS.rim);
  // escudo da cabeça e escudo traseiro mais claros
  s.paintIn(shell, ell(32, topY + 2, 8, 2.4), MS.hi);
  if (k < 2) {
    // cabeça de focinho fino e orelhas compridas
    const hy = 48 + (k === 1 ? 4 : 0) + b;
    for (const sx of [-1, 1]) {
      const ear = poly([[32 + sx * 4, hy - 1], [32 + sx * 6, hy - 12], [32 + sx * 11, hy - 10], [32 + sx * 9, hy + 1]]);
      s.fill(ear, MK);
      s.paint(poly([[32 + sx * 6.4, hy - 2], [32 + sx * 7.4, hy - 9], [32 + sx * 9.6, hy - 8], [32 + sx * 8.6, hy - 1]]), '#E8A4A0');
    }
    const head = uni(ell(32, hy, 7, 5.4), ell(32, hy + 5, 4, 4.4));
    s.fill(head, MK);
    s.fill(ell(32, hy + 8, 2.4, 1.5), PINK, { n: 1 });
    s.paintIn(head, rect(0, hy - 6, 64, 3), MS.sh);
    eye(s, 32 - 6.4, hy - 2, 3.4, 3.4, '#3A2418', b === 1);
    eye(s, 32 + 3, hy - 2, 3.4, 3.4, '#3A2418', b === 1);
  } else {
    // fechado: só a ponta do focinho e a borda das orelhas
    s.fill(ell(32, 57.6, 7, 2), MS, { n: 1 });
    s.dots(MK.md, [28, 57], [36, 57]);
    s.line(18, 57, 46, 57, MS.dp);
  }
};

// ------------------------------------------------------------------ ratão-do-banhado
const RT = ramp('#7E5C40', { hi: '#A07C58', rim: '#D8B484', sh: '#573E34', dp: '#38262E', ol: '#150C12' });
const WH = ramp('#E8DCC4', { hi: '#FFFFFF', sh: '#BCAC94', dp: '#7E6E70', ol: '#3A2C30' });
const TEETH = ramp('#F08A22', { hi: '#FFC25A', sh: '#C85A1E', dp: '#8E3820', ol: '#3A1A14' });

export const ratao: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const sink = f === 2 ? 7 : f === 3 ? 13 : 0;
  const hy = 38 + sink + b;
  // dorso largo na superfície
  const back = ell(32, 53 + sink * 0.5, 18, 9.5);
  s.fill(back, RT);
  s.dots(RT.hi, [18, 50 + sink * 0.5], [24, 47 + sink * 0.5], [40, 47 + sink * 0.5], [46, 50 + sink * 0.5]);
  s.dots(RT.dp, [22, 53], [28, 51], [37, 52], [43, 54]);
  for (const sx of [-1, 1]) s.fill(ell(32 + sx * 11.4, hy - 6, 3.2, 3.2), RT, { n: 1 });
  const head = ell(32, hy, 11.4, 9.6);
  s.fill(head, RT);
  s.paintIn(head, ell(32, hy + 5.6, 8.4, 5), WH.md);
  s.paintIn(head, ell(32, hy - 2, 5, 2), RT.hi);
  s.fill(ell(32, hy + 3.2, 3, 2), NOSE, { n: 1 });
  s.put(31, hy + 2.6, '#9A8A92');
  s.line(32, hy + 5, 32, hy + 7, WH.dp);
  s.fill(rect(29.8, hy + 7, 2.2, 3), TEETH, { n: 1 });
  s.fill(rect(32.4, hy + 7, 2.2, 3), TEETH, { n: 1 });
  for (const sx of [-1, 1]) {
    s.line(32 + sx * 5, hy + 5, 32 + sx * 14, hy + 3, WH.hi);
    s.line(32 + sx * 5, hy + 6, 32 + sx * 14, hy + 7, WH.md);
    s.line(32 + sx * 5, hy + 4, 32 + sx * 13, hy, WH.hi);
  }
  eye(s, 32 - 8.6, hy - 4, 4, 4, '#3A2418', b === 1);
  eye(s, 32 + 4.6, hy - 4, 4, 4, '#3A2418', b === 1);
  for (let k = 57 * 64; k < s.g.length; k++) s.g[k] = null;
  water(s, 32, 27, f, f >= 2 ? 2 : 0);
  if (f >= 2) s.dots('#E8FCFF', [22, 54 - f * 2], [41, 52 - f], [27, 50 - f * 2]);
};
