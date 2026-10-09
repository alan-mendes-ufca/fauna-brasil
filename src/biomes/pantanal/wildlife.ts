import { INK, ramp } from '../../art/animals/kit';
import { cap, ell, eye, path, poly, rect, sub, uni, type P } from '../../art/wildlife/kit';
import { far, flyer, gait, type OwDrawer, owSprite, quad } from '../../art/wildlife/parts';

// Fauna do Pantanal na exploração (32×32, olhando para a direita, base em y = 28).

// ------------------------------------------------------------------ jacaré (grande)
const CAI = ramp('#6E7E3E', { hi: '#96A858', rim: '#D0E08C', sh: '#475A30', dp: '#2A3C32', ol: '#0E1A18' });

export const jacare: OwDrawer = owSprite({ cx: 15, w: 24 }, (s, f) => {
  const g = gait(f);
  const sw = f === 1 ? 1 : 0;
  // pernas curtas abertas
  for (const x of [10, 19]) {
    s.fill(cap(x + 1, 23, 1.3, x + 1 + g, 26.5, 1), far(CAI));
  }
  const tail = path([[9, 22, 2.6], [4, 23 + sw, 1.8], [0.5, 24 - sw, 0.9]]);
  s.fill(tail, CAI);
  const body = ell(13, 21.5, 8, 3.4);
  s.fill(body, CAI);
  for (let x = 7; x < 20; x += 2.4) s.put(x, 18.5, CAI.dp);
  for (const x of [9, 18]) s.fill(cap(x, 23, 1.4, x - g, 26.5, 1.1), CAI);
  // cabeça e focinho longo
  const head = uni(ell(21.5, 21, 3, 2.6), path([[22, 21.5, 2.2], [27, 22, 1.7], [30.5, 22.5, 1.2]]));
  s.fill(head, CAI);
  s.paintIn(head, rect(23, 23.2, 9, 2), '#DCD29C');
  s.fill(ell(21, 18.8, 1.2, 1.1), CAI);
  s.put(21, 18.6, '#E3B33A');
  s.put(21, 19, INK);
  if (f === 1 || f === 3) s.dots('#FFFFFF', [27, 23.4], [29, 23.4]);
});

// ------------------------------------------------------------------ capivara (grande)
const CAPI = ramp('#A07446', { hi: '#C49A62', rim: '#F0D09C', sh: '#74503A', dp: '#4A3044', ol: '#20121E' });

export const capivara: OwDrawer = owSprite({ cx: 15, w: 20 }, (s, f) => {
  quad(s, f, { r: CAPI, legs: [9, 19], legTop: 21, lr: 1.7, stride: 1.3, foot: '#3A2418', b: [14, 19, 9.5, 5.2] });
  s.dots(CAPI.hi, [10, 15], [14, 14.5], [18, 15]);
  const hy = 16 + (gait(f) ? -0.5 : 0);
  const head = uni(ell(23.5, hy + 1, 4.4, 4.2), ell(26.5, hy + 2.6, 3, 2.6));
  s.fill(head, CAPI);
  s.fill(ell(22, hy - 3.6, 1.1, 1.3), CAPI);
  s.paintIn(head, ell(27, hy + 4, 2.4, 1.1), '#D8B488');
  s.fill(ell(28.6, hy + 1.6, 1.3, 1.1), ramp('#3A2824', { ol: '#140A10' }));
  eye(s, 25, hy - 0.8, false, INK, f === 1);
});

// ------------------------------------------------------------------ tuiuiú (grande, voa)
const WH = ramp('#F4F2EC', { hi: '#FFFFFF', rim: '#FFFFFF', sh: '#C8C6D6', dp: '#9490B0', ol: '#2C2848' });
const BLK = ramp('#2A2832', { hi: '#4E4A5C', rim: '#8A869A', sh: '#1A1822', dp: '#100E18', ol: '#06040C' });
const RED = ramp('#DC3A2E', { hi: '#F4684A', rim: '#FFB890', sh: '#A81E3C', dp: '#6A1038', ol: '#2A0A1E' });

export const tuiuiu: OwDrawer = owSprite({ cx: 15, w: 14, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    { body: WH, wing: WH, tip: BLK, b: [14, 13, 5.4, 2.8], sh: [16, 12], span: 11, chord: 6 },
    (dy) => {
      s.fill(path([[10, 13.5 + dy, 1.4], [5, 14.5 + dy, 1]]), WH);
      s.fill(path([[11, 15 + dy, 0.7], [3, 20 + dy, 0.5]]), BLK, { ol: false });
    },
    (dy) => {
      s.fill(cap(18, 12 + dy, 1.8, 20.6, 10 + dy, 1.6), BLK);
      s.fill(ell(20.4, 12.4 + dy, 2.2, 0.9), RED);
      s.fill(ell(21.5, 9.5 + dy, 2, 1.9), BLK);
      s.fill(poly([[22.5, 9 + dy], [29, 10.4 + dy], [29.5, 11.2 + dy], [22.5, 11.6 + dy]]), BLK);
    },
  );
});

// ------------------------------------------------------------------ arara-azul (médio, voa)
const BLUE = ramp('#2E52CC', { hi: '#5A86EC', rim: '#B4D4FF', sh: '#1E3496', dp: '#141E64', ol: '#080C34' });
const BLUE_DK = ramp('#1C3098', { hi: '#3C5CD0', rim: '#8CB0F0', sh: '#122070', dp: '#0C1450', ol: '#060822' });

export const araraazul: OwDrawer = owSprite({ cx: 14, w: 10, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    { body: BLUE, wing: BLUE_DK, b: [15, 13, 5, 3], sh: [16, 12], span: 10, chord: 6, bands: [[5, BLUE.md]] },
    (dy) => {
      const tail = path([[11, 14 + dy, 1.7], [6, 16 + dy, 1.3], [1, 18.5 + dy, 0.7]]);
      s.fill(tail, BLUE);
      s.paintIn(tail, rect(0, 0, 5, 32), BLUE_DK.md);
    },
    (dy) => {
      s.fill(ell(20.5, 11 + dy, 3, 2.8), BLUE);
      s.dots('#F4C42E', [21.5, 12 + dy], [22, 13.2 + dy]);
      s.fill(poly([[22.5, 9.6 + dy], [25.6, 10.4 + dy], [25.4, 13.6 + dy], [23.6, 14.8 + dy], [22.4, 12.6 + dy]]), ramp('#2C2A32', { hi: '#5C5A68', ol: '#08060E' }));
      s.put(22, 10.4 + dy, '#FFFFFF');
    },
  );
});

// ------------------------------------------------------------------ cervo-do-pantanal (grande, pula)
const DEER = ramp('#BA6A32', { hi: '#DC9050', rim: '#FACE94', sh: '#8E4A34', dp: '#552A3A', ol: '#28121E' });
const DCREAM = ramp('#F4ECDC', { hi: '#FFFFFF', sh: '#D4C4B2', dp: '#9C8C94', ol: '#3A2C34' });
const SOCK = '#2E2224';
const ANTLER = ramp('#8A6A4C', { hi: '#B8946C', rim: '#E4C8A0', sh: '#5E4636', ol: '#1A1014' });

export const cervo: OwDrawer = owSprite({ cx: 15, w: 18 }, (s, f) => {
  const b = f === 1 ? 0.5 : 0;
  const bound = f === 3 ? -2 : 0;
  s.fill(ell(7, 13 + bound, 1.6, 2), DCREAM);
  const leg = (x: number, x1: number, y1: number, r: ReturnType<typeof ramp>) => {
    s.fill(cap(x, 17 + bound + b, 1.2, x1, y1, 0.8), r);
    s.put(x1, y1 - 1, SOCK);
    s.put(x1, y1, SOCK);
  };
  const g = gait(f);
  if (f === 3) {
    leg(10, 6, 25, far(DEER));
    leg(19.5, 22, 22, far(DEER));
  } else {
    leg(10.5, 10.5 - g, 26.5, far(DEER));
    leg(20, 20 + g, 26.5, far(DEER));
  }
  const body = ell(14, 15.5 + bound + b, 7, 3.7);
  s.fill(body, DEER);
  s.paintIn(body, rect(8, 18 + bound + b, 13, 2), DCREAM.md);
  if (f === 3) {
    leg(9, 4.5, 24, DEER);
    leg(18.5, 21, 21, DEER);
  } else {
    leg(9.5, 9.5 + g, 26.5, DEER);
    leg(19, 19 - g, 26.5, DEER);
  }
  const hy = 8 + bound + b;
  s.fill(cap(19, 14 + bound + b, 2.4, 22, hy + 2, 1.7), DEER);
  s.fill(ell(19.5, hy - 1, 1.2, 2), DEER);
  // galhada ramificada
  s.line(21.5, hy - 1, 21.5, hy - 6, ANTLER.md);
  s.line(21.5, hy - 4, 19.5, hy - 6, ANTLER.hi);
  s.line(21.5, hy - 6, 23.5, hy - 7, ANTLER.hi);
  s.line(21.5, hy - 3, 23.5, hy - 5, ANTLER.md);
  const head = uni(ell(23, hy + 1, 2.6, 2.2), cap(23, hy + 1.5, 1.8, 27, hy + 2.8, 1.2));
  s.fill(head, DEER);
  s.paintIn(head, rect(25, hy + 3, 3, 1), DCREAM.md);
  s.put(28, hy + 2.5, SOCK);
  eye(s, 23.5, hy + 0.5, false, INK, f === 1);
});

// ------------------------------------------------------------------ piranha (pequeno, água)
const PIR = ramp('#8E9AA4', { hi: '#B8C4CC', rim: '#E4F0F4', sh: '#5E6E7E', dp: '#3E4A5E', ol: '#1A2236' });
const PRED = ramp('#D0382E', { hi: '#F0684A', sh: '#9E1E3C', dp: '#5E1038', ol: '#2A0A22' });
const CUT = rect(0, 25.6, 32, 7);

export const piranha: OwDrawer = owSprite(
  null,
  (s, f) => {
    const k = f >= 2 ? 1 : 0;
    const bob = f % 2;
    // dorso e nadadeira dorsal cortando a água
    s.fill(sub(ell(14 + k, 26.4, 6, 2.6), CUT), PIR);
    s.fill(sub(poly([[12 + k, 25.8], [16 + k, 25.8], [15 + k, 23.2 - bob], [13 + k, 24]]), CUT), PIR);
    // cabeça robusta de queixo saliente, olho vermelho
    const head = sub(uni(ell(20 + k, 25.6 - bob * 0.5, 3.4, 2.8), ell(22.5 + k, 26, 2.2, 1.8)), CUT);
    s.fill(head, PIR);
    s.paintIn(head, rect(18, 25.4, 8, 1), PRED.md);
    s.put(21 + k, 24 - bob * 0.5, '#E0382E');
    s.put(21 + k, 24.5 - bob * 0.5, INK);
    if (f === 1 || f === 3) s.dots('#FFFFFF', [24 + k, 25], [25 + k, 25]);
  },
  { cx: 15, w: 14, y: 25 },
);

// ------------------------------------------------------------------ anta (grande)
const ANTA = ramp('#6E5E50', { hi: '#968472', rim: '#CCBCA2', sh: '#4C3E48', dp: '#30242C', ol: '#150D13' });
const AHEAD = ramp('#8A7A6A', { hi: '#B2A28C', rim: '#E0D2BA', sh: '#64544E', dp: '#44343A', ol: '#1A1016' });

export const anta: OwDrawer = owSprite({ cx: 15, w: 20 }, (s, f) => {
  quad(s, f, { r: ANTA, legs: [9, 19], legTop: 21, lr: 1.9, stride: 1.2, foot: '#1A1014', b: [14, 18, 9.5, 5.8] });
  const hy = 15 + (gait(f) ? -0.5 : 0);
  s.fill(ell(19.5, hy + 1.5, 3.6, 4), ANTA);
  s.fill(ell(21.5, hy - 2.6, 1.3, 1.6), ANTA);
  s.paint(rect(21, hy - 3.6, 2, 1), '#E4DCC8');
  const head = uni(ell(23.4, hy + 1.6, 3.8, 3.2), ell(26.8, hy + 3, 3, 2.4));
  s.fill(head, AHEAD);
  // tromba curta, pendendo
  const tw = f === 1 ? 0 : gait(f);
  const trunk = path([[27, hy + 3, 1.7], [29, hy + 5.4, 1.5], [29.6 + tw, hy + 7.4, 1.3]]);
  s.fill(trunk, AHEAD);
  s.put(29 + tw, hy + 8, '#E4DCC8');
  eye(s, 24.5, hy + 0.4, false, INK, f === 1);
});

// ------------------------------------------------------------------ quati (médio, pula)
const QUATI = ramp('#A86A3A', { hi: '#CC9058', rim: '#F4C890', sh: '#7E4A3A', dp: '#4A2A38', ol: '#21121C' });
const QCREAM = '#EFDFBE';

export const quati: OwDrawer = owSprite({ cx: 15, w: 14 }, (s, f) => {
  const hop = f === 3 ? -2 : 0;
  // cauda anelada erguida
  const tail = path([[8, 17 + hop, 1.5], [5, 13 + hop, 1.4], [5, 8 + hop, 1.3], [7.5, 4.5 + hop, 1.1]]);
  s.fill(tail, QUATI);
  s.dots('#34241E', [5, 11 + hop], [5, 7.5 + hop], [7, 5 + hop], [6, 14 + hop]);
  const body = quad(s, f, { r: QUATI, legs: [10, 18], legTop: 20 + hop, lr: 1.5, stride: 1.6, foot: '#34241E', b: [14, 19 + hop, 7.4, 4.2] });
  s.paintIn(body, rect(8, 21.5 + hop, 13, 2), QCREAM);
  const hy = 16 + hop;
  s.fill(ell(21, hy - 3, 1.3, 1.4), QUATI);
  const head = uni(ell(22, hy, 3.4, 3.2), path([[24, hy + 0.8, 1.8], [28, hy + 1.8, 1.1]]));
  s.fill(head, QUATI);
  s.paintIn(head, ell(23.5, hy - 0.2, 2, 1.4), '#34241E');
  s.paintIn(head, rect(25, hy + 1.8, 4, 1), QCREAM);
  s.put(29, hy + 2, '#1A1014');
  eye(s, 23.5, hy - 0.8, false, '#F4E8C8', f === 1);
});

// ------------------------------------------------------------------ colhereiro (médio, voa)
const PINK = ramp('#F6A8BE', { hi: '#FFD0DC', rim: '#FFF0F2', sh: '#D87898', dp: '#A04870', ol: '#4A1C44' });
const CARM = ramp('#DC3C64', { hi: '#F26A88', rim: '#FFB8C4', sh: '#A81E50', dp: '#6E1244', ol: '#2E0A2A' });
const SBILL = ramp('#A8A08C', { hi: '#CCC4AC', rim: '#EAE4CE', sh: '#7C745E', ol: '#2A2420' });

export const colhereiro: OwDrawer = owSprite({ cx: 15, w: 12, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    { body: PINK, wing: PINK, tip: CARM, b: [14.5, 13, 5, 2.8], sh: [16, 12], span: 10, chord: 5, bands: [[3, CARM.md]] },
    (dy) => {
      s.fill(path([[10, 14 + dy, 1.5], [6, 15 + dy, 1]]), PINK);
    },
    (dy) => {
      s.fill(cap(18, 12 + dy, 1.6, 20.5, 10.6 + dy, 1.5), PINK);
      s.fill(ell(21.5, 10 + dy, 2, 1.8), ramp('#C4BC78', { ol: '#2E2A22' }));
      s.put(21.8, 9.8 + dy, '#D83A2E');
      s.fill(poly([[23, 9.8 + dy], [27, 10.6 + dy], [28.4, 12.2 + dy], [26, 12.8 + dy], [23, 11.8 + dy]]), SBILL);
    },
  );
});

// ------------------------------------------------------------------ bugio-preto (médio, pula)
const BUG = ramp('#322A34', { hi: '#554A5C', rim: '#9488A0', sh: '#1E1824', dp: '#120E18', ol: '#06040A' });

export const bugio: OwDrawer = owSprite({ cx: 15, w: 14 }, (s, f) => {
  const hop = f === 3 ? -2 : 0;
  // cauda preênsil enrolada para cima
  s.fill(path([[8, 18 + hop, 1.3], [4.5, 20 + hop, 1.2], [3.5, 24 + hop, 1.1], [6, 26 + hop, 1], [7.5, 24 + hop, 0.9]]), BUG);
  quad(s, f, { r: BUG, legs: [10, 18], legTop: 20 + hop, lr: 1.7, stride: 1.4, foot: '#4A3C42', b: [14, 18 + hop, 6.6, 5], farDx: 1 });
  s.dots(BUG.hi, [11, 14.5 + hop], [14, 14 + hop]);
  const hy = 12.5 + hop + (f === 1 ? 0.5 : 0);
  s.fill(ell(21, hy + 3.4, 2.8, 3.2), BUG);
  s.fill(ell(21.8, hy, 3.2, 3), BUG);
  s.fill(ell(23.4, hy + 0.8, 1.7, 1.7), ramp('#4A3C42', { ol: '#120A10' }));
  s.put(23.6, hy - 0.2, '#E8B060');
});

// ------------------------------------------------------------------ dourado (médio, água)
const GOLD = ramp('#D89A2A', { hi: '#F2C45A', rim: '#FFF0A0', sh: '#A8641E', dp: '#6A3A26', ol: '#2E1620' });

export const dourado: OwDrawer = owSprite(
  null,
  (s, f) => {
    const k = f >= 2 ? 1 : 0;
    const bob = f % 2;
    s.fill(sub(ell(12 + k, 26.4, 8, 2.8), CUT), GOLD);
    s.fill(sub(poly([[9 + k, 25.8], [14 + k, 25.8], [13 + k, 22.6 - bob], [10 + k, 24]]), CUT), ramp('#E0602A', { hi: '#F08A4A', sh: '#B03C26', ol: '#4A1420' }));
    s.dots('#E0602A', [3 + k, 24.4], [2 + k, 23.4], [3 + k, 25.4]);
    const head = sub(uni(ell(19.5 + k, 25.6 - bob * 0.5, 4, 2.8), ell(23 + k, 26, 2.4, 1.8)), CUT);
    s.fill(head, GOLD);
    s.paintIn(head, rect(18, 26, 9, 1), '#F4D878');
    s.put(21 + k, 24.2 - bob * 0.5, INK);
    s.put(20 + k, 24 - bob * 0.5, '#FFF0A0');
  },
  { cx: 14, w: 18, y: 25 },
);

// ------------------------------------------------------------------ jaguatirica (médio)
const OCE = ramp('#DAB066', { hi: '#F0CE8A', rim: '#FFF0C0', sh: '#B07C4A', dp: '#70483C', ol: '#2A1620' });
const ODARK = '#2E1E1C';

export const jaguatirica: OwDrawer = owSprite({ cx: 15, w: 17 }, (s, f) => {
  const t = f === 1 ? 1 : 0;
  const tail = path([[7, 17, 1.2], [3.5, 19, 1.1], [2, 23 - t, 1], [3 + t, 25.5 - t, 0.9]]);
  s.fill(tail, OCE);
  s.dots(ODARK, [3, 20], [2, 22.5 - t], [3 + t, 25 - t]);
  const body = quad(s, f, { r: OCE, legs: [9, 19], legTop: 20, lr: 1.6, stride: 1.5, foot: '#F6ECDA', b: [14, 18.5, 8, 4.4] });
  s.paintIn(body, rect(7, 21, 15, 1.6), '#F6ECDA');
  for (const [x, y] of [[9, 16], [12, 17.5], [15, 16], [18, 17.5], [11, 20], [16, 20]] as P[]) {
    s.paintIn(body, ell(x, y, 1.2, 0.9), ODARK);
    s.paint(ell(x, y, 0.4, 0.4), '#B0793F');
  }
  const hy = 14 + (gait(f) !== 0 ? -0.5 : 0);
  s.fill(ell(22, hy - 3.2, 1.3, 1.4), OCE);
  const head = uni(ell(23.6, hy, 3.8, 3.4), ell(26.8, hy + 1.4, 2.2, 1.8));
  s.fill(head, OCE);
  s.paintIn(head, ell(27, hy + 2.2, 2, 1.2), '#F6ECDA');
  s.dots(ODARK, [21, hy - 1], [22, hy + 0.5], [24, hy - 2.2]);
  s.dots('#C8505E', [29, hy + 1]);
  eye(s, 25.5, hy - 1, false, '#D8D83A', f === 1);
});

export const OW_DRAWERS: Record<string, OwDrawer> = {
  jacare, capivara, tuiuiu, araraazul, cervo, piranha, anta, quati, colhereiro, bugio, dourado, jaguatirica,
};
