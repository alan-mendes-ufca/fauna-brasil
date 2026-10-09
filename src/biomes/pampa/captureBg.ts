import { rng, type Painter } from '../../art/canvas';
import { ANIMAL_GROUND_Y, W, X0, X1, Y0, Y1, beams, drawGlints, drawWaves, ellipse, frond, gradient, layer, line, type CaptureBgPainter } from '../../art/captureBg';
import type { Habitat } from '../../data/species';

// Fundos de captura do Pampa (320×214 de arte): campo nativo, banhado e butiazal.
// Céu amplo e azul-acinzentado, horizonte longo de coxilhas, luz fria e suave; sombras azul-esverdeadas.

const C = {
  g0: '#1e4a34',
  g1: '#3a7040',
  g2: '#5e9a48',
  g3: '#8cbc58',
  g4: '#b8d880',
  g5: '#e0ecae',
  straw0: '#8a8448',
  straw1: '#c4b874',
  straw2: '#e6dc9c',
  bark0: '#2a2224',
  bark1: '#54463e',
  bark2: '#80705c',
  bark3: '#b0a088',
  blue0: '#10303a',
  blue1: '#2a6258',
  blue2: '#4c9a74',
  blue3: '#8cc896',
  blue4: '#d4efc0',
  fruit0: '#a8501a',
  fruit1: '#d87a1c',
  fruit2: '#f6b43a',
  fruit3: '#ffe488',
};

const SHADE = 'rgba(24,56,72,0.34)';

function shade(p: Painter, x: number, y: number, rx: number): void {
  ellipse(p, x + 2, y, rx, Math.max(1, Math.round(rx * 0.22)), SHADE);
}

/** Céu frio do sul: azul-acinzentado em degradê, nuvens baixas e achatadas e um sol difuso. */
function coolSky(p: Painter, r: () => number, horizon: number, sunX: number, sunY: number): void {
  gradient(p, X0, Y0, W, horizon - Y0 + 8, ['#5f90c0', '#86aed0', '#b4cfe0', '#dbe8ea', '#eef0e6']);
  for (const [rad, a] of [[52, 0.08], [34, 0.12], [20, 0.2], [11, 0.4]] as const) ellipse(p, sunX, sunY, rad, Math.round(rad * 0.8), `rgba(255,250,232,${a})`);
  ellipse(p, sunX, sunY, 5, 5, '#fffdf0');
  // nuvens: faixas longas, claras no topo e cinzentas embaixo
  for (let i = 0; i < 9; i++) {
    const x = X0 + Math.floor(r() * W);
    const y = Y0 + 10 + Math.floor(r() * (horizon - 20));
    const rx = 22 + Math.floor(r() * 36);
    const ry = 3 + Math.floor(r() * 3);
    ellipse(p, x, y + 2, rx, ry, 'rgba(150,172,196,0.38)');
    ellipse(p, x - 2, y, rx - 4, ry, 'rgba(255,255,255,0.62)');
    ellipse(p, x - 6, y - 2, Math.round(rx * 0.5), Math.max(1, ry - 1), 'rgba(255,255,255,0.75)');
  }
}

/** Camadas de coxilhas: ondas longas e suaves, do azulado distante ao verde próximo. */
function coxilhas(p: Painter, r: () => number, layers: { col: string; crest: string; base: number; amp: number; fr: number; off: number }[]): void {
  for (const L of layers) {
    for (let x = X0; x < X1; x++) {
      const h = Math.round(L.amp * (Math.sin(x * L.fr + L.off) + 0.5 * Math.sin(x * L.fr * 2.3 + L.off * 2) + 0.2 * Math.sin(x * L.fr * 5.1)));
      const y = L.base - h;
      p.vline(x, y, 22, L.col);
      p.px(x, y, L.crest);
      if (r() < 0.05) p.px(x, y + 1, L.crest);
    }
  }
}

function blades(p: Painter, r: () => number, x: number, base: number, n: number, h: number, straw = 0.2): void {
  for (let i = 0; i < n; i++) {
    const a = (r() - 0.5) * 1.3;
    const len = h * (0.55 + r() * 0.55);
    const x0 = x + i - n / 2;
    const x1 = x0 + Math.sin(a) * len;
    const y1 = base - Math.cos(a) * len;
    const s = r() < straw;
    line(p, x0, base, x1, y1, s ? C.straw1 : r() < 0.5 ? C.g1 : C.g2);
    p.px(Math.round(x1), Math.round(y1) - 1, s ? C.straw2 : C.g4);
  }
}

/** Chão de campo em perspectiva: toques de tom e tufos que crescem com a proximidade. */
function groundTexture(p: Painter, r: () => number, top: number, n: number, cols: string[]): void {
  for (let i = 0; i < n; i++) {
    const t = Math.pow(r(), 1.5);
    const y = Math.round(top + t * (Y1 - top));
    const s = 1 + Math.floor(t * 3);
    p.rect(Math.round(X0 + r() * W), y, s * 2 + 1, s, cols[Math.floor(r() * cols.length)]);
  }
}

function flower(p: Painter, x: number, y: number, c: string, stem = 6): void {
  p.vline(x, y + 1, stem, C.g2);
  p.px(x - 1, y, c).px(x + 1, y, c).px(x, y - 1, c).px(x, y + 1, c).px(x, y, '#fff6c0');
}

function umbuFar(p: Painter, r: () => number, x: number, base: number, s: number): void {
  shade(p, x, base + 1, Math.round(s * 0.9));
  p.vline(x, base - Math.round(s * 0.4), Math.round(s * 0.4), C.bark1);
  p.vline(x + 1, base - Math.round(s * 0.4), Math.round(s * 0.4), C.bark2);
  const cy = base - Math.round(s * 0.55);
  ellipse(p, x, cy, Math.round(s * 1.0), Math.round(s * 0.52), C.g0);
  ellipse(p, x - 1, cy - 1, Math.round(s * 0.9), Math.round(s * 0.44), C.g1);
  ellipse(p, x - Math.round(s * 0.2), cy - Math.round(s * 0.2), Math.round(s * 0.62), Math.round(s * 0.28), C.g2);
  for (let i = 0; i < 6; i++) p.px(x - s + Math.floor(r() * s * 2), cy - Math.round(s * 0.3) + Math.floor(r() * 4), C.g4);
}

function butiaPalm(p: Painter, x: number, base: number, h: number): void {
  shade(p, x, base + 1, Math.round(h * 0.55));
  const tw = Math.max(3, Math.round(h * 0.12));
  for (let y = base; y > base - h; y--) {
    const wd = tw + (y > base - 4 ? 1 : 0);
    p.hline(x - (wd >> 1), y, wd, C.bark2);
    p.px(x - (wd >> 1), y, C.bark3);
    p.px(x - (wd >> 1) + wd - 1, y, C.bark0);
    if ((base - y) % 4 === 0) p.hline(x - (wd >> 1), y, wd, C.bark1);
  }
  const top = base - h;
  const len = Math.round(h * 0.75) + 6;
  for (let k = 0; k < 9; k++) {
    const ang = -1.75 + k * 0.44;
    frond(p, x, top + 1, len, ang, 0.075 * Math.sign(ang || 1) * (Math.abs(ang) > 0.5 ? 1 : 0.4), C.blue1, k % 2 ? C.blue3 : C.blue2);
  }
  ellipse(p, x, top + 2, 3, 2, C.blue0);
  for (const [dx, dy] of [[-2, 4], [0, 5], [2, 4], [-1, 6], [1, 6]] as const) p.px(x + dx, top + dy, C.fruit1).px(x + dx + 1, top + dy, C.fruit2);
}

// ---------- campo nativo ----------

function campoBack(p: Painter): void {
  const r = rng(401);
  const horizon = 82;
  coolSky(p, r, horizon, 236, 34);
  coxilhas(p, r, [
    { col: '#8ea8bc', crest: '#a6bccc', base: horizon + 3, amp: 7, fr: 0.014, off: 0.6 },
    { col: '#6e9a88', crest: '#8cb49a', base: horizon + 10, amp: 6, fr: 0.021, off: 2.1 },
    { col: '#5c9050', crest: '#84b45e', base: horizon + 17, amp: 5, fr: 0.03, off: 4.2 },
  ]);
  // taipa de pedra e umbus distantes sobre a coxilha do meio
  for (let x = 40; x < 118; x += 3) p.rect(x, horizon + 12 + Math.round(Math.sin(x * 0.03) * 2), 2, 1, x % 6 === 0 ? '#aab4b8' : '#7e8c94');
  umbuFar(p, r, 262, horizon + 15, 9);
  umbuFar(p, r, 74, horizon + 17, 6);
  // butiás e capões longínquos
  for (const [x, b] of [[170, horizon + 12], [198, horizon + 14], [26, horizon + 12]] as const) {
    p.vline(x, b - 6, 6, C.bark2);
    for (let k = 0; k < 5; k++) p.px(x - 3 + k * 1.5, b - 7 + Math.abs(k - 2) * 1, C.blue2).px(x - 3 + k * 1.5 + 1, b - 7 + Math.abs(k - 2), C.blue3);
  }
  for (let i = 0; i < 14; i++) ellipse(p, 100 + Math.floor(r() * 50), horizon + 21, 3 + Math.floor(r() * 3), 2, r() < 0.5 ? C.g0 : C.g1);
  // campo de primeiro plano
  gradient(p, X0, horizon + 22, W, Y1 - horizon, ['#7cae56', '#6c9e4c', '#5a8a40', '#486f36', '#365a2e']);
  groundTexture(p, r, horizon + 24, 520, [C.g3, C.g1, C.straw1, C.g4, C.g0]);
  for (let i = 0; i < 260; i++) {
    const t = Math.pow(r(), 1.4);
    const y = Math.round(horizon + 26 + t * (Y1 - horizon - 26));
    blades(p, r, Math.round(X0 + r() * W), y, 3, 3 + t * 10, 0.28);
  }
  // flores do campo no meio-plano
  for (const [x, y, c] of [[48, 118, '#ffffff'], [98, 128, '#f6d03c'], [214, 122, '#d8a8f0'], [276, 136, '#ffffff'], [132, 112, '#ff9ac8']] as const) flower(p, x, y, c, 3);
  ellipse(p, 160, ANIMAL_GROUND_Y + 2, 36, 5, 'rgba(36,70,50,0.34)');
}

function campoFront(p: Painter): void {
  const r = rng(402);
  blades(p, r, X0 + 20, Y1, 22, 52, 0.25);
  blades(p, r, X1 - 20, Y1, 22, 56, 0.25);
  blades(p, r, X0 + 70, Y1, 14, 30, 0.3);
  blades(p, r, X1 - 66, Y1, 14, 32, 0.3);
  shade(p, X0 + 24, Y1 - 3, 40);
  shade(p, X1 - 24, Y1 - 3, 40);
  // pluma de capim-dos-pampas
  for (const [x, h] of [[X0 + 38, 62], [X1 - 40, 66]] as const) {
    for (let k = 0; k < 4; k++) line(p, x, Y1, x + (k - 1.5) * 1.6, Y1 - h * (0.8 + k * 0.05), C.g2);
    ellipse(p, x, Y1 - h - 2, 2, 5, '#f4f0dc');
    ellipse(p, x - 1, Y1 - h - 3, 1, 4, '#ffffff');
  }
  for (const [x, y, c] of [[34, 202, '#ffffff'], [288, 198, '#d8a8f0'], [62, 208, '#f6d03c']] as const) flower(p, x, y, c, 7);
}

// ---------- banhado ----------

function banhadoBack(p: Painter): void {
  const r = rng(411);
  const horizon = 72;
  const shore = 136;
  coolSky(p, r, horizon, 90, 30);
  coxilhas(p, r, [
    { col: '#8ea8bc', crest: '#a6bccc', base: horizon + 2, amp: 5, fr: 0.016, off: 1.4 },
    { col: '#6e9a88', crest: '#8cb49a', base: horizon + 7, amp: 4, fr: 0.025, off: 3.3 },
  ]);
  // margem distante: juncal e capões
  gradient(p, X0, horizon + 6, W, 10, ['#5e9462', '#3e7852']);
  for (let i = 0; i < 70; i++) {
    const x = X0 + Math.floor(r() * W);
    p.vline(x, horizon + 3 - Math.floor(r() * 5), 6 + Math.floor(r() * 4), r() < 0.5 ? C.g1 : C.g2);
  }
  for (const x of [28, 66, 238, 292]) ellipse(p, x, horizon + 4, 9 + Math.floor(r() * 4), 4, r() < 0.5 ? C.g0 : C.g1);
  // lâmina d'água: reflexo do céu em degradê e riscos de ondulação
  gradient(p, X0, horizon + 14, W, shore - horizon - 12, ['#a4c8dc', '#78a8c4', '#4e84a4', '#386c8e', '#2c587a']);
  for (let i = 0; i < 190; i++) {
    const t = Math.pow(r(), 1.3);
    const y = Math.round(horizon + 16 + t * (shore - horizon - 20));
    p.hline(Math.round(X0 + r() * W), y, 3 + Math.floor(t * 16), r() < 0.5 ? 'rgba(230,246,255,0.7)' : 'rgba(30,70,100,0.5)');
  }
  // reflexo dos capões e do sol
  for (const x of [28, 66, 238, 292]) for (let y = horizon + 16; y < horizon + 30; y += 2) p.hline(x - 6 + Math.round(Math.sin(y) * 2), y, 12 - (y - horizon - 16) / 3, 'rgba(20,70,70,0.4)');
  for (let y = horizon + 16; y < shore - 6; y += 2) p.hline(90 - 3 + Math.round(Math.sin(y * 0.7) * 2), y, 6 + ((y * 7) % 5), 'rgba(255,250,224,0.35)');
  // aguapés flutuando
  for (const [x, y] of [[190, 104], [212, 112], [70, 118], [118, 98], [262, 120]] as const) {
    ellipse(p, x, y, 6, 2, C.g1);
    ellipse(p, x - 1, y - 1, 4, 1, C.g3);
    p.px(x + 2, y - 2, '#d8a8f0').px(x + 3, y - 2, '#f4e0fc');
  }
  // margem em primeiro plano: juncal, lama e grama molhada
  for (let x = X0; x < X1; x++) {
    const edge = shore + Math.round(Math.sin(x * 0.06) * 2 + Math.sin(x * 0.19));
    p.vline(x, edge, Y1 - edge, '#5a7e44');
    p.vline(x, edge - 1, 1, '#e8f6fc');
    p.vline(x, edge, 2, '#2e5a3e');
  }
  gradient(p, X0, shore + 3, W, Y1 - shore - 3, ['#6e9650', '#58803e', '#46682f', '#6a5e40', '#54482f']);
  for (let i = 0; i < 380; i++) {
    const t = Math.pow(r(), 1.4);
    const y = Math.round(shore + 5 + t * (Y1 - shore));
    p.rect(Math.round(X0 + r() * W), y, 1 + Math.floor(t * 4), 1 + Math.floor(t * 2), [C.g3, C.g4, C.g0, '#8a7c58', '#a49470'][Math.floor(r() * 5)]);
  }
  for (let i = 0; i < 80; i++) {
    const t = Math.pow(r(), 1.2);
    blades(p, r, Math.round(X0 + r() * W), Math.round(shore + 8 + t * (Y1 - shore - 8)), 2, 3 + t * 7, 0.05);
  }
  ellipse(p, 160, ANIMAL_GROUND_Y + 4, 34, 4, 'rgba(40,40,28,0.32)');
}

function banhadoFront(p: Painter): void {
  const r = rng(412);
  // galho de corticeira com flores vermelhas, pendendo do canto de cima
  for (const [x, m] of [[X0, 1]] as const) {
    line(p, x, Y0 + 24, x + m * 96, Y0 + 44, C.bark1);
    line(p, x, Y0 + 23, x + m * 96, Y0 + 43, C.bark3);
    for (let i = 0; i < 20; i++) {
      const fx = x + m * (6 + r() * 92);
      const fy = Y0 + 22 + r() * 30;
      ellipse(p, Math.round(fx), Math.round(fy), 6, 3, C.g0);
      ellipse(p, Math.round(fx) - 1, Math.round(fy) - 1, 4, 2, r() < 0.5 ? C.g1 : C.g2);
    }
    for (let i = 0; i < 12; i++) {
      const fx = Math.round(x + m * (10 + r() * 80));
      const fy = Math.round(Y0 + 22 + r() * 28);
      p.px(fx, fy, '#c4281e').px(fx + 1, fy, '#f04a34').px(fx, fy - 1, '#ff7a5a').px(fx + 1, fy + 1, '#8a1820');
    }
  }
  // juncal alto e tiririca
  for (const [x, n, h] of [[X0 + 24, 20, 50], [X1 - 24, 20, 54], [X0 + 84, 11, 28], [X1 - 80, 11, 30]] as const) {
    for (let i = 0; i < n; i++) {
      const a = (r() - 0.5) * 1.0;
      const len = h * (0.55 + r() * 0.5);
      line(p, x + i - n / 2, Y1, x + i - n / 2 + Math.sin(a) * len, Y1 - Math.cos(a) * len, r() < 0.5 ? '#2c6a48' : '#6aa858');
    }
  }
  shade(p, X0 + 26, Y1 - 3, 36);
  shade(p, X1 - 26, Y1 - 3, 36);
  // espigas marrons de junco
  for (const x of [X0 + 54, X1 - 48, X1 - 90]) {
    p.vline(x, Y1 - 56, 56, '#2c6a48');
    p.rect(x - 1, Y1 - 66, 3, 12, '#6a3e26');
    p.vline(x - 1, Y1 - 66, 12, '#9a6a40');
  }
}

// ---------- butiazal ----------

function butiazalBack(p: Painter): void {
  const r = rng(421);
  const horizon = 74;
  coolSky(p, r, horizon, 70, 28);
  coxilhas(p, r, [
    { col: '#8ea8bc', crest: '#a6bccc', base: horizon + 3, amp: 6, fr: 0.017, off: 2.2 },
    { col: '#5c8e74', crest: '#80b08a', base: horizon + 9, amp: 5, fr: 0.026, off: 0.4 },
  ]);
  // capão de mato ao fundo
  gradient(p, X0, horizon + 5, W, 16, ['#3e7a4a', '#2a5a3c']);
  for (let i = 0; i < 120; i++) {
    const x = X0 + Math.floor(r() * W);
    const y = horizon + 3 + Math.floor(r() * 11);
    ellipse(p, x, y, 4 + Math.floor(r() * 4), 2 + Math.floor(r() * 2), [C.g0, C.g1, C.g2, C.blue1][Math.floor(r() * 4)]);
  }
  for (let i = 0; i < 10; i++) {
    const x = X0 + Math.floor(r() * W);
    const y = horizon + 3 + Math.floor(r() * 9);
    p.px(x, y, '#e8503a').px(x + 1, y, '#ff8a68');
  }
  // chão do butiazal
  gradient(p, X0, horizon + 18, W, Y1 - horizon, ['#6c9a52', '#5a8a46', '#4a7a3c', '#3a6232', '#2e4e2c']);
  groundTexture(p, r, horizon + 20, 480, [C.g3, C.g1, C.g0, C.straw0, C.g2]);
  for (let i = 0; i < 200; i++) {
    const t = Math.pow(r(), 1.4);
    const y = Math.round(horizon + 24 + t * (Y1 - horizon - 24));
    blades(p, r, Math.round(X0 + r() * W), y, 3, 3 + t * 9, 0.12);
  }
  // butiás espalhados em três planos de profundidade
  const palms: [number, number, number][] = [[24, 96, 14], [78, 100, 18], [188, 94, 12], [236, 102, 20], [292, 98, 15], [130, 92, 10], [214, 92, 9], [52, 90, 9]];
  palms.sort((a, b) => a[1] - b[1]);
  for (const [x, b, h] of palms) butiaPalm(p, x, b, h);
  // frutos caídos
  for (let i = 0; i < 26; i++) {
    const t = Math.pow(r(), 1.2);
    const x = Math.round(X0 + r() * W);
    const y = Math.round(horizon + 40 + t * (Y1 - horizon - 44));
    const s = 1 + Math.floor(t * 1.8);
    p.rect(x, y, s + 1, s, C.fruit1);
    p.px(x, y, C.fruit3);
    p.px(x + s, y + s - 1, C.fruit0);
  }
  ellipse(p, 160, ANIMAL_GROUND_Y + 2, 36, 5, 'rgba(20,50,36,0.38)');
}

function butiazalFront(p: Painter): void {
  const r = rng(422);
  // folhas arqueadas de butiá e cacho de frutos pendendo dos cantos de cima
  for (const [x, m] of [[X0 + 8, 1], [X1 - 8, -1]] as const) {
    for (let k = 0; k < 7; k++) frond(p, x, Y0 + 8, 42 + Math.floor(r() * 14), m * (1.0 + k * 0.26), m * 0.1, C.blue0, k % 2 ? C.blue3 : C.blue2);
    for (let i = 0; i < 9; i++) {
      const fx = x + m * (4 + (i % 3) * 3);
      const fy = Y0 + 12 + Math.floor(i / 3) * 4;
      p.px(fx, fy, C.fruit1).px(fx + 1, fy, C.fruit2).px(fx, fy + 1, C.fruit0).px(fx, fy, C.fruit3);
    }
  }
  blades(p, r, X0 + 30, Y1, 14, 30, 0.1);
  blades(p, r, X1 - 30, Y1, 14, 32, 0.1);
  shade(p, X0 + 30, Y1 - 3, 36);
  shade(p, X1 - 30, Y1 - 3, 36);
  for (const [x, y] of [[40, 204], [276, 206], [88, 210]] as const) p.rect(x, y, 3, 3, C.fruit1).px(x, y, C.fruit3).px(x + 2, y + 2, C.fruit0);
}

const mk =
  (back: (p: Painter) => void, front: (p: Painter) => void, water: boolean, fxSeed: number): CaptureBgPainter =>
  (scene, key) => ({
    back: layer(scene, key('back'), back),
    front: layer(scene, key('front'), front),
    fx: layer(scene, key('fx'), water ? (p) => drawGlints(p, fxSeed, 84) : (p) => beams(p, [70, 170, 270], 13, 0.22, 0.1)),
    fxKind: water ? 'glints' : 'beams',
    ...(water ? { waves: layer(scene, key('waves'), (p) => drawWaves(p, 136, false)) } : {}),
  });

export const CAPTURE_BG: Partial<Record<Habitat, CaptureBgPainter>> = {
  'campo-nativo': mk(campoBack, campoFront, false, 0),
  banhado: mk(banhadoBack, banhadoFront, true, 431),
  butiazal: mk(butiazalBack, butiazalFront, false, 0),
};
