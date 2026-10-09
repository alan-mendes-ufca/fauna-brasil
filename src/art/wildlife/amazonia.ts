import { INK, ramp } from '../animals/kit';
import { cap, ell, eye, path, poly, rect, sub, uni, type P } from './kit';
import { far, flyer, gait, type OwDrawer, owSprite, quad } from './parts';

// Animais da Amazônia na exploração (32×32, olhando para a direita, base em y = 28).

const SPOT = '#2B1423';

// ------------------------------------------------------------------ onça-pintada (grande)
const GOLD = ramp('#E0A532', { hi: '#F6CE5C', rim: '#FFEFA8', sh: '#B2672A', dp: '#7A3A2C', ol: '#2E1424' });
const CREAM = ramp('#F6E9CB', { sh: '#D7B9A0', dp: '#A98A8A', ol: '#4A2C3A' });

export const onca: OwDrawer = owSprite({ cx: 15, w: 22 }, (s, f) => {
  const t = f === 1 ? 1 : 0;
  const tail = path([[6, 16, 1.4], [3, 18, 1.2], [2, 22 - t, 1.1], [3 + t, 25 - t, 1]]);
  s.fill(tail, GOLD);
  s.dots(SPOT, [3, 19], [2, 22 - t], [3 + t, 25 - t]);
  const body = quad(s, f, { r: GOLD, legs: [8, 19], legTop: 20, lr: 1.8, stride: 1.6, foot: CREAM.md, b: [14, 18, 9, 5] });
  s.paintIn(body, rect(6, 21, 16, 2), CREAM.md);
  for (const [x, y] of [[8, 15], [11, 17], [14, 15], [17, 17], [20, 15], [10, 20], [16, 20], [6, 18], [19, 19]] as P[]) {
    s.paintIn(body, ell(x, y, 1.2, 1), SPOT);
    s.paintIn(body, ell(x, y, 0.5, 0.5), '#9A5A26');
  }
  // cabeça
  const hy = 14 + (gait(f) !== 0 ? -0.5 : 0);
  s.fill(ell(22.5, hy - 3.5, 1.4, 1.4), GOLD);
  const head = uni(ell(24.5, hy, 4.5, 3.8), ell(27.5, hy + 1.5, 2.5, 2));
  s.fill(head, GOLD);
  s.paintIn(head, ell(28, hy + 2, 2.2, 1.6), CREAM.md);
  s.dots(SPOT, [22, hy - 1], [24, hy - 2], [21, hy + 1]);
  s.dots('#C8505E', [30, hy + 1]);
  s.put(29, hy + 3, INK);
  eye(s, 26, hy - 1, false, '#D8D83A');
  s.put(26, hy - 2, SPOT);
});

// ------------------------------------------------------------------ arara-vermelha (médio, voa)
const RED = ramp('#E3302B', { hi: '#FF6A40', rim: '#FFC890', sh: '#A81C44', dp: '#5E1040', ol: '#2A0A22' });
const BLUE = ramp('#2A62CC', { hi: '#52A6F4', rim: '#B8EAFF', sh: '#1C3C9E', dp: '#14226E', ol: '#0A0F3A' });

export const arara: OwDrawer = owSprite({ cx: 14, w: 10, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    { body: RED, wing: BLUE, b: [15, 13, 5, 3], sh: [16, 12], span: 10, chord: 6, bands: [[6, '#33A458'], [4, '#F4C42E'], [2.5, '#E3302B']] },
    (dy) => {
      const tail = path([[11, 14 + dy, 1.8], [6, 16 + dy, 1.3], [1, 18 + dy, 0.8]]);
      s.fill(tail, RED);
      s.paintIn(tail, rect(0, 0, 4, 32), BLUE.md);
    },
    (dy) => {
      s.fill(ell(20.5, 11 + dy, 3, 2.8), RED);
      s.paint(ell(21.5, 11.5 + dy, 1.5, 1.4), '#F8E2DA');
      s.fill(poly([[22.5, 10 + dy], [25, 10.5 + dy], [25.5, 13 + dy], [23.5, 13.5 + dy]]), ramp('#EFE0B8', { ol: '#2A1824' }));
      s.put(22, 10 + dy, INK);
    },
  );
});

// ------------------------------------------------------------------ boto-cor-de-rosa (grande, água)
const PINK = ramp('#F0A0B2', { hi: '#FFCAD2', rim: '#FFEDE6', sh: '#C86C8A', dp: '#823E66', ol: '#3E1A44' });
const BACKP = ramp('#C890B4', { hi: '#E0B4CC', rim: '#F8E4F0', sh: '#9A6094', dp: '#6A3C78', ol: '#321A48' });
const WATERLINE = rect(0, 0, 32, 25.5);

export const boto: OwDrawer = owSprite(
  null,
  (s, f) => {
    if (f < 2) {
      const b = f;
      // dorso, cabeça com o melão para fora d'água e o rostro longo, quase deitado
      s.fill(sub(ell(10, 26, 8, 2.6), rect(0, 25.6, 32, 6)), BACKP);
      const head = sub(uni(ell(19, 23.5 + b, 6, 3.6), ell(22, 21 + b, 3, 2.4)), rect(0, 25.6, 32, 6));
      s.fill(head, PINK);
      s.paintIn(head, ell(21, 19.5 + b, 2, 1), PINK.rim);
      // rostro longo e fino, bem destacado da testa
      const beak = path([[24.5, 22.5 + b, 1.3], [28, 23.4 + b, 1], [30.8, 24.4 + b, 0.8]]);
      s.fill(beak, PINK);
      s.line(25, 23.6 + b, 30, 24.8 + b, PINK.sh);
      eye(s, 21, 22.5 + b, false, '#6A4A8A', b === 1);
    } else {
      const k = f === 3 ? 1 : 0;
      // dorso arqueado com a crista baixa
      const back = sub(ell(15 + k, 26, 11, 5 - k), sub(ell(15 + k, 26, 11, 5 - k), WATERLINE));
      s.fill(back, BACKP);
      s.fill(poly([[13 + k, 22 - k], [18 + k, 22 - k], [16 + k, 19.5 - k]]), BACKP);
      s.paintIn(back, rect(20 + k, 20, 6, 6), PINK.md);
      if (k) s.dots('#C8F6FF', [26, 21], [27, 19], [25, 18]);
    }
  },
  { cx: 15, w: 20, y: 25 },
);

// ------------------------------------------------------------------ preguiça (médio)
const FUR = ramp('#B8A27A', { hi: '#DCCFA2', rim: '#F6EDCB', sh: '#8E7058', dp: '#5C4458', ol: '#2E2030' });

export const preguica: OwDrawer = owSprite({ cx: 15, w: 16 }, (s, f) => {
  const g = gait(f);
  const b = f === 1 ? 1 : 0;
  // braço do lado de lá, corpo encurvado, braço de cá com garras compridas
  s.fill(cap(18, 18, 1.6, 23 + g * 2, 25 - (g > 0 ? 1 : 0), 1.3), far(FUR));
  s.fill(cap(8, 22, 2, 7, 26.5, 1.8), far(FUR));
  const body = ell(13, 20 + b * 0.5, 7, 6);
  s.fill(body, FUR);
  s.dots('#8FA062', [10, 16], [13, 15], [8, 19], [15, 18]);
  s.dots(FUR.hi, [11, 17], [14, 19], [9, 21]);
  s.fill(cap(11, 23, 2, 12, 26.5, 1.8), FUR);
  s.fill(cap(17, 20, 1.8, 22 - g * 2, 25 + (g < 0 ? -1 : 0), 1.4), FUR);
  s.dots('#F2EACB', [23 - g * 2, 26 + (g < 0 ? -1 : 0)], [24 - g * 2, 26 + (g < 0 ? -1 : 0)]);
  // cabeça redonda: rosto claro com a faixa escura dos olhos
  const hy = 15 + b;
  s.fill(ell(20, hy, 4.4, 4), FUR);
  s.paint(ell(21.5, hy + 0.5, 2.8, 2.6), '#F2E6C4');
  s.paint(rect(19, hy - 0.5, 5.5, 1), '#4B3A40');
  s.put(21, hy - 0.5, INK);
  s.put(23, hy - 0.5, INK);
  s.put(22.5, hy + 1.5, '#2A2024');
  s.line(21, hy + 2.5, 23, hy + 2.5, '#8E7058');
});

// ------------------------------------------------------------------ perereca (pequeno)
const FROG = ramp('#6CBC3A', { hi: '#A8EC5A', rim: '#EBFFA0', sh: '#2E8E4C', dp: '#1A4C52', ol: '#0A2232' });
const TOE = '#F59A2E';

export const perereca: OwDrawer = owSprite({ cx: 16, w: 10 }, (s, f) => {
  const hop = f === 3 ? -5 : f === 2 ? 1 : 0;
  const b = f === 1 ? 0.5 : 0;
  if (f === 3) {
    s.fill(cap(13, 21 + hop, 1.5, 9, 24 + hop, 1), FROG);
    s.dots(TOE, [8, 25 + hop], [9, 25 + hop]);
  } else {
    s.fill(ell(13, 24 + hop * 0.5, 2.6, 2.2), FROG);
    s.dots(TOE, [11, 27], [12, 27], [13, 27]);
  }
  const body = ell(16, 23 + hop + b, 4.6, 3);
  s.fill(body, FROG);
  s.paintIn(body, rect(12, 24 + hop, 6, 1), '#3E6FE0');
  s.fill(ell(19.5, 21.5 + hop + b, 2.8, 2.4), FROG);
  s.fill(cap(19, 24 + hop, 1, 20, 26.5 + (f === 3 ? hop : 0), 0.8), FROG);
  s.dots(TOE, [20, 27 + (f === 3 ? hop : 0)], [21, 27 + (f === 3 ? hop : 0)]);
  // olho vermelho saltado
  s.paint(ell(20, 19.5 + hop + b, 1.6, 1.5), '#EC3A2C');
  s.put(20, 19.5 + hop + b, INK);
  s.put(19, 19 + hop + b, '#FFD0A0');
  s.line(20, 23 + hop, 22, 22.5 + hop, FROG.dp);
});

// ------------------------------------------------------------------ sucuri (grande)
const SKIN = ramp('#5C8E34', { hi: '#94C456', rim: '#DAF69A', sh: '#2F5E3A', dp: '#1B3434', ol: '#0A1620' });

function snake(ph: number, x0: number, x1: number, y: number, amp: number, r: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let x = x0; x <= x1; x += 2) {
    const t = (x - x0) / (x1 - x0);
    const rr = t < 0.15 ? r * (0.4 + t * 4) : t > 0.85 ? r * 1.05 : r;
    pts.push([x, y + Math.sin(x * 0.42 + ph) * amp * (0.4 + t * 0.6), rr]);
  }
  return pts;
}

export const sucuri: OwDrawer = owSprite({ cx: 15, w: 26 }, (s, f) => {
  const ph = [0, 0, 1.2, 2.6][f];
  const pts = snake(ph, 2, 24, 23, 2.6, 2.4);
  const body = path(pts);
  s.fill(body, SKIN);
  for (let i = 1; i < pts.length - 1; i += 2) {
    s.paintIn(body, ell(pts[i][0], pts[i][1] - 0.6, 1.2, 0.8), '#1E2E1C');
    s.put(pts[i][0] + 1, pts[i][1] + 1, '#D6C458');
  }
  const [hx, hy] = pts[pts.length - 1];
  s.fill(uni(ell(hx + 2.5, hy - 0.5, 3, 2.2), ell(hx + 4.5, hy, 1.8, 1.6)), SKIN);
  s.put(hx + 3, hy - 1.5, '#F6DC3A');
  s.put(hx + 3, hy - 1, INK);
  s.line(hx + 1, hy - 2, hx + 3, hy - 2.5, '#1E2E1C');
  if (f === 1) s.dots('#E83A5A', [hx + 7, hy + 0.5], [hx + 8, hy], [hx + 8, hy + 1]);
});

// ------------------------------------------------------------------ uacari-branco (médio)
const WHITE = ramp('#F8F3E8', { hi: '#FFFFFF', rim: '#FFFFFF', sh: '#CDBDC8', dp: '#9484A8', ol: '#4B3A5C' });
const BROWN = ramp('#8A6E55', { hi: '#B8946A', sh: '#5C4448', dp: '#3A2A3A', ol: '#241626' });

export const uacari: OwDrawer = owSprite({ cx: 15, w: 14 }, (s, f) => {
  const RED = ramp('#E8484A', { hi: '#FF7A62', rim: '#FFC0A0', sh: '#B82C54', ol: '#3C0F2B' });
  const redFace = (x: number, y: number) => {
    s.fill(ell(x, y, 3.8, 3.6), WHITE);
    s.fill(ell(x + 1.5, y + 0.5, 2.4, 2.6), RED, { ol: false });
    s.put(x + 2, y - 0.5, INK);
    s.put(x + 3, y + 1.5, '#7C1A4C');
  };
  if (f < 2) {
    // sentado, de costas retas, mãos no colo
    const b = f === 1 ? 1 : 0;
    s.fill(path([[11, 25, 1.4], [8, 26, 1.2], [6, 25, 1]]), BROWN);
    s.fill(ell(12, 25.5, 3.6, 1.8), far(WHITE));
    const body = ell(14, 21 + b * 0.5, 5, 6);
    s.fill(body, WHITE);
    s.dots('#E8E0F0', [12, 18], [11, 21], [15, 23]);
    s.fill(cap(17, 19, 1.4, 18, 24, 1.2), WHITE);
    s.dots(BROWN.md, [18, 25], [19, 25]);
    s.fill(ell(16, 26.3, 3, 1.3), BROWN, { ol: BROWN.ol });
    redFace(17, 13.5 + b);
  } else {
    // andando de quatro, cabeça baixa
    s.fill(path([[9, 18, 1.4], [6, 18, 1.2], [5, 20, 1]]), BROWN);
    const body = quad(s, f, { r: WHITE, legs: [11, 18], legTop: 21, lr: 1.6, stride: 1.4, foot: BROWN.md, b: [14, 19.5, 6, 3.8] });
    s.dots('#E8E0F0', [10, 17], [13, 16], [16, 17]);
    s.paintIn(body, rect(8, 22, 12, 1), WHITE.sh);
    redFace(21, 17);
  }
});

// ------------------------------------------------------------------ harpia (grande, voa)
const SLATE = ramp('#5A5E70', { hi: '#8A90A8', rim: '#D4D8EC', sh: '#383A54', dp: '#22213C', ol: '#0E0C20' });
const PALE = ramp('#F2EFE8', { hi: '#FFFFFF', sh: '#C8C4D8', dp: '#8C88A8', ol: '#2E2A48' });
const HEADG = ramp('#9A9EB2', { hi: '#C0C4D4', rim: '#E8EAF4', sh: '#6E7290', dp: '#484A66', ol: '#14122A' });

export const harpia: OwDrawer = owSprite({ cx: 15, w: 14, alpha: 0.6 }, (s, f) => {
  flyer(
    s,
    f,
    { body: PALE, wing: SLATE, tip: ramp('#2F2E44'), b: [15, 12, 6.5, 3.8], sh: [16, 11], span: 11, chord: 6 },
    (dy) => {
      // cauda em leque, faixas claras
      const tail = poly([[10, 11.5 + dy], [10, 14 + dy], [3.5, 16.5 + dy], [2.5, 10 + dy]]);
      s.fill(tail, SLATE);
      s.paintIn(tail, rect(4.5, 0, 1, 32), '#C8C4D8');
      s.paintIn(tail, rect(7.5, 0, 0.6, 32), '#C8C4D8');
    },
    (dy) => {
      s.paintIn(ell(15, 12 + dy, 6.5, 3.8), rect(17, 0, 3, 32), '#2F2E44');
      s.fill(cap(20, 8 + dy, 1.2, 17, 5 + dy, 0.6), SLATE);
      s.fill(ell(22, 10 + dy, 3.4, 3), HEADG);
      s.fill(poly([[24.5, 9.5 + dy], [27, 10.5 + dy], [26.5, 13 + dy], [24.5, 12 + dy]]), ramp('#34323E', { ol: '#0A0818' }));
      s.put(23, 9 + dy, INK);
      s.put(22, 8.5 + dy, '#E0902A');
    },
  );
  // garras amarelas penduradas
  if (f % 2 === 1) s.dots('#EDB82E', [15, 17], [16, 17], [16, 18]);
});

// ------------------------------------------------------------------ ariranha (médio, água)
const OTTER = ramp('#7A4C2E', { hi: '#A87850', rim: '#E8B888', sh: '#4C2E2E', dp: '#2E1C2E', ol: '#190F20' });

export const ariranha: OwDrawer = owSprite(
  null,
  (s, f) => {
    const up = f === 0 ? 1 : 0;
    const k = f === 3 ? 1 : 0;
    // dorso e cauda achatada rente à água
    const back = sub(uni(ell(13 + k, 25, 8, 2.5), path([[6 + k, 25, 1.6], [1 + k, 25.5, 1]])), rect(0, 25.6, 32, 6));
    s.fill(back, OTTER, { rim: false });
    s.dots(OTTER.hi, [10 + k, 23], [14 + k, 23]);
    // cabeça larga erguida, mancha clara na garganta
    const hy = 21 - up - (f >= 2 ? -1 : 0);
    s.fill(cap(19 + k, 24, 2.6, 21 + k, hy + 1, 2.4), OTTER);
    s.fill(ell(20.6 + k, hy - 2.4, 1, 1), OTTER);
    const head = uni(ell(22.5 + k, hy, 3.4, 2.7), ell(25.2 + k, hy + 0.8, 2, 1.5));
    s.fill(head, OTTER);
    // manchas claras da garganta (cada ariranha tem um desenho) e focinho escuro
    s.paintIn(head, ell(21.5 + k, hy + 2.3, 2, 1), '#F2E8D0');
    s.put(24 + k, hy + 2, '#F2E8D0');
    s.put(23 + k, hy - 1, INK);
    s.dots('#1E1218', [27 + k, hy + 0.5], [26 + k, hy]);
    s.line(24.5 + k, hy + 1.6, 26.5 + k, hy + 1.6, OTTER.dp);
  },
  { cx: 15, w: 20, y: 25 },
);

// ------------------------------------------------------------------ poraquê (médio, água)
const EEL = ramp('#46583A', { hi: '#748E50', rim: '#B8D480', sh: '#2A4034', dp: '#162630', ol: '#0A121C' });

export const poraque: OwDrawer = owSprite(
  null,
  (s, f) => {
    const ph = [0, 0.5, 1.4, 2.6][f];
    // dorso ondulando: só as cristas das ondas passam da linha d'água
    const pts: [number, number, number][] = [];
    for (let x = 2; x <= 20; x += 1.5) pts.push([x, 25.2 + Math.sin(x * 0.55 + ph) * 1.3, 1.1 + ((x - 2) / 18) * 1.5]);
    const back = sub(path(pts), rect(0, 25.6, 32, 6));
    s.fill(back, EEL);
    // cabeça achatada erguida para engolir ar, garganta alaranjada
    const up = f === 0 || f === 2 ? 1 : 0;
    const hy = 22.5 - up;
    const head = sub(uni(cap(19, 25, 2.4, 22, hy + 1, 2.6), ell(24, hy, 3.6, 2.5), ell(26.8, hy - 0.4 - up * 0.4, 2, 1.6)), rect(0, 25.8, 32, 6));
    s.fill(head, EEL);
    s.paintIn(head, rect(20, hy + 1.2, 10, 3), '#E8962E');
    s.paintIn(head, rect(20, hy + 2.2, 10, 3), '#B8602A');
    s.line(24, hy + 1, 28.5, hy - 0.2 - up * 0.4, '#3A1A1E');
    s.put(25, hy - 1, '#F0C838');
    s.put(25, hy - 0.5, INK);
    s.dots(EEL.rim, [22, hy - 2], [23, hy - 2.3]);
    // descarga: faíscas amarelas em volta
    if (f === 1 || f === 3) s.dots('#FFF35A', [20, 19], [21, 18], [28, 18], [29, 17], [24, 17], [12, 22], [13, 21], [6, 22], [7, 21]);
  },
  { cx: 15, w: 22, y: 25 },
);

// ------------------------------------------------------------------ morfo-azul (pequeno, voa)
const MBLUE = ramp('#2878E8', { hi: '#46B0FA', rim: '#8FE4FF', sh: '#1C4FC8', dp: '#0B2E6B', ol: '#0F0F24' });
const MBROWN = ramp('#7A5A3A', { hi: '#A07A50', rim: '#C8A070', sh: '#5A3E2A', ol: '#1A1010' });

export const morfo: OwDrawer = owSprite({ cx: 16, w: 6, alpha: 0.5 }, (s, f) => {
  const open = f % 2 === 0;
  const y = 14 + (f === 1 ? 1 : 0) + (f >= 2 ? -1 : 0);
  // asa vista de cima: anterior em triângulo para a frente, posterior arredondada atrás; d = 1 desce, −1 sobe
  const wing = (d: number, k: number) =>
    uni(
      poly([[18.5, y], [21.5, y + d * 8 * k], [17, y + d * 9 * k], [14.5, y + d * 3 * k], [14.5, y]]),
      ell(13, y + d * 4 * k, 3 * k, 3.6 * k),
    );
  if (open) {
    // asas abertas: a de lá sobe na tela (menor, mais escura), a de cá desce
    const farW = wing(-1, 0.8);
    const nearW = wing(1, 1);
    s.fill(farW, far(MBLUE), { ol: '#0F0F24' });
    s.fill(nearW, MBLUE, { ol: '#0F0F24' });
    // margem preta com pintas brancas e reflexo iridescente perto do corpo
    s.paintIn(nearW, sub(nearW, uni(ell(17, y + 3, 3.4, 5), ell(13.5, y + 3, 2.4, 3))), '#14163A');
    s.paintIn(farW, sub(farW, uni(ell(17, y - 2.6, 3, 4), ell(13.5, y - 2.5, 2, 2.4))), '#14163A');
    s.paintIn(nearW, ell(16.5, y + 2.5, 1.4, 2), MBLUE.rim);
    s.dots('#F3EFE0', [20, y + 7], [18, y + 8], [10, y + 5], [11, y + 7]);
    s.dots('#C8C4D8', [20, y - 6], [11, y - 5]);
  } else {
    // fechadas para cima: verso marrom com os ocelos amarelos
    const w = wing(-1, 1);
    s.fill(w, MBROWN);
    s.paintIn(w, rect(10, y - 3, 12, 0.6), MBROWN.sh);
    for (const [ox, oy] of [[18, y - 5.5], [13, y - 4]] as P[]) {
      s.paint(ell(ox, oy, 1.1, 1.1), '#F2D86A');
      s.put(ox - 0.5, oy - 0.5, INK);
    }
  }
  // corpo fino e antenas
  s.line(11, y, 19, y, '#2A1A26');
  s.line(12, y + 1, 18, y + 1, '#120A16');
  s.put(19, y, '#5A4048');
  s.dots('#2A1A36', [20, y - 1], [21, y - 2], [22, y - 3], [21, y - 1], [22, y - 1.5], [23, y - 2]);
});

// ------------------------------------------------------------------ tracajá (médio)
const SHELL = ramp('#5E6E3A', { hi: '#94A84C', rim: '#DCEA8C', sh: '#3A4E34', dp: '#223030', ol: '#0E161C' });
const TSKIN = ramp('#58684A', { hi: '#8AA060', sh: '#38483E', dp: '#222E30', ol: '#0E161C' });

export const tracaja: OwDrawer = owSprite({ cx: 15, w: 18 }, (s, f) => {
  const g = gait(f);
  const hx = f >= 2 ? 1 : 0;
  // patas e cabeça saindo do casco
  for (const [x, d] of [[9, 1], [20, -1]] as P[]) s.fill(ell(x + 1 + g * d, 24.5, 1.6, 1.4), far(TSKIN));
  s.fill(cap(20, 22, 1.6, 24 + hx, 21 - hx, 1.6), TSKIN);
  s.fill(ell(25 + hx, 21 - hx, 2.4, 1.8), TSKIN);
  s.dots('#F6D63A', [25 + hx, 20 - hx], [26 + hx, 20 - hx], [24 + hx, 22 - hx]);
  s.put(26 + hx, 21 - hx, INK);
  s.fill(ell(14, 25, 8, 2), ramp('#D8CC9E', { ol: '#2E2A38' }));
  const dome = ell(14, 21, 8, 4.6);
  s.fill(dome, SHELL);
  for (const x of [11, 14, 17]) s.paintIn(dome, rect(x, 0, 0.5, 32), SHELL.dp);
  s.paintIn(dome, rect(0, 23, 32, 0.5), SHELL.dp);
  s.dots(SHELL.rim, [12, 17], [15, 17]);
  for (const [x, d] of [[9, -1], [19, 1]] as P[]) s.fill(ell(x + g * d, 26, 1.7, 1.4), TSKIN);
});
