import { cap, type Drawer, ell, eye, hurtEye, INK, type Mask, path, poly, pose, ramp, rect, Spr, sub, uni, water, type Pt } from './kit';

// ------------------------------------------------------------------ perereca
const FROG = ramp('#6CBC3A', { hi: '#A8EC5A', rim: '#EBFFA0', sh: '#2E8E4C', dp: '#1A4C52', ol: '#0A2232' });
const FBELLY = ramp('#F8F4E6', { hi: '#FFFFFF', sh: '#D8D0CC', dp: '#A298B0', ol: '#2E3A4A' });
const FEYE = ramp('#EC3A2C', { hi: '#FF7A4A', rim: '#FFD0A0', sh: '#B01C3C', dp: '#6A1040', ol: '#220C22' });
const TOE = ramp('#F59A2E', { hi: '#FFD060', sh: '#C85A30', dp: '#7A3030', ol: '#3A1624' });
const FLANK = '#3E6FE0';

function frogEye(s: Spr, x: number, y: number, blink: boolean): void {
  if (pose.mode === 'hurt') {
    s.fill(ell(x, y, 6, 6), FROG);
    hurtEye(s, x - 3, y - 3, 6, 6, FROG.ol);
    return;
  }
  if (blink) {
    s.fill(ell(x, y, 6, 6), FROG);
    s.line(x - 4, y, x + 4, y, FROG.ol);
    s.line(x - 3, y + 1, x + 3, y + 1, FROG.sh);
    return;
  }
  s.fill(ell(x, y, 6.2, 6.2), FEYE);
  s.paint(ell(x, y + 0.3, 1.5, 3.8), INK);
  s.dots('#FFFFFF', [x - 3, y - 3], [x - 2, y - 3], [x - 3, y - 2]);
  s.put(x + 2.5, y + 2.5, '#FFB080');
  // pálpebra verde sobre o topo do olho
  s.paintIn(ell(x, y, 6.2, 6.2), ell(x, y - 6.6, 7.4, 3.6), FROG.md);
  s.line(x - 5, y - 3, x + 4, y - 3, FROG.sh);
}

export const perereca: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  if (f < 2) {
    // coxas dobradas dos lados e pés com ventosas laranja
    for (const sx of [-1, 1]) {
      s.fill(ell(32 + sx * 18, 49, 7.5, 9), FROG);
      s.paintIn(ell(32 + sx * 18, 49, 7.5, 9), ell(32 + sx * 21, 50, 2.4, 6), FLANK);
      s.fill(ell(32 + sx * 15, 57, 8, 2.8), TOE);
      s.dots(TOE.hi, [32 + sx * 11, 55], [32 + sx * 14, 55], [32 + sx * 17, 55]);
    }
    const body = ell(32, 47, 15, 11 + b * 0.5);
    s.fill(body, FROG);
    s.fill(ell(32, 50, 9.5, 8.5), FBELLY, { ol: false });
    for (const sx of [-1, 1]) {
      s.fill(cap(32 + sx * 10, 48, 3.5, 32 + sx * 11, 55, 3), FROG);
      s.fill(ell(32 + sx * 11.5, 57, 4.5, 2.2), TOE);
      s.dots(TOE.hi, [32 + sx * 8.5, 56], [32 + sx * 11.5, 55.5], [32 + sx * 14.5, 56]);
    }
    // cabeça larga com olhos saltados
    s.fill(ell(32, 39 + b * 0.5, 16, 9), FROG);
    s.fill(ell(32, 43 + b, 7, 3 + b * 0.6), FBELLY, { ol: false, rim: false });
    frogEye(s, 22, 31 + b * 0.5, b === 1);
    frogEye(s, 42, 31 + b * 0.5, b === 1);
    s.dots(FROG.dp, [30, 36], [34, 36]);
    s.line(18, 40, 20, 42, INK);
    s.line(20, 42, 44, 42, INK);
    s.line(44, 42, 46, 40, INK);
    s.dots('#FFFFFF', [24, 37], [40, 37]);
  } else {
    const g = f === 3 ? 3 : 0;
    // no ar: braços abertos, pernas esticadas
    for (const sx of [-1, 1]) {
      s.fill(cap(32 + sx * 8, 45, 4.5, 32 + sx * (17 - g * 0.5), 56 + g * 0.3, 3, ), FROG);
      s.fill(ell(32 + sx * (18 - g * 0.5), 58, 6, 2.5), TOE);
      s.fill(cap(32 + sx * 9, 31 + g, 3.2, 32 + sx * 22, 27 + g * 2, 2.6), FROG);
      s.fill(ell(32 + sx * 23.5, 26.5 + g * 2, 3.5, 3), TOE);
      s.dots(TOE.hi, [32 + sx * 23, 25 + g * 2]);
    }
    const body = ell(32, 38 + g * 0.5, 11, 13);
    s.fill(body, FROG);
    s.fill(ell(32, 41, 7, 9.5), FBELLY, { ol: false });
    s.paintIn(body, ell(32 - 10.5, 40, 1.8, 6), FLANK);
    s.paintIn(body, ell(32 + 10.5, 40, 1.8, 6), FLANK);
    s.fill(ell(32, 24 + g * 0.6, 15, 8), FROG);
    frogEye(s, 23, 17 + g * 0.6, false);
    frogEye(s, 41, 17 + g * 0.6, false);
    s.line(19, 26 + g * 0.6, 22, 28 + g * 0.6, INK);
    s.line(22, 28 + g * 0.6, 42, 28 + g * 0.6, INK);
    s.line(42, 28 + g * 0.6, 45, 26 + g * 0.6, INK);
    s.paint(ell(32, 29.5 + g * 0.6, 4, 1.2), '#C44060');
  }
};

// ------------------------------------------------------------------ sucuri
const SKIN = ramp('#5C8E34', { hi: '#94C456', rim: '#DAF69A', sh: '#2F5E3A', dp: '#1B3434', ol: '#0A1620' });
const SBELLY = ramp('#E4D8A8', { sh: '#B8A878', dp: '#7A7060', ol: '#2A2E30' });
const BLOTCH = '#1E2E1C';
const RING = '#D6C458';

function blotch(s: Spr, clip: Mask, x: number, y: number, k = 1): void {
  s.paintIn(clip, ell(x, y, 3.8 * k, 2.6 * k), RING);
  s.paintIn(clip, ell(x, y + 0.2, 2.8 * k, 1.8 * k), BLOTCH);
  s.paintIn(clip, ell(x - 0.8, y - 0.6, 0.8, 0.5), '#4A6A30');
}

export const sucuri: Drawer = (s, f) => {
  const strike = f >= 2;
  const g = f === 3 ? 1 : 0;
  const b = f === 1 ? 1 : 0;

  // espirais
  const coils: [number, number, number, number][] = [[32, 54, 26, 6.5], [32, 47.5, 22, 6]];
  for (const [cx, cy, rx, ry] of coils) {
    const c = ell(cx, cy, rx, ry);
    s.fill(c, SKIN);
    for (let x = cx - rx + 4; x < cx + rx - 3; x += 7) blotch(s, c, x, cy - 1.5, 0.9);
    s.paintIn(c, rect(cx - rx, cy + ry - 2.5, rx * 2, 3), SBELLY.md);
  }
  // pescoço em S
  const neckPts: [number, number, number][] = strike
    ? [[24, 48, 8], [20, 42, 7], [32, 37, 6.5], [32 + g, 31, 6.5]]
    : [[30, 46, 8], [25, 39, 6.5], [35, 31, 5.8], [32, 24, 5.2 + b * 0.3]];
  const neck = path(neckPts);
  s.fill(neck, SKIN);
  for (let i = 0; i < neckPts.length - 1; i++) {
    const [x, y] = neckPts[i];
    blotch(s, neck, x + (i % 2 ? 1 : -1), y, 0.95 - i * 0.07);
  }
  s.paintIn(neck, ell(32, 29, 3.4, 5), SBELLY.md);

  if (!strike) {
    const hy = 17 - b;
    const head = uni(ell(32, hy, 10, 7), ell(32, hy + 6, 6, 5));
    s.fill(head, SKIN);
    s.paintIn(head, ell(32, hy + 9, 4.5, 2.8), SBELLY.md);
    s.line(24, hy - 3, 26, hy, BLOTCH);
    s.dots(BLOTCH, [32, hy - 6], [31, hy - 4], [33, hy - 4], [32, hy - 2]);
    for (const sx of [-1, 1]) {
      const ex = 32 + sx * 6.5;
      if (pose.mode === 'hurt') {
        hurtEye(s, ex - 2.5, hy - 3.5, 5, 5);
        continue;
      }
      s.paint(ell(ex, hy - 1, 3, 3), INK);
      s.paint(ell(ex, hy - 1, 2.2, 2.2), '#F6DC3A');
      s.line(ex, hy - 2, ex, hy, INK);
      s.put(ex - 1, hy - 2, '#FFFFFF');
      s.line(ex + sx * 1, hy + 2, ex + sx * 3, hy + 6, BLOTCH);
    }
    s.dots(INK, [30, hy + 8], [34, hy + 8]);
    s.line(28, hy + 10, 32, hy + 11, INK);
    s.line(36, hy + 10, 32, hy + 11, INK);
    if (b === 1) {
      s.line(32, hy + 11, 32, hy + 17, '#E83A5A');
      s.dots('#E83A5A', [31, hy + 18], [33, hy + 18], [30, hy + 19], [34, hy + 19]);
    }
  } else {
    const hy = 24 + g;
    // cabeça enorme de bote: maxilar, boca aberta, presas
    s.fill(uni(ell(32, hy + 17, 10, 4), ell(32, hy + 18, 7, 4)), SKIN);
    s.fill(ell(32, hy + 11.5, 11, 6.5 + g), ramp('#A02448', { ol: '#2A0C1C' }), { rim: false });
    s.paint(ell(32, hy + 14, 5.5, 2.6), '#F07890');
    s.line(32, hy + 12, 32, hy + 15, '#C04468');
    const top = uni(ell(32, hy + 1, 13, 9), ell(32, hy + 5, 9, 6));
    s.fill(top, SKIN);
    s.paintIn(top, rect(21, hy - 6, 22, 1.5), BLOTCH);
    s.dots(BLOTCH, [32, hy - 7], [31, hy - 3], [33, hy - 3], [32, hy - 1]);
    s.paint(poly([[24, hy + 6], [27, hy + 6], [25.5, hy + 12]]), '#FFFFFF');
    s.paint(poly([[37, hy + 6], [40, hy + 6], [38.5, hy + 12]]), '#FFFFFF');
    s.paint(poly([[27, hy + 17], [29, hy + 17], [28, hy + 12.5]]), '#FFF4D8');
    s.paint(poly([[35, hy + 17], [37, hy + 17], [36, hy + 12.5]]), '#FFF4D8');
    for (const sx of [-1, 1]) {
      const ex = 32 + sx * 8;
      s.paint(ell(ex, hy - 1, 3.4, 3), INK);
      s.paint(ell(ex, hy - 1, 2.6, 2.3), '#F8E43A');
      s.line(ex, hy - 3, ex, hy + 1, INK);
      s.put(ex - 1, hy - 2, '#FFFFFF');
      s.line(ex - sx * 3, hy - 5, ex + sx * 3, hy - 3, BLOTCH);
    }
    s.dots(INK, [30, hy + 4], [34, hy + 4]);
  }
};

// ------------------------------------------------------------------ poraquê
const EEL = ramp('#4A5E3C', { hi: '#86A05C', rim: '#D4EE98', sh: '#2A4034', dp: '#162630', ol: '#0A121C' });
const EBELLY = ramp('#EBA83A', { hi: '#FFD868', rim: '#FFF0A8', sh: '#C46A30', dp: '#7C3A30', ol: '#341A20' });

/** Raio em zigue-zague com miolo claro. */
function bolt(s: Spr, pts: Pt[], core: string, edge: string): void {
  for (let i = 0; i + 1 < pts.length; i++) {
    s.line(pts[i][0] + 1, pts[i][1], pts[i + 1][0] + 1, pts[i + 1][1], edge);
    s.line(pts[i][0] - 1, pts[i][1], pts[i + 1][0] - 1, pts[i + 1][1], edge);
  }
  for (let i = 0; i + 1 < pts.length; i++) s.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], core);
}

export const poraque: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const shock = f >= 2;
  const g = f === 3 ? 1 : 0;
  const cx = 30;

  // corpo grosso de peixe-faca: cauda achatada na água, subindo em S até a cabeça
  s.fill(path([[63, 56, 2.5], [57, 57, 5], [49, 57, 7.5]]), EEL);
  const bodyPts: [number, number, number][] = [[49, 57, 8.5], [43, 51, 8.6], [37, 44, 8.4], [32, 36, 8.6]];
  const body = path(bodyPts);
  // nadadeira anal longa e ondulada ao longo da barriga (o jeito de nadar do poraquê)
  const fin = path([[44, 60, 3], [37, 55, 3], [31, 48, 3], [26, 41, 2.5]]);
  s.fill(fin, ramp('#C88A3A', { hi: '#F0B860', rim: '#FFE0A0', sh: '#8E5A30', dp: '#5E3A2C', ol: '#2A1418' }), { n: 1 });
  for (let i = 0; i < 9; i++) s.put(42 - i * 1.9, 60 - i * 2.2, i % 2 ? '#FFE0A0' : '#7A4A2E');
  s.fill(body, EEL);
  // ventre alaranjado, brilho no dorso e poros sensoriais
  s.paintIn(body, path([[42, 55, 3.4], [35, 48, 3.4], [29, 40, 3.6]]), EBELLY.md);
  s.paintIn(body, path([[42, 55, 1.2], [35, 48, 1.2], [29, 40, 1.4]]), EBELLY.hi);
  s.paintIn(body, path([[48, 50, 1.6], [42, 43, 1.6], [37, 36, 1.6]]), EEL.hi);
  s.dots(EEL.rim, [49, 50], [43, 43], [51, 53], [38, 37]);
  s.dots(EEL.dp, [45, 47], [40, 41], [47, 53], [42, 50], [37, 45]);
  // cabeça achatada e larga, mandíbula saliente
  const hy = 27 + b;
  s.fill(ell(cx - 4, hy + 6.5, 10, 3.8), EBELLY, { rim: false });
  s.fill(ell(cx, hy, 14.5, 9), EEL);
  s.line(cx - 13, hy + 5, cx + 8, hy + 6, EEL.ol);
  s.dots(INK, [cx - 9, hy + 2], [cx - 7, hy + 2]);
  s.dots(EBELLY.md, [cx - 3, hy - 5], [cx + 2, hy - 5], [cx + 6, hy - 3], [cx - 7, hy - 4], [cx, hy + 1], [cx + 9, hy], [cx - 11, hy], [cx + 4, hy + 2]);
  eye(s, cx - 11, hy - 4, 5, 5, shock ? '#F4F8A0' : '#F0C838', b === 1);
  eye(s, cx + 2, hy - 5, 5, 5, shock ? '#F4F8A0' : '#F0C838', b === 1);

  if (shock) {
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 64; x++) {
        const d = Math.hypot(x - cx, (y - hy) * 1.05);
        if (d > 15 && d < 19 + g && (x + y + g) % 3 === 0 && !s.get(x, y)) s.put(x, y, '#5CE8F8');
      }
    const dx = cx - 33;
    const mv = (P: Pt[][]) => P.map((a) => a.map(([x, y]) => [x + dx, y] as Pt));
    const A: Pt[][] = mv([
      [[20, hy - 4], [13, hy - 9], [16, hy - 11], [8, hy - 17], [10, hy - 20]],
      [[33, hy - 8], [29, 10], [35, 8], [30, 2]],
      [[46, hy - 3], [52, hy - 8], [49, hy - 11], [58, hy - 16]],
      [[46, hy + 3], [54, hy + 4], [52, hy + 8], [60, hy + 10]],
      [[20, hy + 4], [12, hy + 6], [15, hy + 10], [5, hy + 13]],
    ]);
    const B: Pt[][] = mv([
      [[20, hy - 5], [15, hy - 7], [18, hy - 13], [10, hy - 15], [14, hy - 21]],
      [[33, hy - 8], [37, 12], [31, 8], [36, 2]],
      [[46, hy - 4], [50, hy - 6], [54, hy - 9], [60, hy - 11]],
      [[46, hy + 2], [52, hy + 6], [56, hy + 5], [61, hy + 12]],
      [[20, hy + 3], [14, hy + 3], [10, hy + 7], [4, hy + 8]],
    ]);
    (g ? B : A).forEach((pts, i) => bolt(s, pts, i % 2 ? '#FFF35A' : '#FFFFFF', i % 2 ? '#F2B820' : '#4CD8F4'));
    s.dots('#FFFFFF', [14, 18], [50, 20], [8, hy], [57, hy + 2], [26, 5], [41, 6]);
  }
  water(s, 32, 29, f);
};

// ------------------------------------------------------------------ tracajá
const SHELL = ramp('#5E6E3A', { hi: '#94A84C', rim: '#DCEA8C', sh: '#3A4E34', dp: '#223030', ol: '#0E161C' });
const PLAST = ramp('#D8CC9E', { hi: '#F6EEC8', sh: '#AC9C80', dp: '#6E6478', ol: '#2E2A38' });
const TSKIN = ramp('#58684A', { hi: '#8AA060', sh: '#38483E', dp: '#222E30', ol: '#0E161C' });
const SPOTY = '#F6D63A';

export const tracaja: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const tuck = f >= 2;
  const g = f === 3 ? 1 : 0;

  s.fill(ell(32, 52, 22, 6), PLAST);
  const scy = tuck ? 41 - g : 36 - b;
  const ry = tuck ? 14 : 16;
  const top = scy - ry;
  if (!tuck) {
    for (const sx of [-1, 1]) {
      s.fill(ell(32 + sx * 20, 52, 6, 4.5), TSKIN);
      s.dots(PLAST.hi, [32 + sx * 24, 55], [32 + sx * 21, 56], [32 + sx * 18, 56]);
      s.dots(SPOTY, [32 + sx * 19, 50], [32 + sx * 22, 52]);
    }
  }
  const dome = ell(32, scy, 25, ry);
  s.fill(dome, SHELL);
  // escudos marginais na borda
  const rim = sub(dome, ell(32, scy + 1, 23, ry - 1.5));
  for (let x = 8; x < 58; x += 5) s.paintIn(rim, rect(x, 0, 1, 64), SHELL.dp);
  s.paintIn(rim, rect(0, scy + 4, 64, 20), SHELL.sh);
  // escudos vertebrais em hexágonos
  const cy = top + (tuck ? 7 : 10);
  const kx = tuck ? 0.85 : 1;
  const ky = tuck ? 0.8 : 1;
  const hex: Pt[] = [[26, cy - 5], [38, cy - 5], [43, cy + 1], [38, cy + 7], [26, cy + 7], [21, cy + 1]];
  const H = hex.map(([x, y]) => [32 + (x - 32) * kx, cy + (y - cy) * ky] as Pt);
  s.paintIn(dome, poly(H), SHELL.hi);
  s.paintIn(dome, poly(H.map(([x, y]) => [32 + (x - 32) * 0.7, cy + (y - cy) * 0.7] as Pt)), SHELL.md);
  for (let i = 0; i < H.length; i++) {
    const p0 = H[i];
    const p1 = H[(i + 1) % H.length];
    s.line(p0[0], p0[1], p1[0], p1[1], SHELL.dp);
  }
  for (const [p0, tx, ty] of [[H[0], 14, top + 3], [H[1], 50, top + 3], [H[2], 58, cy + 4], [H[5], 6, cy + 4], [H[3], 52, cy + 12], [H[4], 12, cy + 12]] as [Pt, number, number][])
    s.line(p0[0], p0[1], tx, ty, SHELL.dp);
  s.line(32, H[0][1], 32, top, SHELL.dp);
  s.dots(SHELL.rim, [24, top + 3], [25, top + 3], [17, top + 6], [46, top + 5], [28, cy - 3], [29, cy - 3]);
  s.dots(SHELL.hi, [16, cy + 3], [48, cy + 3], [20, cy + 9], [44, cy + 9]);

  if (!tuck) {
    // cabeça à frente do casco, com as manchas amarelas
    const hy = 52 - b * 0.6;
    s.fill(cap(32, 46, 6, 32, hy, 7), TSKIN);
    s.fill(ell(32, hy, 9, 7), TSKIN);
    s.fill(ell(32, hy + 4.5, 5, 2.4), PLAST, { ol: false, rim: false });
    s.dots(SPOTY, [27, hy - 5], [28, hy - 5], [36, hy - 5], [37, hy - 5], [32, hy - 6], [32, hy - 5], [26, hy + 1], [38, hy + 1], [25, hy + 3], [39, hy + 3]);
    eye(s, 23.5, hy - 4, 5, 5, '#F6D63A', b === 1);
    eye(s, 35.5, hy - 4, 5, 5, '#F6D63A', b === 1);
    s.dots(INK, [31, hy], [33, hy]);
    s.line(29, hy + 3, 32, hy + 4, INK);
    s.line(35, hy + 3, 32, hy + 4, INK);
  } else {
    // recolhido: fresta escura com os olhos espiando
    s.fill(ell(32, 52, 14, 4.2), ramp('#1A1E28', { ol: '#0A0A14' }), { flat: true });
    if (f === 2) {
      eye(s, 25, 50, 4, 3, '#F6D63A');
      eye(s, 35, 50, 4, 3, '#F6D63A');
    } else {
      s.line(25, 51, 29, 51, '#F6D63A');
      s.line(35, 51, 39, 51, '#F6D63A');
    }
    s.dots(TSKIN.hi, [12, 55], [52, 55], [11, 54], [53, 54]);
  }
};
