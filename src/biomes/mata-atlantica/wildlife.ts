import { ramp } from '../../art/animals/kit';
import { cap, ell, path, poly, rect, sub, uni } from '../../art/wildlife/kit';
import { flyer, gait, type OwDrawer, owSprite, quad } from '../../art/wildlife/parts';

// Fauna da Mata Atlântica na exploração (32×32, vista de cima 3/4, olhando para a direita, base em y = 28).

const INKC = '#150b26';

// ------------------------------------------------------------------ mico-leão-dourado (pequeno, pula)
const GOLD = ramp('#F08A24', { hi: '#FFB046', rim: '#FFE29A', sh: '#C8561E', dp: '#8A3220', ol: '#3A1418' });
const MANE = ramp('#FFA52E', { hi: '#FFC858', rim: '#FFEDB0', sh: '#D8681E', dp: '#9A3E20', ol: '#3A1418' });
const DARK = ramp('#5A3A34', { hi: '#7E5648', rim: '#B08470', sh: '#3E262C', dp: '#2A1822', ol: '#140A12' });

export const micoleao: OwDrawer = owSprite({ cx: 14, w: 14 }, (s, f) => {
  const hop = f === 3 ? -2 : 0;
  const t = f === 1 ? 0.5 : 0;
  // cauda longa que sobe na ponta
  s.fill(path([[8, 20 + hop, 1.3], [4, 22 + hop, 1.2], [2, 18 + hop - t, 1.1], [3, 14 + hop - t, 1]]), GOLD);
  const body = quad(s, f === 3 ? 0 : f, { r: GOLD, legs: [10, 17], legTop: 22 + hop, lr: 1.1, stride: 1.4, foot: DARK.md, b: [13.5, 20 + hop, 6, 3.4] });
  s.paintIn(body, ell(14, 21.4 + hop, 4, 1.4), GOLD.hi);
  // juba grande em volta do rosto escuro
  const hy = 17 + hop + (f === 1 ? 0.5 : 0);
  s.fill(ell(19.5, hy, 5, 4.8), MANE);
  s.dots(MANE.rim, [17, hy - 3], [19, hy - 4], [21, hy - 3]);
  s.fill(ell(22, hy + 0.8, 2.6, 2.3), DARK);
  s.put(23, hy + 0.2, '#ffffff');
  s.put(22.2, hy + 0.2, INKC);
  s.put(24, hy + 1.6, INKC);
});

// ------------------------------------------------------------------ muriqui-do-sul (grande, calmo)
const MUR = ramp('#B8A27A', { hi: '#D8C69C', rim: '#F4E8C8', sh: '#8A7660', dp: '#5E4C48', ol: '#2A1E26' });
const MFACE = ramp('#4A3A3A', { hi: '#6E5A52', rim: '#A08C7C', sh: '#322628', dp: '#221A22', ol: '#100A12' });

export const muriqui: OwDrawer = owSprite({ cx: 15, w: 22 }, (s, f) => {
  const g = gait(f);
  const t = f === 1 ? 0.5 : 0;
  // cauda comprida que enrola atrás
  s.fill(path([[8, 15, 2], [4, 17 + t, 1.8], [2, 22, 1.6], [4, 26, 1.4], [8, 26.5, 1.1]]), MUR);
  const body = quad(s, f, { r: MUR, legs: [9, 19], legTop: 20, lr: 2, stride: 1.4, foot: MFACE.md, b: [14, 17, 9, 6] });
  s.paintIn(body, ell(15, 19, 6, 3.4), ramp('#D8C8A0').hi);
  s.dots(MUR.hi, [9, 13], [13, 12], [17, 13], [7, 16]);
  // braço do lado de cá, comprido
  s.fill(cap(18, 15, 2, 21 - g, 23, 1.6), MUR);
  s.dots(MFACE.md, [21 - g, 24], [22 - g, 24]);
  // cabeça redonda com a cara escura
  const hy = 11 + t + (g ? -0.5 : 0);
  s.fill(ell(22, hy, 4.8, 4.6), MUR);
  s.dots(MUR.rim, [20, hy - 4], [22, hy - 4.5]);
  s.fill(ell(24, hy + 1, 3, 3), MFACE);
  s.put(25, hy + 0.2, '#ffffff');
  s.put(24.2, hy + 0.2, INKC);
  s.put(26, hy + 2.6, '#D89A94');
});

// ------------------------------------------------------------------ tucano-de-bico-verde (médio, pula)
const TK = ramp('#2A2430', { hi: '#4C4458', rim: '#7E7690', sh: '#1A141E', dp: '#100A14', ol: '#06040A' });
const TYEL = ramp('#F4D03A', { hi: '#FFEC70', rim: '#FFF8C0', sh: '#D0982A', dp: '#8E5A24', ol: '#3A2214' });
const TBILL = ramp('#8CC03A', { hi: '#B8E060', rim: '#E4FFA0', sh: '#5E9A2E', dp: '#356A2A', ol: '#122A18' });
export const tucanoverde: OwDrawer = owSprite({ cx: 14, w: 12 }, (s, f) => {
  const hop = f === 3 ? -3 : 0;
  const cr = f === 2 ? 1 : 0;
  const b = f === 1 ? 0.5 : 0;
  s.fill(path([[10, 20 + hop + cr, 1.8], [7, 24 + hop, 1.4], [6, 26 + hop * 0.3, 1.2]]), TK);
  s.dots('#D8322B', [9, 22 + hop]);
  for (const x of [12, 15]) s.fill(cap(x, 22 + hop, 0.8, x, 26.5 + (hop ? hop * 0.2 : 0), 0.7), ramp('#7E8CA0', { ol: '#1C2236' }));
  const body = ell(14, 17 + hop + cr + b, 5, 5.8);
  s.fill(body, TK);
  s.paintIn(body, ell(12, 17 + hop, 2.6, 4), TK.hi);
  s.fill(ell(18.5, 14 + hop + cr, 2.6, 2.8), TYEL, { ol: false, rim: false });
  const hy = 9.5 + hop + cr + b;
  s.fill(ell(19, hy, 3, 2.8), TK);
  const lift = f === 3 ? 2 : 0;
  const bill = poly([[21, hy - 1.5], [26, hy - 1.5 - lift], [30.5, hy + 0.5 - lift], [30.5, hy + 2.6 - lift], [26, hy + 3 - lift * 0.5], [21, hy + 2.4]]);
  s.fill(bill, TBILL);
  s.paintIn(bill, ell(30, hy + 1.5 - lift, 1.4, 1.5), TK.md);
  s.paintIn(bill, rect(21, hy - 1.5, 2, 5), '#E0502A');
  s.paint(ell(19.5, hy - 0.6, 1.5, 1.4), '#4C9AD8');
  s.put(19.5, hy - 0.6, INKC);
});

// ------------------------------------------------------------------ saíra-sete-cores (pequena, voa)
const SBLUE = ramp('#2E9AD8', { hi: '#62C8F4', rim: '#C0F0FF', sh: '#1E68B0', dp: '#14408A', ol: '#081A44' });
const SBLK = ramp('#242030', { hi: '#463E58', rim: '#7A708C', sh: '#16121E', dp: '#0E0A14', ol: '#06040A' });
const SGRN = ramp('#4CC070', { hi: '#80E896', rim: '#D0FFC8', sh: '#2E9050', dp: '#1A6044', ol: '#08281E' });
export const saira: OwDrawer = owSprite({ cx: 15, w: 8, alpha: 0.5 }, (s, f) => {
  flyer(
    s,
    f,
    { body: SBLUE, wing: SBLK, b: [15, 14, 3.6, 2.7], sh: [16, 13], span: 8, chord: 4.5, bands: [[3.2, SBLUE.md], [2, SGRN.md]] },
    (dy) => s.fill(path([[12, 14.5 + dy, 1], [8, 16 + dy, 0.8], [5, 17 + dy, 0.6]]), SBLK),
    (dy) => {
      s.fill(ell(19, 12.5 + dy, 2.6, 2.4), SGRN);
      s.dots('#F29A28', [18, 10.6 + dy], [19, 10.4 + dy]);
      s.put(20.3, 12.4 + dy, '#E8E4F0');
      s.put(20, 12.4 + dy, INKC);
      s.dots('#8A8490', [22, 13 + dy], [23, 13.4 + dy]);
    },
  );
});

// ------------------------------------------------------------------ jacutinga (média, calma)
const JK = ramp('#2A2830', { hi: '#48465A', rim: '#7C7A92', sh: '#1A1820', dp: '#100E16', ol: '#06040A' });
const JWH = ramp('#F2F0EA', { hi: '#FFFFFF', sh: '#CCC8D0', dp: '#9490A4', ol: '#2E2A3A' });
const JRED = ramp('#D8322B', { hi: '#FF6A4A', sh: '#A01E38', dp: '#620E34', ol: '#2A0A1E' });
export const jacutinga: OwDrawer = owSprite({ cx: 14, w: 14 }, (s, f) => {
  const g = gait(f);
  const t = f === 1 ? 0.5 : 0;
  s.fill(poly([[10, 15], [3, 19 + t], [2, 22], [10, 19]]), JK);
  const leg = (x: number, dx: number, r: typeof JRED) => { s.fill(cap(x, 19, 0.8, x + dx, 26.6, 0.7), r); s.dots(r.md, [x + dx + 1, 27]); };
  leg(14, -g * 1.4, { ...JRED, md: JRED.sh });
  leg(16.5, g * 1.4, JRED);
  const body = ell(14, 15 + t, 6, 4.4);
  s.fill(body, JK);
  s.paintIn(body, ell(12, 15.5, 3.5, 2), JK.hi);
  s.paintIn(body, ell(11.5, 15, 2.6, 1), JWH.md);
  s.fill(cap(18, 12, 1.8, 20, 8, 1.5), JK);
  s.dots(JWH.md, [18, 11], [19, 12]);
  const hy = 6.5 + (g ? 0.5 : 0);
  s.fill(ell(20.5, hy, 2.4, 2.1), JK);
  s.fill(poly([[18, hy - 1.5], [17, hy - 5], [19.5, hy - 2.6], [21, hy - 5.4], [22, hy - 2]]), JWH);
  s.fill(poly([[22.5, hy - 0.5], [25, hy + 0.5], [24.5, hy + 1.6], [22.5, hy + 1.4]]), ramp('#B8B2A8', { ol: '#2E2A30' }));
  s.put(21.4, hy + 3.4, '#D8322B');
  s.put(21.4, hy + 4.4, '#D8322B');
  s.put(21.5, hy - 0.4, '#8CB4F0');
  s.put(21.8, hy - 0.4, INKC);
});

// ------------------------------------------------------------------ sapinho-pingo-de-ouro (pequeno, pula)
const FG = ramp('#F4A818', { hi: '#FFD048', rim: '#FFF0A0', sh: '#D0701E', dp: '#8A3E22', ol: '#3A1A18' });
const FSH = ramp('#E0781E', { hi: '#F8A040', sh: '#B04A20', dp: '#702A24', ol: '#2E1218' });
export const pingodeouro: OwDrawer = owSprite({ cx: 15, w: 9 }, (s, f) => {
  const hop = f === 3 ? -4 : 0;
  const sq = f === 2 ? 1 : 0;
  const b = f === 1 ? 0.5 : 0;
  // perna de trás dobrada (esticada no salto)
  if (f === 3) s.fill(path([[13, 22 + hop, 2], [8, 25 + hop, 1.4], [4, 27 + hop * 0.5, 1]]), FG);
  else s.fill(ell(12.5, 24.2, 3, 2.6), FG);
  s.fill(ell(15, 23.2 + hop + sq * 0.6, 5, 3.6 - sq * 0.4), FG);
  s.paintIn(ell(15, 23.2, 5, 3.6), ell(14, 21.8 + hop, 3.4, 1.7), FSH.md);
  s.dots(FSH.dp, [14, 21 + hop], [14, 23 + hop], [13, 22 + hop], [15, 22 + hop]);
  // cabeça com olhão
  s.fill(ell(19.5, 22 + hop + sq * 0.6, 3, 2.6 + b * 0.2), FG);
  s.paint(ell(20, 20.3 + hop + sq * 0.6, 1.5, 1.4), INKC);
  s.put(20.3, 19.9 + hop + sq * 0.6, '#E8A030');
  s.put(19.6, 19.8 + hop + sq * 0.6, '#ffffff');
  s.fill(cap(18, 25.5 + hop * 0.3, 0.9, 20, 27, 0.7), FG);
  s.dots(FG.rim, [17, 21 + hop]);
});

// ------------------------------------------------------------------ jararaca (média, bote)
const JR = ramp('#8A7A4A', { hi: '#AC9C64', rim: '#D8CC90', sh: '#625238', dp: '#42342E', ol: '#1C1218' });
export const jararaca: OwDrawer = owSprite({ cx: 15, w: 20 }, (s, f) => {
  if (f < 2) {
    const b = f === 1 ? 0.5 : 0;
    for (const [cx, cy, rx, ry] of [[14, 24, 10, 3], [14, 21, 8, 2.6]] as number[][]) {
      const c = ell(cx, cy, rx, ry);
      s.fill(c, JR);
      for (let x = cx - rx + 3; x < cx + rx - 1; x += 4) s.paintIn(c, rect(x, cy - 1.4, 2, 1.6), '#3E2E22');
    }
    s.fill(path([[22, 21, 1.4], [24, 18 - b, 1.3], [25, 15.5 - b, 1.3]]), JR);
    const head = poly([[23, 13.5 - b], [26.5, 12.8 - b], [29.5, 14.5 - b], [27.5, 16.8 - b], [23, 16.6 - b]]);
    s.fill(head, JR);
    s.put(26, 14.2 - b, '#E0B83A');
    s.put(26.4, 14.2 - b, INKC);
    s.line(24, 14.4 - b, 27, 15.4 - b, '#3E2E22');
    s.dots('#B09A5E', [8, 25], [5, 25.5], [4, 26]);
  } else {
    const ph = f === 2 ? 0 : Math.PI;
    const pts: [number, number, number][] = [];
    for (let x = 3; x <= 24; x += 1.6) {
      const t = (x - 3) / 21;
      pts.push([x, 24 + Math.sin(x * 0.5 + ph) * 2, t < 0.2 ? 0.7 + t * 4.5 : 1.5]);
    }
    s.fill(path(pts), JR);
    for (let i = 2; i < pts.length - 1; i += 2) s.paint(rect(pts[i][0] - 0.5, pts[i][1] - 0.8, 1.2, 1), '#3E2E22');
    const [hx, hy] = pts[pts.length - 1];
    s.fill(poly([[hx - 0.5, hy - 1.9], [hx + 3, hy - 1.7], [hx + 5.5, hy], [hx + 3, hy + 1.9], [hx - 0.5, hy + 1.9]]), JR);
    s.put(hx + 3, hy - 0.6, '#E0B83A');
    s.put(hx + 3.4, hy - 0.4, INKC);
    if (f === 3) s.dots('#D8344E', [hx + 6, hy + 0.5], [hx + 7, hy], [hx + 7, hy + 1]);
  }
});

// ------------------------------------------------------------------ ouriço-cacheiro (médio, casco)
const OUR = ramp('#5A4636', { hi: '#7E624A', rim: '#B8946A', sh: '#3E3028', dp: '#2A2022', ol: '#120A10' });
export const ourico: OwDrawer = owSprite({ cx: 14, w: 16 }, (s, f) => {
  const g = gait(f);
  const t = f === 1 ? 0.5 : 0;
  // cauda preênsil
  s.fill(path([[7, 22, 1.6], [3.5, 23.5, 1.3], [2.5, 26, 1.1]]), OUR);
  // espinhos longos, de ponta clara, para cima e para trás
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.95 + (i / 8) * Math.PI * 0.85;
    const x0 = 13 + Math.cos(a) * 5;
    const y0 = 20 + Math.sin(a) * 3;
    const l = 6 + (i % 2) * 2;
    const x1 = 13 + Math.cos(a) * (5 + l);
    const y1 = 20 + Math.sin(a) * (3 + l * 0.8) - t;
    s.line(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2, '#3A2E26');
    s.line((x0 + x1) / 2, (y0 + y1) / 2, x1, y1, '#F0E2A8');
  }
  for (const [x, dx] of [[10, g], [17, -g]] as [number, number][]) s.fill(cap(x, 23, 1.6, x + dx, 26.6, 1.2), OUR);
  const body = ell(13.5, 20.5 + t, 7.4, 5);
  s.fill(body, OUR);
  s.dots('#F0E2A8', [9, 18 + t], [12, 17 + t], [15, 17.5 + t], [18, 19 + t], [10, 21 + t]);
  s.fill(ell(21.5, 22 + t, 3, 2.7), ramp('#4A382E', { hi: '#6E5444', rim: '#A88A6C', sh: '#32241E', ol: '#0E0810' }));
  s.fill(ell(24.4, 23, 1.2, 1.1), ramp('#E8A0A0', { ol: '#2E141E' }));
  s.put(21.8, 21, INKC);
});

// ------------------------------------------------------------------ caranguejo-uçá (pequeno, bote)
const CRB = ramp('#4A7AB8', { hi: '#78A4DC', rim: '#C0DCFF', sh: '#2E4E8E', dp: '#1E3068', ol: '#0A1236' });
const CLEG = ramp('#E87A3A', { hi: '#FFA860', sh: '#B84A2E', dp: '#782A2E', ol: '#321418' });
export const caranguejo: OwDrawer = owSprite({ cx: 15, w: 14 }, (s, f) => {
  const g = gait(f);
  const t = f === 1 ? 0.5 : 0;
  // pernas laterais que alternam; vistas de cima as de cá e as de lá
  for (let i = 0; i < 3; i++) {
    const sw = (i % 2 === 0 ? g : -g) * 1;
    const x = 10 + i * 3.2;
    s.line(x, 22, x - 2 + sw, 27, CLEG.md);
    s.put(x - 2 + sw, 27, CLEG.dp);
    s.line(x + 0.5, 20, x - 1 - sw, 16.5, CLEG.sh);
  }
  const shell = ell(14, 21 + t, 6.2, 3.8);
  s.fill(shell, CRB);
  s.paintIn(shell, ell(12.5, 19.8 + t, 3.4, 1.4), CRB.hi);
  // garras na frente, uma maior
  s.fill(cap(19, 20, 1, 22, 18, 1), CLEG);
  s.fill(ell(24, 17 - (f === 3 ? 1 : 0), 2.6, 2), ramp('#D8602E', { hi: '#F88C50', sh: '#A83A2C', ol: '#2E1018' }));
  s.fill(poly([[25, 15.2 - (f === 3 ? 1 : 0)], [28.5, 14.8], [27, 17]]), ramp('#D8602E', { hi: '#F88C50', sh: '#A83A2C', ol: '#2E1018' }));
  s.fill(cap(19, 23.4, 1, 22, 24.6, 1), CLEG);
  s.fill(ell(24, 25, 1.6, 1.3), ramp('#D8602E', { hi: '#F88C50', sh: '#A83A2C', ol: '#2E1018' }));
  // olhos
  s.dots('#F2F0E8', [19.5, 18.4 + t], [19.5, 21.2 + t]);
  s.dots(INKC, [20.2, 18.4 + t], [20.2, 21.2 + t]);
});

// ------------------------------------------------------------------ boto-cinza (grande, água)
const BG = ramp('#7C8EA0', { hi: '#A4B6C6', rim: '#DCE8F2', sh: '#566880', dp: '#384866', ol: '#1A2238' });
const BGB = ramp('#5E6E86', { hi: '#8496AC', rim: '#B4C4D6', sh: '#40506A', dp: '#2A3650', ol: '#141A30' });
const WL = rect(0, 0, 32, 25.5);
export const botocinza: OwDrawer = owSprite(
  null,
  (s, f) => {
    if (f < 2) {
      const b = f;
      // dorso com a nadadeira dorsal, cabeça arredondada e bico curto para fora d'água
      s.fill(sub(ell(10, 26, 8, 2.8), rect(0, 25.6, 32, 6)), BGB);
      s.fill(poly([[8, 25.5], [13, 25.5], [10.5, 21]]), BGB);
      const head = sub(uni(ell(19, 23.5 + b, 6, 3.8), ell(22, 21.4 + b, 3, 2.6)), rect(0, 25.6, 32, 6));
      s.fill(head, BG);
      s.paintIn(head, ell(21, 19.8 + b, 2, 1), BG.rim);
      const beak = path([[24.5, 22.8 + b, 1.3], [27.8, 23.6 + b, 1], [30, 24.4 + b, 0.8]]);
      s.fill(beak, BG);
      s.line(25, 23.8 + b, 29.4, 24.8 + b, BG.sh);
      s.put(21, 22.4 + b, '#150b26');
    } else {
      const k = f === 3 ? 1 : 0;
      const back = sub(ell(15 + k, 26, 11, 5 - k), sub(ell(15 + k, 26, 11, 5 - k), WL));
      s.fill(back, BGB);
      s.fill(poly([[13 + k, 22 - k], [18.5 + k, 22 - k], [15 + k, 18.5 - k]]), BGB);
      s.paintIn(back, rect(21 + k, 20, 6, 6), BG.md);
      if (k) s.dots('#C8F6FF', [26, 21], [27, 19], [25, 18]);
    }
  },
  { cx: 15, w: 20, y: 25 },
);

// ------------------------------------------------------------------ papagaio-de-cara-roxa (médio, voa)
const PG = ramp('#3EA84A', { hi: '#74D468', rim: '#C0FFA0', sh: '#26783E', dp: '#164E34', ol: '#06240F' });
const PGDK = ramp('#2A7A3A', { hi: '#4CA050', rim: '#98D88A', sh: '#1A5430', dp: '#103822', ol: '#04180C' });
const PBLUE = ramp('#2E5AC0', { hi: '#5C8AE8', sh: '#1E3C94', dp: '#142668', ol: '#080E38' });
export const cararoxa: OwDrawer = owSprite({ cx: 14, w: 10, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    { body: PG, wing: PGDK, tip: PBLUE, b: [15, 14, 4.8, 3], sh: [16, 13], span: 10, chord: 6, bands: [[5, PG.md], [2.6, '#D8322B']] },
    (dy) => {
      const tail = path([[11, 15 + dy, 1.6], [6, 17 + dy, 1.2], [1.5, 19 + dy, 0.8]]);
      s.fill(tail, PG);
    },
    (dy) => {
      s.fill(ell(20.5, 12 + dy, 3, 2.8), PG);
      s.dots('#D8322B', [20, 9.8 + dy], [21, 9.8 + dy]);
      s.paint(ell(21.2, 13.4 + dy, 2, 1.4), '#8A5ABA');
      s.fill(poly([[22.5, 11 + dy], [25, 11.6 + dy], [24.5, 13.8 + dy], [22.5, 13.4 + dy]]), ramp('#C8B898', { ol: '#2A1E22' }));
      s.put(21.4, 11.4 + dy, INKC);
    },
  );
});

// ------------------------------------------------------------------ gralha-azul (média, voa)
const GB = ramp('#2E44D4', { hi: '#5C78F4', rim: '#B8CCFF', sh: '#1E2C9E', dp: '#141C6A', ol: '#080A34' });
const GDK = ramp('#1A2070', { hi: '#3446B0', rim: '#7C90E0', sh: '#10144E', dp: '#0A0C34', ol: '#04041C' });
const GHEAD = ramp('#181430', { hi: '#34305A', rim: '#7470A0', sh: '#100C22', dp: '#0A0816', ol: '#04020C' });
export const gralhaazul: OwDrawer = owSprite({ cx: 14, w: 10, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    { body: GB, wing: GDK, tip: GB, b: [15, 14, 4.8, 3], sh: [16, 13], span: 10, chord: 6, bands: [[5, GB.md]] },
    (dy) => {
      const tail = path([[11, 15 + dy, 1.6], [6, 17 + dy, 1.3], [1.5, 19 + dy, 0.9]]);
      s.fill(tail, GB);
    },
    (dy) => {
      s.fill(ell(20.5, 12 + dy, 3, 2.8), GHEAD);
      s.fill(poly([[18.5, 11 + dy], [18, 7.2 + dy], [20.5, 9.4 + dy], [21.5, 10.6 + dy]]), GHEAD);
      s.dots('#8AAAF8', [21, 10 + dy], [22, 10.4 + dy]);
      s.fill(poly([[22.5, 11 + dy], [25.5, 11.6 + dy], [25, 13.4 + dy], [22.5, 13.4 + dy]]), ramp('#2E2C34', { ol: '#08060E' }));
      s.put(21.4, 11.6 + dy, '#ffffff');
    },
  );
});

export const OW_DRAWERS: Record<string, OwDrawer> = {
  micoleao, muriqui, tucanoverde, saira, jacutinga, pingodeouro, jararaca, ourico, caranguejo, botocinza, cararoxa, gralhaazul,
};
