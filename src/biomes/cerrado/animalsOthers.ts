import { and, type Drawer, ell, eye, INK, mix, type Mask, path, poly, ramp, rect, Spr, type Pt } from '../../art/animals/kit';

// Jiboia e vaga-lume-do-cupinzeiro na captura (64×64).

// ------------------------------------------------------------------ jiboia
const JB = ramp('#A88458', { hi: '#C8A474', rim: '#EDD6A0', sh: '#7C5A46', dp: '#503A44', ol: '#22141C' });
const JBELLY = ramp('#E6D4A4', { hi: '#F8EAC4', sh: '#BCA67E', dp: '#84706A', ol: '#2E2224' });
const SADDLE = '#6A3A2A';
const SADDLE_R = '#A8452E';

/** Sela marrom-avermelhada do dorso, com borda clara. */
function saddle(s: Spr, clip: Mask, x: number, y: number, k = 1, red = false): void {
  const c = red ? SADDLE_R : SADDLE;
  s.paintIn(clip, poly([[x - 4.4 * k, y - 0.6], [x - 2 * k, y - 2.6 * k], [x + 2 * k, y - 2.6 * k], [x + 4.4 * k, y - 0.6], [x + 2.4 * k, y + 2.2 * k], [x - 2.4 * k, y + 2.2 * k]]), mix(c, '#F2D8A0', 0.5));
  s.paintIn(clip, poly([[x - 3.4 * k, y - 0.4], [x - 1.6 * k, y - 1.8 * k], [x + 1.6 * k, y - 1.8 * k], [x + 3.4 * k, y - 0.4], [x + 1.8 * k, y + 1.4 * k], [x - 1.8 * k, y + 1.4 * k]]), c);
}

export const jiboia: Drawer = (s, f) => {
  const strike = f >= 2;
  const g = f === 3 ? 1 : 0;
  const b = f === 1 ? 1 : 0;
  // cauda avermelhada saindo da rodilha
  s.fill(path([[47, 55, 3.4], [55, 52, 2.6], [59, 46, 1.6]]), ramp('#B04A32', { hi: '#D8704A', rim: '#FFB488', sh: '#82303A', dp: '#521E34', ol: '#26101C' }));
  s.dots(SADDLE, [53, 53], [57, 49]);
  // duas voltas do corpo
  for (const [cx, cy, rx, ry, off] of [[31, 53, 23, 6, 0], [31, 46.5, 19, 5.6, 4]] as number[][]) {
    const c = ell(cx, cy, rx, ry);
    s.fill(c, JB);
    for (let x = cx - rx + 4 + off; x < cx + rx - 2; x += 8) saddle(s, c, x, cy - 1.6, 0.9, x > cx + 6);
    s.paintIn(c, rect(cx - rx, cy + ry - 2.4, rx * 2, 3), JBELLY.md);
  }
  // pescoço em S
  const pts: [number, number, number][] = strike
    ? [[22, 46, 6], [18, 40, 5.2], [27, 36, 4.8], [31 + g * 2, 33, 4.6]]
    : [[28, 44, 6], [23, 37, 5], [33, 30, 4.4], [32, 24 - b, 4]];
  const neck = path(pts);
  s.fill(neck, JB);
  saddle(s, neck, pts[1][0] + 1, pts[1][1], 0.9);
  saddle(s, neck, pts[2][0], pts[2][1] - 1, 0.8);
  if (!strike) {
    const hy = 16 - b;
    const head = poly([[24, hy - 1], [28, hy - 7], [36, hy - 7], [40, hy - 1], [38, hy + 5], [34, hy + 9], [30, hy + 9], [26, hy + 5]]);
    s.fill(head, JB);
    s.paintIn(head, rect(22, hy + 5.5, 20, 5), JBELLY.md);
    s.paintIn(head, poly([[30, hy - 7], [34, hy - 7], [33, hy + 1], [31, hy + 1]]), SADDLE);
    for (const sx of [-1, 1]) {
      s.line(32 + sx * 2, hy + 1, 32 + sx * 8.5, hy + 5, '#3A2220');
      eye(s, 32 + sx * 6 - 2.5, hy - 3, 5, 5, '#D8A83A', b === 1);
    }
    s.dots(INK, [30, hy + 7], [34, hy + 7]);
    s.line(28, hy + 8.5, 36, hy + 8.5, JB.dp);
    s.dots(JB.rim, [28, hy - 5], [30, hy - 6]);
    if (f === 1) { s.line(32, hy + 9, 32, hy + 12, '#D8344E'); s.line(32, hy + 12, 30, hy + 14, '#D8344E'); s.line(32, hy + 12, 34, hy + 14, '#D8344E'); }
  } else {
    // bote: cabeça enorme, de boca aberta, indo para cima de quem olha
    const hx = 32 + g;
    const hy = 22 + g * 2;
    const head = poly([[hx - 11, hy - 2], [hx - 6, hy - 10], [hx + 6, hy - 10], [hx + 11, hy - 2], [hx + 9, hy + 6], [hx + 4, hy + 10], [hx - 4, hy + 10], [hx - 9, hy + 6]]);
    s.fill(head, JB);
    s.fill(ell(hx, hy + 6, 7, 4.2 + g), ramp('#9A1F3B', { ol: '#2B0F1E' }), { rim: false, n: 1 });
    s.paint(ell(hx, hy + 7.4, 3.6, 1.6), '#EE7C8E');
    for (const sx of [-1, 1]) {
      s.paint(poly([[hx + sx * 4.4, hy + 2.6], [hx + sx * 2.6, hy + 2.6], [hx + sx * 3.5, hy + 6]]), '#FFFFFF');
      eye(s, hx + sx * 6 - 2.5, hy - 5, 5, 5, '#D8A83A');
      s.line(hx + sx * 2, hy - 3, hx + sx * 9, hy + 1, '#3A2220');
    }
    s.paintIn(head, poly([[hx - 2, hy - 10], [hx + 2, hy - 10], [hx + 1, hy - 2], [hx - 1, hy - 2]]), SADDLE);
  }
};

// ------------------------------------------------------------------ vaga-lume-do-cupinzeiro
const DIRT = ramp('#8A5E3E', { hi: '#AC7C54', rim: '#D8AC7C', sh: '#5E3E3A', dp: '#3E2A34', ol: '#1A1018' });
const LARVA = ramp('#8A7A4A', { hi: '#B2A068', rim: '#E0D090', sh: '#5E4E3E', dp: '#3E3234', ol: '#1A1216' });
const GLOW = '#9CFF6A';
const GLOW_H = '#E8FFC0';

function glowAt(s: Spr, x: number, y: number, r: number, bright: boolean): void {
  const a = s.g.slice();
  const put = (px: number, py: number, c: string) => { if (!a[Math.round(py) * 64 + Math.round(px)] || a[Math.round(py) * 64 + Math.round(px)] === DIRT.ol) s.put(px, py, c); };
  if (bright) {
    for (const [dx, dy] of [[0, -r - 1], [0, r + 1], [-r - 1, 0], [r + 1, 0]]) put(x + dx, y + dy, 'rgba(156,255,106,0.55)');
    for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) put(x + dx, y + dy, 'rgba(156,255,106,0.35)');
  }
  s.paint(ell(x, y, r, r), GLOW);
  s.paint(ell(x, y, Math.max(0.6, r - 1), Math.max(0.6, r - 1)), GLOW_H);
}

export const vagalume: Drawer = (s, f) => {
  const bright = f % 2 === 1 || f === 3;
  const out = f >= 2 ? (f === 3 ? 5 : 3) : 0;
  const b = f === 1 ? 1 : 0;
  // cupinzeiro: cone de terra com sulcos
  const mound = poly([[6, 59], [10, 44], [17, 32], [24, 22], [32, 17], [40, 22], [47, 32], [54, 44], [58, 59]]);
  s.fill(mound, DIRT);
  for (const [x0, y0, x1, y1] of [[18, 40, 14, 56], [26, 28, 24, 52], [38, 28, 40, 52], [46, 40, 50, 56], [32, 22, 32, 36]] as number[][]) s.paintIn(mound, path([[x0, y0, 0.6], [x1, y1, 0.6]]), DIRT.sh);
  for (const [x, y] of [[16, 46], [21, 36], [43, 35], [49, 47], [30, 26], [36, 49], [24, 54]] as Pt[]) s.dots(DIRT.hi, [x, y], [x + 1, y]);
  s.paintIn(mound, rect(0, 56, 64, 4), DIRT.sh);
  // buraquinhos das outras larvas, cada um com sua luz verde
  for (const [x, y] of [[20, 44], [44, 42], [34, 28], [14, 53], [50, 53]] as Pt[]) {
    s.paint(ell(x, y, 2.4, 2), DIRT.dp);
    s.paint(ell(x, y + 0.2, 1.2, 1), bright ? GLOW : '#58B04A');
  }
  // toca principal
  const hx = 32;
  const hy = 44;
  s.fill(ell(hx, hy, 8.6, 7.2), ramp('#2A1A22', { hi: '#4A323A', ol: DIRT.ol }), { n: 1, rim: false });
  // larva saindo: corpo segmentado e cabeça com as duas luzes
  const top = hy - out - b * 0.6;
  const body = path([[hx, hy + 5, 5], [hx, hy + 1, 4.8], [hx, top + 3, 4.2]]);
  s.fill(and(body, rect(0, 0, 64, hy + 4)), LARVA);
  for (let y = Math.round(top + 6); y < hy + 3; y += 3) s.paintIn(body, rect(hx - 6, y, 12, 0.8), LARVA.dp);
  const head = ell(hx, top, 5.2, 4.2);
  s.fill(head, LARVA);
  s.paintIn(head, rect(hx - 6, top - 5, 12, 2.6), LARVA.sh);
  // duas luzes verdes no tórax e olhinhos
  for (const sx of [-1, 1]) {
    glowAt(s, hx + sx * 3, top + 5.2, 1.5, bright);
    eye(s, hx + sx * 2.4 - 1.5, top - 1.2, 3, 3, '#2A1A22', f === 1);
  }
  // mandíbulas
  s.dots(LARVA.dp, [hx - 2, top + 3], [hx + 2, top + 3]);
  s.line(hx - 3, top + 3.6, hx - 1, top + 4.4, INK);
  s.line(hx + 3, top + 3.6, hx + 1, top + 4.4, INK);
  // brilho no entorno
  if (bright) s.dots('rgba(156,255,106,0.5)', [hx - 9, hy - 1], [hx + 9, hy - 1], [hx - 8, hy + 5], [hx + 8, hy + 5]);
};
