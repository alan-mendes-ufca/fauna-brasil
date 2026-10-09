import { ramp } from '../../art/animals/kit';
import { cap, ell, eye, path, poly, rect, uni } from '../../art/wildlife/kit';
import { far, flyer, gait, type OwDrawer, owSprite, quad } from '../../art/wildlife/parts';

// Fauna do Cerrado na exploração (32×32, vista de cima 3/4, olhando para a direita, base em y = 28).

const INKC = '#150b26';
const LG = ramp('#CC7A32', { hi: '#E8A258', rim: '#FFDCA4', sh: '#A04E30', dp: '#5E2E36', ol: '#2A1420' });
const BLK = ramp('#2C2428', { hi: '#4C4248', rim: '#82767C', sh: '#1C161A', dp: '#100A10', ol: '#06040A' });
const CREAM = ramp('#F4EAD4', { hi: '#FFFFFF', sh: '#D2C2A8', dp: '#A08C90', ol: '#4A3438' });

// ------------------------------------------------------------------ lobo-guará (grande, pula)
export const loboguara: OwDrawer = owSprite({ cx: 14, w: 20 }, (s, f) => {
  const g = gait(f);
  const t = f === 1 ? 0.5 : 0;
  s.fill(path([[6, 14, 1.6], [3.5, 17, 1.4], [3, 20 + t, 1.2]]), LG);
  const body = quad(s, f, { r: BLK, legs: [8, 18], legTop: 17, lr: 1.1, stride: 1.7, foot: BLK.hi, b: [13, 14.5, 8, 3.8] });
  s.paintIn(body, rect(0, 0, 40, 32), LG.md);
  s.paint(uni(ell(13, 13.3, 7, 1.6)), LG.hi);
  s.paintIn(body, rect(8, 17, 10, 1.6), CREAM.sh);
  // pescoço com juba negra, cabeça de focinho longo e orelhas enormes
  s.fill(cap(19, 13, 2.6, 22, 8.5 - (g ? 0.5 : 0), 2.1), LG);
  s.fill(poly([[17, 10], [21, 7], [22.5, 10], [19, 14]]), BLK);
  const hy = 8 + (g ? -0.5 : 0);
  s.fill(poly([[21, hy - 1], [21.5, hy - 6], [24.5, hy - 2]]), LG);
  s.put(22, hy - 3, '#3A2228');
  s.fill(ell(24, hy + 0.5, 2.8, 2.4), LG);
  s.fill(cap(25.5, hy + 1.2, 1.5, 29, hy + 2.2, 1), BLK);
  s.put(29, hy + 2, '#0E080C');
  s.paint(ell(24.5, hy + 2.4, 1.5, 0.7), CREAM.md);
  eye(s, 25, hy - 0.6, false, INKC, f === 1);
});

// ------------------------------------------------------------------ tamanduá-bandeira (grande, calmo)
const TG = ramp('#8C8278', { hi: '#B2A89A', rim: '#E2D8C8', sh: '#645A62', dp: '#443A44', ol: '#1C121A' });
const TLEG = ramp('#D8CCBA', { hi: '#F2EADA', sh: '#A89C8E', dp: '#6C6068', ol: '#2A1C26' });
export const tamandua: OwDrawer = owSprite({ cx: 15, w: 24 }, (s, f) => {
  const g = gait(f);
  const t = f === 1 ? 0.5 : 0;
  // cauda peluda e enorme, arrastando para trás
  s.fill(poly([[9, 13], [4, 16 + t], [0.5, 22], [1, 26], [6, 26.5], [11, 23]]), TG);
  s.dots(TG.dp, [4, 22], [6, 24], [3, 19]);
  s.dots(TG.rim, [6, 15], [9, 13]);
  const body = quad(s, f, { r: TG, legs: [11, 19], legTop: 21, lr: 1.6, stride: 1.3, foot: TLEG.md, b: [15, 17, 8, 4.2] });
  // faixa preta diagonal com borda clara
  s.paintIn(body, poly([[17, 12], [22, 12], [22, 18], [19, 20]]), CREAM.md);
  s.paintIn(body, poly([[18, 13], [22, 13], [22, 17], [19.5, 19]]), BLK.md);
  s.dots(TG.hi, [10, 14], [13, 13], [8, 16]);
  // cabeça e focinho finos, longos, que farejam
  const hy = 16 + (g ? 0.5 : 0) + (f === 1 ? 0.5 : 0);
  s.fill(ell(22, hy, 2.6, 2.4), TG);
  s.fill(path([[22.5, hy + 0.5, 1.8], [27, hy + 2.2, 1.1], [30.5, hy + 4, 0.8]]), TG);
  s.put(22, hy - 1, INKC);
  s.put(30.5, hy + 4, BLK.md);
  s.dots(TLEG.hi, [20, 24], [21, 24]);
});

// ------------------------------------------------------------------ tatu-canastra (grande, casco)
const AS = ramp('#5E4E48', { hi: '#86766A', rim: '#B8A894', sh: '#403038', dp: '#2A1E28', ol: '#120A14' });
const ASK = ramp('#B6A692', { hi: '#D8CAB0', rim: '#F2E6D0', sh: '#8A7A74', dp: '#5A4A54', ol: '#241A22' });
export const tatucanastra: OwDrawer = owSprite({ cx: 15, w: 22 }, (s, f) => {
  const g = gait(f);
  const t = f === 1 ? 0.5 : 0;
  s.fill(path([[7, 22, 1.8], [3, 25, 1.2], [0.5, 27, 0.8]]), ASK);
  const body = quad(s, f, { r: ASK, legs: [9, 19], legTop: 22, lr: 1.7, stride: 1.2, foot: '#F2EAD6', b: [14, 20 + t, 8.5, 5.4] }, undefined);
  // carapaça escura em domo, faixa clara embaixo
  const dome = uni(ell(13.5, 19.6 + t, 9.5, 6.6));
  s.fill(dome, AS);
  s.paintIn(dome, rect(0, 22.6 + t, 32, 6), CREAM.sh);
  for (const x of [8, 11, 14, 17, 20]) s.paintIn(dome, rect(x, 14, 0.6, 9), AS.dp);
  s.dots(AS.rim, [9, 14 + t], [13, 13.5 + t], [17, 14.2 + t]);
  void body;
  // cabeça pequena e garras enormes
  const hy = 22.5 + t + (g ? 0.5 : 0);
  s.fill(ell(24, hy, 2.6, 2.2), ASK);
  s.fill(cap(25.5, hy + 0.8, 1.4, 29, hy + 1.8, 0.8), ASK);
  s.put(24.5, hy - 0.8, INKC);
  s.put(22.4, hy - 2.4, AS.md);
  s.dots('#F6EEDC', [24, 27], [25, 27], [26, 27.4]);
});

// ------------------------------------------------------------------ seriema (média, bote)
const SER = ramp('#A89A88', { hi: '#C8BCA8', rim: '#EDE2CC', sh: '#7C6E6E', dp: '#554858', ol: '#241A28' });
const SDARK = ramp('#5A4A44', { hi: '#7E6C62', sh: '#3E3238', dp: '#2A2030', ol: '#120C18' });
const SRED = ramp('#E0503C', { hi: '#FF8060', sh: '#B02E34', dp: '#701C30', ol: '#2E0C1A' });
export const seriema: OwDrawer = owSprite({ cx: 14, w: 14 }, (s, f) => {
  const g = gait(f);
  const t = f === 1 ? 0.5 : 0;
  // cauda longa e barrada
  const tail = poly([[10, 15], [3, 19 + t], [2, 21.5], [10, 18.5]]);
  s.fill(tail, SDARK);
  s.dots(CREAM.md, [4, 20], [6, 19]);
  // pernas finas e vermelhas
  const leg = (x: number, dx: number, r: typeof SRED) => { s.fill(cap(x, 19, 0.8, x + dx, 26.6, 0.7), r); s.dots(r.md, [x + dx + 1, 27]); };
  leg(14, -g * 1.4, { ...SRED, md: SRED.sh });
  leg(16.5, g * 1.4, SRED);
  const body = ell(14, 15 + t, 5.6, 4.4);
  s.fill(body, SER);
  s.paintIn(body, ell(16, 17, 3.5, 2), CREAM.md);
  s.paintIn(body, ell(12, 15.5, 3.5, 2.4), SER.sh);
  // pescoço ereto, cabeça com penacho e bico vermelho ganchudo
  s.fill(cap(18, 12, 1.8, 20, 7, 1.5), SER);
  s.fill(ell(20.5, 6, 2.4, 2.1), SER);
  s.dots(SDARK.md, [19, 3.5], [20, 3.2], [18, 4.2]);
  s.fill(poly([[22, 5.5], [25.5, 6.5], [24.5, 8.5], [22, 7.5]]), SRED);
  eye(s, 21, 5, false, '#F4E08A');
  s.put(21.4, 5.2, INKC);
});

// ------------------------------------------------------------------ ema (grande, calmo)
const EM = ramp('#A09080', { hi: '#C4B6A2', rim: '#EDE0CA', sh: '#766A6C', dp: '#54485A', ol: '#241A28' });
const EDK = ramp('#4A4038', { hi: '#6E6256', sh: '#322830', dp: '#221A26', ol: '#0E0A14' });
export const ema: OwDrawer = owSprite({ cx: 14, w: 22 }, (s, f) => {
  const g = gait(f);
  const t = f === 1 ? 0.5 : 0;
  const leg = (x: number, dx: number, r: typeof EM) => { s.fill(cap(x, 19, 1.5, x + dx, 26.6, 0.8), r); s.dots('#B8A8A0', [x + dx - 1, 27], [x + dx, 27], [x + dx + 1, 27]); };
  leg(11, g * 1.8, far(EM));
  leg(16, -g * 1.8, far(EM));
  leg(10, -g * 1.8, EM);
  leg(15, g * 1.8, EM);
  const body = uni(ell(13, 16 + t, 8.5, 5.2), ell(9, 14.5 + t, 5, 4.6));
  s.fill(body, EM);
  s.dots(EM.hi, [8, 12 + t], [12, 11.5 + t], [16, 12.5 + t], [6, 15 + t]);
  s.dots(EM.sh, [10, 19], [14, 19.5], [18, 18]);
  // pescoço comprido, mancha escura na base, cabeça pequena de bico achatado
  s.fill(path([[19, 13 + t, 2.3], [21, 8, 1.4], [22.5, 4.5 + (f === 1 ? 0.4 : 0), 1.3]]), EM);
  s.paintIn(body, ell(18, 12.5, 3, 3), EDK.md);
  s.fill(ell(23.5, 3.5, 2, 1.7), EM);
  s.fill(poly([[25, 3], [28.5, 4], [28, 5.2], [25, 5]]), ramp('#B8A8A0', { ol: '#2A1C2C' }));
  eye(s, 23, 2.8, false, INKC);
});

// ------------------------------------------------------------------ arara-canindé (média, voa)
const BLUE = ramp('#2E82DC', { hi: '#5CB0F4', rim: '#C0ECFF', sh: '#1E54B0', dp: '#143482', ol: '#081240' });
const BLUE_DK = ramp('#1E5CC0', { hi: '#3E88E0', rim: '#9CD0F8', sh: '#143C94', dp: '#0E2468', ol: '#060E36' });
const YEL = ramp('#F4C418', { hi: '#FFE450', rim: '#FFF6B0', sh: '#D08A18', dp: '#8E4E22', ol: '#3A1E14' });
const MBILL = ramp('#2E2C34', { hi: '#5E5A68', ol: '#08060E' });

export const canide: OwDrawer = owSprite({ cx: 15, w: 12, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    { body: YEL, wing: BLUE_DK, b: [15, 14, 4.6, 2.8], sh: [16, 13], span: 9, chord: 5, bands: [[3.4, YEL.md]] },
    (dy) => {
      const tail = path([[11, 15 + dy, 1.5], [6, 17 + dy, 1.2], [1.5, 19 + dy, 0.8]]);
      s.fill(tail, BLUE);
      s.paintIn(tail, rect(0, 0, 6, 32), BLUE_DK.md);
    },
    (dy) => {
      s.fill(ell(20, 12.5 + dy, 2.8, 2.6), ramp('#8CC03A', { hi: '#B4E060', sh: '#5E9A2E', dp: '#356A2A', ol: '#102A1A' }));
      s.paint(ell(21, 13.3 + dy, 1.6, 1.3), '#F6F0E4');
      s.fill(poly([[21.5, 11.5 + dy], [24.5, 12 + dy], [24.5, 14.5 + dy], [23, 15.5 + dy], [21.5, 14 + dy]]), MBILL);
      s.put(21, 12.2 + dy, INKC);
    },
  );
});

// ------------------------------------------------------------------ tucano-toco (médio, pula)
const TK = ramp('#2A2430', { hi: '#4C4458', rim: '#7E7690', sh: '#1A141E', dp: '#100A14', ol: '#06040A' });
const TBILL = ramp('#F48A22', { hi: '#FFBE50', rim: '#FFE49A', sh: '#C85A1E', dp: '#8A3820', ol: '#3A1A14' });
export const tucano: OwDrawer = owSprite({ cx: 14, w: 12 }, (s, f) => {
  const hop = f === 3 ? -3 : 0;
  const cr = f === 2 ? 1 : 0;
  const b = f === 1 ? 0.5 : 0;
  s.fill(path([[10, 20 + hop + cr, 1.8], [7, 24 + hop, 1.4], [6, 26 + hop * 0.3, 1.2]]), TK);
  for (const x of [12, 15]) s.fill(cap(x, 22 + hop, 0.8, x, 26.5 + (hop ? hop * 0.2 : 0), 0.7), ramp('#7E8CA0', { ol: '#1C2236' }));
  const body = ell(14, 17 + hop + cr + b, 5, 5.8);
  s.fill(body, TK);
  s.paintIn(body, ell(12, 17 + hop, 2.6, 4), TK.hi);
  s.paint(ell(9.5, 21 + hop + cr, 1.4, 1), CREAM.md);
  s.fill(ell(18.5, 14 + hop + cr, 2.6, 2.8), CREAM, { ol: false, rim: false });
  const hy = 9.5 + hop + cr + b;
  s.fill(ell(19, hy, 3, 2.8), TK);
  const lift = f === 3 ? 2 : 0;
  const bill = poly([[21, hy - 1.5], [26, hy - 1.5 - lift], [30.5, hy + 0.5 - lift], [30.5, hy + 2.6 - lift], [26, hy + 3 - lift * 0.5], [21, hy + 2.4]]);
  s.fill(bill, TBILL);
  s.paintIn(bill, ell(30, hy + 1.5 - lift, 1.4, 1.5), TK.md);
  s.paintIn(bill, rect(21, hy - 1.5, 5, 1), TBILL.rim);
  s.paint(ell(19.5, hy - 0.6, 1.5, 1.4), '#4C9AD8');
  s.put(19.5, hy - 0.6, '#150b26');
});

// ------------------------------------------------------------------ pato-mergulhão (médio, mergulha)
const PD = ramp('#2A3C38', { hi: '#4E6E5E', rim: '#8EB4A0', sh: '#1A2A2E', dp: '#10181E', ol: '#060C10' });
const PGRAY = ramp('#B4B0AA', { hi: '#DAD6CE', rim: '#F4F0E8', sh: '#8A8490', dp: '#5E5868', ol: '#241E2C' });
const PBILL = ramp('#E04630', { hi: '#FF7A58', sh: '#B02A30', dp: '#701A2E', ol: '#300C1A' });
export const patomergulhao: OwDrawer = owSprite(null, (s, f) => {
  const dive = f >= 2;
  const b = f === 1 ? 0.5 : 0;
  const by = dive ? 25 : 24.5;
  s.fill(poly([[7, by - 2], [2, by - 3.5], [3, by - 0.5], [7, by]]), PD);
  const body = ell(13, by, 7, dive ? 2.2 : 3.2);
  s.fill(body, PGRAY);
  s.dots(PGRAY.sh, [9, by - 1], [12, by - 0.5], [15, by - 1]);
  if (!dive) {
    s.paintIn(body, rect(11, by, 4, 1), '#F2F0EA');
    s.fill(path([[18, by - 1, 1.6], [20, 17 - b, 1.2], [20.5, 14.5 - b, 1.2]]), PD);
    const hy = 14 - b;
    s.fill(ell(21, hy, 2.4, 2), PD);
    for (const [dx, dy] of [[-3, -1.5], [-4.5, 0], [-4, 1.5]]) s.line(20, hy, 20 + dx, hy + dy, PD.md);
    s.fill(poly([[23, hy - 0.6], [27.5, hy], [27.5, hy + 1.2], [23, hy + 1.4]]), PBILL);
    s.put(22, hy - 0.5, '#fff');
  } else {
    // só o topete e o dorso fora d'água
    s.dots(PD.md, [20, 24 + (f === 3 ? 1 : 0)], [19, 25]);
    s.dots('#C8F6FF', [22, 21 - b * 2], [24, 18]);
  }
}, { cx: 14, w: 16, y: 27 });

// ------------------------------------------------------------------ raposinha-do-campo (média, pula)
const RP = ramp('#A8998A', { hi: '#C8BAA8', rim: '#EBDDC6', sh: '#7C6E70', dp: '#524656', ol: '#241A28' });
const RBUFF = ramp('#E4B77C', { hi: '#F6D4A0', sh: '#B88260', dp: '#7A5260', ol: '#3A2430' });
export const raposinha: OwDrawer = owSprite({ cx: 14, w: 14 }, (s, f) => {
  const hop = f === 3 ? -3 : 0;
  s.fill(path([[8, 19 + hop, 2], [4, 19.5 + hop, 2], [1.5, 21 + hop, 1.6]]), RP);
  s.paint(ell(2, 21 + hop, 1.5, 1.4), '#2E262C');
  if (f === 3) {
    s.fill(cap(10, 21 + hop, 1.1, 7, 23 + hop, 0.9), RBUFF);
    s.fill(cap(18, 21 + hop, 1, 21, 23 + hop, 0.8), RBUFF);
  }
  const body = quad(s, f === 3 ? 0 : f, { r: RBUFF, legs: [10, 18], legTop: 21, lr: 1.2, stride: 1.2, b: [14, 19 + hop, 6.5, 3.4] });
  s.paintIn(body, rect(0, 0, 40, 20 + hop), RP.md);
  s.paintIn(body, rect(0, 0, 40, 17.2 + hop), RP.hi);
  s.paintIn(body, rect(0, 0, 40, 15.7 + hop), RP.md);
  // cabeça de focinho curto, orelhonas ocres
  const hy = 16 + hop + (f === 1 ? 0.5 : 0);
  s.fill(poly([[17, hy - 1], [17.5, hy - 5.5], [20.5, hy - 2]]), RBUFF);
  s.fill(ell(21, hy + 0.5, 3, 2.5), RP);
  s.fill(cap(22.5, hy + 1.2, 1.6, 25.5, hy + 2, 1), RBUFF);
  s.put(25.8, hy + 1.6, '#1E161C');
  eye(s, 21.5, hy - 0.6, false, '#B0702E', f === 1);
});

// ------------------------------------------------------------------ jiboia (média, bote)
const JB = ramp('#A88458', { hi: '#C8A474', rim: '#EDD6A0', sh: '#7C5A46', dp: '#503A44', ol: '#22141C' });
export const jiboia: OwDrawer = owSprite({ cx: 15, w: 20 }, (s, f) => {
  const moving = f >= 2;
  if (!moving) {
    const b = f === 1 ? 0.5 : 0;
    // rodilha com a cabeça apoiada no alto
    for (const [cx, cy, rx, ry] of [[14, 24, 10, 3], [14, 21, 8, 2.6]] as number[][]) {
      const c = ell(cx, cy, rx, ry);
      s.fill(c, JB);
      for (let x = cx - rx + 3; x < cx + rx - 1; x += 5) s.paintIn(c, rect(x, cy - 1.4, 2, 1.4), '#6A3A2A');
    }
    s.fill(path([[22, 21, 1.6], [24, 18 - b, 1.5], [25, 15.5 - b, 1.5]]), JB);
    const head = poly([[23.5, 13.5 - b], [27, 13 - b], [29.5, 14.5 - b], [27.5, 16.5 - b], [23.5, 16.5 - b]]);
    s.fill(head, JB);
    s.put(26.5, 14.2 - b, '#D8A83A');
    s.put(27, 14.2 - b, '#150b26');
    s.line(24, 14 - b, 27, 15 - b, '#3A2220');
    s.dots('#A8452E', [8, 25], [5, 25.5], [4, 26]);
  } else {
    const ph = f === 2 ? 0 : Math.PI;
    const pts: [number, number, number][] = [];
    for (let x = 3; x <= 24; x += 1.6) {
      const t = (x - 3) / 21;
      pts.push([x, 24 + Math.sin(x * 0.5 + ph) * 2, t < 0.2 ? 0.8 + t * 5 : 1.8]);
    }
    const body = path(pts);
    s.fill(body, JB);
    for (let i = 2; i < pts.length - 1; i += 2) s.paint(rect(pts[i][0] - 0.5, pts[i][1] - 1, 1.2, 1), '#6A3A2A');
    s.dots('#A8452E', [pts[0][0], pts[0][1]], [pts[1][0], pts[1][1]]);
    const [hx, hy] = pts[pts.length - 1];
    s.fill(poly([[hx - 0.5, hy - 1.8], [hx + 3, hy - 1.6], [hx + 5.5, hy], [hx + 3, hy + 1.8], [hx - 0.5, hy + 1.8]]), JB);
    s.put(hx + 3, hy - 0.6, '#D8A83A');
    s.put(hx + 3.4, hy - 0.4, '#150b26');
    if (f === 3) s.dots('#D8344E', [hx + 6, hy + 0.5], [hx + 7, hy], [hx + 7, hy + 1]);
  }
});

// ------------------------------------------------------------------ coruja-buraqueira (pequena, voa)
const OW = ramp('#AA8860', { hi: '#CEAA7C', rim: '#F0D6A4', sh: '#7C5A48', dp: '#503A44', ol: '#24161E' });
const OWDK = ramp('#6A4E3A', { hi: '#8E7050', rim: '#BE9E78', sh: '#4A3234', dp: '#30202C', ol: '#160C16' });
export const buraqueira: OwDrawer = owSprite({ cx: 15, w: 9, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    { body: OW, wing: OWDK, tip: OWDK, b: [15, 14, 3.8, 2.6], sh: [16, 13], span: 7, chord: 4, bands: [[2.4, OW.md]] },
    (dy) => {
      const tail = poly([[12, 13 + dy], [12, 16 + dy], [8, 16.5 + dy], [8, 13.5 + dy]]);
      s.fill(tail, OW);
      s.dots(OWDK.md, [9.5, 14 + dy], [10.5, 15 + dy]);
    },
    (dy) => {
      s.fill(ell(19.5, 12.5 + dy, 2.8, 2.4), OW);
      s.dots(CREAM.md, [18, 10.8 + dy], [19.5, 10.6 + dy]);
      s.paint(ell(20.6, 12.4 + dy, 1.2, 1.2), '#F4D030');
      s.put(21, 12.4 + dy, INKC);
      s.put(22.5, 13.8 + dy, '#E8D890');
    },
  );
});

// ------------------------------------------------------------------ vaga-lume-do-cupinzeiro (pequeno, calmo)
// Cupinzeiro com a larva espiando e pontinhos verdes acesos; a luz pulsa de um quadro para o outro.
const DIRT = ramp('#8A5E3E', { hi: '#AC7C54', rim: '#D8AC7C', sh: '#5E3E3A', dp: '#3E2A34', ol: '#1A1018' });
export const vagalume: OwDrawer = owSprite({ cx: 16, w: 14 }, (s, f) => {
  const on = f % 2 === 1;
  const mound = poly([[6, 28], [8, 22], [12, 15], [16, 10], [20, 15], [24, 22], [26, 28]]);
  s.fill(mound, DIRT);
  s.paintIn(mound, rect(15, 11, 0.6, 12), DIRT.sh);
  s.paintIn(mound, rect(11, 18, 0.6, 9), DIRT.sh);
  s.dots(DIRT.rim, [14, 11], [10, 17], [20, 17]);
  const c = on ? '#E8FFC0' : '#7AE86A';
  for (const [x, y] of [[12, 22], [20, 20], [16, 16], [9, 26], [23, 26]] as [number, number][]) {
    s.put(x, y, DIRT.ol);
    s.put(x, y + 1, c);
  }
  s.paint(ell(16, 24, 2.6, 2), '#2A1A22');
  s.dots('#9CFF6A', [15, 23], [17, 23]);
  s.dots(on ? '#E8FFC0' : '#9CFF6A', [15, 24 - (f >= 2 ? 1 : 0)], [17, 24 - (f >= 2 ? 1 : 0)]);
  if (on) s.dots('rgba(156,255,106,0.55)', [14, 22], [18, 22], [16, 21], [10, 22], [22, 20]);
});

export const OW_DRAWERS: Record<string, OwDrawer> = {
  loboguara, tamandua, tatucanastra, seriema, ema, canide, tucano, patomergulhao, raposinha, jiboia, buraqueira, vagalume,
};
