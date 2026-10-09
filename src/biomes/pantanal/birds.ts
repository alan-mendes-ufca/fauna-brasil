import { cap, type Drawer, ell, eye, INK, path, poly, ramp, type Spr, uni, water } from '../../art/animals/kit';
import { drawWing, flapAngles, tailWedge, type WingSpec } from '../../art/animals/wing';

// Aves do Pantanal (retratos 64×64, base em y = 58).

// ------------------------------------------------------------------ tuiuiú
const WH = ramp('#F4F2EC', { hi: '#FFFFFF', rim: '#FFFFFF', sh: '#C8C6D6', dp: '#9490B0', ol: '#2C2848' });
const BLK = ramp('#2A2832', { hi: '#4E4A5C', rim: '#8A869A', sh: '#1A1822', dp: '#100E18', ol: '#06040C' });
const RED = ramp('#DC3A2E', { hi: '#F4684A', rim: '#FFB890', sh: '#A81E3C', dp: '#6A1038', ol: '#2A0A1E' });
const LEGS = ramp('#3A3640', { hi: '#5E5A68', ol: '#0E0A14' });

const TUI_WING: WingSpec = {
  S: [38, 28],
  S2: [38, 38],
  feathers: [[26, -0.42], [27, -0.2], [27, 0.03], [25, 0.26], [21, 0.5]],
  outer: BLK,
  bands: [[17, WH]],
  sep: BLK.dp,
};

function tuiBill(s: Spr, x: number, y: number): void {
  // bico enorme, reto e levemente curvado para cima na ponta
  const bill = poly([[x, y - 3], [x + 11, y - 2.4], [x + 22, y], [x + 26, y - 1.4], [x + 25.5, y + 1.4], [x + 17, y + 3.4], [x + 8, y + 4.6], [x, y + 4]]);
  s.fill(bill, BLK);
  s.line(x + 1, y + 1.2, x + 24, y + 0.4, BLK.dp);
  s.dots(BLK.rim, [x + 4, y - 2], [x + 8, y - 1.5], [x + 13, y - 1]);
}

export const tuiuiu: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  if (f < 2) {
    // pernas longas e escuras
    for (const sx of [-1, 1]) {
      const x = 32 + sx * 4.2;
      s.fill(cap(x, 43, 2, x + sx * 0.6, 56, 1.4), LEGS, { n: 1 });
      s.fill(ell(x + sx * 0.8, 57.3, 3.6, 1.3), LEGS, { n: 1 });
      s.dots(INK, [x - 2.5, 58], [x + 0.5, 58.8], [x + 3.5, 58]);
    }
    // cauda curta e branca
    s.fill(poly([[28, 44], [36, 44], [37, 52], [32, 53.5], [27, 52]]), WH);
    // corpo branco e asas dobradas, pontas pretas
    s.fill(ell(32, 34, 11, 13), WH);
    for (const sx of [-1, 1]) {
      const wing = poly([[32 + sx * 3, 24], [32 + sx * 11, 28], [32 + sx * 11, 42], [32 + sx * 5, 50], [32 + sx * 2, 42]]);
      s.fill(wing, WH, { ol: WH.sh });
      s.paintIn(wing, poly([[32 + sx * 4, 42], [32 + sx * 11, 40], [32 + sx * 5, 50]]), BLK.md);
      s.line(32 + sx * 4, 28, 32 + sx * 4, 40, WH.sh);
    }
    // pescoço negro, com o colar vermelho na base
    s.fill(cap(33, 23, 4.8, 33, 12, 3.4), BLK);
    s.fill(ell(33, 22.5, 6.8, 3.4), RED);
    s.dots(RED.rim, [29, 21], [30, 20.5], [31, 20.3]);
    s.dots(RED.dp, [30, 24.5], [34, 25], [37, 24]);
    // cabeça e bico
    const hy = 10 + b;
    s.fill(ell(33, hy, 5.2, 4.8), BLK);
    tuiBill(s, 36, hy - 0.5);
    eye(s, 32, hy - 2.5, 4, 4, '#E8C040', f === 1);
  } else {
    const a = flapAngles(f, -1.0, 0.7);
    drawWing(s, TUI_WING, a.l, -1);
    drawWing(s, TUI_WING, a.r, 1);
    const { dy } = a;
    // pernas esticadas para trás
    for (const sx of [-1, 1]) s.fill(cap(32 + sx * 2.4, 48, 1.4, 32 + sx * 3.4, 61, 1), LEGS, { n: 1 });
    tailWedge(s, 32, 46 + dy, 8, 56, 0, WH, undefined);
    s.fill(ell(32, 36 + dy, 8.5, 12), WH);
    s.fill(cap(33, 26 + dy, 4.2, 35, 14 + dy, 3.2), BLK);
    s.fill(ell(33, 26 + dy, 5.8, 2.8), RED);
    s.fill(ell(35, 11 + dy, 5, 4.6), BLK);
    tuiBill(s, 38, 10.5 + dy);
    eye(s, 33.5, 8.5 + dy, 4, 4, '#E8C040', false);
  }
};

// ------------------------------------------------------------------ arara-azul-grande
const BLUE = ramp('#2E52CC', { hi: '#5A86EC', rim: '#B4D4FF', sh: '#1E3496', dp: '#141E64', ol: '#080C34' });
const BLUE_DK = ramp('#1C3098', { hi: '#3C5CD0', rim: '#8CB0F0', sh: '#122070', dp: '#0C1450', ol: '#060822' });
const YEL = ramp('#F4C42E', { hi: '#FFE878', rim: '#FFF6B8', sh: '#C08A24', dp: '#7A5226', ol: '#3A200E' });
const HBILL = ramp('#2C2A32', { hi: '#5C5A68', rim: '#908E9E', sh: '#1A1820', ol: '#08060E' });

const ARARA_WING: WingSpec = {
  S: [38, 31],
  S2: [38, 41],
  feathers: [[31, -0.42], [34, -0.17], [33, 0.08], [29, 0.33], [23, 0.55]],
  outer: BLUE_DK,
  bands: [[20, BLUE], [12, ramp('#3E6AE0', { hi: '#6C98F4', sh: '#2444AA', dp: '#162C78' })]],
  sep: BLUE_DK.dp,
};

export const araraazul: Drawer = (s, f) => {
  const a = flapAngles(f, -1.05, 0.75);
  drawWing(s, ARARA_WING, a.l, -1);
  drawWing(s, ARARA_WING, a.r, 1);
  const { dy, lean } = a;
  // cauda longa e pontuda
  tailWedge(s, 32, 44 + dy, 10, 62, lean, BLUE, BLUE_DK, 8);
  // pés cinzentos
  const FOOT = ramp('#6E6678', { hi: '#9C94AC', ol: '#201830' });
  for (const sx of [-1, 1]) {
    s.fill(ell(32 + sx * 4, 49 + dy, 2.4, 2), FOOT, { n: 1 });
    s.fill(cap(32 + sx * 4, 50 + dy, 1, 32 + sx * 2.5, 52.5 + dy, 0.8), FOOT, { n: 1 });
    s.fill(cap(32 + sx * 4, 50 + dy, 1, 32 + sx * 5.5, 52.5 + dy, 0.8), FOOT, { n: 1 });
  }
  // corpo azul-cobalto
  s.fill(ell(32 + lean * 0.5, 37 + dy, 9.5, 13), BLUE);
  s.dots(BLUE.hi, [29, 40 + dy], [33, 43 + dy], [35, 38 + dy], [30, 35 + dy], [28, 44 + dy]);
  // cabeça
  const hx = 32 + lean;
  const hy = 20 + dy;
  s.fill(ell(hx, hy, 9.8, 8.8), ramp('#3A62D8', { hi: '#6C96F0', rim: '#C0DCFF', sh: '#2444AA', dp: '#162C78', ol: '#080C34' }));
  // pele amarela em volta dos olhos e na base do bico
  s.fill(uni(ell(hx - 5.4, hy + 1.2, 3.6, 3.2), ell(hx + 5.4, hy + 1.2, 3.6, 3.2)), YEL, { ol: false, rim: false });
  eye(s, hx - 7.5, hy - 1, 5, 5, '#2A1A14', f === 1);
  eye(s, hx + 2.5, hy - 1, 5, 5, '#2A1A14', f === 1);
  // bico preto, enorme e curvo, com a mandíbula amarela embaixo
  s.fill(ell(hx, hy + 8.4, 3, 2.2), YEL, { n: 1, rim: false });
  s.fill(poly([[hx - 5, hy + 2], [hx + 5, hy + 2], [hx + 5.5, hy + 8], [hx + 3, hy + 14], [hx - 0.5, hy + 17], [hx - 2.5, hy + 14], [hx - 5, hy + 8]]), HBILL);
  s.line(hx - 3.5, hy + 8.5, hx + 4, hy + 8.5, HBILL.sh);
  s.dots(HBILL.rim, [hx - 3, hy + 3], [hx - 2, hy + 4], [hx - 3, hy + 6]);
  s.dots(YEL.hi, [hx - 1, hy + 9], [hx + 1, hy + 9]);
};

// ------------------------------------------------------------------ colhereiro
const PINK = ramp('#F6A8BE', { hi: '#FFD0DC', rim: '#FFF0F2', sh: '#D87898', dp: '#A04870', ol: '#4A1C44' });
const CARM = ramp('#DC3C64', { hi: '#F26A88', rim: '#FFB8C4', sh: '#A81E50', dp: '#6E1244', ol: '#2E0A2A' });
const SKIN = ramp('#C4BC78', { hi: '#E0DA9A', rim: '#F4F0BE', sh: '#968E58', dp: '#6A6040', ol: '#2E2A22' });
const SBILL = ramp('#A8A08C', { hi: '#CCC4AC', rim: '#EAE4CE', sh: '#7C745E', dp: '#564E48', ol: '#2A2420' });
const PLEG = ramp('#C84A56', { hi: '#E8707A', ol: '#42142A' });


export const colhereiro: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const feeding = f >= 2;
  // pernas rosadas (somem na água)
  for (const sx of [-1, 1]) {
    const x = 30 + sx * 4;
    s.fill(cap(x, 44, 1.8, x, 58, 1.3), PLEG, { n: 1 });
  }
  // cauda curta e corpo rosado
  s.fill(poly([[22, 40], [28, 38], [26, 49], [20, 50]]), PINK);
  s.fill(ell(30, 36 + b * 0.4, 11.5, 11), PINK);
  // asa dobrada com o ombro carmim
  const wing = ell(27, 37, 8.5, 7.5);
  s.fill(wing, ramp('#F8B8CA', { hi: '#FFD8E2', sh: '#D882A2', dp: '#A04E78', ol: '#4A1C44' }));
  s.paintIn(wing, ell(31, 33, 3.6, 3), CARM.md);
  s.dots(CARM.hi, [30, 32], [31, 31]);
  for (const x of [22, 25, 28]) s.line(x, 39, x - 1, 44, PINK.sh);
  // pescoço branco-rosado
  const neck = feeding ? path([[34, 30, 4.4], [40, 36, 3.2], [44, 46, 2.8]]) : path([[35, 30, 4.4], [36, 22, 3.2], [37, 15, 2.8]]);
  s.fill(neck, ramp('#FBE4EA', { hi: '#FFFFFF', rim: '#FFFFFF', sh: '#E4B0C4', dp: '#B27A9C', ol: '#4A1C44' }));
  if (!feeding) {
    // cabeça nua, esverdeada, bico em colher apontando para a frente
    const hy = 11 + b;
    s.fill(ell(38, hy, 4.4, 4.2), SKIN);
    s.paint(ell(36.5, hy + 0.5, 1.8, 1.8), '#F4F0BE');
    eye(s, 38, hy - 1.5, 3, 3, '#D83A2E', f === 1);
    const stalk = poly([[41, hy - 2], [49, hy - 0.6], [52, hy + 1], [50, hy + 3], [43, hy + 3.4]]);
    s.fill(stalk, SBILL);
    const spoon = ell(55.5, hy + 4.4, 5.6, 3.2);
    s.fill(spoon, SBILL);
    s.paintIn(spoon, ell(55, hy + 4.8, 3.6, 1.6), SBILL.hi);
    s.line(44, hy, 51, hy + 1.2, SBILL.sh);
  } else {
    // cabeça baixa: o bico varre a água de um lado para o outro
    const sw = f === 2 ? -3 : 3;
    const hx = 45 + sw * 0.3;
    s.fill(ell(hx, 49, 4.2, 4), SKIN);
    eye(s, hx + 0.5, 47.4, 3, 3, '#D83A2E', false);
    const stalk = poly([[hx + 2, 48], [hx + 10 + sw * 0.4, 51], [hx + 11 + sw * 0.5, 53.5], [hx + 2, 53]]);
    s.fill(stalk, SBILL);
    s.fill(ell(hx + 13.5 + sw * 0.6, 53.4, 5, 2.8), SBILL);
    s.dots(SBILL.hi, [hx + 12 + sw * 0.6, 52.6], [hx + 14 + sw * 0.6, 52.6]);
  }
  water(s, 32, 27, f, feeding ? 3 : 0);
};
