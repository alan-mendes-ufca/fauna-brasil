import { rng } from '../../art/canvas';
import { cap, type Drawer, ell, erode, eye, fuzz, INK, path, poly, ramp, rect, type Spr, uni, type Pt } from '../../art/animals/kit';

// Mamíferos do Pantanal (retratos 64×64, base em y = 58).

// ------------------------------------------------------------------ capivara
const CAPI = ramp('#A07446', { hi: '#C49A62', rim: '#F0D09C', sh: '#74503A', dp: '#4A3044', ol: '#20121E' });
const CAPI_LT = ramp('#C8A474', { hi: '#E0C494', sh: '#9A7452', dp: '#6E4E4A', ol: '#2A1A22' });
const CNOSE = ramp('#3A2824', { hi: '#5E4640', ol: '#140A10' });

export const capivara: Drawer = (s, f) => {
  const rand = rng(23);
  const b = f === 1 ? 1 : 0;
  const chew = f === 2;
  const tilt = f === 3 ? 1 : 0;
  // patas curtas, com dedos escuros
  for (const sx of [-1, 1]) {
    s.fill(ell(32 + sx * 15, 55, 6, 3.6), CAPI);
    s.dots(CAPI.ol, [32 + sx * 12, 57], [32 + sx * 15, 58], [32 + sx * 18, 57]);
  }
  // corpo de barril
  const body = ell(32, 45, 22, 13 + b * 0.5);
  s.fill(body, CAPI);
  fuzz(s, body, CAPI.hi, rand, 0.22);
  s.paintIn(body, ell(32, 52, 14, 5), CAPI.md);
  for (const [x, y] of [[14, 42], [20, 38], [48, 42], [43, 38], [32, 36]] as Pt[]) s.dots(CAPI.sh, [x, y], [x + 1, y + 1]);
  // orelhas pequenas, no alto
  for (const sx of [-1, 1]) {
    const e = ell(32 + sx * 12.5 + tilt * sx, 19, 3, 3.6);
    s.fill(e, CAPI);
    s.paintIn(e, ell(32 + sx * 12.5 + tilt * sx, 19.6, 1.5, 2), '#5A3A38');
  }
  // cabeça grande e quadrada
  const hy = 29 + b * 0.5 + tilt * 0.5;
  const head = uni(ell(32, hy, 14, 11), rect(20, hy + 2, 24, 11));
  s.fill(head, CAPI);
  s.paintIn(head, ell(32, hy - 7, 8, 2.6), CAPI.hi);
  // focinho largo e claro embaixo
  const muz = ell(32, hy + 9, 12, 5.5);
  s.fill(muz, CAPI_LT, { ol: false, rim: false });
  // narinas no alto do focinho, almofada escura
  s.fill(ell(32, hy + 3.6, 7.2, 3.2), CNOSE, { ol: false, rim: false });
  s.dots('#0C0608', [28, hy + 3], [29, hy + 3], [35, hy + 3], [36, hy + 3]);
  s.dots(CNOSE.hi, [31, hy + 2], [33, hy + 2]);
  // olhos pequenos e altos
  eye(s, 22, hy - 4.5, 4, 4, '#2A1A14', f === 3);
  eye(s, 38, hy - 4.5, 4, 4, '#2A1A14', f === 3);
  s.line(21, hy - 6, 26, hy - 6.5, CAPI.dp);
  s.line(38, hy - 6.5, 43, hy - 6, CAPI.dp);
  // boca e dentes de roedor
  if (chew) {
    s.fill(ell(32, hy + 11.5, 6.5, 2.6), ramp('#7A2A34', { ol: '#2B0F1E' }), { rim: false, n: 1 });
    s.dots('#F2C86A', [30, hy + 9], [31, hy + 9], [33, hy + 9], [34, hy + 9]);
  } else {
    s.line(24, hy + 11, 40, hy + 11, CAPI.dp);
    s.dots('#F2C86A', [31, hy + 11.5], [33, hy + 11.5]);
  }
  s.dots(INK, [26, hy + 8], [38, hy + 8], [24, hy + 9], [40, hy + 9]);
  s.dots(CAPI_LT.hi, [29, hy + 7], [35, hy + 7]);
};

// ------------------------------------------------------------------ cervo-do-pantanal
const DEER = ramp('#BA6A32', { hi: '#DC9050', rim: '#FACE94', sh: '#8E4A34', dp: '#552A3A', ol: '#28121E' });
const SOCK = ramp('#3C2C2A', { hi: '#5E4846', ol: '#120A10' });
const DCREAM = ramp('#F4ECDC', { hi: '#FFFFFF', sh: '#D4C4B2', dp: '#9C8C94', ol: '#3A2C34' });
const ANTLER = ramp('#8A6A4C', { hi: '#B8946C', rim: '#E4C8A0', sh: '#5E4636', dp: '#3E2C2E', ol: '#1A1014' });

function cervoHead(s: Spr, cx: number, hy: number, f: number, air: boolean): void {
  // galhada ramificada
  for (const sx of [-1, 1]) {
    const beam = path([[cx + sx * 3.5, hy - 6, 1.5], [cx + sx * 7, hy - 11, 1.3], [cx + sx * 11, hy - 16, 1.2], [cx + sx * 12.5, hy - 21, 0.9]]);
    s.fill(beam, ANTLER, { n: 1 });
    s.fill(path([[cx + sx * 7, hy - 11, 1.1], [cx + sx * 3.5, hy - 17, 0.8]]), ANTLER, { n: 1 });
    s.fill(path([[cx + sx * 11, hy - 16, 1.1], [cx + sx * 16, hy - 17.5, 0.8]]), ANTLER, { n: 1 });
  }
  // orelhas grandes, forradas de branco
  for (const sx of [-1, 1]) {
    const tip: Pt = air ? [cx + sx * 17, hy - 9] : [cx + sx * 18, hy - 2];
    const ear = poly([[cx + sx * 5, hy - 5], [cx + sx * 10, hy - 9], tip, [cx + sx * 13, hy + 2], [cx + sx * 7, hy - 0.5]]);
    s.fill(ear, DEER);
    s.paintIn(ear, erode(ear, 2), DCREAM.md);
    s.paintIn(erode(ear, 2), ell(cx + sx * 11, hy - 3.5, 2.6, 1.6), '#E2B2A8');
    s.dots(SOCK.md, tip);
  }
  const head = uni(ell(cx, hy - 1, 7.6, 7), ell(cx, hy + 5.5, 4.8, 5.6));
  s.fill(head, DEER);
  s.paintIn(head, ell(cx, hy - 5.5, 4.4, 2.4), DEER.sh);
  // focinho claro com nariz preto, anel branco em volta dos olhos
  s.fill(ell(cx, hy + 7.4, 4.2, 3.2), DCREAM, { ol: false, rim: false });
  s.fill(ell(cx, hy + 6.2, 2.8, 1.8), SOCK, { n: 1 });
  s.line(cx, hy + 8.4, cx, hy + 9.4, DCREAM.dp);
  for (const sx of [-1, 1]) {
    s.paint(ell(cx + sx * 4.8, hy - 1.5, 3.4, 3.2), DCREAM.hi);
    eye(s, cx + sx * 4.8 - 2.5, hy - 4, 5, 5, '#3A2418', f === 1);
  }
}

export const cervo: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const crouch = f === 2;
  const air = f === 3;
  const y = air ? -9 : crouch ? 3 : 0;
  const leg = (x0: number, y0: number, x1: number, y1: number, r0: number, r1: number) => {
    s.fill(cap(x0, y0, r0, x1, y1, r1), DEER, { n: 1 });
    const lo = cap(x0 + (x1 - x0) * 0.55, y0 + (y1 - y0) * 0.55, r0 * 0.8, x1, y1, r1);
    s.fill(lo, SOCK, { n: 1 });
  };
  const hoof = (x: number, yy: number) => s.fill(ell(x, yy, 1.9, 1.4), ramp('#1E1618', { hi: '#3E3236', ol: '#08040A' }), { n: 1 });
  if (air) {
    for (const sx of [-1, 1]) {
      leg(32 + sx * 8, 45 + y, 32 + sx * 14, 50 + y, 2.8, 1.7);
      leg(32 + sx * 14, 50 + y, 32 + sx * 11, 56 + y, 1.7, 1.4);
      hoof(32 + sx * 11, 57 + y);
      leg(32 + sx * 4, 47 + y, 32 + sx * 7, 53 + y, 2.6, 1.6);
      leg(32 + sx * 7, 53 + y, 32 + sx * 3, 57 + y, 1.6, 1.3);
      hoof(32 + sx * 3, 58 + y);
    }
  } else {
    const k = crouch ? 2 : 0;
    for (const sx of [-1, 1]) {
      leg(32 + sx * 10, 45 + y, 32 + sx * (11 + k), 56, 3, 1.5);
      hoof(32 + sx * (11 + k), 57.5);
      leg(32 + sx * 5, 45 + y, 32 + sx * (5 + k), 56, 3.2, 1.6);
      hoof(32 + sx * (5 + k), 57.5);
    }
  }
  s.fill(ell(32, 41 + y, 13.5, 8.5), DEER);
  s.fill(ell(32, 42 + y, 8, 8), DEER);
  s.fill(ell(32, 45 + y, 4.5, 4), DCREAM, { ol: false, rim: false });
  // pescoço grosso e crina
  s.fill(cap(32, 38 + y, 6, 32, 28 + y, 4.8), DEER);
  s.fill(ell(32, 32 + y, 3.4, 4), DCREAM, { ol: false, rim: false });
  cervoHead(s, 32, 21 + y + (crouch ? 0 : b), f, air);
  if (air) s.dots('#E8DCC8', [18, 62], [20, 61], [44, 62], [46, 61], [32, 62]);
};

// ------------------------------------------------------------------ anta
const ANTA = ramp('#6E5E50', { hi: '#968472', rim: '#CCBCA2', sh: '#4C3E48', dp: '#30242C', ol: '#150D13' });
const AHEAD = ramp('#8A7A6A', { hi: '#B2A28C', rim: '#E0D2BA', sh: '#64544E', dp: '#44343A', ol: '#1A1016' });
const ALIP = ramp('#E4DCC8', { hi: '#FFFFFF', sh: '#BCB0A2', dp: '#8A7E80', ol: '#3A2E34' });

export const anta: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  // patas grossas com três cascos
  for (const sx of [-1, 1]) {
    s.fill(cap(32 + sx * 14, 46, 5, 32 + sx * 14.5, 55, 4.2), ANTA);
    s.fill(ell(32 + sx * 14.5, 56.4, 5.6, 2.6), ANTA, { n: 1 });
    s.dots('#1A1014', [32 + sx * 11.5, 58], [32 + sx * 14.5, 58.6], [32 + sx * 17.5, 58]);
  }
  const body = ell(32, 44, 21, 13 + b * 0.5);
  s.fill(body, ANTA);
  s.paintIn(body, ell(32, 52, 14, 4), ANTA.sh);
  // crista de pelos no pescoço e cabeça larga, mais clara nas bochechas
  s.fill(ell(32, 30, 14, 7), ANTA);
  // orelhas ovais com ponta branca
  for (const sx of [-1, 1]) {
    const e = ell(32 + sx * 11, 17 + (f === 3 ? -1 : 0), 3.6, 4.6);
    s.fill(e, ANTA);
    s.paintIn(e, rect(32 + sx * 11 - 5, 11, 10, 4.2), ALIP.md);
    s.paintIn(e, ell(32 + sx * 11, 19, 1.6, 2.4), '#4A3036');
  }
  const hy = 25 + b * 0.5;
  const head = uni(ell(32, hy, 11.5, 10), ell(32, hy + 8, 8.5, 6));
  s.fill(head, AHEAD);
  s.paintIn(head, ell(32, hy - 7, 8, 2.6), ANTA.md);
  s.paintIn(head, rect(20, hy - 9, 24, 3), ANTA.md);
  // olhos pequenos, de cílios escuros
  eye(s, 22.5, hy - 2.5, 4, 4, '#2A1A14', f === 1);
  eye(s, 37.5, hy - 2.5, 4, 4, '#2A1A14', f === 1);
  s.line(22, hy - 3.8, 26, hy - 4, INK);
  s.line(38, hy - 4, 42, hy - 3.8, INK);
  // lábios brancos e tromba curta que balança
  s.fill(ell(32, hy + 12.5, 7.6, 3.2), ALIP, { ol: false, rim: false });
  const sw = f === 2 ? -4 : f === 3 ? 4 : 0;
  const lift = f >= 2 ? -2 : 0;
  const trunk = path([[32, hy + 4, 5.6], [32 + sw * 0.4, hy + 9.5, 4.6], [32 + sw, hy + 14 + lift, 3.6]]);
  s.fill(trunk, AHEAD);
  s.paintIn(trunk, rect(31 + sw * 0.4, hy + 2, 2, 10), AHEAD.hi);
  s.fill(ell(32 + sw, hy + 15 + lift, 3.6, 2), ALIP, { n: 1 });
  s.dots('#1A1014', [31 + sw, hy + 15 + lift], [33 + sw, hy + 15 + lift]);
  s.dots(AHEAD.rim, [27, hy - 6], [28, hy - 7], [36, hy - 7]);
};

// ------------------------------------------------------------------ quati
const QUATI = ramp('#A86A3A', { hi: '#CC9058', rim: '#F4C890', sh: '#7E4A3A', dp: '#4A2A38', ol: '#21121C' });
const QDARK = ramp('#34241E', { hi: '#5A4036', rim: '#8A6A58', sh: '#22161A', ol: '#0C0608' });
const QCREAM = ramp('#EFDFBE', { hi: '#FFF4DC', sh: '#CBB594', dp: '#9A8478', ol: '#3A2A30' });

function quatiTail(s: Spr, pts: [number, number, number][]): void {
  const tail = path(pts);
  s.fill(tail, QUATI);
  pts.forEach(([x, y, r], i) => {
    if (i % 2 === 1) s.paintIn(tail, ell(x, y, r + 1.2, r + 1.2), QDARK.md);
  });
  const [tx, ty] = pts[pts.length - 1];
  s.paintIn(tail, ell(tx, ty, 3, 3), QDARK.md);
}

function quatiHead(s: Spr, cx: number, cy: number, blink: boolean): void {
  for (const sx of [-1, 1]) {
    s.fill(ell(cx + sx * 8, cy - 7, 3, 3.2), QUATI, { n: 1 });
    s.paint(ell(cx + sx * 8, cy - 6.8, 1.6, 1.7), QCREAM.md);
  }
  const head = uni(ell(cx, cy, 9.5, 8.2), ell(cx, cy + 5, 5.4, 6));
  s.fill(head, QUATI);
  // máscara escura em volta dos olhos e manchas brancas
  for (const sx of [-1, 1]) {
    s.paintIn(head, ell(cx + sx * 4.8, cy - 0.5, 3.8, 3.2), QDARK.md);
    s.paint(ell(cx + sx * 4.6, cy - 4.4, 1.7, 0.9), QCREAM.hi);
    s.paint(ell(cx + sx * 6.6, cy + 2.8, 1.6, 0.9), QCREAM.hi);
  }
  // focinho comprido e levantado
  const snout = ell(cx, cy + 8.5, 3.8, 4.8);
  s.fill(snout, QCREAM, { ol: QCREAM.ol, rim: false });
  s.fill(ell(cx, cy + 12.2, 2.6, 1.8), QDARK, { n: 1 });
  s.dots('#8A5A64', [cx - 1, cy + 11.6]);
  s.line(cx, cy + 13.4, cx, cy + 14.2, INK);
  eye(s, cx - 6.2, cy - 2.6, 3, 3, '#3A2418', blink);
  eye(s, cx + 3.2, cy - 2.6, 3, 3, '#3A2418', blink);
  s.dots(QUATI.rim, [cx - 3, cy - 7], [cx - 2, cy - 7.4]);
}

export const quati: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const air = f === 3;
  const crouch = f === 2;
  const y = air ? -9 : crouch ? 3 : 0;
  // cauda anelada erguida atrás do corpo, ponta escura
  quatiTail(
    s,
    air
      ? [[43, 48 + y, 3.4], [53, 44 + y, 3.2], [57, 35 + y, 3], [54, 26 + y, 2.8], [49, 20 + y, 2.6]]
      : [[43, 50 + y, 3.4], [52, 47 + y, 3.2], [55, 38 + y, 3], [52, 28 + y, 2.8], [46, 22 + y, 2.6]],
  );
  if (air) {
    for (const sx of [-1, 1]) {
      s.fill(cap(32 + sx * 8, 50 + y, 4.5, 32 + sx * 14, 59 + y, 3), QUATI);
      s.fill(ell(32 + sx * 15, 60 + y, 4.4, 2), QDARK, { n: 1 });
      s.fill(cap(32 + sx * 8, 41 + y, 2.8, 32 + sx * 15, 34 + y, 2.2), QDARK, { n: 1 });
    }
  } else {
    for (const sx of [-1, 1]) {
      s.fill(ell(32 + sx * 11.5, 51 + y * 0.6, 6, 6.5), QUATI);
      s.fill(ell(32 + sx * 10, 57, 5.6, 2.2), QDARK, { n: 1 });
      s.dots(QCREAM.hi, [32 + sx * 7, 58], [32 + sx * 10, 58.6], [32 + sx * 13, 58]);
    }
  }
  const rand = rng(11);
  const body = ell(32, 47 + y, air ? 11 : 13, air ? 12 : 10.5 + b * 0.5);
  s.fill(body, QUATI);
  fuzz(s, body, QUATI.hi, rand, 0.2);
  s.fill(ell(32, 50 + y, 6.4, 7), QCREAM, { ol: false });
  if (!air) for (const sx of [-1, 1]) s.fill(cap(32 + sx * 5, 54, 2.4, 32 + sx * 5.5, 57.5, 2), QDARK, { n: 1 });
  quatiHead(s, 32, 29 + y + b, b === 1);
  if (air) s.dots('#E8DCC8', [22, 61], [20, 62], [44, 61], [46, 62], [32, 62]);
};

// ------------------------------------------------------------------ bugio-preto
const BUG = ramp('#322A34', { hi: '#554A5C', rim: '#9488A0', sh: '#1E1824', dp: '#120E18', ol: '#06040A' });
const BTAN = ramp('#6A4E3A', { hi: '#8E6C4E', sh: '#4A3430', dp: '#2E2028', ol: '#120A10' });
const BSKIN = ramp('#4A3C42', { hi: '#6E5C62', sh: '#32262E', ol: '#120A10' });
const WOOD = ramp('#8A6038', { hi: '#B48450', rim: '#E4B882', sh: '#5E3E30', dp: '#3A2428', ol: '#1A0E12' });
const LEAF = ramp('#4E9A3C', { hi: '#86CC58', sh: '#2E6A3C', dp: '#1A4234', ol: '#0A2018' });

function branch(s: Spr): void {
  const log = uni(rect(2, 54, 60, 4), ell(6, 56, 6, 3), ell(58, 56, 6, 3));
  s.fill(log, WOOD, { n: 2 });
  s.dots(WOOD.dp, [14, 56], [15, 56], [30, 55], [46, 57], [47, 57]);
  for (const [x, y] of [[6, 52], [58, 51]] as Pt[]) {
    s.fill(ell(x, y, 3, 1.8), LEAF, { n: 1 });
    s.line(x - 1, y, x + 1, y, LEAF.dp);
  }
}

export const bugio: Drawer = (s, f) => {
  const rand = rng(31);
  const b = f === 1 ? 1 : 0;
  const crouch = f === 2;
  const air = f === 3;
  const y = air ? -10 : crouch ? 2 : 0;
  branch(s);
  // cauda preênsil enrolada no galho e subindo pela direita
  const tail = path(air ? [[42, 50 + y, 3], [52, 54, 2.6], [58, 49, 2.4], [56, 43, 2.2], [51, 42, 2]] : [[41, 49 + y, 3], [51, 53, 2.6], [57, 49, 2.4], [56, 43, 2.2], [51, 41, 2]]);
  s.fill(tail, BUG);
  s.dots(BUG.rim, [57, 46], [55, 42]);
  // coxas e pés agarrando
  if (air) {
    for (const sx of [-1, 1]) {
      s.fill(cap(32 + sx * 7, 48 + y, 4.8, 32 + sx * 12, 58 + y, 3.2), BUG);
      s.fill(ell(32 + sx * 12.5, 59.5 + y, 4.4, 2), BSKIN, { n: 1 });
    }
  } else {
    for (const sx of [-1, 1]) {
      s.fill(ell(32 + sx * 10.5, 51 + y, 6.6, 5.6), BUG);
      s.fill(ell(32 + sx * 10, 56, 5.4, 2.2), BSKIN, { n: 1 });
    }
  }
  const body = ell(32, 41 + y, 11.5, 14 + b * 0.5);
  s.fill(body, BUG);
  fuzz(s, body, BUG.hi, rand, 0.3);
  // dorso arruivado e peito escuro
  s.paintIn(body, ell(37, 38 + y, 4, 9), BTAN.md);
  s.paintIn(body, ell(37, 38 + y, 2, 6), BTAN.hi);
  // braços: no repouso, agarram o galho; no salto, abertos para cima
  for (const sx of [-1, 1]) {
    if (air) {
      s.fill(cap(32 + sx * 9, 36 + y, 3.4, 32 + sx * 17, 26 + y, 2.6), BUG);
      s.fill(ell(32 + sx * 18, 24.5 + y, 3.2, 2.8), BSKIN, { n: 1 });
    } else {
      s.fill(cap(32 + sx * 10, 34 + y, 3.6, 32 + sx * 13, 47 + y, 3), BUG);
      s.fill(ell(32 + sx * 13, 50 + y, 3.6, 2.8), BSKIN, { n: 1 });
    }
  }
  // cabeça com barba grossa embaixo e rosto nu
  const hy = 21 + y + b;
  const beard = ell(32, hy + 9, 9, 8);
  s.fill(beard, BUG);
  fuzz(s, beard, BUG.hi, rand, 0.3);
  const skull = ell(32, hy, 9.4, 8.8);
  s.fill(skull, BUG);
  s.paintIn(skull, ell(32, hy - 6, 7, 2.2), BUG.hi);
  s.fill(ell(32, hy + 2.6, 6.6, 6), BSKIN, { ol: BUG.ol, rim: false });
  eye(s, 25.6, hy - 1.4, 4, 4, '#B8742E', f === 1);
  eye(s, 34.4, hy - 1.4, 4, 4, '#B8742E', f === 1);
  s.line(25, hy - 3, 29.5, hy - 2.6, BUG.ol);
  s.line(34.5, hy - 2.6, 39, hy - 3, BUG.ol);
  s.dots('#1A1218', [30.5, hy + 2.6], [33.5, hy + 2.6]);
  if (air) {
    // boca aberta: o urro
    s.fill(ell(32, hy + 6.8, 3.8, 2.8), ramp('#7A2A34', { ol: '#2B0F1E' }), { n: 1, rim: false });
    s.dots('#F4F0E8', [30, hy + 5.4], [34, hy + 5.4]);
  } else {
    s.line(29.5, hy + 6, 34.5, hy + 6, INK);
  }
};

// ------------------------------------------------------------------ jaguatirica
const OCE = ramp('#DAB066', { hi: '#F0CE8A', rim: '#FFF0C0', sh: '#B07C4A', dp: '#70483C', ol: '#2A1620' });
const OCREAM = ramp('#F6ECDA', { sh: '#D6C0AA', dp: '#A28C8E', ol: '#4A2C3A' });
const ODARK = '#2E1E1C';

function rosette(s: Spr, clip: Uint8Array, x: number, y: number, k = 1): void {
  s.paintIn(clip, ell(x, y, 2.6 * k, 1.7 * k), ODARK);
  s.paintIn(clip, ell(x, y + 0.1, 1.4 * k, 0.8 * k), '#B0793F');
}

export const jaguatirica: Drawer = (s, f) => {
  const pounce = f >= 2;
  const g = f === 3 ? 1 : 0;
  const b = f === 1 ? 1 : 0;
  // cauda anelada, de ponta escura
  const tp: [number, number, number][] = pounce ? [[50, 50, 3], [58, 47, 2.8], [61, 38, 2.6], [57, 28, 2.6]] : [[48, 52, 3], [57, 53, 2.8], [61, 45, 2.6], [59, 33, 2.6]];
  const tail = path(tp);
  s.fill(tail, OCE);
  tp.forEach(([x, yy], i) => {
    if (i > 0) s.paintIn(tail, ell(x, yy, 4.5, 1.3), ODARK);
  });
  const tt = tp[tp.length - 1];
  s.paintIn(tail, ell(tt[0], tt[1] - 1, 4, 3.4), ODARK);
  // corpo
  const body = ell(32, pounce ? 49 : 47, pounce ? 21 : 18, pounce ? 10 : 12 + b * 0.5);
  s.fill(body, OCE);
  if (!pounce) {
    for (const sx of [-1, 1]) {
      const leg = uni(cap(32 + sx * 9.5, 42, 5, 32 + sx * 10, 55, 4.2), ell(32 + sx * 10, 55.5, 5.6, 3));
      s.fill(leg, OCE);
      s.dots(OCE.dp, [32 + sx * 12, 57], [32 + sx * 10, 57.5], [32 + sx * 8, 57]);
      rosette(s, leg, 32 + sx * 11, 47, 0.7);
    }
    s.fill(ell(32, 49, 6, 8), OCREAM, { ol: false });
    for (const [x, yy] of [[20, 40], [44, 40], [18, 47], [46, 47], [22, 53], [42, 53]] as Pt[]) rosette(s, body, x, yy);
  } else {
    const leg = uni(cap(44, 44, 5.5, 45, 56, 4.5), ell(45, 55.5, 6.5, 3));
    s.fill(leg, OCE);
    s.dots('#FFFFFF', [42, 58], [45, 58.5], [48, 58]);
    s.fill(cap(21, 43, 5.5, 12, 35 - g * 2, 4.5), OCE);
    s.fill(ell(10, 32 - g * 2, 6.5, 5.5), OCE);
    for (const k of [-4, -1, 2, 5]) s.line(10 + k, 36 - g * 2, 9 + k, 40 - g * 2, '#FFF7E0');
    for (const [x, yy] of [[30, 44], [38, 46], [26, 52], [46, 50], [34, 54]] as Pt[]) rosette(s, body, x, yy, 1.1);
  }
  // orelhas: costas pretas com mancha branca
  const ey = pounce ? 15 + g : 12 + b;
  for (const sx of [-1, 1]) {
    const ear = poly([[32 + sx * 5, ey + 5], [32 + sx * 9.5, ey - 5], [32 + sx * 13, ey - 5], [32 + sx * 15, ey + 4]]);
    s.fill(ear, OCE);
    s.paint(poly([[32 + sx * 8, ey + 4], [32 + sx * 10.5, ey - 2.5], [32 + sx * 13, ey + 3]]), '#5A3036');
    s.dots(ODARK, [32 + sx * 11, ey - 5], [32 + sx * 12, ey - 5], [32 + sx * 13, ey - 4]);
  }
  const hy = pounce ? 26 + g : 23 + b;
  const head = ell(32, hy, pounce ? 15 : 13, pounce ? 12 : 11);
  s.fill(head, OCE);
  // listras da testa e das bochechas
  for (const sx of [-1, 1]) {
    s.line(32 + sx * 2, hy - 10, 32 + sx * 3, hy - 6, ODARK);
    s.line(32 + sx * 6, hy - 9, 32 + sx * 6.5, hy - 5.5, ODARK);
    s.line(32 + sx * 10, hy - 3, 32 + sx * 13, hy - 1, ODARK);
    s.line(32 + sx * 9.5, hy + 0.5, 32 + sx * 12.5, hy + 3, ODARK);
  }
  s.fill(uni(ell(27.5, hy + 6, 4.6, 3.4), ell(36.5, hy + 6, 4.6, 3.4), ell(32, hy + 8, 4.6, 3.4)), OCREAM, { ol: false, rim: false });
  for (const sx of [-1, 1]) {
    s.paint(ell(32 + sx * 6, hy + 4.2, 1.7, 1.2), ODARK);
    s.line(32 + sx * 9, hy + 6, 32 + sx * 14, hy + 5, '#FFFFFF');
    s.line(32 + sx * 9, hy + 8, 32 + sx * 14, hy + 9, '#FFFFFF');
  }
  if (!pounce) {
    for (const sx of [-1, 1]) {
      eye(s, 32 + sx * 6.5 - 3, hy - 5.5, 6, 6, '#C8A83A', b === 1);
      s.line(32 + sx * 3.5, hy - 7, 32 + sx * 9.5, hy - 6.5, OCE.dp);
      s.line(32 + sx * 3, hy - 1, 32 + sx * 3, hy + 2, ODARK);
    }
    s.paint(poly([[29.5, hy + 1.5], [34.5, hy + 1.5], [32, hy + 4.5]]), '#D88A8A');
    s.line(29.5, hy + 1, 34.5, hy + 1, INK);
    s.dots(INK, [32, hy + 5], [32, hy + 6]);
    s.line(32, hy + 6, 29, hy + 8, INK);
    s.line(32, hy + 6, 35, hy + 8, INK);
  } else {
    s.fill(ell(32, hy + 8, 8.5, 4.5 + g * 1.5), ramp('#9A1F3B', { ol: '#2B0F1E' }), { rim: false });
    s.paint(ell(32, hy + 10 + g, 4.5, 1.8), '#EE7C8E');
    s.paint(poly([[25.5, hy + 4.5], [28, hy + 4.5], [26.8, hy + 8]]), '#FFFFFF');
    s.paint(poly([[36, hy + 4.5], [38.5, hy + 4.5], [37.2, hy + 8]]), '#FFFFFF');
    s.paint(poly([[27, hy + 12 + g], [29, hy + 12 + g], [28, hy + 9]]), '#FFF2D8');
    s.paint(poly([[35, hy + 12 + g], [37, hy + 12 + g], [36, hy + 9]]), '#FFF2D8');
    s.paint(poly([[29.5, hy + 1], [34.5, hy + 1], [32, hy + 4]]), '#D88A8A');
    s.line(29.5, hy, 34.5, hy, INK);
    for (const sx of [-1, 1]) {
      const x = 32 + sx * 7.5;
      s.paint(ell(x, hy - 4, 3.2, 2.5), INK);
      s.paint(ell(x, hy - 3.7, 2.3, 1.7), '#E8D040');
      s.paint(ell(x, hy - 3.6, 0.8, 1.4), INK);
      s.put(x - 1, hy - 4.5, '#FFFFFF');
      s.line(x - sx * 4, hy - 8, x + sx * 3, hy - 5.5, OCE.dp);
    }
  }
};
