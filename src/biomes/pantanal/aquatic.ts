import { cap, type Drawer, ell, eye, INK, type Mask, path, poly, ramp, rect, type Spr, uni, water, type Pt } from '../../art/animals/kit';

// Répteis e peixes do Pantanal (retratos 64×64, base/linha d'água em y = 58).

// ------------------------------------------------------------------ jacaré-do-pantanal
const CAI = ramp('#6E7E3E', { hi: '#96A858', rim: '#D0E08C', sh: '#475A30', dp: '#2A3C32', ol: '#0E1A18' });
const CBELLY = ramp('#DCD29C', { hi: '#F4EDC4', sh: '#B4AA78', dp: '#7A7458', ol: '#2E3A2C' });
const MOUTH = ramp('#B03048', { hi: '#E8687A', ol: '#2B0F1E' });

export const jacare: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const open = f >= 2 ? (f === 3 ? 2 : 1) : 0;
  const dy = f === 3 ? 2 : 0;
  // cauda grossa, enrolada para a direita
  const tail = path([[40, 22, 7], [50, 17, 5.6], [58, 20, 4], [61, 28, 2.4]]);
  s.fill(tail, CAI);
  for (const [x, y] of [[48, 14], [53, 15], [58, 18]] as Pt[]) s.dots(CAI.dp, [x, y], [x + 1, y + 1]);
  s.paintIn(tail, ell(55, 20, 1.4, 4), CAI.sh);
  // patas traseiras abertas, dedos com garras
  const limb = (x0: number, y0: number, x1: number, y1: number, r0: number, r1: number) => {
    s.fill(cap(x0, y0, r0, x1, y1, r1), CAI);
    s.fill(ell(x1 + Math.sign(x1 - x0) * 1.5, y1 + 1, 4.2, 2.6), CAI, { n: 1 });
    for (const k of [-3, 0, 3]) s.put(x1 + Math.sign(x1 - x0) * 4 + k * 0.4, y1 + 3 + Math.abs(k) * 0.3, CBELLY.hi);
  };
  for (const sx of [-1, 1]) {
    limb(32 + sx * 13, 22, 32 + sx * 24, 26, 5.2, 3);
    limb(32 + sx * 14, 36 + dy * 0.5, 32 + sx * 25, 43 + dy * 0.5, 5, 3);
  }
  // corpo comprido visto de cima: couraça de escudos e faixas escuras
  const body = uni(ell(32, 29, 17, 15), ell(32, 40, 11, 6));
  s.fill(body, CAI);
  for (const yy of [18, 24, 30, 36]) s.paintIn(body, ell(32, yy, 16, 1.1), CAI.sh);
  for (let yy = 15; yy < 42; yy += 3) {
    for (const sx of [-1, 1]) {
      s.put(32 + sx * 2.5, yy, CAI.rim);
      s.put(32 + sx * 2.5, yy + 1, CAI.dp);
      s.put(32 + sx * 7, yy + 1.5, CAI.hi);
      s.put(32 + sx * 11, yy + 3, CAI.hi);
    }
  }
  s.line(32, 14, 32, 40, CAI.dp);
  // focinho largo que afina até a ponta, com a mandíbula amarelada embaixo
  const hy = 34 + dy + b * 0.5;
  const snout: Mask = uni(poly([[20, hy], [44, hy], [41, hy + 9], [37.5, hy + 18], [26.5, hy + 18], [23, hy + 9]]), ell(32, hy + 19.5, 5.8, 3.2));
  if (open === 0) {
    s.fill(snout, CAI);
    // linha da boca e dentes que aparecem por fora
    for (const sx of [-1, 1]) {
      s.line(32 + sx * 10, hy + 6, 32 + sx * 6.5, hy + 18, CBELLY.sh);
      for (const [yy, o] of [[8, 9.2], [11, 8.2], [14, 7.2], [17, 6.4]] as Pt[]) s.put(32 + sx * o, hy + yy, '#FFFFFF');
    }
    s.paintIn(snout, ell(32, hy + 6, 6, 4), CAI.hi);
    s.dots(CAI.dp, [30, hy + 22], [34, hy + 22]);
    s.fill(ell(32, hy + 20, 3.2, 1.6), CAI, { ol: false, n: 1 });
  } else {
    // boca aberta: mandíbula de baixo caída, língua e dentes
    const lower = poly([[22, hy + 12 + open], [42, hy + 12 + open], [38.5, hy + 22 + open * 2], [25.5, hy + 22 + open * 2]]);
    s.fill(lower, CBELLY);
    for (const x of [26, 29, 32, 35, 38]) s.put(x, hy + 20 + open * 2, CBELLY.dp);
    s.fill(poly([[21, hy], [43, hy], [41, hy + 7], [37.5, hy + 12 + open], [26.5, hy + 12 + open], [23, hy + 7]]), CAI);
    const gape = ell(32, hy + 12 + open, 8.4 + open, 4.2 + open * 1.5);
    s.fill(gape, MOUTH, { rim: false, n: 1 });
    s.paintIn(gape, ell(32, hy + 14 + open, 4.4, 2 + open * 0.6), MOUTH.hi);
    for (const sx of [-1, 1]) {
      for (let k = 0; k < 4; k++) s.put(32 + sx * (3 + k * 1.8), hy + 8 + open * 0.2 + k * 0.3, '#FFFFFF');
      for (let k = 0; k < 3; k++) s.put(32 + sx * (4 + k * 2), hy + 16 + open * 2 - k * 0.6, '#FFFFFF');
    }
    s.fill(ell(32, hy + 7.5, 3.4, 1.8), CAI, { ol: false, n: 1 });
  }
  // olhos saltados sobre a crista óssea
  for (const sx of [-1, 1]) {
    s.fill(ell(32 + sx * 8.4, hy + 1.2, 4, 3.2), CAI);
    eye(s, 32 + sx * 8.4 - 2.5, hy - 0.8, 5, 4, '#E8C23A', f === 1);
  }
  s.line(26, hy + 1, 38, hy + 1, CAI.rim);
};

// ------------------------------------------------------------------ piranha-vermelha
const PSILVER = ramp('#8C9CA6', { hi: '#B8C8D0', rim: '#E8F4F8', sh: '#5E7080', dp: '#3A4658', ol: '#161E2E' });
const PBACK = ramp('#586470', { hi: '#7C8A96', sh: '#38444F', dp: '#252E3C', ol: '#101624' });
const PRED = ramp('#E0402E', { hi: '#FF7A4A', rim: '#FFC090', sh: '#B02438', dp: '#701834', ol: '#2E0C26' });
const FINRED = ramp('#D43A2E', { hi: '#F26040', sh: '#A82038', dp: '#6E1430', ol: '#2E0C26' });

function teeth(s: Spr, pts: Pt[]): void {
  for (const [x, y] of pts) s.dots('#FFFFFF', [x, y], [x, y + 1]);
}

export const piranha: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const hi = f >= 2;
  const k = f === 3 ? 1 : 0;
  if (!hi) {
    // peixe alto e boca para cima, saindo da água
    const spine: [number, number, number][] = [[12, 60, 5], [24, 54, 9], [36, 46, 10.5], [45, 40 - b, 8.5]];
    const body = path(spine);
    // cauda e nadadeira dorsal
    s.fill(poly([[2, 54], [14, 56], [10, 62], [0, 64]]), FINRED);
    s.fill(poly([[24, 44], [33, 36], [40, 38], [34, 46]]), PBACK);
    s.fill(body, PSILVER);
    s.paintIn(body, path([[16, 49, 4], [28, 41, 5], [38, 35, 5]]), PBACK.md);
    s.paintIn(body, path([[16, 61, 4], [28, 53, 5], [40, 46, 5]]), PRED.md);
    for (const [x, y] of [[22, 52], [27, 49], [31, 46], [26, 54], [32, 52]] as Pt[]) s.dots(PSILVER.rim, [x, y]);
    for (const [x, y] of [[24, 47], [30, 43], [34, 41], [28, 50]] as Pt[]) s.dots(PBACK.dp, [x, y]);
    // mancha escura atrás da guelra
    s.paint(ell(34, 48, 1.8, 2.8), PBACK.dp);
    // cabeça romba com boca de dentes
    s.fill(poly([[44, 32 - b], [54, 36 - b], [56, 40 - b], [52, 44 - b], [43, 46 - b]]), PSILVER);
    s.fill(poly([[48, 42 - b], [57, 41 - b], [56, 46 - b], [48, 47 - b]]), PSILVER);
    s.line(49, 41 - b, 56, 40 - b, INK);
    teeth(s, [[51, 41 - b], [53, 41 - b], [55, 41 - b]]);
    s.dots(PRED.md, [47, 45 - b], [51, 45 - b]);
    eye(s, 44.5, 34 - b, 5, 5, '#E83A2E', f === 1);
    // nadadeira peitoral vermelha
    s.fill(poly([[36, 52], [42, 56], [37, 60]]), FINRED);
    water(s, 28, 26, f);
  } else {
    // salto: o corpo arqueia e a boca abre com os dentes à mostra
    const spine: [number, number, number][] = [[12, 56 + k * 2, 4], [22, 47, 8], [32, 38 - k, 9.5], [40, 29 - k * 2, 8]];
    const body = path(spine);
    s.fill(poly([[4, 50 + k * 2], [14, 53 + k * 2], [10, 59 + k * 2], [1, 60 + k * 2]]), FINRED);
    s.fill(poly([[20, 36], [24, 28], [32, 28], [28, 38]]), PBACK);
    s.fill(body, PSILVER);
    s.paintIn(body, path([[16, 41, 4], [24, 34, 5], [32, 26 - k, 5]]), PBACK.md);
    s.paintIn(body, path([[16, 56, 4], [26, 47, 5], [36, 38, 5]]), PRED.md);
    for (const [x, y] of [[20, 46], [25, 41], [29, 37], [24, 48]] as Pt[]) s.dots(PSILVER.rim, [x, y]);
    s.paint(ell(31, 38, 1.6, 2.6), PBACK.dp);
    // cabeça com mandíbulas abertas
    const jawUp = poly([[38, 20 - k], [49, 20 - k], [55, 24 - k], [47, 28 - k], [39, 29 - k]]);
    s.fill(jawUp, PSILVER);
    const jawLow = poly([[41, 32 - k], [52, 32 - k], [56, 38 - k], [46, 40 - k], [40, 36 - k]]);
    s.fill(jawLow, PSILVER);
    const mouth = poly([[44, 27 - k], [54, 25 - k], [55, 33 - k], [46, 32 - k]]);
    s.fill(mouth, MOUTH, { rim: false });
    teeth(s, [[47, 27 - k], [50, 26 - k], [53, 25.5 - k]]);
    s.dots('#FFFFFF', [47, 31 - k], [50, 31.5 - k], [53, 32.5 - k]);
    eye(s, 39.5, 22 - k, 5, 5, '#E83A2E', false);
    s.dots('#FFFFFF', [38, 20 - k]);
    s.fill(poly([[28, 46], [34, 52], [28, 54]]), FINRED);
    // respingos
    s.dots('#D6FAFF', [8, 48], [6, 44], [14, 44], [50, 50], [54, 46], [46, 54]);
    water(s, 30, 24, f, 3);
  }
};

// ------------------------------------------------------------------ dourado
const GOLD = ramp('#E0A030', { hi: '#F6CC54', rim: '#FFF0A0', sh: '#B2662A', dp: '#7A3A2C', ol: '#2E1424' });
const GBACK = ramp('#A8681E', { hi: '#C88A32', sh: '#7C4420', dp: '#4C2A28', ol: '#2A1220' });
const GBELLY = ramp('#F4DC8C', { hi: '#FFF4BC', sh: '#D4AC5C', dp: '#A07C48', ol: '#4A2A28' });
const GFIN = ramp('#E4602C', { hi: '#FF8E4A', rim: '#FFC890', sh: '#B03A2C', dp: '#70202C', ol: '#2E0C20' });

export const dourado: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  if (f < 2) {
    // dorso dourado e cabeça rente à superfície, boca grande
    const spine: [number, number, number][] = [[6, 60, 3.5], [18, 56, 6], [30, 52 - b, 8], [42, 49 - b, 7.5]];
    const body = path(spine);
    s.fill(poly([[0, 50], [10, 56], [8, 62], [-1, 64]]), GFIN);
    s.fill(poly([[26, 48], [32, 40], [38, 40], [38, 49]]), GFIN);
    s.fill(body, GOLD);
    s.paintIn(body, path([[10, 53, 3], [22, 49, 4], [34, 44 - b, 5]]), GBACK.md);
    for (const [x, y] of [[16, 56], [22, 54], [28, 52], [34, 50], [20, 58], [26, 56]] as Pt[]) {
      s.dots(GOLD.hi, [x, y]);
      s.dots(GOLD.sh, [x + 1, y + 1]);
    }
    s.line(12, 57, 40, 51 - b, GOLD.rim);
    const head = poly([[40, 42 - b], [50, 43 - b], [58, 48 - b], [57, 53 - b], [44, 55 - b], [39, 50 - b]]);
    s.fill(head, GOLD);
    s.paintIn(head, rect(40, 51 - b, 20, 6), GBELLY.md);
    s.line(46, 51 - b, 57, 50 - b, INK);
    s.dots('#FFFFFF', [48, 51 - b], [51, 50.5 - b], [54, 50 - b]);
    s.line(41, 44 - b, 41, 54 - b, GOLD.sh);
    eye(s, 44, 45 - b, 5, 5, '#E8A02E', f === 1);
    water(s, 30, 28, f);
  } else {
    // salto fora d'água: corpo arqueado, rabo vermelho para baixo
    const k = f === 3 ? 1 : 0;
    const spine: [number, number, number][] = [[12, 48 - k, 3.4], [20, 38 - k * 2, 6], [31, 31 - k * 3, 8], [43, 28 - k * 3, 7.6], [51, 31 - k * 3, 5]];
    const body = path(spine);
    s.fill(poly([[2, 46 - k], [12, 44 - k], [14, 53 - k], [4, 55 - k]]), GFIN);
    s.fill(poly([[26, 28 - k * 3], [30, 20 - k * 3], [38, 20 - k * 3], [38, 30 - k * 3]]), GFIN);
    s.fill(body, GOLD);
    s.paintIn(body, path([[16, 33 - k, 3], [26, 24 - k * 3, 4], [38, 21 - k * 3, 4.4]]), GBACK.md);
    s.paintIn(body, path([[16, 43 - k, 3.4], [28, 37 - k * 3, 5], [42, 35 - k * 3, 5]]), GBELLY.md);
    for (const [x, y] of [[20, 38], [26, 33], [32, 30], [38, 29], [24, 40], [30, 36]] as Pt[]) {
      s.dots(GOLD.hi, [x, y - k * 2]);
      s.dots(GOLD.sh, [x + 1, y + 1 - k * 2]);
    }
    s.paint(ell(15, 46 - k, 1.6, 2), GBACK.dp);
    const head = poly([[48, 24 - k * 3], [56, 28 - k * 3], [60, 33 - k * 3], [58, 38 - k * 3], [48, 38 - k * 3], [44, 32 - k * 3]]);
    s.fill(head, GOLD);
    s.line(50, 35 - k * 3, 59, 34 - k * 3, INK);
    s.dots('#FFFFFF', [53, 35 - k * 3], [56, 34.6 - k * 3]);
    s.line(47, 26 - k * 3, 47, 37 - k * 3, GOLD.sh);
    eye(s, 50, 28 - k * 3, 5, 5, '#E8A02E', false);
    s.fill(poly([[30, 40 - k * 3], [36, 46 - k * 3], [30, 47 - k * 3]]), GFIN);
    s.dots('#D6FAFF', [8, 56], [4, 52], [14, 54], [54, 50], [58, 54], [48, 56], [20, 58]);
    water(s, 30, 26, f, 3);
  }
};
