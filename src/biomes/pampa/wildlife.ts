import { INK, ramp, type Ramp } from '../../art/animals/kit';
import { cap, ell, eye, type M, path, poly, rect, Spr, sub, uni } from '../../art/wildlife/kit';
import { far, flyer, gait, type OwDrawer, owSprite, quad } from '../../art/wildlife/parts';

// Fauna do Pampa na exploração (32×32, vista de cima 3/4, olhando para a direita, base em y = 28).
// Cores tiradas dos retratos de captura (animals*.ts) para manter a coerência.

const INKP = '#150b26';
const CREAM = ramp('#F4EAD8', { hi: '#FFFFFF', sh: '#CDBCA8', dp: '#8E7C80', ol: '#3A2A2E' });
const WHITE = ramp('#F8F4EA', { hi: '#FFFFFF', rim: '#FFFFFF', sh: '#D6CCC0', dp: '#A09098', ol: '#3A2C34' });
const BLK = ramp('#26242C', { hi: '#4A4654', rim: '#8A869A', sh: '#18161E', dp: '#100E16', ol: '#06040A' });
const RED = ramp('#D8342E', { hi: '#F26048', rim: '#FFB090', sh: '#A81E30', dp: '#6A1030', ol: '#2A0A1A' });

/** Quadrúpede no meio do salto: patas de trás esticadas para trás, as da frente para a frente. */
function leap(s: Spr, r: Ramp, b: [number, number, number, number], lr: number, foot?: string): M {
  const [cx, cy, rx, ry] = b;
  const hx = cx - rx * 0.55;
  const fx = cx + rx * 0.55;
  const ly = cy + ry * 0.3;
  const leg = (x0: number, x1: number, y1: number, rr: Ramp) => {
    s.fill(cap(x0, ly, lr, x1, y1, lr * 0.8), rr);
    if (foot) s.put(x1, y1, foot);
  };
  leg(hx + 1.5, hx - 3.5, ly + 3, far(r));
  leg(fx + 1.5, fx + 5.5, ly + 2.5, far(r));
  const body = ell(cx, cy, rx, ry);
  s.fill(body, r);
  leg(hx, hx - 5, ly + 3.5, r);
  leg(fx, fx + 4, ly + 3.5, r);
  return body;
}

// ------------------------------------------------------------------ veado-campeiro (grande, pula)
const VD = ramp('#BC8650', { hi: '#D8A872', rim: '#FFE0AC', sh: '#8E5A3E', dp: '#56343A', ol: '#26141E' });
const VANT = ramp('#C8B898', { hi: '#E8DCC0', rim: '#FFF6DC', sh: '#8E7C68', dp: '#54463E', ol: '#241A18' });
const HOOF = '#3A2A22';

export const veadocampeiro: OwDrawer = owSprite({ cx: 15, w: 17 }, (s, f) => {
  const b = f === 1 ? 0.5 : 0;
  const bound = f === 3 ? -2 : 0;
  // rabinho branco erguido (alerta) no salto
  s.fill(ell(7.5, 13.5 + bound - (f === 3 ? 1 : 0), 1.4, 1.8), f === 3 ? CREAM : VD);
  const leg = (x: number, x1: number, y1: number, r: Ramp) => {
    s.fill(cap(x, 17 + bound + b, 1.1, x1, y1, 0.7), r);
    s.put(x1, y1, HOOF);
  };
  const g = gait(f);
  if (f === 3) {
    leg(10.5, 6.5, 24.5, far(VD));
    leg(19.5, 22.5, 22, far(VD));
  } else {
    leg(11, 11 - g, 26.5, far(VD));
    leg(19.5, 19.5 + g, 26.5, far(VD));
  }
  const body = ell(14, 15.5 + bound + b, 6.6, 3.4);
  s.fill(body, VD);
  s.paintIn(body, rect(8, 17.6 + bound + b, 13, 2), CREAM.md);
  if (f === 3) {
    leg(9.5, 5, 23.5, VD);
    leg(18.5, 21.5, 21, VD);
  } else {
    leg(10, 10 + g, 26.5, VD);
    leg(18.5, 18.5 - g, 26.5, VD);
  }
  const hy = 8.5 + bound + b;
  s.fill(cap(18.5, 14 + bound + b, 2.2, 21.5, hy + 2, 1.5), VD);
  s.fill(ell(19.5, hy - 1, 1.2, 1.9), VD);
  // galhada curta de três pontas
  s.line(21.5, hy - 1, 21, hy - 5, VANT.md);
  s.line(21, hy - 5, 19.5, hy - 6, VANT.hi);
  s.line(21.2, hy - 3, 23, hy - 4.5, VANT.hi);
  const head = uni(ell(22.5, hy + 1, 2.4, 2), cap(22.5, hy + 1.4, 1.6, 26.5, hy + 2.6, 1.1));
  s.fill(head, VD);
  s.paintIn(head, rect(24, hy + 3, 4, 1), CREAM.md);
  s.dots(CREAM.md, [22, hy + 0.2]);
  s.put(27.5, hy + 2.3, HOOF);
  eye(s, 23, hy + 0.5, false, INK, f === 1);
});

// ------------------------------------------------------------------ graxaim-do-campo (médio, pula)
const GX = ramp('#A39078', { hi: '#C4B298', rim: '#EEDFC0', sh: '#7A6A64', dp: '#4E4054', ol: '#241A26' });
const GR = ramp('#C87C42', { hi: '#E4A064', rim: '#FFD8A0', sh: '#9C5A3A', dp: '#5E3238', ol: '#2A1420' });
const GBK = '#2E262C';

export const graxaim: OwDrawer = owSprite({ cx: 14, w: 16 }, (s, f) => {
  const hop = f === 3 ? -3 : 0;
  // cauda peluda caída, de ponta preta
  const tail = path([[8, 18.5 + hop, 1.8], [4.5, 20 + hop, 2.1], [2, 22.5 + hop * 0.6, 1.6]]);
  s.fill(tail, GX);
  s.paintIn(tail, ell(1.5, 23 + hop * 0.6, 1.8, 1.8), GBK);
  s.paintIn(tail, rect(0, 17 + hop, 8, 1.5), GX.hi);
  const bb: [number, number, number, number] = [14, 19 + hop, 6.8, 3.4];
  const body = f === 3 ? leap(s, GR, bb, 1.1, GBK) : quad(s, f, { r: GR, legs: [10, 18], legTop: 21, lr: 1.1, stride: 1.3, foot: GBK, b: bb });
  s.paintIn(body, rect(0, 0, 40, 20 + hop), GX.md);
  s.paintIn(body, rect(0, 0, 40, 17.2 + hop), GX.hi);
  s.paintIn(body, rect(0, 0, 40, 15.9 + hop), GX.md);
  s.paintIn(body, rect(8, 21 + hop, 12, 1.5), CREAM.sh);
  // cabeça cinza, orelhas e focinho ruivos, queixo preto
  const hy = 15.5 + hop + (f === 1 ? 0.5 : 0);
  s.fill(poly([[18, hy - 1], [18.8, hy - 5.6], [21.6, hy - 1.6]]), GR);
  s.put(19, hy - 3, GR.dp);
  s.fill(ell(21.3, hy + 0.5, 2.9, 2.5), GX);
  const snout = cap(22.8, hy + 1.2, 1.6, 26.5, hy + 2.2, 0.9);
  s.fill(snout, GR);
  s.paintIn(snout, rect(22, hy + 2.6, 6, 1), GBK);
  s.paint(ell(21, hy + 1.8, 1.4, 0.7), CREAM.md);
  s.put(27, hy + 1.8, GBK);
  eye(s, 22, hy - 0.4, false, '#B0702E', f === 1);
});

// ------------------------------------------------------------------ zorrilho (pequeno, bote)
const ZB = ramp('#2C262C', { hi: '#4C444E', rim: '#8A808E', sh: '#1C161E', dp: '#100A14', ol: '#06040A' });
const ZW = ramp('#F2EEE6', { hi: '#FFFFFF', rim: '#FFFFFF', sh: '#CCC4CC', dp: '#948C9C', ol: '#2E2832' });

export const zorrilho: OwDrawer = owSprite({ cx: 15, w: 15 }, (s, f) => {
  // no bote ergue e abre a cauda de aviso
  const raise = f === 3 ? -2 : f === 1 ? -0.5 : 0;
  const tail = path([[10.5, 20.5, 1.8], [7.5, 16.5 + raise, 2.6], [7, 11.5 + raise, 2.9], [9.5, 8 + raise * 1.5, 2.3]]);
  s.fill(tail, ZB);
  s.paintIn(tail, path([[8.5, 17 + raise, 0.9], [7.6, 12 + raise, 1.4], [9.5, 8.5 + raise * 1.5, 1.2]]), ZW.md);
  s.paintIn(tail, rect(0, 0, 9, 9 + raise * 1.5), ZW.hi);
  const body = quad(s, f, { r: ZB, legs: [11, 18], legTop: 22.5, lr: 1.3, stride: 1.2, foot: ZB.hi, b: [14.5, 21, 6.6, 3.8] });
  // faixas brancas pelo dorso
  s.paintIn(body, ell(14, 17.9, 6.2, 1.2), ZW.md);
  s.paintIn(body, ell(13, 17.6, 4, 0.6), ZW.hi);
  const hy = 20 + (gait(f) ? -0.5 : 0) + (f === 1 ? 0.5 : 0);
  s.fill(ell(19.8, hy - 2.4, 1, 0.9), ZB);
  const head = uni(ell(21.5, hy, 2.8, 2.4), cap(22.5, hy + 0.6, 1.5, 26.5, hy + 1.6, 0.9));
  s.fill(head, ZB);
  s.paintIn(head, rect(18, hy - 2.6, 4.5, 1), ZW.md);
  s.put(27, hy + 1.4, '#5A5058');
  eye(s, 22.5, hy - 0.4, false, '#8A808E', f === 1);
});

// ------------------------------------------------------------------ tuco-tuco (pequeno, calmo)
const TC = ramp('#9A7650', { hi: '#BC9870', rim: '#EBCFA0', sh: '#6E5038', dp: '#43303A', ol: '#1E141C' });
const SAND = ramp('#D8BE88', { hi: '#F0DCA8', rim: '#FFF2CC', sh: '#AC8C62', dp: '#7A5E52', ol: '#3A2A28' });
const TEETH = ramp('#F08A22', { hi: '#FFC25A', sh: '#C85A1E', dp: '#8E3820', ol: '#3A1A14' });

export const tucotuco: OwDrawer = owSprite({ cx: 17, w: 12 }, (s, f) => {
  // montinho de areia na boca da toca
  const mound = poly([[1.5, 28], [3.5, 24.5], [7, 23], [10.5, 24.5], [12, 28]]);
  s.fill(mound, SAND);
  s.paint(ell(7, 26.6, 2.2, 1.4), '#3A2418');
  s.paint(ell(7, 27, 1.4, 0.8), '#1E120C');
  if (f >= 2) s.dots(SAND.md, f === 2 ? [12.5, 22] : [11.5, 20.5], f === 2 ? [10.5, 21] : [13, 21.5]);
  s.fill(path([[13, 23, 0.8], [11.5, 24, 0.6]]), TC);
  const body = quad(s, f, { r: TC, legs: [15, 20.5], legTop: 24, lr: 1, stride: 1, foot: '#F0E2C4', b: [17.5, 22.5, 5.6, 3.4] });
  s.paintIn(body, rect(13, 24.4, 10, 1.4), SAND.hi);
  // cabeção redondo, olhos e orelhas miúdos, dentes laranja
  const hy = 21 + (f === 1 ? 0.5 : 0) + (gait(f) ? -0.5 : 0);
  const head = uni(ell(22.8, hy, 3.2, 2.8), ell(25, hy + 0.8, 1.8, 1.6));
  s.fill(head, TC);
  s.paintIn(head, ell(25, hy + 1.6, 1.6, 1), SAND.md);
  s.put(21, hy - 2.6, TC.sh);
  s.put(26.6, hy + 0.2, '#5E442E');
  s.dots(TEETH.md, [25.5, hy + 2.6], [26, hy + 2.6]);
  s.put(25.5, hy + 3.2, TEETH.sh);
  eye(s, 23.5, hy - 0.8, false, INK, f === 1);
});

// ------------------------------------------------------------------ gato-palheiro (médio, bote)
const GP = ramp('#C8A878', { hi: '#E0C498', rim: '#FFEBC0', sh: '#9A7650', dp: '#5E4440', ol: '#2A1C24' });
const GPRUST = '#A0603A';
const GPDK = '#3A2C26';

export const gatopalheiro: OwDrawer = owSprite({ cx: 15, w: 17 }, (s, f) => {
  const t = f === 1 ? 1 : 0;
  // cauda grossa e anelada
  const tail = path([[7, 17, 1.5], [3.5, 19, 1.5], [2, 23 - t, 1.4], [3 + t, 25.5 - t, 1.3]]);
  s.fill(tail, GP);
  s.dots(GPRUST, [4, 18.5], [2, 21]);
  s.dots(GPDK, [2, 23 - t], [3 + t, 25.5 - t], [3.5 + t, 25.5 - t]);
  const body = quad(s, f, { r: GP, legs: [9, 19], legTop: 20, lr: 1.6, stride: 1.5, foot: GPDK, b: [14, 18.5, 8, 4.4] });
  s.paintIn(body, rect(7, 21, 15, 1.6), '#F0E4CC');
  // manchas ruivas em faixas oblíquas, apagadas no capim
  for (const x of [9, 12.5, 16, 19]) {
    s.paintIn(body, cap(x, 15.5, 0.6, x - 1, 19.5, 0.6), GPRUST);
  }
  // listras escuras nas patas de cá
  const g = gait(f);
  s.dots(GPDK, [9 - g * 0.8, 23.5], [19 + g * 0.8, 23.5], [9 - g * 1.2, 25], [19 + g * 1.2, 25]);
  const hy = 14 + (g !== 0 ? -0.5 : 0);
  s.fill(poly([[20.6, hy - 2], [21.6, hy - 5.8], [23.8, hy - 2.6]]), GP);
  s.put(21.8, hy - 3.6, GPDK);
  const head = uni(ell(23.6, hy, 3.6, 3.3), ell(26.6, hy + 1.4, 2.2, 1.8));
  s.fill(head, GP);
  s.paintIn(head, ell(27, hy + 2.2, 2, 1.2), '#F0E4CC');
  s.dots(GPRUST, [22.5, hy + 0.8], [23.5, hy + 1.4], [21.5, hy - 1.5]);
  s.dots('#C8505E', [28.8, hy + 1]);
  eye(s, 25.5, hy - 1, false, '#C8C83A', f === 1);
});

// ------------------------------------------------------------------ quero-quero (médio, voa)
const QB = ramp('#B0A48E', { hi: '#CCC0A8', rim: '#EEE4CC', sh: '#82766E', dp: '#58485A', ol: '#241A28' });
const QBRZ = ramp('#8A7A52', { hi: '#A8A06A', rim: '#D8D098', sh: '#625444', dp: '#42343E', ol: '#1C1420' });
const QLEG = ramp('#E0605A', { hi: '#F88A78', rim: '#FFC0A8', sh: '#B03E48', dp: '#702438', ol: '#2E1020' });

export const queroquero: OwDrawer = owSprite({ cx: 15, w: 11, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    // faixa branca larga na asa entre o ombro bronzeado e a ponta preta
    { body: QB, wing: QB, tip: BLK, b: [14.5, 13, 4.8, 2.6], sh: [16, 12], span: 10, chord: 5, bands: [[6, WHITE.md], [3, QBRZ.md]] },
    (dy) => {
      s.fill(cap(10.5, 14.5 + dy, 0.6, 6, 16 + dy, 0.5), QLEG, { ol: false });
      const tail = path([[10.5, 13.5 + dy, 1.5], [6, 14 + dy, 1.3]]);
      s.fill(tail, WHITE);
      s.paintIn(tail, rect(0, 0, 7, 32), BLK.md);
    },
    (dy) => {
      s.fill(ell(18.8, 13.2 + dy, 2, 1.8), BLK);
      const head = ell(20.6, 11 + dy, 2.3, 2);
      s.fill(head, QB);
      s.paintIn(head, rect(21.5, 9, 3, 4 + dy), BLK.md);
      s.paintIn(head, ell(20, 12.2 + dy, 1.4, 0.8), WHITE.md);
      // penacho fino da nuca
      s.line(19, 9.4 + dy, 16.5, 8.4 + dy, BLK.md);
      s.put(21.2, 10.4 + dy, '#E8302E');
      s.fill(poly([[22.6, 10.6 + dy], [25, 11.3 + dy], [22.6, 12 + dy]]), QLEG, { ol: QLEG.dp });
      s.put(25, 11.3 + dy, BLK.md);
    },
  );
});

// ------------------------------------------------------------------ joão-de-barro (pequeno, pula)
const JR = ramp('#B8703A', { hi: '#D8925A', rim: '#F8C890', sh: '#8A4A2E', dp: '#56303A', ol: '#26141C' });
const JB = ramp('#EDD0A4', { hi: '#FAE8C8', sh: '#C8A07C', dp: '#8A6A64', ol: '#3A2630' });
const CLAY = ramp('#B87848', { hi: '#D49A64', rim: '#F4C890', sh: '#8A5440', dp: '#583238', ol: '#241218' });
const JLEG = ramp('#8A6A58', { hi: '#B8967C', ol: '#2A1C20' });

export const joaodebarro: OwDrawer = owSprite({ cx: 15, w: 10 }, (s, f) => {
  const hop = f === 3 ? -3 : 0;
  const b = f === 1 ? 0.5 : 0;
  const cr = f === 2 ? 1 : 0;
  // cauda ruiva, levemente erguida
  s.fill(path([[11, 19.5 + hop + cr, 1.6], [7.5, 18 + hop + cr, 1.4], [5.5, 17 + hop + cr, 1.1]]), JR);
  for (const x of [13.5, 16]) s.fill(cap(x, 21 + hop + cr, 0.6, x + (hop ? -1 : 0), 26.5 + hop * 0.3, 0.5), JLEG);
  const body = ell(15, 19 + hop + cr + b, 4.6, 3.4);
  s.fill(body, JR);
  s.paintIn(body, ell(16.8, 21 + hop + cr, 3.4, 1.8), JB.md);
  s.paintIn(body, ell(13, 18 + hop + cr, 2.6, 1.2), JR.sh);
  const hy = 15 + hop + cr + b;
  const head = ell(19.4, hy, 2.6, 2.4);
  s.fill(head, JR);
  s.paintIn(head, ell(20.6, hy + 1.8, 1.8, 1), '#F8ECD4');
  s.dots(JB.md, [19, hy - 1.3], [20, hy - 1.5]);
  s.fill(poly([[21.6, hy - 0.5], [24.8, hy + 0.5], [21.6, hy + 1]]), JLEG, { ol: JLEG.ol });
  // às vezes leva uma bolinha de barro no bico
  if (f === 1) s.fill(ell(25.2, hy + 1, 1, 1), CLAY);
  eye(s, 20, hy - 0.4, false, INKP, f === 1);
});

// ------------------------------------------------------------------ cisne-de-pescoço-preto (grande, voa)
const SW = ramp('#F6F4EE', { hi: '#FFFFFF', rim: '#FFFFFF', sh: '#CCC8DC', dp: '#8E8AAA', ol: '#2E2A48' });
const SN = ramp('#2E2C36', { hi: '#524E60', rim: '#9894AC', sh: '#1C1A24', dp: '#100E18', ol: '#06040A' });
const SBILL = ramp('#A8A4B4', { hi: '#D0CCDA', rim: '#EEECF4', sh: '#7C788A', dp: '#524E66', ol: '#1C1A2C' });

export const cisne: OwDrawer = owSprite({ cx: 14, w: 16, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    { body: SW, wing: SW, b: [12.5, 14, 5.6, 2.9], sh: [14, 13], span: 11, chord: 6 },
    (dy) => {
      s.fill(path([[8, 14.5 + dy, 1.7], [4.5, 15 + dy, 1.1]]), SW);
      s.dots('#4A4654', [7, 16.5 + dy], [6, 16.5 + dy]);
    },
    (dy) => {
      // pescoço comprido e preto, esticado para a frente
      s.fill(path([[16.5, 13.6 + dy, 1.7], [20.5, 12.4 + dy, 1.2], [24.5, 11.4 + dy, 1.1]]), SN);
      s.fill(ell(25.4, 11 + dy, 1.9, 1.6), SN);
      s.put(25, 10.2 + dy, '#FFFFFF');
      s.put(25.8, 10.6 + dy, INKP);
      s.fill(poly([[26.8, 10.4 + dy], [29.8, 11.2 + dy], [29.6, 12.2 + dy], [26.8, 12 + dy]]), SBILL);
      s.dots(RED.md, [27, 9.8 + dy], [27.8, 10 + dy], [27.4, 10.4 + dy]);
    },
  );
});

// ------------------------------------------------------------------ tatu-mulita (médio, casco)
const MS = ramp('#9C8C7C', { hi: '#BCAC98', rim: '#E4D4BC', sh: '#72645E', dp: '#4A3E48', ol: '#1E141C' });
const MK = ramp('#CDB098', { hi: '#E6D0BA', rim: '#F8E8D4', sh: '#A08678', dp: '#6E5658', ol: '#2E1E26' });

export const mulita: OwDrawer = owSprite({ cx: 15, w: 19 }, (s, f) => {
  const g = gait(f);
  const t = f === 1 ? 0.5 : 0;
  // cauda longa, fina e anelada
  const tail = path([[8, 22, 1.5], [4.5, 24.5, 1], [1.5, 26.5, 0.6]]);
  s.fill(tail, MS);
  s.dots(MS.dp, [6, 23.5], [4, 25], [2.5, 26]);
  quad(s, f, { r: MK, legs: [10, 18], legTop: 23, lr: 1.2, stride: 1.2, foot: '#F2E6D2', b: [14, 21.5 + t, 6.5, 3.8] });
  // carapaça em domo com cintas
  const dome = ell(14, 20.4 + t, 7.6, 5);
  s.fill(dome, MS);
  s.paintIn(dome, rect(0, 23.6 + t, 32, 6), MK.sh);
  for (const x of [11, 13, 15, 17]) s.paintIn(dome, rect(x, 15, 0.6, 8.6), MS.dp);
  s.dots(MS.rim, [9, 16.5 + t], [12, 15.6 + t], [16, 15.6 + t], [19, 16.6 + t]);
  // cabeça de escudo, focinho fino e orelhas compridas
  const hy = 21.5 + t + (g ? 0.5 : 0);
  s.fill(poly([[20.6, hy - 1], [20.2, hy - 5.4], [22.4, hy - 1.4]]), MK);
  s.put(20.8, hy - 3, MK.dp);
  s.fill(ell(22.6, hy, 2.4, 2), MS);
  s.fill(cap(24, hy + 0.6, 1.2, 28.8, hy + 1.8, 0.7), MS);
  s.put(29, hy + 1.6, '#3A2C30');
  s.put(23, hy - 0.6, INKP);
});

// ------------------------------------------------------------------ ratão-do-banhado (médio, mergulha)
const RT = ramp('#7E5C40', { hi: '#A07C58', rim: '#D8B484', sh: '#573E34', dp: '#38262E', ol: '#150C12' });
const RWH = ramp('#E8DCC4', { hi: '#FFFFFF', sh: '#BCAC94', dp: '#7E6E70', ol: '#3A2C30' });
const CUT = rect(0, 25.6, 32, 7);

export const ratao: OwDrawer = owSprite(
  null,
  (s, f) => {
    const swim = f >= 2;
    const k = f === 3 ? 1 : 0;
    const bob = f === 1 ? 0.5 : 0;
    const sink = swim ? 1.5 : 0;
    // dorso arredondado fora d'água
    const back = sub(ell(12 + k, 26.4 + sink, 7, 3.4), CUT);
    s.fill(back, RT);
    s.dots(RT.hi, [9 + k, 23.6 + sink], [13 + k, 23.2 + sink]);
    // cabeça larga, focinho branco, dentes laranja
    const hy = 21.5 + bob + sink;
    const head = sub(uni(ell(20 + k, hy + 1, 3.4, 3), ell(23.2 + k, hy + 1.8, 2.4, 2)), CUT);
    s.fill(head, RT);
    s.fill(ell(18.6 + k, hy - 1.8, 1, 0.9), RT);
    s.paintIn(head, ell(24.6 + k, hy + 2.6, 1.6, 1.2), RWH.md);
    s.put(25.6 + k, hy + 1.2, '#2A1E1E');
    if (hy + 3 < 25.6) s.dots(TEETH.md, [24 + k, hy + 3], [24.6 + k, hy + 3]);
    s.dots(RWH.hi, [27 + k, hy + 2], [27 + k, hy + 3]);
    eye(s, 21 + k, hy, false, INK, f === 1);
    if (swim) s.dots('#C8F6FF', [27.5 + k, 25], [28.5 + k, 24.6 + k * 0.4]);
  },
  { cx: 15, w: 16, y: 25 },
);

// ------------------------------------------------------------------ cardeal-amarelo (pequeno, voa)
const CY = ramp('#F2C81E', { hi: '#FFE250', rim: '#FFF6A8', sh: '#CE9A1C', dp: '#8A5C24', ol: '#3A2214' });
const CG = ramp('#8A9068', { hi: '#AAB080', rim: '#D2D8A4', sh: '#646A52', dp: '#424640', ol: '#1C1E1C' });
const CK = ramp('#1E1C20', { hi: '#403C46', rim: '#7C788A', sh: '#121014', dp: '#0A080C', ol: '#030204' });

export const cardeal: OwDrawer = owSprite({ cx: 15, w: 9, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    { body: CG, wing: CG, tip: CK, b: [15, 14, 3.8, 2.5], sh: [16, 13], span: 7, chord: 4, bands: [[2.4, CY.sh]] },
    (dy) => {
      const tail = path([[12, 14.5 + dy, 1.3], [7.5, 15.5 + dy, 1.1]]);
      s.fill(tail, CK);
      s.paintIn(tail, rect(0, 15.6 + dy, 32, 2), CY.md);
    },
    (dy) => {
      // rosto amarelo vivo, crista e garganta pretas
      s.fill(poly([[18.4, 11 + dy], [16, 7.6 + dy], [19, 9.2 + dy], [20.6, 10.4 + dy]]), CK);
      const head = ell(19.8, 12.5 + dy, 2.6, 2.3);
      s.fill(head, CY);
      s.paintIn(head, rect(17, 9.8 + dy, 6, 1.2), CK.md);
      s.paintIn(head, ell(20.8, 14.2 + dy, 1.5, 1), CK.md);
      s.fill(poly([[22, 11.8 + dy], [24.2, 12.6 + dy], [22, 13.4 + dy]]), ramp('#C0BCC4', { hi: '#E8E4EC', sh: '#908CA0', ol: '#1C1A28' }));
      s.put(20.6, 12 + dy, INKP);
    },
  );
});

// ------------------------------------------------------------------ sapinho-de-barriga-vermelha (pequeno, pula)
const SK = ramp('#34342E', { hi: '#5A5A48', rim: '#8E8E70', sh: '#222220', dp: '#14141A', ol: '#07070A' });
const SRED = ramp('#E0402A', { hi: '#FF7A4A', rim: '#FFC090', sh: '#B02430', dp: '#701834', ol: '#2E0C22' });
const SYEL = ramp('#EAD030', { hi: '#FFF070', rim: '#FFFAB0', sh: '#C0962A', dp: '#7E5A26', ol: '#3A2214' });

export const sapinho: OwDrawer = owSprite({ cx: 16, w: 11 }, (s, f) => {
  const air = f === 3 ? -5 : 0;
  const cr = f === 2 ? 0.5 : 0;
  const b = f === 1 ? 0.5 : 0;
  const y = air + cr;
  if (f === 3) {
    // no salto as pernas esticam e aparece a barriga vermelha
    s.fill(cap(12.5, 22 + y, 1.1, 8, 25 + y, 0.8), far(SK));
    s.fill(cap(13.5, 23 + y, 1.2, 9, 26.5 + y, 0.9), SK);
    s.dots(SRED.md, [8, 25.5 + y], [9, 27 + y]);
  } else {
    s.fill(ell(13.5, 24.4 + cr, 2.6, 1.8), far(SK));
  }
  const body = ell(16, 23 + y + b * 0.4, 5, 3.2 - b * 0.3);
  s.fill(body, SK);
  s.paintIn(body, rect(0, (f === 3 ? 23.6 : 24.8) + y, 32, 4), SRED.md);
  s.dots(SYEL.md, [13.5, 21.4 + y], [16, 20.6 + y], [18, 21.6 + y], [14.5, 23 + y]);
  s.put(16, 22.2 + y, SYEL.hi);
  if (f !== 3) {
    s.fill(ell(12.6, 25 + cr, 2.4, 1.7), SK);
    s.dots(SYEL.sh, [11.6, 24.2 + cr]);
    s.dots(SRED.md, [11, 26.6], [12, 26.6]);
  }
  // braço da frente e mão vermelha
  s.fill(cap(19.5, 24 + y, 0.8, 20.5, (f === 3 ? 26 : 26.6) + y * 0.4, 0.7), SK);
  s.dots(SRED.md, [21, 27 + y * 0.4]);
  // olho saltado de íris dourada
  const ey = 20.4 + y + b * 0.4;
  s.fill(ell(19, ey, 1.3, 1.1), SK);
  if (f === 1) s.put(19, ey, SK.rim);
  else {
    s.put(19, ey - 0.2, '#E8C040');
    s.put(19.6, ey, INK);
  }
  s.put(20.6, 22.6 + y, SK.dp);
});

export const OW_DRAWERS: Record<string, OwDrawer> = {
  veadocampeiro, graxaim, zorrilho, tucotuco, gatopalheiro, queroquero, joaodebarro, cisne, mulita, ratao, cardeal, sapinho,
};
