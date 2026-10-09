import { rng } from '../../art/canvas';
import { cap, type Drawer, ell, eye, fuzz, INK, path, poly, ramp, rect, uni, water, type Pt } from '../../art/animals/kit';
import { drawWing, flapAngles, tailWedge, type WingSpec } from '../../art/animals/wing';

// Aves do Cerrado na captura (64×64): seriema, ema, arara-canindé, tucano-toco, pato-mergulhão e coruja-buraqueira.

// ------------------------------------------------------------------ seriema
const SER = ramp('#A89A88', { hi: '#C8BCA8', rim: '#EDE2CC', sh: '#7C6E6E', dp: '#554858', ol: '#241A28' });
const SBELLY = ramp('#EDE4D0', { hi: '#FFFFFF', sh: '#CBBDA8', dp: '#948490', ol: '#3A2C34' });
const SDARK = ramp('#5A4A44', { hi: '#7E6C62', rim: '#AC9A88', sh: '#3E3238', dp: '#2A2030', ol: '#120C18' });
const SRED = ramp('#E0503C', { hi: '#FF8060', rim: '#FFC0A0', sh: '#B02E34', dp: '#701C30', ol: '#2E0C1A' });

export const seriema: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const strike = f === 3;
  const wind = f === 2;
  const lean = wind ? -2 : strike ? 2 : 0;
  // cauda longa, barrada, com a ponta branca, atrás das pernas
  const tail = poly([[27 + lean * 0.5, 46], [37 + lean * 0.5, 46], [38.5 + lean, 62], [25.5 + lean, 62]]);
  s.fill(tail, SDARK);
  for (const y of [51, 55, 59]) s.paintIn(tail, rect(0, y, 64, 1.4), SBELLY.sh);
  s.paintIn(tail, rect(0, 61, 64, 3), SBELLY.md);
  // pernas longas e vermelhas, pés abertos
  for (const sx of [-1, 1]) {
    const x = 32 + sx * 5 + lean * 0.5;
    s.fill(cap(x, 44, 2.8, x + sx * 0.6, 56, 1.8), SRED);
    s.fill(ell(x + sx * 0.6, 57.4, 4, 1.7), SRED, { n: 1 });
    s.dots(SRED.dp, [x + sx * 0.6 - 3, 58.4], [x + sx * 0.6, 59], [x + sx * 0.6 + 3, 58.4]);
  }
  // corpo
  const body = ell(32 + lean, 35, 10.5, 12.5);
  s.fill(body, SER);
  s.fill(ell(32 + lean, 38, 7.4, 9.5), SBELLY, { ol: false, rim: false });
  for (let y = 31; y < 44; y += 3) s.dots(SER.sh, [29 + lean, y + b], [33 + lean, y + 1 + b], [36 + lean, y + b]);
  // asas dobradas junto ao corpo, com barras
  for (const sx of [-1, 1]) {
    const w = ell(32 + lean + sx * 9.6, 37, 3.8, 10.5);
    s.fill(w, SER);
    for (const y of [33, 38, 43]) s.paintIn(w, rect(0, y, 64, 1), SER.sh);
  }
  // pescoço
  const hy = strike ? 36 : wind ? 14 : 16 + b;
  const hx = 32 + (strike ? 0 : lean);
  s.fill(path([[32 + lean, 27, 5.2], [hx, hy + 6, 3.8]]), SER);
  s.fill(ell(hx, hy + 9, 3, 5), SBELLY, { ol: false, rim: false });
  // cabeça com o penacho de penas finas sobre o bico
  const head = ell(hx, hy, 7, 6.2);
  s.fill(head, SER);
  const tuftDir = strike ? 1 : -1;
  for (let i = -3; i <= 3; i++) {
    const x0 = hx + i * 1.4;
    s.line(x0, hy - 3, x0 + i * 1.6, hy - 10 + Math.abs(i) * 1.2 + (strike ? 4 : 0), i % 2 ? SER.hi : SDARK.md);
  }
  s.dots(SDARK.md, [hx + tuftDir * 0.5, hy - 6]);
  // pele azulada em volta dos olhos grandes e claros
  for (const sx of [-1, 1]) {
    s.paint(ell(hx + sx * 4, hy - 0.5, 3, 3), '#9CB8C8');
    eye(s, hx + sx * 4 - 2, hy - 2.5, 4, 4, '#F6E48C', b === 1);
  }
  // bico vermelho, curto e ganchudo
  s.fill(poly([[hx - 3.6, hy + 2], [hx + 3.6, hy + 2], [hx + 3, hy + 6], [hx + 0.6, hy + 9.5], [hx - 1, hy + 8], [hx - 3, hy + 5.5]]), SRED);
  s.dots(SRED.dp, [hx, hy + 8.5], [hx - 1, hy + 7.5]);
  s.dots(SRED.rim, [hx - 2, hy + 3], [hx - 1, hy + 3]);
  if (strike) s.dots('#E8D8B8', [20, 62], [22, 61], [42, 62], [44, 61]);
};

// ------------------------------------------------------------------ ema
const EM = ramp('#A09080', { hi: '#C4B6A2', rim: '#EDE0CA', sh: '#766A6C', dp: '#54485A', ol: '#241A28' });
const EDK = ramp('#4A4038', { hi: '#6E6256', rim: '#9A8C7C', sh: '#322830', dp: '#221A26', ol: '#0E0A14' });
const ELEG = ramp('#B8A8A0', { hi: '#DACEC4', rim: '#F2E8E0', sh: '#8A7A84', dp: '#5E4E5E', ol: '#2A1C2C' });

export const ema: Drawer = (s, f) => {
  const rand = rng(56);
  const b = f === 1 ? 1 : 0;
  const graze = f >= 2;
  const k = f === 3 ? 1 : 0;
  // pernas longas, de dois lados; a de lá mais escura
  for (const [x, dim] of [[43, true], [32, false]] as [number, boolean][]) {
    const leg = cap(x, 46, 3.6, x - 0.5, 57, 2.2);
    s.fill(leg, dim ? { ...ELEG, rim: ELEG.hi, hi: ELEG.md, md: ELEG.sh, sh: ELEG.dp } : ELEG);
    s.fill(ell(x - 2, 58, 5, 1.7), ELEG, { n: 1 });
    s.dots(ELEG.dp, [x - 6, 58.6], [x - 3, 59], [x - 1, 58.6]);
  }
  // corpo fofo, mais alto atrás
  const body = uni(ell(38, 38 + b * 0.5, 18, 11.5), ell(44, 35, 12, 11));
  s.fill(body, EM);
  fuzz(s, body, EM.hi, rand, 0.4);
  for (let i = 0; i < 22; i++) s.put(27 + ((i * 7) % 24), 32 + ((i * 5) % 13), i % 2 ? EM.hi : EM.sh);
  s.paintIn(body, ell(54, 31, 7, 6), EM.hi);
  s.dots(EM.rim, [34, 28], [40, 26], [46, 25], [52, 26]);
  // pescoço comprido; manchas escuras na base e na nuca
  const pts: [number, number, number][] = graze
    ? [[24, 34, 5], [16, 40 + k, 3.4], [11, 48 + k * 2, 2.8]]
    : [[24, 34, 5], [18, 24, 3.2], [15 + b * 0.5, 14, 2.7]];
  const neck = path(pts);
  s.fill(neck, EM);
  s.paintIn(neck, ell(pts[0][0] - 1, pts[0][1] - 2, 5.5, 5), EDK.md);
  const [hx, hy] = [pts[2][0] - 1, pts[2][1] - 2];
  const tip = pts[2];
  s.paintIn(neck, ell(tip[0], tip[1] - 2, 3.4, graze ? 6 : 8), EM.sh);
  // cabeça pequena e bico achatado
  const head = ell(hx, hy + 1, 4.2, 3.6);
  s.fill(head, EM);
  s.fill(poly([[hx - 3, hy + 1], [hx - 10, hy + 3.5 + (graze ? 1.5 : 0)], [hx - 9.5, hy + 5.5 + (graze ? 1.5 : 0)], [hx - 3, hy + 4]]), ELEG);
  s.dots(EDK.md, [hx - 8, hy + 4 + (graze ? 1.5 : 0)]);
  eye(s, hx - 1, hy - 0.8, 3, 3, '#6A4A2A', b === 1);
  s.dots(EM.rim, [hx + 1, hy - 2], [hx + 2, hy - 2]);
  if (k) s.dots('#CDBF9E', [4, 60], [7, 61], [2, 61]);
};

// ------------------------------------------------------------------ arara-canindé
const BLUE = ramp('#2E82DC', { hi: '#5CB0F4', rim: '#C0ECFF', sh: '#1E54B0', dp: '#143482', ol: '#081240' });
const BLUE_DK = ramp('#1E5CC0', { hi: '#3E88E0', rim: '#9CD0F8', sh: '#143C94', dp: '#0E2468', ol: '#060E36' });
const YEL = ramp('#F4C418', { hi: '#FFE450', rim: '#FFF6B0', sh: '#D08A18', dp: '#8E4E22', ol: '#3A1E14' });
const ORG = ramp('#F0A020', { hi: '#FFC84A', sh: '#C86A1E', dp: '#8A3C22', ol: '#3A1A14' });
const WHITEF = ramp('#F6F0E4', { hi: '#FFFFFF', sh: '#D4C8BC', dp: '#A09098', ol: '#3A2C34' });
const MBILL = ramp('#2E2C34', { hi: '#5E5A68', rim: '#8E8A98', sh: '#1C1A22', ol: '#08060E' });

const CAN_WING: WingSpec = {
  S: [38, 31],
  S2: [38, 41],
  feathers: [[31, -0.42], [34, -0.17], [33, 0.08], [29, 0.33], [24, 0.55]],
  outer: BLUE_DK,
  bands: [[21, YEL], [12, ORG]],
  sep: BLUE_DK.dp,
};

export const canide: Drawer = (s, f) => {
  const a = flapAngles(f, -1.05, 0.75);
  drawWing(s, CAN_WING, a.l, -1);
  drawWing(s, CAN_WING, a.r, 1);
  const { dy, lean } = a;
  tailWedge(s, 32, 44 + dy, 10, 62, lean, BLUE, BLUE_DK, 7);
  for (const sx of [-1, 1]) {
    const fx = 32 + sx * 4;
    s.fill(ell(fx, 49 + dy, 2.4, 2), ramp('#7A7088', { hi: '#A49CB0', ol: '#241A34' }), { n: 1 });
  }
  // corpo amarelo-alaranjado
  s.fill(ell(32 + lean * 0.5, 37 + dy, 9, 12.5), YEL);
  s.fill(ell(32 + lean * 0.5, 41 + dy, 6, 8), ORG, { ol: false, rim: false });
  s.dots(YEL.hi, [29, 33 + dy], [35, 34 + dy]);
  // cabeça: topo verde, face branca nua com linhas de penugem, faixa preta no queixo
  const hx = 32 + lean;
  s.fill(ell(hx, 20 + dy, 9.6, 8.6), ramp('#8CC03A', { hi: '#B4E060', rim: '#E4FFA0', sh: '#5E9A2E', dp: '#356A2A', ol: '#102A1A' }));
  s.fill(uni(ell(hx - 4.5, 22.5 + dy, 5, 4.6), ell(hx + 4.5, 22.5 + dy, 5, 4.6), ell(hx, 25 + dy, 5.4, 3.2)), WHITEF, { ol: false, rim: false });
  for (const sx of [-1, 1]) {
    s.line(hx + sx * 2, 21.5 + dy, hx + sx * 8, 21 + dy, INK);
    s.line(hx + sx * 2, 24 + dy, hx + sx * 7.5, 24.5 + dy, '#4A3A44');
    eye(s, hx + sx * 5 - 2, 18.5 + dy, 4, 4, '#F6E070', f === 1);
  }
  s.fill(ell(hx, 29.5 + dy, 4, 1.8), MBILL, { ol: false, rim: false });
  // bico enorme, preto e ganchudo
  s.fill(poly([[hx - 4.5, 23 + dy], [hx + 4.5, 23 + dy], [hx + 4, 28 + dy], [hx + 1.4, 33 + dy], [hx - 0.8, 32 + dy], [hx - 3.5, 28 + dy]]), MBILL);
  s.line(hx - 3, 27.5 + dy, hx + 3, 27.5 + dy, MBILL.sh);
  s.dots(MBILL.rim, [hx - 2, 24 + dy], [hx - 1, 24 + dy], [hx - 3, 25 + dy]);
};

// ------------------------------------------------------------------ tucano-toco
const TK = ramp('#2A2430', { hi: '#4C4458', rim: '#7E7690', sh: '#1A141E', dp: '#100A14', ol: '#06040A' });
const TBILL = ramp('#F48A22', { hi: '#FFBE50', rim: '#FFE49A', sh: '#C85A1E', dp: '#8A3820', ol: '#3A1A14' });
const TWH = ramp('#F8F4EA', { hi: '#FFFFFF', sh: '#D6CCC0', dp: '#A09098', ol: '#3A2C34' });
const BRANCH = ramp('#7A5A3E', { hi: '#A27E58', rim: '#CCA67E', sh: '#563C34', dp: '#3A2630', ol: '#1A1018' });

export const tucano: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const hop = f === 3;
  const crouch = f === 2;
  const y = hop ? -7 : crouch ? 2 : 0;
  const lift = hop ? 11 : 0;
  // galho
  s.fill(path([[10, 58.6, 1.8], [30, 58, 2], [54, 58.6, 1.8]]), BRANCH, { n: 1 });
  s.dots(BRANCH.dp, [20, 58], [38, 59]);
  // cauda e pés
  s.fill(path([[43, 50 + y, 4.4], [47, 56 + y, 3.6], [49, 62 + y * 0.3, 3]]), TK);
  if (!hop) for (const x of [35, 41]) {
    s.fill(cap(x, 52, 2, x, 56.5, 1.6), ramp('#7E8CA0', { hi: '#A8B4C8', ol: '#1C2236' }), { n: 1 });
    s.fill(ell(x - 1, 57.6, 3.2, 1.3), ramp('#7E8CA0', { ol: '#1C2236' }), { n: 1 });
  } else {
    for (const x of [35, 41]) s.fill(cap(x, 50 + y, 2, x + 1, 55 + y, 1.4), ramp('#7E8CA0', { ol: '#1C2236' }), { n: 1 });
  }
  // corpo escuro, peito para a esquerda
  const body = ell(39, 40 + y + b * 0.4, 11, 14);
  s.fill(body, TK);
  s.paintIn(body, ell(46, 36 + y, 6, 10), TK.hi);
  s.fill(ell(44, 38 + y, 6, 10.5), ramp('#1E1826', { hi: '#3E3650', rim: '#7E7690', ol: '#06040A' }), { ol: false });
  s.dots(TK.rim, [40, 29 + y], [43, 28 + y], [47, 30 + y]);
  s.paint(ell(47, 46 + y, 3, 2), TWH.md);
  // pescoço e peitoral branco
  s.fill(cap(33, 31 + y, 6.5, 30, 24 + y, 5.4), TK);
  s.fill(ell(31, 34 + y, 6.6, 6.6), TWH, { ol: false, rim: false });
  s.line(25, 29 + y, 37, 29 + y, TK.md);
  // cabeça
  const hx = 29;
  const hy = 22 + y + b;
  s.fill(ell(hx, hy, 6.4, 6), TK);
  // bico gigante, laranja, ponta preta
  const tipY = 32 - lift;
  const bill = poly([[hx - 3, hy - 3], [hx - 10, hy - 5 - lift * 0.25], [hx - 20, tipY - 5], [hx - 27, tipY - 1.5 + (hop ? 1 : 0)], [hx - 27, tipY + 2.5], [hx - 20, tipY + 5], [hx - 10, hy + 5 + (hop ? -lift * 0.35 : 0)], [hx - 3, hy + 4]]);
  s.fill(bill, TBILL);
  s.paintIn(bill, rect(0, 0, hx - 3, hy - 2), TBILL.hi);
  s.paintIn(bill, poly([[hx - 8, hy - 4], [hx - 20, tipY - 5], [hx - 27, tipY - 1.5], [hx - 26, tipY - 0.5], [hx - 18, tipY - 3.5], [hx - 8, hy - 2]]), TBILL.rim);
  s.paintIn(bill, ell(hx - 25, tipY + 0.5, 3.4, 3.4), TK.md);
  s.line(hx - 4, hy - 3, hx - 4, hy + 3, TK.md);
  s.line(hx - 10, hy + 3, hx - 25, tipY + 2.5, TBILL.sh);
  // anel azul e laranja em volta do olho
  s.paint(ell(hx - 1, hy - 0.5, 4.4, 4.2), '#F0802E');
  s.paint(ell(hx - 1, hy - 0.5, 3.2, 3.2), '#4C9AD8');
  eye(s, hx - 3, hy - 2.4, 4, 4, '#3A2A2E', b === 1);
  if (hop) s.fill(ell(hx - 25, tipY - 7, 2.4, 2.4), ramp('#D8342E', { hi: '#FF7A5E', ol: '#4A0E18' }), { n: 1 });
  if (hop) s.dots('#E8D2A8', [26, 61], [30, 61]);
};

// ------------------------------------------------------------------ pato-mergulhão
const PD = ramp('#2A3C38', { hi: '#4E6E5E', rim: '#8EB4A0', sh: '#1A2A2E', dp: '#10181E', ol: '#060C10' });
const PGRAY = ramp('#B4B0AA', { hi: '#DAD6CE', rim: '#F4F0E8', sh: '#8A8490', dp: '#5E5868', ol: '#241E2C' });
const PBILL = ramp('#E04630', { hi: '#FF7A58', rim: '#FFC0A0', sh: '#B02A30', dp: '#701A2E', ol: '#300C1A' });

export const patomergulhao: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  if (f < 2) {
    // cauda curta e rígida, apontando para trás
    s.fill(poly([[48, 49], [57, 46.5 - b], [56, 51], [48, 54]]), PD);
    // corpo cinza com escamado fino, boiando
    const body = ell(35, 52, 16, 8.5);
    s.fill(body, PGRAY);
    for (let y = 47; y < 58; y += 2) for (let x = 22 + (y % 4); x < 50; x += 4) s.paintIn(body, rect(x, y, 2, 0.8), PGRAY.sh);
    s.paintIn(body, ell(33, 49, 11, 1.8), PGRAY.rim);
    s.dots(PD.md, [43, 49], [46, 51], [40, 48]);
    // asa dobrada com espelho branco
    s.paintIn(body, ell(40, 52, 7, 3), PD.hi);
    s.paintIn(body, rect(37, 52, 6, 1.4), '#F2F0EA');
    // pescoço esguio e cabeça escura de brilho esverdeado
    s.fill(path([[26, 49, 4.4], [21, 38 - b, 3], [19, 31 - b, 2.8]]), PD);
    s.dots(PD.rim, [22, 36], [21, 33]);
    const hy = 28 - b;
    s.fill(ell(20, hy, 5, 4.2), PD);
    // topete duplo: penas finas e longas caindo para trás
    for (const [dx, dy] of [[4, -3], [7, -1], [9, 1], [8, 3], [5, 4]]) {
      s.line(21, hy - 1, 21 + dx + 2, hy + dy - 1, PD.md);
      s.line(21, hy, 21 + dx + 2, hy + dy + 1, PD.hi);
    }
    // bico fino, vermelho, com dentinhos e unha em gancho
    s.fill(poly([[16.5, hy - 1.5], [8, hy], [6.5, hy + 1.4], [8.5, hy + 2.6], [16.5, hy + 2.2]]), PBILL);
    for (const x of [9, 11, 13]) s.put(x, hy + 2.8, '#F6EEDC');
    s.dots(PBILL.dp, [6.5, hy + 1], [7, hy + 2]);
    eye(s, 17.5, hy - 2.2, 3, 3, '#3A1A1A', b === 1);
    water(s, 34, 22, f);
  } else if (f === 2) {
    // costas arqueadas saindo da água, cabeça já mergulhada; cauda erguida
    s.fill(poly([[48, 47], [58, 40], [57, 46], [49, 52]]), PD);
    const arc = path([[18, 62, 6], [28, 52, 8.5], [40, 47, 7.5], [48, 49, 4.6]]);
    s.fill(arc, PGRAY);
    s.paintIn(arc, path([[26, 51, 3], [40, 46.5, 3]]), PGRAY.rim);
    s.paintIn(arc, ell(36, 50, 4, 2.4), PD.hi);
    s.fill(path([[20, 56, 3.4], [16, 62, 2.8]]), PD);
    // pés vermelhos batendo
    s.fill(ell(55, 37, 2.6, 1.7), ramp('#E86A3A', { ol: '#4A1A12' }), { n: 1 });
    s.dots('#E86A3A', [52, 36], [58, 38]);
    water(s, 28, 22, f, 2);
    s.dots('#E8FCFF', [12, 55], [10, 52], [14, 50]);
  } else {
    // só o dorso e o topete aparecem, com anéis na água e bolhas subindo
    s.fill(path([[40, 56, 4], [46, 55, 3.4], [51, 53, 2]]), PD);
    s.fill(path([[24, 57, 3], [34, 54.5, 5], [42, 55, 4]]), PGRAY);
    s.paintIn(path([[24, 57, 3], [34, 54.5, 5], [42, 55, 4]]), rect(26, 56, 18, 3), PGRAY.sh);
    water(s, 32, 17, f, 5);
    for (const [x, y] of [[13, 50], [11, 44], [15, 38], [10, 33]] as Pt[]) {
      s.paint(ell(x, y, 2 - y / 50, 2 - y / 50), '#C8F6FF');
      s.put(x - 0.5, y - 0.5, '#FFFFFF');
    }
    s.dots('#E8FCFF', [6, 58], [54, 58]);
  }
};

// ------------------------------------------------------------------ coruja-buraqueira
const OW = ramp('#AA8860', { hi: '#CEAA7C', rim: '#F0D6A4', sh: '#7C5A48', dp: '#503A44', ol: '#24161E' });
const OWDK = ramp('#6A4E3A', { hi: '#8E7050', rim: '#BE9E78', sh: '#4A3234', dp: '#30202C', ol: '#160C16' });
const OCR = ramp('#F2EAD6', { hi: '#FFFFFF', sh: '#D2C4AC', dp: '#9C8890', ol: '#3A2C34' });
const OBILL = ramp('#E8D890', { hi: '#FFF4C0', sh: '#B8A460', dp: '#7A6A4A', ol: '#2E2418' });

const OWL_WING: WingSpec = {
  S: [38, 33],
  S2: [38, 42],
  feathers: [[27, -0.45], [30, -0.22], [30, 0], [27, 0.24], [22, 0.46]],
  outer: OWDK,
  bands: [[18, OW]],
  sep: OWDK.dp,
};

export const buraqueira: Drawer = (s, f) => {
  const fly = f >= 2;
  const a = flapAngles(f, -1.0, 0.7);
  const dy = fly ? a.dy : f === 1 ? 1 : 0;
  if (fly) {
    drawWing(s, OWL_WING, a.l, -1);
    drawWing(s, OWL_WING, a.r, 1);
  }
  // cauda curta e barrada
  const tail = poly([[27, 50 + dy], [37, 50 + dy], [38, 61], [26, 61]]);
  s.fill(tail, OW);
  for (const y of [54, 57, 60]) s.paintIn(tail, rect(0, y, 64, 1), OWDK.md);
  // pernas compridas e emplumadas de claro
  for (const sx of [-1, 1]) {
    const x = 32 + sx * 4.6;
    s.fill(cap(x, 47 + dy, 3, x, 56, 2.2), OCR);
    s.paintIn(cap(x, 47 + dy, 3, x, 56, 2.2), rect(0, 52, 64, 1), OCR.sh);
    s.fill(ell(x, 57.6, 3.6, 1.6), ramp('#D8CCA8', { ol: '#3A2C26' }), { n: 1 });
    s.dots('#3A2C26', [x - 2, 59], [x, 59.4], [x + 2, 59]);
  }
  // corpo roliço, pintado de branco; barriga clara barrada
  const body = ell(32, 41 + dy, 11, 12.5);
  s.fill(body, OW);
  s.fill(ell(32, 45 + dy, 7.6, 8.5), OCR, { ol: false, rim: false });
  for (let y = 40; y < 53; y += 3) s.paintIn(body, rect(26, y + dy, 12, 1), OW.sh);
  for (const [x, y] of [[23, 36], [26, 42], [22, 43], [40, 37], [43, 42], [38, 33], [24, 33], [41, 47], [23, 48]] as Pt[]) s.dots(OCR.md, [x, y + dy], [x + 1, y + dy]);
  if (!fly) {
    for (const sx of [-1, 1]) {
      const w = ell(32 + sx * 9, 41 + dy, 3.6, 9);
      s.fill(w, OW);
      s.dots(OCR.md, [32 + sx * 9, 36 + dy], [32 + sx * 9.5, 40 + dy], [32 + sx * 8.5, 44 + dy]);
    }
  }
  // cabeça larga e achatada, sem orelhas; disco facial
  const hy = 26 + dy;
  const head = ell(32, hy, 11.5, 8.6);
  s.fill(head, OW);
  s.fill(ell(32, hy + 1.5, 9.4, 6.6), ramp('#C8A878', { hi: '#E0C498', sh: '#9C7A5E', dp: '#6A4E50', ol: '#3A2630' }), { ol: false, rim: false });
  s.dots(OCR.md, [24, hy - 5], [27, hy - 7], [37, hy - 7], [40, hy - 5], [32, hy - 7]);
  // sobrancelhas brancas bravas e olhos amarelos grandes
  for (const sx of [-1, 1]) {
    s.paint(poly([[32 + sx * 2, hy - 4], [32 + sx * 12, hy - 7.5], [32 + sx * 12, hy - 5.2], [32 + sx * 4, hy - 1.2]]), OCR.hi);
    eye(s, 32 + sx * 5.6 - 3, hy - 3.4, 6, 6, '#F4D030', f === 1);
  }
  // bico pequeno e claro, babador branco
  s.fill(poly([[30, hy + 2.5], [34, hy + 2.5], [33, hy + 6], [31, hy + 6]]), OBILL);
  s.dots(INK, [31.5, hy + 5]);
  s.fill(ell(32, hy + 9.5, 4.6, 1.8), OCR, { ol: false, rim: false });
};
