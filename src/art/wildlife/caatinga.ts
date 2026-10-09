import { INK, ramp } from '../animals/kit';
import { cap, ell, eye, type M, path, poly, rect, Spr, uni, type P } from './kit';
import { far, flyer, gait, type OwDrawer, owSprite, quad } from './parts';

// Animais da Caatinga na exploração (32×32, olhando para a direita, base em y = 28).

// ------------------------------------------------------------------ tatu-bola (médio)
// Parado: de pé, casco alto em três cintas. Andando: fecha-se numa bola e sai rolando.
const SHELL = ramp('#C8A466', { hi: '#E6C886', rim: '#FFF0B8', sh: '#9A7444', dp: '#6A4A34', ol: '#2A1A1A' });
const TSKIN = ramp('#B8968A', { hi: '#DAB8A8', rim: '#F4DCCC', sh: '#8E6A6A', dp: '#5E4250', ol: '#2A1A22' });
const PLATE = '#E8D29A';
const HEADS = ramp('#9A7444', { hi: '#B89058', rim: '#D8B478', sh: '#6A4A34', dp: '#4A3028', ol: '#2A1A1A' });

/** Cinta do casco: meridiano da esfera (cx, cy, rx, ry) no ângulo `phi`, só onde há casco. */
function band(s: Spr, clip: M, cx: number, cy: number, rx: number, ry: number, phi: number, c: string): void {
  for (let y = Math.ceil(cy - ry); y <= cy + ry; y++) {
    const k = Math.sqrt(Math.max(0, 1 - ((y + 0.5 - cy) / ry) ** 2));
    const x = Math.floor(cx + Math.sin(phi) * rx * k);
    if (clip[y * 32 + x]) s.put(x, y, c);
  }
}

export const tatubola: OwDrawer = owSprite({ cx: 16, w: 16 }, (s, f) => {
  if (f < 2) {
    const b = f === 1 ? 0.5 : 0;
    // patinhas do lado de lá e rabinho curto blindado
    for (const x of [11, 19]) s.fill(cap(x + 1.5, 23, 1.2, x + 1.5, 26.5, 1), far(TSKIN));
    s.fill(path([[9, 24, 1.3], [6.5, 25.5, 1]]), SHELL);
    // cabeça: escudo triangular saindo por baixo do casco, orelhinha e focinho
    const head = poly([[20, 19 + b], [23.5, 19.5 + b], [28, 24 + b], [26.5, 25.5 + b], [20, 25.5 + b]]);
    s.fill(head, HEADS);
    s.paintIn(head, rect(19, 23.6 + b, 10, 3), TSKIN.md);
    s.fill(ell(21.5, 18.2 + b, 1.1, 1.5), TSKIN);
    s.put(24, 21.5 + b, INK);
    s.put(28, 24.5 + b, TSKIN.dp);
    const dome = ell(15, 21.5 + b, 7.5, 5.6);
    s.fill(dome, SHELL);
    // três cintas móveis no meio, escudos cheios de plaquinhas na frente e atrás
    for (const phi of [-0.35, 0, 0.35]) band(s, dome, 15, 21.5 + b, 7.5, 5.6, phi, SHELL.dp);
    for (const [x, y] of [[9, 20], [10, 23], [9, 25], [20, 20], [21, 23], [19, 25], [11, 18], [19, 18]] as P[]) s.paintIn(dome, rect(x, y + b, 0.6, 0.6), SHELL.sh);
    s.dots(PLATE, [10, 17 + b], [13, 16 + b], [15.5, 16 + b], [18, 16 + b]);
    for (const x of [10, 18.5]) s.fill(cap(x, 24.5, 1.3, x + 0.5, 26.5, 1.1), TSKIN);
    s.dots('#F2E6D0', [19, 27], [20, 27], [10, 27]);
  } else {
    // bola fechada rolando: as cintas giram de um quadro para o outro
    const k = f === 3 ? 1 : 0;
    const ball = ell(16, 21.5, 6.4, 6.2);
    s.fill(ball, SHELL);
    for (let i = -3; i <= 3; i++) band(s, ball, 16, 21.5, 6.4, 6.2, i * 0.5 + k * 0.25, SHELL.dp);
    // escudos da cabeça e do rabo encaixados na emenda (giram junto)
    const seam = k ? poly([[17, 27], [20, 23], [22.5, 25]]) : poly([[11, 21], [14, 16], [10, 17]]);
    s.paintIn(ball, seam, PLATE);
    s.dots(SHELL.rim, [13, 16], [14, 16], [12, 17]);
    // poeira levantada atrás
    s.dots('rgba(232,214,168,0.85)', [8 - k, 27], [6 - k * 2, 26], [8, 25 - k], [5, 27]);
  }
});

// ------------------------------------------------------------------ ararinha-azul (médio, voa)
const SPIX = ramp('#3C7ED6', { hi: '#6EB0F4', rim: '#C4ECFF', sh: '#24509E', dp: '#183070', ol: '#0A1236' });
const SPIX_DK = ramp('#2448A8', { hi: '#4878D0', rim: '#9CC8F4', sh: '#18307A', dp: '#101E54', ol: '#080C2C' });
const SPIX_HEAD = ramp('#A6C0DC', { hi: '#D2E4F4', rim: '#F4FAFF', sh: '#7890B8', dp: '#4E5E8A', ol: '#16203E' });

export const ararinha: OwDrawer = owSprite({ cx: 15, w: 10, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    { body: SPIX, wing: SPIX_DK, b: [15, 14, 4.2, 2.6], sh: [16, 13], span: 8, chord: 5, bands: [[3.5, SPIX.md]] },
    (dy) => {
      const tail = path([[11, 15 + dy, 1.6], [7, 16.5 + dy, 1.2], [3, 18 + dy, 0.8]]);
      s.fill(tail, SPIX);
      s.paintIn(tail, rect(0, 0, 6, 32), SPIX_DK.md);
    },
    (dy) => {
      s.fill(ell(20, 12.5 + dy, 2.8, 2.5), SPIX_HEAD);
      s.paint(ell(21, 13 + dy, 1.2, 1.1), '#4E5262');
      s.fill(poly([[21.5, 11.5 + dy], [23.8, 12 + dy], [24, 14.5 + dy], [22, 14.5 + dy]]), ramp('#2A2832', { hi: '#5A5868', ol: '#08060E' }));
      s.put(21, 12 + dy, '#F4F0E0');
    },
  );
});

// ------------------------------------------------------------------ asa-branca (pequeno, voa)
const PIGEON = ramp('#8E8496', { hi: '#B4AABA', rim: '#E4DCE8', sh: '#645A74', dp: '#433C58', ol: '#1A1628' });
const VINHO = ramp('#A06A78', { hi: '#C8909A', rim: '#F0C8C8', sh: '#7A4A62', dp: '#53304E', ol: '#24142A' });
const PDARK = ramp('#4A4458', { hi: '#6A6478', rim: '#9890A8', sh: '#322C40', dp: '#201C2E', ol: '#0E0A18' });

export const asabranca: OwDrawer = owSprite({ cx: 16, w: 8, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    // a faixa branca na dobra da asa é o que dá o nome
    { body: VINHO, wing: PIGEON, tip: PDARK, b: [16, 14, 3.6, 2.4], sh: [17, 13], span: 7, chord: 4, bands: [[2.2, '#F6F2EC']] },
    (dy) => {
      const tail = poly([[13, 13 + dy], [13, 16 + dy], [8, 17 + dy], [8, 13.5 + dy]]);
      s.fill(tail, PIGEON);
      s.paintIn(tail, rect(0, 0, 9.5, 32), PDARK.md);
    },
    (dy) => {
      s.fill(ell(20, 12.5 + dy, 2.2, 2), PIGEON);
      s.put(20, 14 + dy, '#5A8E7A');
      s.dots('#2A1E26', [22, 13 + dy], [23, 13 + dy]);
      s.put(20, 12 + dy, '#E86A3A');
    },
  );
});

// ------------------------------------------------------------------ carcará (médio, voa)
const CBROWN = ramp('#4A3628', { hi: '#6E5440', rim: '#A8886A', sh: '#33231E', dp: '#22161A', ol: '#0E0810' });
const CCREAM = ramp('#F2E6CC', { hi: '#FFF8E6', rim: '#FFFFFF', sh: '#D0BC9C', dp: '#9C8470', ol: '#3A2A26' });
const CCAP = ramp('#2A1E1E', { hi: '#4A3A36', rim: '#7A6460', sh: '#1A1214', ol: '#08040A' });

export const carcara: OwDrawer = owSprite({ cx: 15, w: 12, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    // janela clara nas primárias, perto da ponta
    { body: CBROWN, wing: CBROWN, tip: ramp('#D8CCB4'), b: [14.5, 13, 5, 2.8], sh: [16, 12], span: 10, chord: 5 },
    (dy) => {
      // cauda clara, barrada, com a ponta escura
      const tail = poly([[10.5, 12 + dy], [10.5, 14 + dy], [3.5, 15 + dy], [3.5, 11.5 + dy]]);
      s.fill(tail, CCREAM);
      for (const x of [8, 6.5]) s.paintIn(tail, rect(x, 0, 0.6, 32), CBROWN.hi);
      s.paintIn(tail, rect(0, 0, 4.6, 32), CBROWN.md);
    },
    (dy) => {
      // peito e pescoço creme, boné preto, cara laranja, bico claro alto
      s.fill(ell(19, 12.5 + dy, 2.6, 2.4), CCREAM);
      s.fill(ell(21.5, 11.5 + dy, 2.8, 2.5), CCREAM);
      s.paint(ell(21, 10 + dy, 2.6, 1.3), CCAP.md);
      s.put(19, 9.5 + dy, CCAP.md);
      s.put(18, 10 + dy, CCAP.md);
      s.put(22, 11 + dy, '#EE7432');
      s.put(23, 11 + dy, '#EE7432');
      s.put(22, 12 + dy, '#EE7432');
      s.put(23, 10.5 + dy, INK);
      s.fill(poly([[23.5, 11.5 + dy], [25.5, 12 + dy], [25.5, 14 + dy], [24, 13.5 + dy]]), ramp('#A8B8D0', { ol: '#1A1E30' }));
    },
  );
  for (const x of [11, 13, 15]) s.put(x, 14 + (f % 2), CCREAM.sh);
});

// ------------------------------------------------------------------ soldadinho-do-araripe (pequeno, voa)
const SWHITE = ramp('#F6F2EA', { hi: '#FFFFFF', rim: '#FFFFFF', sh: '#CFC8D4', dp: '#9A92AE', ol: '#2E2842' });
const SBLACK = ramp('#24222C', { hi: '#44424E', rim: '#7A7888', sh: '#18161E', dp: '#0E0C14', ol: '#06040A' });
const SRED = ramp('#E8302A', { hi: '#FF6A48', rim: '#FFC0A0', sh: '#B01C3C', dp: '#6E1038', ol: '#2A0818' });

export const soldadinho: OwDrawer = owSprite({ cx: 16, w: 6, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    { body: SWHITE, wing: SBLACK, b: [16, 15, 3.2, 2.2], sh: [17, 14], span: 6, chord: 3.5 },
    (dy) => {
      s.fill(poly([[13.5, 14 + dy], [13.5, 16.5 + dy], [10, 17 + dy], [10, 14 + dy]]), SBLACK);
    },
    (dy) => {
      s.fill(ell(19.5, 13.5 + dy, 2.3, 2.1), SWHITE);
      // capacete vermelho descendo pela nuca e topete na testa
      s.fill(uni(ell(19, 12.2 + dy, 2.4, 1.3), poly([[17, 12 + dy], [20, 11 + dy], [16.5, 14.5 + dy]]), poly([[20, 11.5 + dy], [21.5, 9.5 + dy], [22, 12 + dy]])), SRED, {
        ol: SRED.ol,
      });
      s.put(21, 13.5 + dy, INK);
      s.put(22.5, 14 + dy, SBLACK.md);
    },
  );
});

// ------------------------------------------------------------------ mocó (pequeno, pula)
const MOCO = ramp('#8E806E', { hi: '#B2A48E', rim: '#E2D6BE', sh: '#665866', dp: '#443A4C', ol: '#1E1824' });
const RUFUS = ramp('#B86A3A', { hi: '#D88E56', sh: '#8A4636', dp: '#5A2E30', ol: '#2A141A' });
const MBELLY = '#E2D2B0';

export const moco: OwDrawer = owSprite({ cx: 16, w: 12 }, (s, f) => {
  const b = f === 1 ? 0.5 : 0;
  const hop = f === 3 ? -3 : 0;
  const crouch = f === 2 ? 1 : 0;
  // patas ruivas: as de trás empurram no salto
  if (f === 3) {
    s.fill(cap(12, 23 + hop, 1.3, 9, 25 + hop, 1), RUFUS);
    s.fill(cap(19, 24 + hop, 1, 21, 26 + hop, 0.8), RUFUS);
  } else {
    s.fill(cap(14, 24, 1, 14, 26.6, 0.8), far(RUFUS));
    s.fill(cap(20, 24, 0.9, 20, 26.6, 0.8), far(RUFUS));
  }
  const body = ell(15, 23 + b + hop + crouch, 5.8, 3.6 - crouch * 0.5);
  s.fill(body, MOCO);
  s.paintIn(body, rect(9, 25 + hop + crouch, 12, 2), MBELLY);
  s.dots(MOCO.dp, [12, 21 + hop + crouch], [15, 20.5 + hop + crouch]);
  if (f !== 3) {
    s.fill(cap(12, 25, 1.1, 11.5, 26.6, 0.8), RUFUS);
    s.fill(cap(18.5, 25, 0.9, 18.5, 26.6, 0.8), RUFUS);
  }
  // cabeça de preá: focinho rombudo, orelha curta redonda, olho grande
  const hy = 21.5 + b + hop + crouch;
  s.fill(uni(ell(20.5, hy, 3, 2.6), ell(22.5, hy + 1, 1.8, 1.6)), MOCO);
  s.paint(ell(21.5, hy + 1.8, 1.6, 0.8), MBELLY);
  s.fill(ell(18.5, hy - 2.2, 1.2, 1.1), MOCO);
  s.put(18.5, hy - 2, RUFUS.sh);
  eye(s, 21, hy - 0.5, false, INK, f === 1);
  s.put(24, hy + 0.5, '#2A1E22');
});

// ------------------------------------------------------------------ onça-parda (grande)
const PUMA = ramp('#C8985E', { hi: '#E4BA7E', rim: '#FFE6B4', sh: '#9A6A48', dp: '#6A443E', ol: '#2A1620' });
const PCREAM = ramp('#F6EADA', { sh: '#D4BCA8', dp: '#A08A8E', ol: '#4A2C3A' });
const PDK = '#3A2422';

export const oncaparda: OwDrawer = owSprite({ cx: 15, w: 22 }, (s, f) => {
  const t = f === 1 ? 1 : 0;
  const g = gait(f);
  // cauda longa e grossa, ponta escura, em curva baixa
  const tail = path([[6, 16.5, 1.3], [3.5, 18.5, 1.1], [2.5, 22, 1], [3 + t, 25, 1], [5 + t, 25.5 - t, 1]]);
  s.fill(tail, PUMA);
  s.dots(PDK, [5 + t, 25.5 - t], [4 + t, 25.5]);
  const body = quad(s, f, { r: PUMA, legs: [8, 19], legTop: 20, lr: 1.8, stride: 1.6, foot: PCREAM.md, b: [14, 18, 9, 4.6] });
  s.paintIn(body, rect(6, 21.6, 16, 1.4), PCREAM.md);
  s.dots(PUMA.hi, [10, 15], [14, 14.5], [18, 15]);
  // cabeça menor e redonda, focinho claro com a marca escura do bigode
  const hy = 13.5 + (g !== 0 ? -0.5 : 0);
  // orelhas pequenas e redondas, de verso escuro
  s.fill(ell(24, hy - 3, 1, 1.2), far(PUMA));
  s.fill(ell(22.2, hy - 2.6, 1.1, 1.3), PUMA);
  s.put(22, hy - 3, PDK);
  const head = uni(ell(24, hy, 3.3, 2.9), ell(27, hy + 1.2, 2.2, 1.7));
  s.fill(head, PUMA);
  s.paintIn(head, ell(27.3, hy + 1.8, 2, 1.3), PCREAM.md);
  s.paintIn(head, rect(25.5, hy + 0.6, 0.6, 1.4), PDK);
  s.dots('#B8606A', [29, hy + 0.6]);
  s.put(28, hy + 2.6, PDK);
  eye(s, 25.5, hy - 1, false, '#C8C83A');
  s.put(26, hy - 1, PCREAM.md);
});

// ------------------------------------------------------------------ veado-catingueiro (grande, pula)
const DEER = ramp('#A07E5C', { hi: '#C4A07A', rim: '#ECD4B0', sh: '#765A50', dp: '#4E3A44', ol: '#221822' });
const DCREAM = ramp('#F4ECDE', { hi: '#FFFFFF', sh: '#D2C2B4', dp: '#9C8C94', ol: '#3A2C34' });
const HOOF = '#2A2024';
const ANTLER = ramp('#5A4436', { hi: '#8A6E58', rim: '#C4A88A', sh: '#3E2E2A', ol: '#160E10' });

export const veado: OwDrawer = owSprite({ cx: 15, w: 18 }, (s, f) => {
  const b = f === 1 ? 0.5 : 0;
  const bound = f === 3 ? -2 : 0;
  // rabo branco erguido (a "bandeira"), atrás do corpo
  s.fill(ell(7, 13 + bound, 1.6, 2), DCREAM);
  // pernas finas e compridas; no salto, as de trás esticam e as da frente dobram
  const leg = (x: number, x1: number, y1: number, r: ReturnType<typeof ramp>) => {
    s.fill(cap(x, 17 + bound + b, 1.1, x1, y1, 0.75), r);
    s.put(x1, y1 + 0.5, HOOF);
  };
  const g = gait(f);
  if (f === 3) {
    leg(10, 6, 25, far(DEER));
    leg(19.5, 22, 22, far(DEER));
  } else {
    leg(10.5, 10.5 - g, 26.5, far(DEER));
    leg(20, 20 + g, 26.5, far(DEER));
  }
  const body = ell(14, 15.5 + bound + b, 7, 3.6);
  s.fill(body, DEER);
  s.paintIn(body, rect(8, 18 + bound + b, 13, 2), DCREAM.md);
  s.dots(DEER.hi, [11, 13 + bound], [15, 12.5 + bound]);
  if (f === 3) {
    leg(9, 4.5, 24, DEER);
    leg(18.5, 21, 21, DEER);
  } else {
    leg(9.5, 9.5 + g, 26.5, DEER);
    leg(19, 19 - g, 26.5, DEER);
  }
  // pescoço erguido, cabeça fina, orelhões e chifres curtos e retos
  const hy = 8 + bound + b;
  s.fill(cap(19, 14 + bound + b, 2.2, 22, hy + 2, 1.6), DEER);
  s.fill(ell(19.5, hy - 1, 1.2, 2), DEER);
  s.fill(poly([[21, hy - 2], [21.5, hy - 5.5], [22.3, hy - 2]]), ANTLER, { flat: true });
  const head = uni(ell(23, hy + 1, 2.6, 2.2), cap(23, hy + 1.5, 1.8, 27, hy + 2.8, 1.2));
  s.fill(head, DEER);
  s.paintIn(head, rect(25, hy + 3, 3, 1), DCREAM.md);
  s.put(28, hy + 2.5, HOOF);
  eye(s, 23.5, hy + 0.5, false, INK, f === 1);
  s.put(19.5, hy - 1, DEER.sh);
});

// ------------------------------------------------------------------ cascavel (médio, bote)
// Parada: enrodilhada, pescoço em S e o chocalho de pé. Andando: rasteja em S.
const CSKIN = ramp('#AE8C5C', { hi: '#D0B07A', rim: '#F2E0B0', sh: '#80644A', dp: '#56423A', ol: '#22181A' });
const DIAMOND = '#5A4232';
const RATTLE = ramp('#D8C8A4', { hi: '#F4E8C8', rim: '#FFFFFF', sh: '#A89878', dp: '#6E6258', ol: '#2A2420' });

export const cascavel: OwDrawer = owSprite({ cx: 15, w: 20 }, (s, f) => {
  if (f < 2) {
    const shake = f === 1 ? 1 : 0;
    // chocalho de pé atrás da rodilha, em gomos; tremido no quadro 1
    const rattle = path([[10, 23, 1.2], [9, 19.5, 1.2], [9 + shake * 0.5, 16.5, 1]]);
    s.fill(rattle, RATTLE);
    for (const y of [17, 19, 21]) s.paintIn(rattle, rect(0, y, 32, 0.6), RATTLE.sh);
    if (shake) s.dots('rgba(255,246,214,0.9)', [7, 16], [6, 18], [11, 16], [12, 18]);
    // rodilha em espiral: cada trecho por cima do anterior, o contorno separa as voltas
    const at = (t: number): [number, number, number] => {
      const rx = 7 - t * 1.1;
      return [15 + Math.cos(t) * rx, 24.2 - t * 0.55 + Math.sin(t) * rx * 0.36, 1.6 - t * 0.06];
    };
    for (let t0 = -0.4; t0 < 4.6; t0 += 1.25) {
      const pts: [number, number, number][] = [];
      for (let t = t0; t <= t0 + 1.25 + 0.01; t += 0.25) pts.push(at(t));
      const seg = path(pts);
      s.fill(seg, CSKIN);
      const [mx, my] = at(t0 + 0.62);
      s.paintIn(seg, rect(mx - 0.5, my - 0.5, 1, 0.8), DIAMOND);
    }
    // pescoço curto e a cabeça larga, triangular, deitada no alto da rodilha
    const hy = 17.5 - shake * 0.5;
    s.fill(path([[14, 21, 1.4], [17, 20, 1.3], [19, hy + 0.8, 1.2]]), CSKIN);
    const head = poly([[18, hy - 2], [21.5, hy - 1.7], [25, hy + 0.2], [21.5, hy + 2], [18, hy + 2]]);
    s.fill(head, CSKIN);
    s.paintIn(head, rect(18, hy - 2, 4, 1.2), CSKIN.dp);
    s.line(19, hy - 0.5, 22, hy - 0.5, DIAMOND);
    s.put(22, hy - 0.5, '#F0D23A');
    s.put(22, hy, INK);
    if (!shake) s.dots('#2A1A22', [26, hy + 0.5], [27, hy], [27, hy + 1]);
  } else {
    const ph = f === 2 ? 0 : Math.PI;
    const pts: [number, number, number][] = [];
    for (let x = 5; x <= 22; x += 1.5) {
      const t = (x - 5) / 17;
      pts.push([x, 24 + Math.sin(x * 0.45 + ph) * 2 * (0.5 + t * 0.5), t < 0.15 ? 1 + t * 3 : 1.7]);
    }
    const body = path(pts);
    s.fill(body, CSKIN);
    for (let i = 2; i < pts.length - 1; i += 2) {
      s.paint(rect(pts[i][0] - 0.5, pts[i][1] - 0.6, 1, 0.6), DIAMOND);
      s.put(pts[i][0] + 1, pts[i][1] - 0.5, CSKIN.rim);
    }
    // chocalho na ponta da cauda, um pouco erguido
    const [tx, ty] = pts[0];
    s.fill(path([[tx, ty, 1], [tx - 3, ty - 1, 1.1]]), RATTLE);
    s.put(tx - 1.5, ty - 1, RATTLE.dp);
    const [hx, hy] = pts[pts.length - 1];
    const head = poly([[hx, hy - 1.6], [hx + 3, hy - 1.8], [hx + 5.5, hy], [hx + 3, hy + 1.8], [hx, hy + 1.6]]);
    s.fill(head, CSKIN);
    s.put(hx + 3, hy - 0.5, '#F0D23A');
    s.put(hx + 3, hy, INK);
  }
});

// ------------------------------------------------------------------ teiú (médio)
const TEIU = ramp('#34343C', { hi: '#56565E', rim: '#8A8A96', sh: '#22222C', dp: '#16161E', ol: '#08080E' });
const TCREAM = '#EEE6CC';

export const teiu: OwDrawer = owSprite({ cx: 15, w: 22 }, (s, f) => {
  const g = gait(f);
  const sw = g * 1.2;
  // patas abertas para os lados (lagarto rasteiro)
  const foot = (x0: number, y0: number, x1: number, y1: number, r: ReturnType<typeof ramp>) => s.fill(cap(x0, y0, 1.1, x1, y1, 0.9), r);
  foot(12, 23, 11 - sw, 25.5, far(TEIU));
  foot(19, 23, 20 + sw, 25.5, far(TEIU));
  // cauda longa afinando, com anéis claros
  const tail = path([[10, 24.5, 1.8], [6, 25.5 - sw * 0.5, 1.4], [3, 25 + sw * 0.5, 1], [1, 23.5, 0.6]]);
  s.fill(tail, TEIU);
  for (const x of [3.5, 6, 8.5]) s.paintIn(tail, rect(x, 0, 0.6, 32), TCREAM);
  const body = ell(15.5, 24, 6, 2.6);
  s.fill(body, TEIU);
  // faixas transversais de pintas claras
  for (const x of [11, 14, 17, 20]) for (const y of [22.5, 24.5]) s.paintIn(body, rect(x, y, 0.6, 0.6), TCREAM);
  s.paintIn(body, rect(9, 26, 14, 1), '#5A5A5E');
  foot(11, 25, 9.5 + sw, 27, TEIU);
  foot(19, 25, 20.5 - sw, 27, TEIU);
  // cabeça comprida de focinho fino, papada clara
  const hy = 23 + (f === 1 ? -0.5 : 0);
  const head = uni(ell(23, hy, 2.8, 2.1), cap(23, hy + 0.3, 1.8, 27, hy + 0.8, 1.1));
  s.fill(head, TEIU);
  s.paintIn(head, rect(21, hy + 1, 7, 1.2), TCREAM);
  s.dots(TCREAM, [22, hy - 1], [24, hy - 1.5]);
  s.put(24, hy - 0.5, '#E8D8A0');
  s.put(25, hy - 0.5, INK);
  // língua bifurcada rosada, de vez em quando
  if (f === 1 || f === 3) s.dots('#E07A8E', [29, hy + 1], [30, hy + 0.5], [30, hy + 1.5]);
});

// ------------------------------------------------------------------ sapo-cururu (pequeno, pula)
const TOAD = ramp('#9C7A4A', { hi: '#BE9C66', rim: '#DCC08A', sh: '#6E5240', dp: '#4A3634', ol: '#1E1418' });
const TBELLY = '#EEE0BC';
const GLAND = ramp('#C4A06A', { hi: '#E4C48E', rim: '#FFF0C0', sh: '#8E6E4E', dp: '#5A4440', ol: '#22181C' });

export const cururu: OwDrawer = owSprite({ cx: 16, w: 13 }, (s, f) => {
  const jump = f === 3;
  const hop = jump ? -4 : f === 2 ? 0.5 : 0;
  const b = f === 1 ? 0.5 : 0;
  // perna de trás do lado de lá
  s.fill(ell(11.5, 25.5 + hop * 0.5, 2.2, 1.6), far(TOAD));
  // corpo atarracado e cabeça larga numa só silhueta: traseiro baixo, ombros altos (postura sentada)
  const hy = Math.floor(22 + hop + b);
  const body = uni(ell(14.5, 24 + hop + b * 0.5, 5.2, 3.2), ell(18.5, 22.8 + hop + b, 3.6, 2.8), ell(21, hy, 3, 2.4), ell(23, hy + 0.8, 1.6, 1.5));
  s.fill(body, TOAD, { rim: false });
  s.paintIn(body, rect(18.5, hy + 1.6, 6, 2), TBELLY);
  // manchas escuras e verrugas claras no dorso
  for (const [x, y] of [[11, 22.5], [14, 21.5], [13, 24.2]] as P[]) s.paintIn(body, ell(x + 0.5, y + 0.5 + hop + b * 0.5, 1, 0.7), TOAD.dp);
  s.dots(TOAD.rim, [12, 21 + hop], [15.5, 20.5 + hop], [10, 23 + hop]);
  // glândula de veneno saliente atrás do olho; olho dourado sob a crista escura
  s.paintIn(body, ell(17.6, hy - 1, 1.8, 1), GLAND.hi);
  s.paintIn(body, rect(16, hy - 0.2, 3.5, 0.6), GLAND.sh);
  // olho saltado acima da linha da cabeça
  s.fill(ell(20.6, hy - 2, 1.5, 1.3), TOAD, { rim: false });
  s.dots('#F0B83A', [20, hy - 2], [21, hy - 2], [20, hy - 1.5]);
  s.put(21, hy - 1.5, INK);
  s.line(19.5, hy - 3, 21, hy - 3, TOAD.dp);
  s.line(21, hy + 1.2, 24, hy + 1, TOAD.dp);
  // perna de trás dobrada (ou esticada no salto) e braço reto na frente
  if (jump) {
    s.fill(path([[12, 23 + hop, 1.7], [9, 25 + hop, 1.2], [6.5, 25.5 + hop, 0.9]]), TOAD);
    s.dots(TOAD.sh, [5, 26 + hop], [6, 26 + hop]);
    s.fill(cap(20, 24 + hop, 1, 22.5, 25.5 + hop, 0.8), TOAD);
  } else {
    s.fill(ell(12.5, 25 + b * 0.5, 2.6, 1.9), TOAD);
    s.fill(cap(13, 26.4, 0.9, 16, 26.6, 0.8), TOAD);
    s.fill(cap(20.5, 24 + b, 1, 20.5, 26.6, 0.8), TOAD);
    s.dots(TOAD.sh, [21, 27], [22, 27]);
  }
});

// ------------------------------------------------------------------ jandaíra (pequeno, voa)
const BEE = ramp('#4A3424', { hi: '#7A5A3E', rim: '#C49A6A', sh: '#2E1E1A', dp: '#1E1214', ol: '#0C0608' });
const BEE_Y = ramp('#E8B840', { hi: '#FFE07A', rim: '#FFF4C0', sh: '#B07A2A', dp: '#6E4626', ol: '#2A1810' });
const WINGC = 'rgba(226,244,255,0.75)';
const WINGE = 'rgba(70,90,120,0.8)';

export const jandaira: OwDrawer = owSprite({ cx: 16, w: 4, alpha: 0.5 }, (s, f) => {
  const y = 14 + (f === 1 ? 1 : 0) + (f >= 2 ? (f === 2 ? -1 : 0) : 0);
  const up = f % 2 === 0;
  // asas translúcidas: para cima ou abertas para os lados (borrão)
  const wing = up ? uni(ell(15.5, y - 3, 1.6, 2.6), ell(17, y - 3.5, 1.4, 2.4)) : uni(ell(14.5, y - 1.8, 2.8, 1.4), ell(15, y + 2.2, 2.6, 1.3));
  s.outline(wing, WINGE);
  s.paint(wing, WINGC);
  // abdômen listrado de amarelo, tórax peludo, cabeça escura
  const abd = ell(13.5, y + 0.5, 2.8, 2);
  s.fill(abd, BEE_Y);
  for (const x of [12, 14]) s.paintIn(abd, rect(x, 0, 0.7, 32), BEE.md);
  s.fill(ell(17, y, 1.8, 1.7), BEE);
  s.put(16.5, y - 1, BEE.rim);
  s.fill(ell(19.6, y + 0.4, 1.2, 1.2), BEE);
  s.put(20, y, '#F2E8C8');
  s.dots(BEE.ol, [21, y - 1.5], [22, y - 2.5]);
  // bolinha de pólen na pata de trás
  s.put(15.5, y + 2, '#F2A83A');
});
