import { cap, type Drawer, ell, erode, eye, hurtEye, INK, type Mask, mirror, path, poly, pose, ramp, rect, rot, Spr, sub, uni, type Pt } from './kit';

// ------------------------------------------------------------------ cascavel
const CSKIN = ramp('#AE8C5C', { hi: '#D0B07A', rim: '#F2E0B0', sh: '#80644A', dp: '#56423A', ol: '#22181A' });
const CBELLY = ramp('#E8DCB4', { sh: '#C0AE88', dp: '#8A7A6A', ol: '#2E2624' });
const DIAMOND = '#3A2620';
const DEDGE = '#F2E6C0';
const RATTLE = ramp('#D8C8A4', { hi: '#F4E8C8', rim: '#FFFFFF', sh: '#A89878', dp: '#6E6258', ol: '#2A2420' });

/** Losango escuro com borda clara, o desenho típico do dorso. */
function diamond(s: Spr, clip: Mask, x: number, y: number, k = 1): void {
  s.paintIn(clip, poly([[x - 5 * k, y], [x, y - 3.6 * k], [x + 5 * k, y], [x, y + 3.6 * k]]), DEDGE);
  s.paintIn(clip, poly([[x - 3.8 * k, y], [x, y - 2.6 * k], [x + 3.8 * k, y], [x, y + 2.6 * k]]), DIAMOND);
  s.paintIn(clip, poly([[x - 2 * k, y], [x, y - 1.2 * k], [x + 2 * k, y], [x, y + 1.2 * k]]), CSKIN.sh);
}

function rattle(s: Spr, x: number, y: number, shake: number): void {
  // chocalho erguido: gomos empilhados
  for (let i = 0; i < 5; i++) {
    const cx = x + shake * (i % 2 ? 1 : -1) * (i > 1 ? 1 : 0);
    s.fill(ell(cx, y - i * 3.2, 3.2 - i * 0.25, 1.9), RATTLE, { n: 1 });
  }
  if (shake) {
    for (const sx of [-1, 1]) {
      s.line(x + sx * 6, y - 13, x + sx * 8, y - 15, '#FFF4C8');
      s.line(x + sx * 6, y - 8, x + sx * 9, y - 8, '#FFF4C8');
      s.line(x + sx * 6, y - 3, x + sx * 8, y - 1, '#FFF4C8');
    }
  }
}

export const cascavel: Drawer = (s, f) => {
  const strike = f >= 2;
  const g = f === 3 ? 1 : 0;
  const b = f === 1 ? 1 : 0;

  // cauda erguida com o chocalho atrás das espirais
  s.fill(path([[46, 50, 4], [51, 44, 3], [52, 39, 2.4]]), CSKIN);
  rattle(s, 52, 37, f === 1 || f === 3 ? 1 : 0);
  // espirais
  for (const [cx, cy, rx, ry] of [[31, 54, 23, 5.8], [31, 48, 19, 5.4]] as [number, number, number, number][]) {
    const c = ell(cx, cy, rx, ry);
    s.fill(c, CSKIN);
    for (let x = cx - rx + 5; x < cx + rx - 3; x += 9) diamond(s, c, x, cy - 1, 1);
    s.paintIn(c, rect(cx - rx, cy + ry - 2.2, rx * 2, 3), CBELLY.md);
  }
  // pescoço em S com as duas listras escuras
  const neckPts: [number, number, number][] = strike
    ? [[24, 47, 6.5], [20, 41, 5.6], [31, 36, 5.2], [32 + g, 31, 5.2]]
    : [[29, 46, 6.5], [24, 39, 5.4], [34, 32, 4.8], [32, 26, 4.4]];
  const neck = path(neckPts);
  s.fill(neck, CSKIN);
  diamond(s, neck, neckPts[0][0], neckPts[0][1] - 1, 1);
  diamond(s, neck, neckPts[1][0] + 2, neckPts[1][1], 0.9);
  for (let i = 2; i < neckPts.length - 1; i++) {
    const [x0, y0] = neckPts[i];
    const [x1, y1] = neckPts[i + 1];
    for (const o of [-1.6, 1.6]) s.line(x0 + o, y0, x1 + o, y1, DIAMOND);
  }

  if (!strike) {
    const hy = 18 - b;
    // cabeça triangular larga (fosseta loreal) e focinho mais estreito
    const head = poly([[22, hy - 4], [28, hy - 8], [36, hy - 8], [42, hy - 4], [40, hy + 3], [35, hy + 8], [29, hy + 8], [24, hy + 3]]);
    s.fill(head, CSKIN);
    s.paintIn(head, rect(20, hy + 5, 24, 4), CBELLY.md);
    s.dots(CSKIN.rim, [27, hy - 7], [28, hy - 7], [31, hy - 7]);
    for (const sx of [-1, 1]) {
      const ex = 32 + sx * 6;
      // faixa escura atravessando o olho
      s.line(ex - sx * 2, hy - 3, ex + sx * 4, hy + 2, DIAMOND);
      if (pose.mode === 'hurt') hurtEye(s, ex - 2, hy - 3.5, 4, 5);
      else {
        s.paint(ell(ex, hy - 1.5, 2.6, 2.4), INK);
        s.paint(ell(ex, hy - 1.5, 1.9, 1.7), '#E8B840');
        s.line(ex, hy - 3, ex, hy, INK);
        s.put(ex - 1, hy - 2.5, '#FFFFFF');
      }
      // fosseta entre olho e narina
      s.put(32 + sx * 4, hy + 3, INK);
      // escama grossa sobre o olho
      s.line(ex - 2, hy - 4.5, ex + 2, hy - 4.5, CSKIN.dp);
    }
    s.dots(INK, [31, hy + 6], [33, hy + 6]);
    if (b === 1) {
      s.line(32, hy + 9, 32, hy + 14, '#2A1A2A');
      s.dots('#2A1A2A', [31, hy + 15], [33, hy + 15]);
    }
  } else {
    const hy = 22 + g;
    // bote: boca escancarada com as presas dobradas para a frente
    s.fill(uni(ell(32, hy + 13 + g, 9.5, 3), ell(32, hy + 14 + g, 6, 2.6)), CSKIN);
    s.fill(poly([[21, hy + 3], [43, hy + 3], [38, hy + 11 + g], [26, hy + 11 + g]]), ramp('#E07A8E', { ol: '#3A1424', sh: '#B04E6A', dp: '#7A2A4A' }), { rim: false });
    s.paint(ell(32, hy + 9 + g, 2.6, 1.2), '#B04E6A');
    s.line(32, hy + 6, 32, hy + 8 + g, '#2A1A2A');
    const top = poly([[20, hy - 4], [27, hy - 9], [37, hy - 9], [44, hy - 4], [41, hy + 5], [23, hy + 5]]);
    s.fill(top, CSKIN);
    s.paint(poly([[24.5, hy + 5], [27, hy + 5], [26.5, hy + 11]]), '#FFFFFF');
    s.paint(poly([[37, hy + 5], [39.5, hy + 5], [37.5, hy + 11]]), '#FFFFFF');
    s.dots(CSKIN.rim, [27, hy - 8], [28, hy - 8]);
    for (const sx of [-1, 1]) {
      const ex = 32 + sx * 7;
      s.line(ex - sx * 3, hy - 3, ex + sx * 5, hy + 3, DIAMOND);
      s.paint(ell(ex, hy - 2, 3, 2.6), INK);
      s.paint(ell(ex, hy - 2, 2.2, 1.9), '#F2C840');
      s.line(ex, hy - 4, ex, hy, INK);
      s.put(ex - 1, hy - 3, '#FFFFFF');
      s.line(ex - sx * 3, hy - 6, ex + sx * 2, hy - 4.5, CSKIN.dp);
    }
    s.dots(INK, [30, hy + 2], [34, hy + 2]);
  }
};

// ------------------------------------------------------------------ teiú
const TEIU = ramp('#34343C', { hi: '#56565E', rim: '#8A8A96', sh: '#22222C', dp: '#16161E', ol: '#08080E' });
const TWHITE = '#F2EEE0';
const TCREAM = ramp('#EEE6CC', { sh: '#C8BC9C', dp: '#8E8478', ol: '#26222A' });

/** Faixas transversais de pintas brancas, como no teiú. */
function bands(s: Spr, clip: Mask, xs: number[]): void {
  const inner = erode(clip, 1);
  xs.forEach((bx, i) => {
    for (let y = 36 + (i % 2) * 2; y < 56; y += 4) {
      const x = bx + ((y >> 2) % 2);
      if (inner[y * 64 + x]) s.paintIn(inner, ell(x, y, 1.3, 1.6), TWHITE);
    }
  });
}

export const teiu: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const lift = f >= 2 ? 2 : 0;
  const tongue = f >= 2;

  // cauda longa enrolando para trás
  const tail = path([[18, 50, 5], [10, 50, 4.2], [5, 45, 3.4], [5, 38, 2.6], [9, 33, 2], [14, 32, 1.4]]);
  s.fill(tail, TEIU);
  for (const [x, y] of [[12, 49], [7, 47], [5, 42], [6, 37], [10, 33]] as Pt[]) s.paintIn(tail, ell(x, y, 1.6, 1.6), TWHITE);
  // patas traseiras
  s.fill(uni(cap(20, 50, 3.4, 15, 56, 2.6), ell(14, 57, 3.6, 1.8)), TEIU, { n: 1 });
  s.dots(TWHITE, [11, 58], [13, 59], [16, 59]);
  // corpo baixo e comprido
  const body = uni(ell(30, 48, 14, 7 + b * 0.4), ell(40, 46 - lift * 0.5, 7, 6));
  s.fill(body, TEIU);
  bands(s, body, [19, 24, 29, 34, 40]);
  s.paintIn(body, rect(0, 53, 64, 3), TCREAM.sh);
  s.dots(TEIU.rim, [24, 41], [28, 41], [33, 41], [38, 40]);
  // patas da frente
  s.fill(uni(cap(40, 50, 3.4, 42, 56, 2.6), ell(43, 57, 3.6, 1.8)), TEIU, { n: 1 });
  s.dots(TWHITE, [41, 59], [44, 59], [46, 58]);
  // cabeça grande com papada e focinho comprido
  const hy = 40 - lift;
  const head = uni(ell(49, hy, 8, 6.5), poly([[49, hy - 6], [60, hy - 1], [61, hy + 3], [55, hy + 5], [46, hy + 6]]), ell(47, hy + 4, 6.5, 4.6));
  s.fill(head, TEIU);
  // escamas labiais barradas de preto e branco
  for (let x = 47; x <= 60; x += 2) s.line(x, hy + 2, x, hy + 3, TWHITE);
  s.paintIn(head, ell(46, hy + 6, 4.5, 2.6), TCREAM.md);
  s.dots(TWHITE, [45, hy - 4], [49, hy - 5], [52, hy - 3], [43, hy], [56, hy - 2]);
  s.dots(TEIU.rim, [48, hy - 6], [50, hy - 6], [53, hy - 5]);
  s.paint(ell(52.5, hy - 2, 3, 2.4), '#6A6A74');
  eye(s, 50.5, hy - 3.5, 4, 4, '#E0A040', b === 1);
  s.put(59, hy - 1, INK);
  s.line(53, hy + 2.5, 61, hy + 1.5, INK);
  if (tongue) {
    const L = f === 2 ? 4 : 2;
    s.line(61, hy + 1, 61 + L - 1, hy + 1, '#D8607A');
    s.dots('#D8607A', [61 + L, hy], [61 + L, hy + 2]);
    s.dots('#F4A0B0', [61 + L - 1, hy + 1]);
  }
};

// ------------------------------------------------------------------ sapo-cururu
const TOAD = ramp('#AE8C58', { hi: '#D0B07A', rim: '#F2DEA8', sh: '#7E6046', dp: '#523E3A', ol: '#22181C' });
const TBELLY = ramp('#EEE0BC', { hi: '#FFF6DA', sh: '#C8B494', dp: '#928078', ol: '#30262A' });
const GLAND = ramp('#C4A06A', { hi: '#E4C48E', rim: '#FFF0C0', sh: '#8E6E4E', dp: '#5A4440', ol: '#22181C' });

function warts(s: Spr, clip: Mask, seed: number): void {
  const inner = erode(clip, 1);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      if (!inner[y * 64 + x]) continue;
      const h = (x * 73 + y * 151 + seed * 37) % 23;
      if (h === 0) s.put(x, y, TOAD.dp);
      else if (h === 1) s.put(x, y, TOAD.rim);
      else if (h === 2 && inner[(y + 1) * 64 + x]) {
        s.put(x, y, TOAD.hi);
        s.put(x, y + 1, TOAD.sh);
      }
    }
}

function toadEye(s: Spr, x: number, y: number, blink: boolean): void {
  // crista óssea por cima do olho
  s.fill(ell(x, y, 4.6, 4.2), TOAD);
  if (pose.mode === 'hurt') hurtEye(s, x - 2.5, y - 2.5, 5, 5);
  else if (blink) {
    s.line(x - 3, y, x + 3, y, TOAD.ol);
  } else {
    s.paint(ell(x, y + 0.3, 3.4, 3), '#1A1218');
    s.paint(ell(x, y + 0.3, 2.8, 2.4), '#E8B83A');
    s.line(x - 2.5, y + 0.5, x + 2.5, y + 0.5, INK);
    s.put(x - 1, y - 1, '#FFFFFF');
  }
  s.line(x - 4, y - 3.5, x + 4, y - 3.5, TOAD.dp);
}

export const cururu: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const air = f === 3;
  const crouch = f === 2;
  const y = air ? -9 : crouch ? 2 : 0;

  if (!air) {
    // coxas grossas dobradas e pés espalmados
    for (const sx of [-1, 1]) {
      const thigh = ell(32 + sx * 17, 50 + y * 0.5, 7.5, 7.5);
      s.fill(thigh, TOAD);
      warts(s, thigh, 3 + sx);
      s.fill(ell(32 + sx * 16, 57, 7, 2.4), TOAD, { n: 1 });
      s.dots(TOAD.dp, [32 + sx * 11, 58], [32 + sx * 14, 58], [32 + sx * 18, 58]);
    }
  } else {
    for (const sx of [-1, 1]) {
      s.fill(cap(32 + sx * 7, 50 + y, 4.5, 32 + sx * 14, 60, 3), TOAD);
      s.fill(ell(32 + sx * 15, 61, 5.5, 2), TOAD, { n: 1 });
    }
  }
  const body = ell(32, 46 + y, 16, 11.5 + b * 0.5);
  s.fill(body, TOAD);
  warts(s, body, 7);
  s.fill(ell(32, 51 + y, 9, 6.5), TBELLY, { ol: false });
  s.dots(TBELLY.dp, [29, 50 + y], [34, 52 + y], [31, 54 + y], [36, 49 + y]);
  // braços curtos
  for (const sx of [-1, 1]) {
    const armEnd = air ? 32 + sx * 18 : 32 + sx * 11;
    s.fill(cap(32 + sx * 10, 47 + y, 3.4, armEnd, air ? 42 + y : 55 + y * 0.3, 2.8), TOAD);
    s.fill(ell(armEnd, air ? 41 + y : 57, 4, 1.8), TOAD, { n: 1 });
  }
  // cabeça larga, glândulas parotoides atrás dos olhos
  const hy = 36 + y + b * 0.5;
  for (const sx of [-1, 1]) {
    const gl = ell(32 + sx * 15, hy + 1, 4.6, 6.2);
    s.fill(gl, GLAND);
    for (const [dx, dy] of [[-1, -2], [1, 1], [0, 3], [-1, 0]] as Pt[]) s.put(32 + sx * 15 + dx, hy + 1 + dy, GLAND.dp);
  }
  const head = ell(32, hy + 1, 13.5, 8);
  s.fill(head, TOAD);
  warts(s, head, 11);
  toadEye(s, 24, hy - 4, b === 1);
  toadEye(s, 40, hy - 4, b === 1);
  s.dots(TOAD.dp, [30, hy + 1], [34, hy + 1]);
  s.line(20, hy + 4, 22, hy + 6, INK);
  s.line(22, hy + 6, 42, hy + 6, INK);
  s.line(42, hy + 6, 44, hy + 4, INK);
  if (air) s.dots('#E8DCC0', [20, 62], [24, 63], [40, 63], [44, 62]);
};

// ------------------------------------------------------------------ jandaíra
const BEE = ramp('#4A3424', { hi: '#7A5A3E', rim: '#C49A6A', sh: '#2E1E1A', dp: '#1E1214', ol: '#0C0608' });
const BEE_Y = ramp('#E8B840', { hi: '#FFE07A', rim: '#FFF4C0', sh: '#B07A2A', dp: '#6E4626', ol: '#2A1810' });
const POLLEN = ramp('#F2A83A', { hi: '#FFD878', sh: '#C0702A', ol: '#3A1E14' });
const MEMB = 'rgba(214,236,255,0.55)';
const VEIN = '#7A8EB0';

function beeWing(s: Spr, ang: number, side: 1 | -1, len: number, wid: number, oy: number): void {
  const S: Pt = [36, 30 + oy];
  const pts: Pt[] = [S, [S[0] + len * 0.5, S[1] - wid], [S[0] + len, S[1] - wid * 0.6], [S[0] + len + 1, S[1]], [S[0] + len * 0.6, S[1] + wid * 0.5]];
  let m = poly(pts.map((p) => rot(p, ang, S[0], S[1])));
  if (side < 0) m = mirror(m);
  s.outline(m, VEIN);
  s.paint(m, MEMB);
  const inner = sub(m, erode(m, 1));
  s.paint(inner, 'rgba(180,206,240,0.8)');
  const a = rot([S[0] + len * 0.85, S[1] - wid * 0.3], ang, S[0], S[1]);
  const xa = side < 0 ? 63 - a[0] : a[0];
  const xs = side < 0 ? 63 - S[0] : S[0];
  s.line(xs, S[1], xa, a[1], VEIN);
}

export const jandaira: Drawer = (s, f) => {
  // 0 asas para cima, 1 para baixo, 2–3 voando inclinada
  const up = f === 0 || f === 2;
  const lean = f === 2 ? -2 : f === 3 ? 2 : 0;
  const dy = f === 1 ? 1 : f === 3 ? -1 : 0;
  // asas (de trás) translúcidas
  for (const side of [1, -1] as const) {
    beeWing(s, up ? -0.9 : -0.25, side, 24, 8, dy);
    beeWing(s, up ? -0.55 : 0.05, side, 18, 6, dy + 2);
  }
  // abdômen listrado de amarelo, pendendo atrás/abaixo da cabeça
  const abd = ell(32 + lean, 46 + dy, 9.5, 10.5);
  s.fill(abd, BEE);
  for (const yy of [41, 45, 49]) s.paintIn(abd, rect(0, yy + dy, 64, 2), BEE_Y.md);
  s.paintIn(abd, rect(0, 53 + dy, 64, 1), BEE_Y.sh);
  s.dots(BEE.rim, [27 + lean, 40 + dy], [26 + lean, 44 + dy]);
  // patas: as de trás com a corbícula cheia de pólen
  for (const sx of [-1, 1]) {
    s.line(32 + sx * 6, 36 + dy, 32 + sx * 10, 42 + dy, BEE.ol);
    s.line(32 + sx * 10, 42 + dy, 32 + sx * 9, 46 + dy, BEE.ol);
    s.fill(cap(32 + sx * 8, 38 + dy, 1.2, 32 + sx * 13, 48 + dy, 1.2), BEE, { n: 1 });
    s.fill(ell(32 + sx * 13, 50 + dy, 2.8, 3.4), POLLEN, { n: 1 });
    s.line(32 + sx * 13, 53 + dy, 32 + sx * 12, 57 + dy, BEE.ol);
  }
  // tórax peludo
  const thx = ell(32, 32 + dy, 10, 7);
  s.fill(thx, BEE);
  for (let i = 0; i < 14; i++) s.put(24 + ((i * 5) % 17), 27 + dy + ((i * 3) % 9), i % 2 ? BEE.hi : '#8E6A48');
  // cabeça com olhos compostos grandes e marcas amarelas
  const hy = 23 + dy;
  const head = ell(32, hy, 9.5, 8);
  s.fill(head, BEE);
  for (const sx of [-1, 1]) {
    const e = ell(32 + sx * 6, hy - 0.5, 3.8, 5.6);
    s.fill(e, ramp('#2A2030', { hi: '#5A4A6A', rim: '#9A8AB0', sh: '#1A1220', ol: '#08040C' }), { n: 1 });
    if (pose.mode === 'hurt') {
      hurtEye(s, 32 + sx * 6 - 2, hy - 3, 4, 5, '#E8DCFF');
      continue;
    }
    s.dots('#C8B8E8', [32 + sx * 6 - 1, hy - 4], [32 + sx * 6 - 1, hy - 3]);
    s.dots('#FFFFFF', [32 + sx * 6 - 2, hy - 4]);
    if (pose.mode === 'attack') s.line(32 + sx * 9, hy - 6, 32 + sx * 3, hy - 4, BEE_Y.md);
  }
  s.paint(uni(rect(30, hy + 2, 4, 3), rect(29, hy - 2, 1, 4), rect(34, hy - 2, 1, 4)), BEE_Y.md);
  s.dots(BEE_Y.hi, [31, hy + 2], [32, hy + 2]);
  // mandíbulas
  s.dots('#8A5A2E', [30, hy + 6], [33, hy + 6]);
  s.line(31, hy + 7, 32, hy + 7, INK);
  // antenas cotoveladas
  for (const sx of [-1, 1]) {
    s.line(32 + sx * 1.5, hy - 6, 32 + sx * 3, hy - 12, BEE.ol);
    s.line(32 + sx * 3, hy - 12, 32 + sx * 8, hy - 15 + (f === 1 ? 1 : 0), BEE.ol);
    s.put(32 + sx * 8, hy - 15 + (f === 1 ? 1 : 0), BEE.hi);
  }
  if (f === 1) for (const sx of [-1, 1]) s.dots('#FFFFFF', [32 + sx * 22, 34], [32 + sx * 24, 37]);
};
