import { cap, type Drawer, ell, eye, INK, poly, ramp, rect, Spr, uni, type Pt } from './kit';
import { drawWing, flapAngles, tailWedge, type WingSpec } from './wing';

/** Pés zigodáctilos (dois dedos para a frente) agarrados, cinza. */
function parrotFeet(s: Spr, y: number, dy: number): void {
  const FOOT = ramp('#7A7088', { hi: '#A49CB0', ol: '#241A34' });
  for (const sx of [-1, 1]) {
    s.fill(ell(32 + sx * 4, y + dy, 2.4, 2), FOOT, { n: 1 });
    s.fill(cap(32 + sx * 4, y + 1 + dy, 1, 32 + sx * 2.5, y + 3.5 + dy, 0.8), FOOT, { n: 1 });
    s.fill(cap(32 + sx * 4, y + 1 + dy, 1, 32 + sx * 5.5, y + 3.5 + dy, 0.8), FOOT, { n: 1 });
  }
}

// ------------------------------------------------------------------ ararinha-azul
const SPIX = ramp('#3C7ED6', { hi: '#6EB0F4', rim: '#C4ECFF', sh: '#24509E', dp: '#183070', ol: '#0A1236' });
const SPIX_DK = ramp('#2448A8', { hi: '#4878D0', rim: '#9CC8F4', sh: '#18307A', dp: '#101E54', ol: '#080C2C' });
const SPIX_HEAD = ramp('#A6C0DC', { hi: '#D2E4F4', rim: '#F4FAFF', sh: '#7890B8', dp: '#4E5E8A', ol: '#16203E' });
const SPIX_TEAL = ramp('#3C9AC8', { hi: '#70C8E8', sh: '#24689E', dp: '#184672' });
const FACE_GRAY = ramp('#4E5262', { hi: '#6E7284', sh: '#363848', ol: '#14141E' });
const BILL = ramp('#2A2832', { hi: '#5A5868', rim: '#8A8898', sh: '#1A1822', ol: '#08060E' });

const SPIX_WING: WingSpec = {
  S: [38, 31],
  S2: [38, 40],
  feathers: [[31, -0.42], [34, -0.17], [33, 0.08], [29, 0.33], [23, 0.55]],
  outer: SPIX_DK,
  bands: [[20, SPIX], [12, SPIX_TEAL]],
  sep: SPIX_DK.dp,
};

export const ararinha: Drawer = (s, f) => {
  const a = flapAngles(f);
  drawWing(s, SPIX_WING, a.l, -1);
  drawWing(s, SPIX_WING, a.r, 1);
  const { dy, lean } = a;
  tailWedge(s, 32, 44 + dy, 10, 61, lean, SPIX, SPIX_DK, 5);
  parrotFeet(s, 49, dy);
  // corpo azul, peito um pouco esverdeado
  s.fill(ell(32 + lean * 0.5, 37 + dy, 9, 12.5), SPIX);
  s.dots(SPIX.hi, [29, 40 + dy], [33, 43 + dy], [35, 38 + dy], [30, 35 + dy]);
  s.dots(SPIX_TEAL.md, [31, 45 + dy], [34, 46 + dy], [28, 44 + dy]);
  // cabeça cinza-azulada clara
  const hx = 32 + lean;
  s.fill(ell(hx, 20 + dy, 9.6, 8.4), SPIX_HEAD);
  s.dots(SPIX_HEAD.rim, [28 + lean, 14 + dy], [30 + lean, 13 + dy], [27 + lean, 15 + dy]);
  // pele nua cinza-escura ao redor dos olhos e na base do bico
  s.fill(uni(ell(hx - 5, 21.5 + dy, 4.2, 3.8), ell(hx + 5, 21.5 + dy, 4.2, 3.8), ell(hx, 24 + dy, 4.5, 2.5)), FACE_GRAY, { ol: false, rim: false });
  eye(s, hx - 7.5, 19.5 + dy, 5, 5, '#F2E6A0', f === 1);
  eye(s, hx + 2.5, 19.5 + dy, 5, 5, '#F2E6A0', f === 1);
  // bico preto pequeno e curvo
  s.fill(poly([[hx - 3.5, 23 + dy], [hx + 3.5, 23 + dy], [hx + 3, 27 + dy], [hx + 0.5, 31 + dy], [hx - 1, 30 + dy], [hx - 3, 27 + dy]]), BILL);
  s.line(hx - 2, 27 + dy, hx + 2, 27 + dy, BILL.sh);
  s.dots(BILL.rim, [hx - 2, 24 + dy], [hx - 1, 24 + dy]);
};

// ------------------------------------------------------------------ asa-branca
const PIGEON = ramp('#8E8496', { hi: '#B4AABA', rim: '#E4DCE8', sh: '#645A74', dp: '#433C58', ol: '#1A1628' });
const VINHO = ramp('#A06A78', { hi: '#C8909A', rim: '#F0C8C8', sh: '#7A4A62', dp: '#53304E', ol: '#24142A' });
const HEADP = ramp('#94808E', { hi: '#B8A4B0', rim: '#E2D4DC', sh: '#6A5670', dp: '#463A54', ol: '#1A1424' });
const PWHITE = ramp('#F4F0EA', { hi: '#FFFFFF', sh: '#CCC4D0', dp: '#9890A8', ol: '#2A2438' });
const PDARK = ramp('#4A4458', { hi: '#6A6478', rim: '#9890A8', sh: '#322C40', dp: '#201C2E', ol: '#0E0A18' });

const PIGEON_WING: WingSpec = {
  S: [38, 33],
  S2: [38, 41],
  feathers: [[28, -0.4], [30, -0.17], [29, 0.06], [26, 0.3], [20, 0.52]],
  outer: PDARK,
  bands: [[19, PWHITE], [16, PIGEON]],
  sep: PDARK.dp,
};

export const asabranca: Drawer = (s, f) => {
  const a = flapAngles(f, -1.0, 0.7);
  drawWing(s, PIGEON_WING, a.l, -1);
  drawWing(s, PIGEON_WING, a.r, 1);
  const { dy, lean } = a;
  // cauda curta em leque, escura na ponta
  const ptail = poly([[28, 45 + dy], [36, 45 + dy], [38 + lean, 57], [32 + lean, 58.5], [26 + lean, 57]]);
  s.fill(ptail, PIGEON);
  s.paintIn(ptail, rect(20, 54, 24, 6), PDARK.md);
  // pés vermelhos
  for (const sx of [-1, 1]) s.fill(ell(32 + sx * 4, 50 + dy, 2.2, 1.8), ramp('#D2485A', { ol: '#3A1020' }), { n: 1 });
  // corpo roliço: peito vinho, ventre cinza
  s.fill(ell(32 + lean * 0.5, 39 + dy, 10, 11.5), PIGEON);
  s.fill(ell(32 + lean * 0.5, 35 + dy, 8.5, 7), VINHO, { ol: false, rim: false });
  // cabeça pequena cinza-vinho, nuca escamada
  const hx = 32 + lean;
  s.fill(ell(hx, 23 + dy, 6.6, 6.2), HEADP);
  for (const [x, y] of [[-6, 27], [-4, 28], [4, 28], [6, 27], [-5, 29], [5, 29], [-3, 30], [3, 30]] as Pt[]) s.put(hx + x, y + dy, PWHITE.sh);
  s.dots(HEADP.rim, [hx - 3, 18 + dy], [hx - 2, 18 + dy]);
  // olho laranja com anel de pele vermelha
  for (const sx of [-1, 1]) {
    s.paint(ell(hx + sx * 3.6, 22 + dy, 2.4, 2.4), '#C8404E');
    eye(s, hx + sx * 3.6 - 1.5, 20.5 + dy, 3, 3, '#F2902E', f === 1);
  }
  s.fill(poly([[hx - 1.2, 25 + dy], [hx + 1.2, 25 + dy], [hx, 29 + dy]]), PDARK, { n: 1 });
  s.dots('#E8E0E8', [hx, 25 + dy]);
};

// ------------------------------------------------------------------ carcará
const CBROWN = ramp('#4A3628', { hi: '#6E5440', rim: '#A8886A', sh: '#33231E', dp: '#22161A', ol: '#0E0810' });
const CCREAM = ramp('#F2E6CC', { hi: '#FFF8E6', rim: '#FFFFFF', sh: '#D0BC9C', dp: '#9C8470', ol: '#3A2A26' });
const CFACE = ramp('#EE7432', { hi: '#FFA060', rim: '#FFD0A0', sh: '#C24A2A', dp: '#7A2A26', ol: '#3A1418' });
const CBILL = ramp('#A8B8D0', { hi: '#D4E0F0', rim: '#F4FAFF', sh: '#7A88A8', dp: '#4E5878', ol: '#1A1E30' });
const CLEG = ramp('#F0C83A', { hi: '#FFE878', rim: '#FFF6B8', sh: '#C08A24', dp: '#7A5226', ol: '#2E1C18' });
const CCAP = ramp('#2A1E1E', { hi: '#4A3A36', rim: '#7A6460', sh: '#1A1214', ol: '#08040A' });

const CARC_WING: WingSpec = {
  S: [38, 31],
  S2: [38, 42],
  feathers: [[27, -0.5], [30, -0.3], [31, -0.1], [30, 0.1], [28, 0.3], [22, 0.5]],
  outer: CBROWN,
  bands: [[23, ramp('#D8CCB4', { sh: '#A89880', dp: '#7A6A5A' })], [17, CBROWN]],
  sep: CBROWN.dp,
  notch: 0.18,
};

export const carcara: Drawer = (s, f) => {
  const a = flapAngles(f, -1.0, 0.7);
  drawWing(s, CARC_WING, a.l, -1);
  drawWing(s, CARC_WING, a.r, 1);
  // barras escuras na janela clara das primárias
  const dy = a.dy;
  // cauda clara barrada com ponta escura
  const tail = poly([[27, 47], [37, 47], [39, 60], [25, 60]]);
  s.fill(tail, CCREAM);
  for (const y of [50, 53, 56]) s.paintIn(tail, rect(20, y, 30, 1), CBROWN.sh);
  s.paintIn(tail, rect(20, 58, 30, 3), CBROWN.md);
  // pernas longas amarelas
  for (const sx of [-1, 1]) {
    const x = 32 + sx * 4.5;
    s.fill(cap(x, 46 + dy, 2.6, x + sx * 0.5, 56, 1.8), CLEG);
    s.fill(ell(x + sx * 0.5, 57.5, 3.6, 1.6), CLEG, { n: 1 });
    s.dots(INK, [x + sx * 0.5 - 3, 58], [x + sx * 0.5, 59], [x + sx * 0.5 + 3, 58]);
  }
  // corpo: ventre marrom, peito creme barrado
  s.fill(ell(32, 40 + dy, 10.5, 12.5), CBROWN);
  const chest = ell(32, 34 + dy, 9, 7.5);
  s.fill(chest, CCREAM, { ol: false, rim: false });
  for (let y = 30; y < 42; y += 2) s.paintIn(chest, rect(23, y + dy, 18, 1), CBROWN.hi);
  s.dots(CBROWN.dp, [28, 33 + dy], [36, 33 + dy], [32, 37 + dy]);
  // cabeça: pescoço e bochechas creme, boné preto com crista para trás
  // crista desgrenhada para trás (aparece dos lados da cabeça)
  for (const sx of [-1, 1]) s.fill(poly([[32 + sx * 6, 12 + dy], [32 + sx * 13, 9 + dy], [32 + sx * 11, 13 + dy], [32 + sx * 14, 14 + dy], [32 + sx * 8, 18 + dy]]), CCAP);
  // cabeça creme com o boné preto achatado no alto
  const head = ell(32, 20 + dy, 9.5, 9);
  s.fill(head, CCREAM);
  s.fill(ell(32, 14 + dy, 9.6, 5.2), CCAP, { ol: false });
  s.paintIn(head, rect(22, 14 + dy, 20, 1), CCAP.md);
  s.dots(CCAP.rim, [28, 10 + dy], [29, 10 + dy], [35, 10 + dy]);
  // face nua laranja
  s.fill(ell(32, 22.5 + dy, 6.5, 4), CFACE, { ol: false });
  eye(s, 24, 16 + dy, 5, 5, '#8A4A22', f === 1);
  eye(s, 35, 16 + dy, 5, 5, '#8A4A22', f === 1);
  s.line(23, 15 + dy, 28, 16 + dy, CCAP.md);
  s.line(41, 15 + dy, 36, 16 + dy, CCAP.md);
  // bico alto azulado com gancho
  s.fill(poly([[29, 20 + dy], [35, 20 + dy], [36, 25 + dy], [34, 29 + dy], [32, 31 + dy], [30.5, 28 + dy], [28.5, 25 + dy]]), CBILL);
  s.dots(CBILL.dp, [32, 30 + dy], [31, 29 + dy]);
  s.dots(INK, [30, 22 + dy], [34, 22 + dy]);
};

// ------------------------------------------------------------------ soldadinho-do-araripe
const SWHITE = ramp('#F6F2EA', { hi: '#FFFFFF', rim: '#FFFFFF', sh: '#CFC8D4', dp: '#9A92AE', ol: '#2E2842' });
const SBLACK = ramp('#24222C', { hi: '#44424E', rim: '#7A7888', sh: '#18161E', dp: '#0E0C14', ol: '#06040A' });
const SRED = ramp('#E8302A', { hi: '#FF6A48', rim: '#FFC0A0', sh: '#B01C3C', dp: '#6E1038', ol: '#2A0818' });

const SOLD_WING: WingSpec = {
  S: [38, 35],
  S2: [37, 42],
  feathers: [[22, -0.42], [24, -0.15], [23, 0.12], [20, 0.38], [16, 0.58]],
  outer: SBLACK,
  bands: [[9, ramp('#3A3846', { hi: '#5A5866', sh: '#24222C' })]],
  sep: '#56545F',
};

export const soldadinho: Drawer = (s, f) => {
  const a = flapAngles(f, -1.1, 0.8);
  drawWing(s, SOLD_WING, a.l, -1);
  drawWing(s, SOLD_WING, a.r, 1);
  const { dy, lean } = a;
  // cauda preta
  s.fill(poly([[29, 46 + dy], [35, 46 + dy], [37 + lean, 57], [27 + lean, 57]]), SBLACK);
  for (const sx of [-1, 1]) s.fill(ell(32 + sx * 3.5, 51 + dy, 1.8, 1.5), ramp('#5A4E5A', { ol: '#1A1420' }), { n: 1 });
  // corpo redondo branco
  s.fill(ell(32 + lean * 0.5, 40 + dy, 10, 10.5), SWHITE);
  // cabeça branca com o capacete vermelho e o topete na testa
  const hx = 32 + lean;
  s.fill(ell(hx, 27 + dy, 8.5, 8), SWHITE);
  // manto vermelho descendo pela nuca (aparece dos lados)
  s.fill(uni(ell(hx, 22 + dy, 8.2, 4.6), poly([[hx - 7, 22 + dy], [hx + 7, 22 + dy], [hx + 9, 29 + dy], [hx + 6, 26 + dy], [hx - 6, 26 + dy], [hx - 9, 29 + dy]])), SRED);
  // topete: penas da testa erguidas para a frente
  s.fill(poly([[hx - 4, 21 + dy], [hx - 2, 11 + dy], [hx + 1, 14 + dy], [hx + 3, 9 + dy], [hx + 4.5, 20 + dy]]), SRED);
  s.dots(SRED.rim, [hx - 2, 13 + dy], [hx + 2, 12 + dy], [hx - 4, 20 + dy]);
  eye(s, hx - 7, 25 + dy, 4, 4, '#B02A2A', f === 1);
  eye(s, hx + 3, 25 + dy, 4, 4, '#B02A2A', f === 1);
  s.fill(poly([[hx - 1.6, 28.5 + dy], [hx + 1.6, 28.5 + dy], [hx, 31.5 + dy]]), SBLACK, { n: 1 });
  s.dots(SWHITE.sh, [28, 44 + dy], [35, 45 + dy], [31, 47 + dy]);
};
