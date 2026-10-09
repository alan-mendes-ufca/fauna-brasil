import type { Habitat } from '../../data/species';
import { rng, type Painter } from '../../art/canvas';
import { ANIMAL_GROUND_Y, W, X0, X1, Y0, Y1, beams, drawGlints, drawWaves, ellipse, foliage, gradient, groundShadow, layer, line, type CaptureBgPainter } from '../../art/captureBg';

// Fundos da tela de captura do Pantanal: campo alagado, baía e mata de cordilheira.
// Céu azul-esverdeado de ar úmido, sol alto e verdes vivos; água clara com reflexo dourado.

const P = {
  sky0: '#3aa0d0',
  sky1: '#7fcbe0',
  sky2: '#d4f0d8',
  sky3: '#fff4c8',
  deep0: '#06303a',
  deep1: '#0c5560',
  deep2: '#17808a',
  deep3: '#4cc0b4',
  shal0: '#2c6c5c',
  shal1: '#4a9a84',
  shal2: '#7acbae',
  shal3: '#c4f0dc',
  leaf0: '#06281c',
  leaf1: '#0e4a2c',
  leaf2: '#1f7a38',
  leaf3: '#58b048',
  leaf4: '#b8e868',
  gold: '#ffe48a',
  gold2: '#fff8c8',
  bark0: '#2a1c10',
  bark1: '#4e3822',
  bark2: '#7e6040',
  bark3: '#b09468',
};

function sky(p: Painter, horizon: number, sunX: number, sunY: number, r: () => number): void {
  gradient(p, X0, Y0, W, horizon - Y0 + 4, [P.sky0, P.sky1, P.sky2, P.sky3]);
  for (const [rad, a] of [[40, 0.1], [28, 0.16], [18, 0.3], [11, 0.55]] as const) ellipse(p, sunX, sunY, rad, rad, `rgba(255,244,190,${a})`);
  ellipse(p, sunX, sunY, 7, 7, P.gold2);
  // nuvens baixas e achatadas
  for (let i = 0; i < 5; i++) {
    const cx = X0 + Math.floor(r() * W);
    const cy = Y0 + 10 + Math.floor(r() * (horizon - 30));
    ellipse(p, cx, cy + 2, 18 + Math.floor(r() * 12), 3, 'rgba(255,255,255,0.45)');
    ellipse(p, cx - 3, cy, 12, 3, 'rgba(255,255,255,0.7)');
  }
  // um bando de aves ao longe
  for (const [bx, by] of [[70, 28], [80, 33], [90, 27], [64, 36]] as const) {
    p.px(bx - 2, by, '#2a4a4a').px(bx - 1, by - 1, '#2a4a4a').px(bx, by, '#2a4a4a').px(bx + 1, by - 1, '#2a4a4a').px(bx + 2, by, '#2a4a4a');
  }
}

/** Palmeira carandá de longe: tronco fino e copa em leque. */
function farPalm(p: Painter, x: number, base: number, h: number): void {
  p.vline(x, base - h, h, P.leaf0);
  p.vline(x + 1, base - h, h, P.leaf1);
  for (let k = -3; k <= 3; k++) line(p, x, base - h, x + k * 3, base - h - 5 + Math.abs(k), k < 0 ? P.leaf2 : P.leaf1);
  line(p, x, base - h, x - 4, base - h + 4, P.leaf1);
  line(p, x + 1, base - h, x + 5, base - h + 4, P.leaf0);
}

/** Linha de mata baixa ao longe com palmeiras e árvores floridas. */
function farTreeline(p: Painter, r: () => number, horizon: number, strength: number): void {
  gradient(p, X0, horizon - 14, W, 16, ['rgba(40,120,110,0)', '#2c8a78', '#1e6a5a']);
  foliage(p, r, 160, horizon - 8, 190, 9, 120, 6, [P.leaf0, P.leaf1, P.leaf2, P.leaf3]);
  foliage(p, r, 160, horizon - 3, 190, 5, 90, 5, ['#0e4a3a', '#1a6a4a', '#2c8a58', '#58b058']);
  for (let i = 0; i < strength; i++) farPalm(p, X0 + 8 + Math.floor(r() * (W - 16)), horizon - 2, 10 + Math.floor(r() * 10));
  // copas floridas de paratudo e ipê
  for (let i = 0; i < 8; i++) {
    const x = X0 + Math.floor(r() * W);
    ellipse(p, x, horizon - 8 - Math.floor(r() * 4), 5, 3, i % 3 === 0 ? '#e86098' : '#f0c020');
    ellipse(p, x - 1, horizon - 9, 3, 1, i % 3 === 0 ? '#ffb0d0' : '#ffe870');
  }
}

/** Tufos de capim e junco que crescem com a perspectiva (maiores perto do observador). */
function tufts(p: Painter, r: () => number, y0: number, y1: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const t = Math.pow(r(), 1.2);
    const y = Math.round(y0 + t * (y1 - y0));
    const x = Math.round(X0 + r() * W);
    const h = 2 + Math.round(t * 9);
    for (let k = -1; k <= 1; k++) {
      for (let j = 0; j < h - Math.abs(k); j++) p.px(x + k * (1 + Math.floor(t * 2)) + Math.round(k * j * 0.15), y - j, j > h - 3 ? P.leaf4 : j > h / 2 ? P.leaf3 : P.leaf2);
    }
    p.px(x, y + 1, 'rgba(10,50,40,0.5)').px(x + 1, y + 1, 'rgba(10,50,40,0.35)');
  }
}

/** Aguapés: folhas redondas e lustrosas com uma espiga lilás. */
function hyacinths(p: Painter, r: () => number, cx: number, cy: number, n: number, s: number): void {
  for (let i = 0; i < n; i++) {
    const x = Math.round(cx + (r() - 0.5) * s * 3);
    const y = Math.round(cy + (r() - 0.5) * s * 0.8);
    ellipse(p, x, y, s, Math.max(1, Math.round(s * 0.4)), P.leaf1);
    ellipse(p, x - 1, y - 1, s - 1, Math.max(1, Math.round(s * 0.32)), P.leaf3);
    p.hline(x - Math.floor(s / 2), y - 1, Math.max(2, s - 2), P.leaf4);
    if (r() < 0.5) {
      p.vline(x, y - s - 1, s, P.leaf2);
      p.px(x, y - s - 2, '#e0b8f8').px(x - 1, y - s - 1, '#b27ad8').px(x + 1, y - s - 1, '#d8a8f0').px(x, y - s, '#8a52b8');
    }
  }
}

// ------------------------------------------------------------------ campo alagado

function alagadoBack(p: Painter): void {
  const r = rng(301);
  const horizon = 60;
  sky(p, horizon, 236, 30, r);
  farTreeline(p, r, horizon, 8);
  // lâmina d'água rasa sobre o campo, com o céu refletido
  gradient(p, X0, horizon, W, Y1 - horizon, [P.shal3, P.shal2, P.shal1, P.shal0, '#1e4e44']);
  for (let i = 0; i < 220; i++) {
    const t = Math.pow(r(), 1.5);
    const y = Math.round(horizon + 2 + t * (Y1 - horizon));
    p.hline(Math.round(X0 + r() * W), y, 3 + Math.floor(t * 16), r() < 0.5 ? P.shal3 : P.shal0);
  }
  for (let y = horizon + 1; y < Y1; y += 2) {
    const t = (y - horizon) / (Y1 - horizon);
    const w = Math.round(5 + t * 28 + r() * 6);
    p.hline(Math.round(236 - w / 2 + (r() - 0.5) * 5), y, w, r() < 0.6 ? P.gold : P.gold2);
  }
  tufts(p, r, horizon + 4, ANIMAL_GROUND_Y - 6, 110);
  hyacinths(p, r, 80, horizon + 28, 5, 4);
  hyacinths(p, r, 250, horizon + 36, 5, 5);
  hyacinths(p, r, 170, horizon + 14, 4, 2);
  // sombra do animal na água
  ellipse(p, 160, ANIMAL_GROUND_Y + 2, 34, 4, 'rgba(10,50,50,0.35)');
}

function alagadoFront(p: Painter): void {
  const r = rng(302);
  // capim alto e aguapés nos cantos de baixo
  for (const side of [-1, 1]) {
    for (let i = 0; i < 13; i++) {
      const bx = side < 0 ? X0 + 3 + i * 4 : X1 - 3 - i * 4;
      const h = 40 + Math.floor(r() * 56) - i * 2;
      for (let y = 0; y < h; y++) {
        const t = y / h;
        p.px(bx + Math.round(side * Math.sin(y * 0.05 + i) * 4 * t), Y1 - y, t > 0.88 ? P.leaf4 : t > 0.5 ? P.leaf3 : y % 7 < 3 ? P.leaf1 : P.leaf2);
      }
      if (i % 4 === 1) p.rect(bx - 1, Y1 - h - 3, 3, 4, '#d8c878');
    }
  }
  hyacinths(p, r, X0 + 60, Y1 - 5, 5, 6);
  hyacinths(p, r, X1 - 60, Y1 - 4, 5, 6);
  hyacinths(p, r, 160, Y1 - 1, 3, 7);
  // junco pendurado no alto
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) {
    const x = side < 0 ? X0 + 4 + i * 5 : X1 - 4 - i * 5;
    for (let y = 0; y < 14 + i * 3; y++) p.px(x + Math.round(side * y * 0.1), Y0 + y, y > 10 ? P.leaf3 : P.leaf1);
  }
}

// ------------------------------------------------------------------ baía

function baiaBack(p: Painter): void {
  const r = rng(311);
  const horizon = 54;
  sky(p, horizon, 226, 26, r);
  // margem distante: mata de galeria e carandás
  farTreeline(p, r, horizon, 10);
  gradient(p, X0, horizon, W, 6, ['#2c7a62', '#4a9a84']);
  // água aberta, funda e clara
  gradient(p, X0, horizon + 2, W, Y1 - horizon, [P.deep3, P.deep2, P.deep1, P.deep0]);
  for (let i = 0; i < 300; i++) {
    const t = Math.pow(r(), 1.5);
    const y = Math.round(horizon + 4 + t * (Y1 - horizon));
    p.hline(Math.round(X0 + r() * W), y, 3 + Math.floor(t * 18), r() < 0.5 ? P.deep3 : P.deep1);
  }
  // reflexo da mata na margem
  for (let x = X0; x < X1; x += 2) if (r() < 0.6) p.vline(x, horizon + 2, 3 + Math.floor(r() * 5), 'rgba(6,50,40,0.5)');
  // reflexo dourado do sol
  for (let y = horizon + 3; y < Y1; y += 2) {
    const t = (y - horizon) / (Y1 - horizon);
    const w = Math.round(6 + t * 36 + r() * 8);
    p.hline(Math.round(226 - w / 2 + (r() - 0.5) * 6), y, w, r() < 0.6 ? P.gold : P.gold2);
  }
  // vitórias-régias a meia distância
  hyacinths(p, r, 70, horizon + 40, 4, 5);
  ellipse(p, 270, ANIMAL_GROUND_Y - 6, 12, 3, P.leaf1);
  ellipse(p, 270, ANIMAL_GROUND_Y - 7, 11, 2, P.leaf3);
  ellipse(p, 160, ANIMAL_GROUND_Y + 2, 34, 4, 'rgba(2,30,40,0.4)');
}

function baiaFront(p: Painter): void {
  const r = rng(312);
  for (const [cx, cy, rx] of [[X0 + 24, Y1 - 8, 34], [X1 - 26, Y1 - 6, 36], [X0 + 96, Y1 - 2, 22], [X1 - 100, Y1 - 2, 20]] as const) {
    ellipse(p, cx, cy, rx, Math.round(rx * 0.32), P.leaf0);
    ellipse(p, cx, cy - 1, rx - 2, Math.round(rx * 0.28), P.leaf2);
    ellipse(p, cx - 3, cy - 3, Math.round(rx * 0.55), Math.round(rx * 0.14), P.leaf3);
    p.hline(cx - 1, cy - 2, rx, P.leaf0);
  }
  hyacinths(p, r, X0 + 50, Y1 - 6, 4, 6);
  hyacinths(p, r, X1 - 52, Y1 - 5, 4, 6);
  // juncos e capim-d'água nos lados
  for (const side of [-1, 1]) {
    for (let i = 0; i < 10; i++) {
      const bx = side < 0 ? X0 + 3 + i * 4 : X1 - 3 - i * 4;
      const h = 44 + Math.floor(r() * 52) - i * 2;
      for (let y = 0; y < h; y++) p.px(bx + Math.round(side * Math.sin(y * 0.05 + i) * 4 * (y / h)), Y1 - y, y > h - 8 ? P.leaf4 : y % 7 < 3 ? P.leaf1 : P.leaf2);
    }
  }
}

// ------------------------------------------------------------------ cordilheira

function cordilheiraBack(p: Painter): void {
  const r = rng(321);
  const horizon = 70;
  // fundo de mata: luz verde-dourada coada pelas copas
  gradient(p, X0, Y0, W, horizon - Y0 + 6, ['#0c3c2c', '#17603a', '#3a8a48', '#9acc6a']);
  foliage(p, r, 160, horizon - 20, 200, 30, 220, 9, [P.leaf0, P.leaf1, P.leaf2, P.leaf3]);
  // troncos finos ao fundo e um ipê florido
  for (let i = 0; i < 12; i++) {
    const x = X0 + 10 + Math.floor(r() * (W - 20));
    const w = 3 + Math.floor(r() * 3);
    p.rect(x, Y0, w, horizon - Y0 + 8, i % 2 ? P.bark1 : P.bark0);
    p.vline(x, Y0, horizon - Y0 + 8, P.bark2);
  }
  for (const [x, y, c, c2] of [[70, 20, '#f0c020', '#ffe870'], [250, 14, '#e86098', '#ffb0d0']] as const) {
    ellipse(p, x, y, 26, 14, c);
    ellipse(p, x - 6, y - 4, 17, 8, c2);
    p.vline(x - 2, y + 12, 60, P.bark1);
  }
  foliage(p, r, 160, Y0 + 10, 210, 20, 150, 9, [P.leaf0, P.leaf1, P.leaf2, P.leaf3]);
  // sub-bosque na linha do chão, para o fundo não terminar num corte reto
  foliage(p, r, 160, horizon + 2, 200, 6, 120, 6, [P.leaf0, P.leaf1, P.leaf2, P.leaf3]);
  // chão: folhas, capim e manchas de sol
  gradient(p, X0, horizon + 4, W, Y1 - horizon - 4, ['#3a6a2c', '#5a8c34', '#6c9a3c', '#3e6a2a']);
  for (let i = 0; i < 140; i++) {
    const t = Math.pow(r(), 1.2);
    const y = Math.round(horizon + 2 + t * (Y1 - horizon));
    const x = Math.round(X0 + r() * W);
    const c = r();
    p.hline(x, y, 2 + Math.floor(t * 4), c < 0.3 ? '#c8742c' : c < 0.5 ? '#a8501c' : c < 0.8 ? P.leaf3 : P.leaf1);
  }
  for (const sx of [70, 160, 240]) {
    ellipse(p, sx, ANIMAL_GROUND_Y + 8, 28, 5, 'rgba(255,240,150,0.28)');
    ellipse(p, sx + 2, ANIMAL_GROUND_Y + 8, 14, 2, 'rgba(255,248,190,0.35)');
  }
  tufts(p, r, horizon + 6, ANIMAL_GROUND_Y - 4, 40);
  foliage(p, r, 160, horizon + 3, 200, 4, 90, 5, [P.leaf0, P.leaf1, P.leaf2, P.leaf3]);
  groundShadow(p, 160, ANIMAL_GROUND_Y + 2, 34);
}

function cordilheiraFront(p: Painter): void {
  const r = rng(322);
  // troncos grossos nas laterais, com cipós
  for (const [x, w] of [[X0 + 2, 18], [X1 - 22, 20]] as const) {
    p.rect(x, Y0, w, H_ALL, P.bark1);
    p.vline(x, Y0, H_ALL, P.bark3);
    p.vline(x + 1, Y0, H_ALL, P.bark2);
    p.vline(x + w - 1, Y0, H_ALL, P.bark0);
    p.vline(x + w - 2, Y0, H_ALL, P.bark0);
    for (let i = 0; i < 30; i++) p.vline(x + 3 + Math.floor(r() * (w - 6)), Y0 + Math.floor(r() * H_ALL), 3 + Math.floor(r() * 8), r() < 0.5 ? P.bark0 : P.bark2);
    for (let i = 0; i < w; i++) if (r() < 0.4) p.vline(x + i, Y1 - 30 - Math.floor(r() * 40), 3 + Math.floor(r() * 5), P.leaf2);
  }
  // samambaias e folhagem baixa
  foliage(p, r, X0 + 16, Y1 - 6, 44, 14, 40, 8, [P.leaf0, P.leaf1, P.leaf2, P.leaf3]);
  foliage(p, r, X1 - 16, Y1 - 6, 44, 14, 40, 8, [P.leaf0, P.leaf1, P.leaf2, P.leaf3]);
  foliage(p, r, X0 + 12, Y0 + 6, 40, 12, 36, 8, [P.leaf0, P.leaf1, P.leaf2, P.leaf3]);
  foliage(p, r, X1 - 12, Y0 + 6, 40, 12, 36, 8, [P.leaf0, P.leaf1, P.leaf2, P.leaf3]);
  // cipós pendentes
  for (const x of [X0 + 70, X0 + 130, X1 - 110]) for (let y = 0; y < 28 + Math.floor(r() * 24); y++) p.px(x + Math.round(Math.sin(y / 6) * 1.5), Y0 + y, y % 9 === 0 ? P.leaf4 : P.leaf1);
}

const H_ALL = Y1 - Y0;

const alagado = (scene: Parameters<CaptureBgPainter>[0], key: Parameters<CaptureBgPainter>[1]): ReturnType<CaptureBgPainter> => ({
  back: layer(scene, key('back'), alagadoBack),
  front: layer(scene, key('front'), alagadoFront),
  fx: layer(scene, key('fx'), (p) => drawGlints(p, 303, 62)),
  fxKind: 'glints',
  waves: layer(scene, key('waves'), (p) => drawWaves(p, 140, false)),
});

const baia: CaptureBgPainter = (scene, key) => ({
  back: layer(scene, key('back'), baiaBack),
  front: layer(scene, key('front'), baiaFront),
  fx: layer(scene, key('fx'), (p) => drawGlints(p, 313, 56)),
  fxKind: 'glints',
  waves: layer(scene, key('waves'), (p) => {
    const r = rng(314);
    for (let i = 0; i < 40; i++) {
      const y = 70 + Math.floor(Math.pow(r(), 1.2) * 150);
      p.hline(Math.round(X0 + r() * W), y, 6 + Math.floor(((y - 56) / 150) * 20), 'rgba(200,255,240,0.55)');
    }
  }),
});

const cordilheira: CaptureBgPainter = (scene, key) => ({
  back: layer(scene, key('back'), cordilheiraBack),
  front: layer(scene, key('front'), cordilheiraFront),
  fx: layer(scene, key('fx'), (p) => beams(p, [60, 140, 230, 290], 12, 0.28, 0.16)),
  fxKind: 'beams',
});

export const CAPTURE_BG: Partial<Record<Habitat, CaptureBgPainter>> = { alagado, baia, cordilheira };
