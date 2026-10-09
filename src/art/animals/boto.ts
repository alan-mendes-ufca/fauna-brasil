import { type Drawer, ell, eye, INK, path, poly, ramp, uni, water } from './kit';

const PINK = ramp('#F0A0B2', { hi: '#FFCAD2', rim: '#FFEDE6', sh: '#C86C8A', dp: '#823E66', ol: '#3E1A44' });
const BELLY = ramp('#FCE4E0', { sh: '#E2B0C0', dp: '#B07C9C', ol: '#4A2450' });
const BACK = ramp('#C890B4', { hi: '#E0B4CC', rim: '#F8E4F0', sh: '#9A6094', dp: '#6A3C78', ol: '#321A48' });

export const boto: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  if (f < 2) {
    // tronco subindo da água, inclinado para a direita
    const trunk = path([[20, 62, 12], [22, 50 - b, 11.5], [27, 39 - b, 9.5], [31, 31 - b, 9]]);
    s.fill(trunk, PINK);
    s.paintIn(trunk, path([[15, 56, 4], [18, 44, 3.5], [22, 34, 3]]), BACK.md);
    // nadadeira peitoral
    s.fill(poly([[27, 44], [21, 46], [12, 56], [18, 56], [27, 51]]), ramp('#DC7F9A', { hi: '#F2A8BA', sh: '#AE5078', dp: '#6E2E5C', ol: '#3E1A44' }));
    // cabeça redonda, melão saliente e rostro fino
    const melon = ell(41, 17 - b, 6.8, 6.2);
    s.fill(uni(ell(37, 25 - b, 10.5, 9.5), melon), PINK);
    s.paintIn(melon, ell(40, 13.5 - b, 5, 2.6), BACK.hi);
    // rostro longo, fino e levemente curvado para baixo
    const snout = path([[44, 29 - b, 3.8], [51, 31 - b, 2.9], [57, 34 - b, 2.1], [61, 38 - b, 1.5]]);
    s.fill(snout, PINK);
    s.fill(path([[45, 31 - b, 2.3], [51, 33 - b, 1.7], [56.5, 35.5 - b, 1.2], [59.5, 38.5 - b, 0.8]]), BELLY, { ol: false, rim: false });
    for (const [x0, y0, x1, y1] of [[44, 30.5, 51, 32], [51, 32, 56, 34.5], [56, 34.5, 60, 38.5]]) s.line(x0, y0 - b, x1, y1 - b, INK);
    s.line(43, 29 - b, 45, 31 - b, INK);
    s.dots('#FFFFFF', [49, 32.5 - b], [52, 33.5 - b], [55, 35 - b]);
    s.dots(PINK.dp, [37, 10 - b], [38, 10 - b]);
    eye(s, 36, 20.5 - b, 6, 6, '#6A4A8A', b === 1);
    s.line(36, 19 - b, 42, 19.5 - b, PINK.dp);
    s.dots(PINK.hi, [32, 21 - b], [31, 25 - b]);
    // pintas e cicatrizes de pele rosada
    s.dots('#FFB8C4', [27, 40], [24, 48], [30, 36], [26, 52]);
    water(s, 28, 27, f);
  } else {
    const k = f === 3 ? 2 : 0;
    // só o dorso, a nadadeira dorsal e o rastro d'água
    const hump = ell(28 + k, 62, 19, 14);
    s.fill(hump, BACK);
    s.paintIn(hump, ell(26 + k, 58, 11, 4), PINK.md);
    s.fill(poly([[27 + k, 55], [39 + k, 55], [37 + k, 47], [33 + k, 41], [31 + k, 49]]), BACK);
    s.dots(BACK.rim, [33 + k, 44], [32 + k, 47]);
    // focinho e esguicho do respiro
    s.fill(uni(ell(14 + k, 57, 4, 2.5)), PINK, { n: 1 });
    s.dots('#C8F6FF', [14 + k, 52], [12 + k, 50], [16 + k, 49], [14 + k, 46]);
    water(s, 28 + k, 28, f, 3);
  }
};
