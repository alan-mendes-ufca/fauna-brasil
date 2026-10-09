import { cap, type Drawer, ell, eye, INK, type Mask, path, poly, ramp, rect, Spr, uni, water } from '../../art/animals/kit';

// Sapinho-pingo-de-ouro, jararaca, caranguejo-uçá e boto-cinza na captura (64×64).

// ------------------------------------------------------------------ sapinho-pingo-de-ouro (pula)
const GOLD = ramp('#F4A818', { hi: '#FFD048', rim: '#FFF0A0', sh: '#D0701E', dp: '#8A3E22', ol: '#3A1A18' });
const SHIELD = ramp('#E0781E', { hi: '#F8A040', rim: '#FFD890', sh: '#B04A20', dp: '#702A24', ol: '#2E1218' });
const LITTER = ramp('#8A5A32', { hi: '#B07C4A', rim: '#D8A870', sh: '#5E3C2C', dp: '#3E2628', ol: '#1A1014' });

function litter(s: Spr): void {
  const a = poly([[4, 60], [10, 55], [22, 54], [26, 60]]);
  const b = poly([[24, 61], [32, 56], [48, 56], [52, 61]]);
  const c = poly([[44, 60], [52, 55], [61, 56], [60, 61]]);
  s.fill(a, LITTER, { n: 1 });
  s.fill(b, ramp('#6E7A32', { hi: '#98A646', rim: '#C8D678', sh: '#4A5A2E', dp: '#2E3E2C', ol: '#121C14' }), { n: 1 });
  s.fill(c, LITTER, { n: 1 });
  s.line(8, 58, 22, 57, LITTER.dp);
  s.line(30, 59, 48, 58, '#2E3E2C');
}

export const pingodeouro: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const jump = f === 3;
  const crouch = f === 2;
  const dy = jump ? -12 : crouch ? 2 : 0;
  litter(s);
  if (jump) s.dots('rgba(20,10,30,0.28)', [26, 60], [32, 61], [38, 60]);
  // pernas de trás dobradas (ou esticadas no salto)
  for (const sx of [-1, 1]) {
    const x = 32 + sx * 14;
    if (jump) {
      s.fill(path([[32 + sx * 10, 50 + dy, 4], [32 + sx * 16, 56 + dy, 2.8], [32 + sx * 20, 62 + dy * 0.6, 1.8]]), GOLD);
    } else {
      s.fill(ell(x, 51 + dy, 6.2, 5.6), GOLD);
      s.fill(ell(x + sx * 2, 56.5, 5, 2), GOLD, { n: 1 });
      s.dots(GOLD.dp, [x + sx * 5, 58], [x + sx * 3, 58.6], [x + sx * 7, 57.5]);
    }
  }
  // corpo gordinho
  const body = ell(32, 46 + dy + (crouch ? 1 : 0), 13.5, 11 - (crouch ? 1 : 0) + b * 0.5);
  s.fill(body, GOLD);
  s.paintIn(body, ell(32, 51 + dy, 8, 5), GOLD.hi);
  // escudo ósseo nas costas, com cruz de pontinhos
  const shield = ell(32, 42 + dy, 8.8, 5.2);
  s.fill(shield, SHIELD, { n: 2 });
  s.line(32, 38 + dy, 32, 46 + dy, SHIELD.dp);
  s.line(27, 42 + dy, 37, 42 + dy, SHIELD.dp);
  s.dots(SHIELD.rim, [28, 39 + dy], [36, 39 + dy], [30, 44 + dy], [34, 44 + dy]);
  // bracinhos
  for (const sx of [-1, 1]) {
    s.fill(cap(32 + sx * 9, 50 + dy, 2.4, 32 + sx * 8, 57 - (jump ? 2 : 0) + dy * (jump ? 0.6 : 0), 1.8), GOLD, { n: 1 });
    s.dots(GOLD.dp, [32 + sx * 6, 58 + (jump ? dy * 0.5 : 0)], [32 + sx * 8, 58 + (jump ? dy * 0.5 : 0)], [32 + sx * 10, 58 + (jump ? dy * 0.5 : 0)]);
  }
  // cabeça larga e olhos grandes
  const head = ell(32, 34 + dy + b * 0.5, 10, 7);
  s.fill(head, GOLD);
  s.paintIn(head, ell(32, 31 + dy, 6, 2), GOLD.hi);
  for (const sx of [-1, 1]) {
    s.fill(ell(32 + sx * 7, 29.5 + dy, 4.8, 4.6), GOLD);
    eye(s, 32 + sx * 7 - 3, 26.5 + dy, 6, 6, '#C84A1E', b === 1 && !jump);
  }
  s.line(25, 38 + dy, 39, 38 + dy, GOLD.dp);
  s.dots(INK, [30, 35 + dy], [34, 35 + dy]);
  s.dots(GOLD.rim, [27, 32 + dy], [37, 32 + dy]);
};

// ------------------------------------------------------------------ jararaca (bote)
const JR = ramp('#8A7A4A', { hi: '#AC9C64', rim: '#D8CC90', sh: '#625238', dp: '#42342E', ol: '#1C1218' });
const JBLOT = '#3E2E22';
const JBLOT_E = '#D8C890';
const JBELLY = ramp('#E8DCA8', { hi: '#FAF0C8', sh: '#BCAA7C', dp: '#847460', ol: '#2E2224' });

/** Mancha trapezoidal escura com borda clara. */
function blotch(s: Spr, clip: Mask, x: number, y: number, k = 1): void {
  const t = (m: number): [number, number][] => [[x - 4.2 * k + m, y - 2.4 * k + m], [x + 4.2 * k - m, y - 2.4 * k + m], [x + 2.6 * k - m, y + 2.4 * k - m], [x - 2.6 * k + m, y + 2.4 * k - m]];
  s.paintIn(clip, poly(t(0)), JBLOT_E);
  s.paintIn(clip, poly(t(1)), JBLOT);
}

export const jararaca: Drawer = (s, f) => {
  const strike = f >= 2;
  const g = f === 3 ? 1 : 0;
  const b = f === 1 ? 1 : 0;
  // cauda fina saindo da rodilha
  s.fill(path([[47, 55, 3], [55, 53, 2.2], [59, 48, 1.4]]), ramp('#B09A5E', { ol: '#26181C' }));
  for (const [cx, cy, rx, ry, off] of [[31, 53, 23, 6, 0], [31, 46.5, 18, 5.4, 4]] as number[][]) {
    const c = ell(cx, cy, rx, ry);
    s.fill(c, JR);
    for (let x = cx - rx + 4 + off; x < cx + rx - 2; x += 7) blotch(s, c, x, cy - 1.4, 0.8);
    s.paintIn(c, rect(cx - rx, cy + ry - 2.4, rx * 2, 3), JBELLY.md);
  }
  const pts: [number, number, number][] = strike
    ? [[22, 46, 5.4], [17, 40, 4.4], [26, 35, 3.8], [31 + g * 2, 32, 3.6]]
    : [[28, 44, 5.4], [23, 37, 4.4], [33, 30, 3.6], [32, 24 - b, 3.2]];
  const neck = path(pts);
  s.fill(neck, JR);
  blotch(s, neck, pts[1][0] + 1, pts[1][1], 0.8);
  blotch(s, neck, pts[2][0], pts[2][1] - 1, 0.7);
  if (!strike) {
    const hy = 16 - b;
    // cabeça triangular larga, com a fosseta e a língua
    const head = poly([[32, hy - 8], [38, hy - 6], [42, hy], [38, hy + 6], [34, hy + 9], [30, hy + 9], [26, hy + 6], [22, hy], [26, hy - 6]]);
    s.fill(head, JR);
    s.paintIn(head, rect(20, hy + 5, 24, 6), JBELLY.md);
    s.paintIn(head, poly([[28, hy - 7], [36, hy - 7], [34, hy - 3], [30, hy - 3]]), JBLOT);
    for (const sx of [-1, 1]) {
      s.line(32 + sx * 2, hy - 1, 32 + sx * 9, hy + 2.5, JBLOT);
      s.line(32 + sx * 2, hy - 0.2, 32 + sx * 9, hy + 3.4, JBLOT_E);
      eye(s, 32 + sx * 6 - 2.5, hy - 3, 5, 5, '#E0B83A', b === 1);
      s.dots(INK, [32 + sx * 6, hy - 1], [32 + sx * 6, hy]);
      s.dots(INK, [32 + sx * 3.5, hy + 2.6]);
    }
    s.line(28, hy + 8, 36, hy + 8, JR.dp);
    s.dots(JR.rim, [27, hy - 3], [29, hy - 5]);
    if (f === 1) {
      s.line(32, hy + 9, 32, hy + 12, '#D8344E');
      s.line(32, hy + 12, 30, hy + 14, '#D8344E');
      s.line(32, hy + 12, 34, hy + 14, '#D8344E');
    }
  } else {
    const hx = 32 + g;
    const hy = 22 + g * 2;
    const head = poly([[hx - 12, hy - 1], [hx - 6, hy - 10], [hx + 6, hy - 10], [hx + 12, hy - 1], [hx + 9, hy + 6], [hx + 4, hy + 10], [hx - 4, hy + 10], [hx - 9, hy + 6]]);
    s.fill(head, JR);
    s.fill(ell(hx, hy + 6, 7, 4.4 + g), ramp('#9A1F3B', { ol: '#2B0F1E' }), { rim: false, n: 1 });
    s.paint(ell(hx, hy + 7.4, 3.4, 1.6), '#EE7C8E');
    for (const sx of [-1, 1]) {
      s.paint(poly([[hx + sx * 5, hy + 2.4], [hx + sx * 3, hy + 2.4], [hx + sx * 4, hy + 7.4 + g]]), '#FFFFFF');
      eye(s, hx + sx * 6 - 2.5, hy - 5, 5, 5, '#E0B83A');
      s.line(hx + sx * 2, hy - 3, hx + sx * 10, hy + 1, JBLOT);
    }
    s.paintIn(head, poly([[hx - 3, hy - 10], [hx + 3, hy - 10], [hx + 1, hy - 3], [hx - 1, hy - 3]]), JBLOT);
  }
};

// ------------------------------------------------------------------ caranguejo-uçá (bote)
const CRB = ramp('#4A7AB8', { hi: '#78A4DC', rim: '#C0DCFF', sh: '#2E4E8E', dp: '#1E3068', ol: '#0A1236' });
const CLEG = ramp('#E87A3A', { hi: '#FFA860', rim: '#FFD8A0', sh: '#B84A2E', dp: '#782A2E', ol: '#321418' });
const CCLAW = ramp('#D8602E', { hi: '#F88C50', rim: '#FFC890', sh: '#A83A2C', dp: '#6A2230', ol: '#2E1018' });
const MUD = ramp('#6A5240', { hi: '#8A7058', rim: '#B09878', sh: '#463428', dp: '#2E2024', ol: '#120A10' });

/** Garra: palma e duas pinças que abrem em `open` (0–1), apontando em `ang` (rad). */
function claw(s: Spr, x: number, y: number, size: number, open: number, ang: number, flip = 1): void {
  const palm = ell(x, y, 5.4 * size, 4.6 * size);
  s.fill(palm, CCLAW);
  const tipx = (a: number, l: number) => [x + Math.cos(a) * l, y + Math.sin(a) * l] as const;
  for (const sgn of [-1, 1]) {
    const a = ang + sgn * (0.12 + open * 0.5) * flip;
    const [tx, ty] = tipx(a, 11.5 * size);
    const [bx, by] = tipx(a - sgn * 0.5 * flip, 4 * size);
    s.fill(poly([[bx, by], [x + Math.cos(a + sgn * 1.2) * 3.4 * size, y + Math.sin(a + sgn * 1.2) * 3.4 * size], [tx, ty]]), CCLAW);
    s.dots('#FFF0D0', [tx, ty]);
  }
  s.dots(CCLAW.rim, [x - 2, y - 2], [x - 1, y - 3]);
}

export const caranguejo: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const up = f === 2;
  const snap = f === 3;
  // lama com a toca ao fundo
  s.fill(poly([[0, 62], [4, 56], [20, 54], [44, 54], [60, 56], [64, 62]]), MUD, { n: 2 });
  s.paint(ell(32, 55.4, 9, 2), MUD.dp);
  s.dots(MUD.hi, [9, 58], [18, 57], [47, 58], [55, 57]);
  // pernas andadoras
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const sy = 44 + i * 3.4;
      const lift = (i === 1 && f === 1) ? -1 : 0;
      s.fill(path([[32 + sx * 12, sy, 1.8], [32 + sx * 19 + sx * i, sy - 3 + lift, 1.4], [32 + sx * 23 + sx * i * 2, 55 + i * 0.6, 1.1]]), CLEG, { n: 1 });
    }
  }
  // garras: a direita (grande) levanta e fecha
  const lOpen = up ? 0.3 : 0.1;
  claw(s, 14, up ? 33 : 40, 0.8, lOpen, -2.2, -1);
  s.fill(path([[22, 44, 2.6], [17, 42, 2.2], [14, up ? 36 : 41, 2]]), CLEG, { n: 1 });
  const ry = up ? 22 : snap ? 36 : 36;
  const rx = up ? 52 : snap ? 52 : 50;
  s.fill(path([[42, 44, 3], [50, 44, 2.6], [rx, ry + 5, 2.4]]), CLEG, { n: 1 });
  claw(s, rx, ry, 1.15, snap ? 0.05 : up ? 0.9 : 0.55, up ? -1.4 : -1.1);
  // carapaça larga
  const shell = uni(ell(32, 43 + b * 0.4, 15, 10), ell(32, 41, 12, 11));
  s.fill(shell, CRB);
  s.paintIn(shell, ell(30, 38, 9, 5), CRB.hi);
  s.line(32, 33, 32, 46, CRB.sh);
  s.line(24, 39, 40, 39, CRB.sh);
  s.dots(CRB.rim, [24, 35], [27, 33], [37, 33]);
  s.paintIn(shell, rect(0, 49, 64, 5), CRB.sh);
  // olhos em pedúnculos
  for (const sx of [-1, 1]) {
    s.fill(cap(32 + sx * 4, 33, 1.6, 32 + sx * 5, 27, 1.8), CLEG, { n: 1 });
    eye(s, 32 + sx * 5 - 2.5, 22.5 - b * 0.5, 5, 5, '#4A3A24', false);
  }
  // boca
  s.line(29, 36, 35, 36, CRB.dp);
  s.dots(CLEG.md, [30, 37], [34, 37]);
};

// ------------------------------------------------------------------ boto-cinza (mergulha)
const GRAY = ramp('#7C8EA0', { hi: '#A4B6C6', rim: '#DCE8F2', sh: '#566880', dp: '#384866', ol: '#1A2238' });
const GBACK = ramp('#5E6E86', { hi: '#8496AC', rim: '#B4C4D6', sh: '#40506A', dp: '#2A3650', ol: '#141A30' });
const GBELLY = ramp('#E0DCE4', { hi: '#F8F6FA', sh: '#B4B0C4', dp: '#7C7890', ol: '#2E2A44' });

export const botocinza: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  if (f < 2) {
    // tronco subindo da água, com a cabeça de testa arredondada e bico curto
    const trunk = path([[20, 62, 12], [22, 51 - b, 11.5], [27, 40 - b, 9.6], [32, 32 - b, 9]]);
    s.fill(trunk, GRAY);
    s.paintIn(trunk, path([[12, 58, 5], [15, 46, 4.4], [20, 36, 3.8]]), GBACK.md);
    s.paintIn(trunk, path([[28, 60, 5], [31, 48, 4], [34, 38, 3.4]]), GBELLY.md);
    // nadadeira dorsal triangular, curva, nas costas
    s.fill(poly([[16, 47], [9, 55], [18, 52]]), GBACK);
    // peitoral
    s.fill(poly([[28, 46], [22, 49], [14, 58], [20, 58], [28, 53]]), ramp('#6E8098', { hi: '#94A8BC', sh: '#4A5C76', dp: '#303E5E', ol: '#141A30' }));
    // cabeça
    const melon = ell(40, 19 - b, 6.4, 6);
    s.fill(uni(ell(37, 26 - b, 10, 9.5), melon), GRAY);
    s.paintIn(melon, ell(40, 15.5 - b, 4.4, 2.4), GBACK.hi);
    // rostro fino e comprido, mais claro por baixo
    const snout = path([[44, 29 - b, 3.6], [51, 31 - b, 2.8], [57, 33 - b, 2], [61, 35 - b, 1.5]]);
    s.fill(snout, GRAY);
    s.paintIn(snout, path([[45, 31.5 - b, 2], [51, 33.4 - b, 1.4], [57, 35 - b, 1], [60, 36.4 - b, 0.7]]), GBELLY.md);
    s.line(43, 30 - b, 61, 35.4 - b, INK);
    s.dots('#FFFFFF', [50, 33 - b], [54, 34 - b], [57, 35 - b]);
    eye(s, 36, 21.5 - b, 5, 5, '#4A3A52', b === 1);
    s.dots(GBACK.dp, [38, 11 - b], [39, 11 - b]);
    s.dots(GRAY.rim, [31, 24 - b], [30, 28 - b]);
    water(s, 28, 27, f);
  } else {
    const k = f === 3 ? 2 : 0;
    // só o dorso e a nadadeira dorsal fora da água
    const hump = ell(28 + k, 62, 19, 14);
    s.fill(hump, GBACK);
    s.paintIn(hump, ell(26 + k, 57, 11, 3.5), GRAY.md);
    s.fill(poly([[26 + k, 55], [38 + k, 55], [36 + k, 48], [30 + k, 40], [28 + k, 50]]), GBACK);
    s.dots(GBACK.rim, [31 + k, 43], [30 + k, 46]);
    s.fill(ell(14 + k, 57, 4.4, 2.6), GRAY, { n: 1 });
    s.dots('#C8F6FF', [14 + k, 52], [12 + k, 50], [16 + k, 49], [14 + k, 46]);
    water(s, 28 + k, 28, f, 3);
  }
};
