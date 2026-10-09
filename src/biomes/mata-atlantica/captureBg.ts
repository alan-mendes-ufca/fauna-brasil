import { rng, type Painter } from '../../art/canvas';
import { ANIMAL_GROUND_Y, W, X0, X1, Y0, Y1, beams, drawGlints, drawWaves, ellipse, foliage, frond, gradient, groundShadow, layer, line, type CaptureBgPainter } from '../../art/captureBg';
import type { Habitat } from '../../data/species';

// Fundos de captura da Mata Atlântica (320×214 de arte): floresta úmida de encosta, mata de araucárias e manguezal.
// Verdes frios e azulados, névoa de serra, flores roxas de quaresmeira e sombras azul-violeta.

const C = {
  teal0: '#06222c',
  teal1: '#0e4046',
  teal2: '#17665e',
  teal3: '#2a9078',
  leaf0: '#0a3a30',
  leaf1: '#16664a',
  leaf2: '#2e9a58',
  leaf3: '#6cca6c',
  leaf4: '#c0f09c',
  bark0: '#1e1a20',
  bark1: '#3e3434',
  bark2: '#6a5a50',
  bark3: '#9a8a74',
  vio0: '#40186a',
  vio1: '#7a3eb0',
  vio2: '#b468e0',
  vio3: '#e6b4fa',
  red0: '#3a1a1e',
  red1: '#6a3030',
  red2: '#a05a42',
  red3: '#d09068',
  mud0: '#2e261c',
  mud1: '#4a3e2c',
  mud2: '#6e5c40',
  mud3: '#948060',
  grass0: '#2a5a46',
  grass1: '#3e7a56',
  grass2: '#58966a',
  grass3: '#8cc890',
  grass4: '#d4f0cc',
};

const rock = (p: Painter, x: number, y: number, rx: number, ry: number): void => {
  ellipse(p, x, y, rx, ry, '#2e4258');
  ellipse(p, x - 1, y - 1, rx - 1, Math.max(1, ry - 1), '#5c7a92');
  ellipse(p, x - 2, y - 2, Math.max(1, rx - 3), Math.max(1, ry - 2), '#90aec0');
  p.hline(x - rx + 2, y - ry, Math.max(2, rx - 2), '#78c870');
};

// ---------- floresta úmida ----------

function florestaBack(p: Painter): void {
  const r = rng(701);
  const horizon = 84;
  // céu de névoa serrana entre as copas
  gradient(p, X0, Y0, W, horizon - Y0 + 10, ['#14505c', '#2a8a86', '#78c4aa', '#cce8c4']);
  // serras distantes em azul esfumado, com um fio de cachoeira
  for (const [col, amp, off, base] of [['#6aa8a8', 14, 0.4, 62], ['#4a8c92', 12, 2.2, 70]] as const) {
    for (let x = X0; x < X1; x++) {
      const h = Math.round(amp + Math.sin(x * 0.02 + off) * amp * 0.55 + Math.sin(x * 0.07 + off * 2) * 2.5);
      p.vline(x, base - h, h + 24, col);
    }
  }
  for (let y = 36; y < 66; y++) p.px(58 + Math.round(Math.sin(y * 0.4) * 0.6), y, y % 7 < 4 ? '#e8fcff' : '#a8e4e4');
  ellipse(p, 58, 66, 5, 2, 'rgba(240,255,255,0.7)');
  // troncos que somem na névoa (mais claros os mais distantes)
  const xs = [-8, 30, 76, 124, 196, 246, 290, 334];
  xs.forEach((tx, i) => {
    const w = 8 + Math.floor(r() * 9);
    const far = i % 2 === 0;
    const cols = far ? ['#2a4e52', '#4a7a78', '#6a9a90'] : [C.bark0, C.bark1, C.bark2];
    p.rect(tx, Y0, w, horizon + 10 - Y0, cols[1]);
    p.vline(tx, Y0, horizon + 10 - Y0, cols[2]);
    p.vline(tx + 1, Y0, horizon + 10 - Y0, cols[2]);
    p.vline(tx + w - 1, Y0, horizon + 10 - Y0, cols[0]);
    p.vline(tx + w - 2, Y0, horizon + 10 - Y0, cols[0]);
    for (let k = 0; k < w; k++) if (r() < 0.45) p.vline(tx + k, Y0 + Math.floor(r() * (horizon - Y0)), 3 + Math.floor(r() * 6), C.leaf2);
    if (far) for (let y = Y0; y < horizon + 10; y++) p.hline(tx, y, w, 'rgba(150,230,210,0.4)');
    // bromélias nos troncos
    if (!far) for (const by of [30 + (i * 11) % 22, 58 + (i * 7) % 14]) for (let k = 0; k < 6; k++) line(p, tx + w / 2, by, tx + w / 2 + (k - 2.5) * 2.2, by - 5 + Math.abs(k - 2.5), k % 2 ? C.leaf2 : C.leaf1);
  });
  // copas distantes e manchas roxas de quaresmeira
  foliage(p, r, 160, Y0 + 8, 190, 24, 130, 8, [C.teal1, C.teal2, C.teal3, C.leaf2]);
  foliage(p, r, 160, horizon - 6, 190, 16, 120, 7, [C.leaf0, C.leaf1, C.leaf2, C.leaf3]);
  for (const [qx, qy] of [[104, 26], [230, 20], [176, 40], [18, 44], [302, 36]] as const) foliage(p, r, qx, qy, 18, 9, 16, 5, [C.vio0, C.vio1, C.vio2, C.vio3]);
  // chão em perspectiva: folhiço úmido e musgo
  gradient(p, X0, horizon, W, Y1 - horizon, ['#2c6a4e', '#26594a', '#1c4640', '#102e34']);
  for (let i = 0; i < 1000; i++) {
    const t = Math.pow(r(), 1.7);
    const y = Math.round(horizon + t * (Y1 - horizon));
    const x = Math.round(X0 + r() * W);
    const s = 1 + Math.floor(t * 4);
    const cols = [C.bark1, '#8a5a34', '#c0944a', C.leaf1, C.leaf2, C.vio1, '#4a9a78'];
    p.rect(x, y, s * 2, s, cols[Math.floor(r() * cols.length)]);
  }
  // raízes e cipós rasteiros partindo do ponto de fuga
  for (let i = 0; i < 7; i++) {
    const tx = 30 + i * 43;
    for (let y = horizon + 2; y < Y1; y += 1) {
      const t = (y - horizon) / (Y1 - horizon);
      const x = Math.round(160 + (tx - 160) * (0.2 + t * 1.1) + Math.sin(y * 0.2 + i) * 2);
      p.rect(x, y, 1 + Math.floor(t * 3), 1, t < 0.5 ? C.bark1 : C.bark2);
    }
  }
  // xaxins (samambaiaçus) e samambaias médias
  for (const [fx, fy] of [[44, horizon + 30], [262, horizon + 26]] as const) {
    p.rect(fx - 3, fy - 16, 6, 18, '#3a2a26');
    p.vline(fx - 3, fy - 16, 18, '#6a5040');
    for (let k = 0; k < 8; k++) frond(p, fx, fy - 16, 20, -1.5 + k * 0.43, 0.06 * (k - 3.5), C.leaf0, k % 2 ? C.leaf3 : C.leaf2);
  }
  for (let i = 0; i < 9; i++) {
    const fx = X0 + 10 + i * 40 + Math.floor(r() * 16);
    if (Math.abs(fx - 160) < 36) continue;
    const fy = horizon + 18 + Math.floor(r() * 16);
    for (let k = 0; k < 6; k++) frond(p, fx, fy, 14, -1.2 + k * 0.48, 0.05 * (k - 2.5), C.leaf1, C.leaf3);
  }
  ellipse(p, 160, ANIMAL_GROUND_Y + 2, 38, 5, 'rgba(6,30,44,0.4)');
}

function florestaFront(p: Painter): void {
  const r = rng(702);
  for (const [fx, fy, mirror] of [[X0 + 14, Y1, 1], [X1 - 14, Y1, -1], [X0 + 62, Y1 + 4, 1], [X1 - 64, Y1 + 4, -1]] as const) {
    for (let k = 0; k < 8; k++) frond(p, fx, fy, 40 + Math.floor(r() * 14), mirror * (0.3 + k * 0.3), -mirror * 0.035, C.leaf0, k % 2 ? C.leaf2 : C.leaf3);
  }
  // bromélia grande no canto, com inflorescência vermelha
  for (const [bx, m] of [[X0 + 36, 1], [X1 - 34, -1]] as const) {
    for (let k = 0; k < 9; k++) line(p, bx, Y1 - 2, bx + m * (k - 4) * 4, Y1 - 24 - (k % 2) * 4 + Math.abs(k - 4) * 2, k % 2 ? '#1c7a4c' : '#3aa660');
    line(p, bx, Y1 - 6, bx, Y1 - 36, '#d83a3a');
    p.rect(bx - 2, Y1 - 40, 5, 6, '#ff5a4a');
    p.px(bx, Y1 - 41, '#ffd0a0');
  }
  // copas pendentes nos cantos de cima, com flores roxas
  foliage(p, r, X0 + 8, Y0 + 8, 48, 28, 60, 9, [C.teal0, C.leaf0, C.leaf1, C.leaf2]);
  foliage(p, r, X1 - 8, Y0 + 6, 48, 26, 60, 9, [C.teal0, C.leaf0, C.leaf1, C.leaf2]);
  foliage(p, r, X0 + 52, Y0 + 14, 16, 8, 12, 4, [C.vio0, C.vio1, C.vio2, C.vio3]);
  foliage(p, r, X1 - 56, Y0 + 12, 16, 8, 12, 4, [C.vio0, C.vio1, C.vio2, C.vio3]);
  // cipós
  for (const vx of [X0 + 30, X0 + 70, X1 - 40, X1 - 80]) {
    const len = 36 + Math.floor(r() * 36);
    for (let y = Y0; y < Y0 + len; y++) p.px(vx + Math.round(Math.sin(y * 0.14 + vx) * 2), y, y % 6 === 0 ? C.leaf3 : C.leaf1);
  }
}

// ---------- mata de araucárias ----------

/** Araucária à distância: tronco reto e copa em taça formada por tufos de folhas rígidas. */
function araucariaTree(p: Painter, r: () => number, x: number, base: number, h: number, dark: boolean): void {
  const trunkC = dark ? ['#3a2a30', '#5c4040'] : ['#4a3236', '#7a5448'];
  const leafC = dark ? ['#0e3a34', '#1c5a48', '#3a8a62'] : ['#16463c', '#2a7058', '#5ca47a'];
  const w = Math.max(2, Math.round(h / 16));
  groundShadow(p, x, base + 1, Math.round(h * 0.28));
  p.rect(x - (w >> 1), base - h, w, h, trunkC[1]);
  p.vline(x - (w >> 1), base - h, h, trunkC[0]);
  p.vline(x + (w >> 1), base - h, h, '#1e1418');
  const tuft = (tx: number, ty: number, s: number) => {
    ellipse(p, tx, ty, Math.round(s * 1.15), Math.max(1, Math.round(s * 0.55)), leafC[0]);
    ellipse(p, tx - 1, ty - 1, Math.round(s * 0.9), Math.max(1, Math.round(s * 0.4)), leafC[1]);
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI + (i / 6) * Math.PI;
      p.px(Math.round(tx + Math.cos(a) * s * 1.2), Math.round(ty + Math.sin(a) * s * 0.7) - 1, leafC[2]);
    }
    p.px(tx - 2, ty - 2, '#c4e8c0');
  };
  const top = base - h;
  // braços laterais mais baixos (menores) e copa de taça no alto
  for (let i = 0; i < 6; i++) {
    const y = top + h * (0.34 + i * 0.07);
    const dx = (1 - i * 0.12) * h * 0.2;
    line(p, x, y + 2, x - dx, y - h * 0.08, trunkC[0]);
    line(p, x, y + 2, x + dx, y - h * 0.08, trunkC[0]);
    tuft(Math.round(x - dx), Math.round(y - h * 0.08), Math.max(2, Math.round(h * 0.07)));
    tuft(Math.round(x + dx), Math.round(y - h * 0.08), Math.max(2, Math.round(h * 0.07)));
  }
  for (const [dx, dy, s] of [[0, 0, 0.12], [-0.17, 0.04, 0.1], [0.17, 0.04, 0.1], [-0.08, -0.04, 0.1], [0.08, -0.04, 0.1], [-0.27, 0.12, 0.09], [0.27, 0.12, 0.09]] as const) tuft(Math.round(x + dx * h), Math.round(top + dy * h + 4), Math.max(3, Math.round(s * h)));
  void r;
}

function araucariaBack(p: Painter): void {
  const r = rng(711);
  const horizon = 78;
  // céu frio de altitude, com nuvens esgarçadas
  gradient(p, X0, Y0, W, horizon - Y0 + 8, ['#5a98c0', '#92c4d8', '#cfe6e0', '#f2f2dc']);
  for (let i = 0; i < 9; i++) {
    const cx = Math.round(X0 + r() * W);
    const cy = Y0 + 14 + Math.floor(r() * 44);
    ellipse(p, cx, cy, 24 + Math.floor(r() * 22), 3, 'rgba(255,255,255,0.45)');
    ellipse(p, cx + 6, cy - 2, 14 + Math.floor(r() * 12), 2, 'rgba(255,255,255,0.65)');
  }
  ellipse(p, 252, 30, 22, 22, 'rgba(255,250,220,0.14)');
  ellipse(p, 252, 30, 12, 12, 'rgba(255,250,220,0.4)');
  ellipse(p, 252, 30, 6, 6, '#fffbe8');
  // coxilhas distantes, cobertas por pinhais minúsculos
  for (const [col, amp, off, base, pine] of [['#8cb8b8', 12, 0.5, 70, '#5a8c88'], ['#5e9a8c', 10, 2.6, 78, '#2e6a5a']] as const) {
    for (let x = X0; x < X1; x++) {
      const h = Math.round(amp + Math.sin(x * 0.017 + off) * amp * 0.6 + Math.sin(x * 0.06 + off * 2) * 2);
      p.vline(x, base - h, h + 14, col);
    }
    for (let i = 0; i < 26; i++) {
      const x = Math.round(X0 + r() * W);
      const hh = Math.round(amp + Math.sin(x * 0.017 + off) * amp * 0.6 + Math.sin(x * 0.06 + off * 2) * 2);
      const y = base - hh + 2;
      p.vline(x, y - 4, 4, pine);
      ellipse(p, x, y - 5, 2, 1, pine);
    }
  }
  // campo de altitude em perspectiva
  gradient(p, X0, horizon, W, Y1 - horizon, ['#8cc8a0', '#68a880', '#4a8a64', '#2e6650', '#1e4a40']);
  for (let i = 0; i < 700; i++) {
    const t = Math.pow(r(), 1.6);
    const y = Math.round(horizon + 4 + t * (Y1 - horizon));
    const x = Math.round(X0 + r() * W);
    const s = 1 + Math.floor(t * 3);
    const cols = [C.grass0, C.grass3, C.grass4, '#a87a4a', C.grass1];
    p.rect(x, y, s * 2, s, cols[Math.floor(r() * cols.length)]);
  }
  // araucárias do fundo para frente
  araucariaTree(p, r, 30, horizon + 14, 54, false);
  araucariaTree(p, r, 112, horizon + 10, 40, false);
  araucariaTree(p, r, 214, horizon + 12, 44, false);
  araucariaTree(p, r, 292, horizon + 24, 72, true);
  araucariaTree(p, r, 70, horizon + 30, 84, true);
  // pedras, acículas e tufos de capim
  for (const [rx, ry, a, b] of [[150, 112, 9, 4], [244, 128, 7, 3], [20, 138, 8, 3]] as const) rock(p, rx, ry, a, b);
  for (let i = 0; i < 120; i++) {
    const t = Math.pow(r(), 1.3);
    const y = Math.round(horizon + 10 + t * (Y1 - horizon - 10));
    const x = Math.round(X0 + r() * W);
    const hh = 3 + Math.floor(t * 10);
    line(p, x, y, x + Math.round((r() - 0.5) * 4), y - hh, r() < 0.5 ? C.grass2 : C.grass3);
    if (r() < 0.12) p.px(x, y - hh - 1, r() < 0.5 ? '#fff4f8' : '#e8b0f0');
  }
  ellipse(p, 160, ANIMAL_GROUND_Y + 2, 36, 5, 'rgba(10,40,50,0.36)');
}

function araucariaFront(p: Painter): void {
  const r = rng(712);
  // capim alto nos cantos de baixo
  for (const [x, n, h] of [[X0 + 22, 20, 46], [X1 - 22, 20, 50], [X0 + 84, 11, 28], [X1 - 84, 11, 28]] as const) {
    for (let i = 0; i < n; i++) {
      const a = (r() - 0.5) * 1.1;
      const len = h * (0.55 + r() * 0.5);
      const bx = x + i - n / 2;
      line(p, bx, Y1, bx + Math.sin(a) * len, Y1 - Math.cos(a) * len, r() < 0.5 ? C.grass1 : C.grass3);
    }
  }
  groundShadow(p, X0 + 26, Y1 - 3, 36);
  groundShadow(p, X1 - 26, Y1 - 3, 36);
  // galhos de araucária pendendo no alto, com folhas rígidas e uma pinha
  for (const [x, m] of [[X0, 1], [X1, -1]] as const) {
    line(p, x, Y0 + 14, x + m * 96, Y0 + 30, '#4a3236');
    line(p, x, Y0 + 13, x + m * 96, Y0 + 29, '#8a6252');
    for (let i = 0; i < 6; i++) {
      const tx = x + m * (24 + i * 14);
      const ty = Y0 + 20 + i * 2.5;
      for (let k = 0; k < 11; k++) {
        const a = -0.6 + (k / 10) * 3.5;
        line(p, tx, ty, tx + Math.cos(a) * 11 * m, ty + Math.sin(a) * 9 + 3, k % 2 ? '#0e3a34' : '#2e7a5a');
      }
    }
    ellipse(p, x + m * 60, Y0 + 40, 5, 6, '#4a2e22');
    ellipse(p, x + m * 59, Y0 + 39, 4, 5, '#7a5238');
    p.hline(x + m * 56, Y0 + 40, 7, '#2e1a14');
  }
}

// ---------- manguezal ----------

function mangueBack(p: Painter): void {
  const r = rng(721);
  const horizon = 60;
  const shore = 134;
  // céu de fim de tarde sobre o estuário
  gradient(p, X0, Y0, W, horizon - Y0 + 6, ['#3a8ac0', '#7ac8d0', '#ffe0a8', '#ffd0a0']);
  ellipse(p, 226, horizon - 22, 22, 22, 'rgba(255,224,160,0.2)');
  ellipse(p, 226, horizon - 22, 13, 13, 'rgba(255,230,170,0.55)');
  ellipse(p, 226, horizon - 22, 7, 7, '#fff8d8');
  for (let i = 0; i < 6; i++) ellipse(p, Math.round(X0 + r() * W), Y0 + 10 + Math.floor(r() * 30), 22 + Math.floor(r() * 20), 2, 'rgba(255,255,255,0.4)');
  // restinga e mata ao fundo, na outra margem
  gradient(p, X0, horizon - 14, W, 16, ['#3a8a7a', '#1e6a5a']);
  foliage(p, r, 160, horizon - 12, 190, 10, 130, 6, [C.teal1, C.teal2, C.teal3, C.leaf2]);
  foliage(p, r, 160, horizon - 4, 190, 6, 90, 5, [C.leaf0, C.leaf1, C.leaf2, C.leaf3]);
  // estuário
  gradient(p, X0, horizon, W, shore - horizon + 4, ['#c8f0e0', '#5ec0b4', '#2a8a98', '#1c6682', '#1a5470']);
  for (let i = 0; i < 240; i++) {
    const t = Math.pow(r(), 1.4);
    const y = Math.round(horizon + 2 + t * (shore - horizon - 4));
    p.hline(Math.round(X0 + r() * W), y, 3 + Math.floor(t * 16), r() < 0.5 ? '#a8ece0' : '#1a5470');
  }
  // reflexo do sol
  for (let y = horizon + 1; y < shore; y += 2) {
    const t = (y - horizon) / (shore - horizon);
    const w = Math.round(5 + t * 30 + r() * 6);
    p.hline(Math.round(226 - w / 2 + (r() - 0.5) * 6), y, w, r() < 0.6 ? '#ffe9a8' : '#ffc870');
  }
  // mangues-vermelhos dentro d'água, com raízes-escora
  const rootTree = (x: number, base: number, s: number) => {
    for (let k = -3; k <= 3; k++) {
      line(p, x, base - s * 0.55, x + k * s * 0.2, base, C.red1);
      line(p, x - 1, base - s * 0.55, x + k * s * 0.2 - 1, base, C.red2);
    }
    p.rect(x - 2, base - s * 0.95, 4, Math.round(s * 0.45), C.red1);
    foliage(p, r, x, Math.round(base - s * 1.05), Math.round(s * 0.7), Math.round(s * 0.32), 30, Math.max(3, Math.round(s / 6)), [C.leaf0, C.leaf1, C.leaf2, C.leaf3]);
    ellipse(p, x, base + 1, Math.round(s * 0.6), 1, 'rgba(8,30,50,0.35)');
  };
  for (const [x, b, s] of [[26, 84, 26], [88, 74, 16], [118, 90, 22], [196, 72, 14], [270, 88, 28], [302, 78, 18]] as const) rootTree(x, b, s);
  // margem de lama
  for (let x = X0; x < X1; x++) {
    const edge = shore + Math.round(Math.sin(x * 0.06) * 2 + Math.sin(x * 0.19));
    p.vline(x, edge, Y1 - edge, C.mud1);
    p.vline(x, edge - 1, 1, '#e4faf0');
    p.vline(x, edge, 2, C.mud0);
  }
  gradient(p, X0, shore + 3, W, Y1 - shore - 3, [C.mud2, C.mud1, C.mud0, '#1c160e']);
  for (let i = 0; i < 420; i++) {
    const t = Math.pow(r(), 1.4);
    const y = Math.round(shore + 5 + t * (Y1 - shore));
    p.rect(Math.round(X0 + r() * W), y, 1 + Math.floor(t * 5), 1 + Math.floor(t * 2), [C.mud3, C.mud0, '#8a8a78', '#4a5a34'][Math.floor(r() * 4)]);
  }
  // brilho da lama molhada e pneumatóforos
  for (let i = 0; i < 40; i++) {
    const y = shore + 8 + Math.floor(r() * (Y1 - shore - 10));
    p.hline(Math.round(X0 + r() * W), y, 3 + Math.floor(r() * 8), 'rgba(200,230,230,0.35)');
  }
  for (let i = 0; i < 40; i++) {
    const x = Math.round(X0 + r() * W);
    const y = shore + 12 + Math.floor(r() * (Y1 - shore - 14));
    const h = 3 + Math.floor((y - shore) / 14);
    p.vline(x, y - h, h, '#2a2a22');
    p.vline(x + 1, y - h, h, '#4a4a34');
    p.px(x, y - h - 1, '#8a9a5a');
  }
  ellipse(p, 160, ANIMAL_GROUND_Y + 2, 36, 4, 'rgba(10,30,40,0.36)');
}

function mangueFront(p: Painter): void {
  const r = rng(722);
  // raízes-escora em arco nos cantos
  for (const [x, m] of [[X0 + 10, 1], [X1 - 10, -1]] as const) {
    for (let k = 0; k < 6; k++) {
      let px = x + m * 2;
      let py = Y1 - 78 + k * 4;
      const span = 24 + k * 7;
      for (let t = 1; t <= 16; t++) {
        const u = t / 16;
        const nx = x + m * (2 + span * Math.sin(u * 1.4));
        const ny = Y1 - 78 + k * 4 + (78 - k * 4) * (u * u * 0.45 + u * 0.55) - Math.sin(u * 3.14) * 8;
        line(p, px, py, nx, ny, C.red0);
        line(p, px - 1, py, nx - 1, ny, k % 2 ? C.red1 : C.red2);
        px = nx;
        py = ny;
      }
    }
    p.rect(x - 4, Y0, 9, Y1 - 60 - Y0, C.red1);
    p.vline(x - 4, Y0, Y1 - 60 - Y0, C.red2);
    p.vline(x + 4, Y0, Y1 - 60 - Y0, C.red0);
  }
  // folhas grossas pendentes e propágulos
  foliage(p, r, X0 + 20, Y0 + 8, 56, 26, 60, 9, [C.teal0, C.leaf0, C.leaf1, C.leaf2]);
  foliage(p, r, X1 - 20, Y0 + 6, 56, 26, 60, 9, [C.teal0, C.leaf0, C.leaf1, C.leaf2]);
  for (const x of [X0 + 54, X0 + 80, X1 - 60, X1 - 90]) {
    const len = 14 + Math.floor(r() * 10);
    p.vline(x, Y0 + 20, len, '#4a7a2a');
    p.vline(x + 1, Y0 + 20, len, '#7a9a3a');
    p.px(x, Y0 + 20 + len, '#b0c850');
  }
  // folhas de samambaia-do-mangue na lama
  for (const [fx, m] of [[X0 + 70, 1], [X1 - 70, -1]] as const) for (let k = 0; k < 6; k++) frond(p, fx, Y1, 26, m * (0.2 + k * 0.28), -m * 0.04, C.leaf0, k % 2 ? C.leaf2 : C.leaf3);
}

const mk =
  (back: (p: Painter) => void, front: (p: Painter) => void, water: boolean, fxSeed: number, beamXs: number[] = [50, 140, 230, 290]): CaptureBgPainter =>
  (scene, key) => ({
    back: layer(scene, key('back'), back),
    front: layer(scene, key('front'), front),
    fx: layer(scene, key('fx'), water ? (p) => drawGlints(p, fxSeed, 62) : (p) => beams(p, beamXs, 11, 0.28, 0.15)),
    fxKind: water ? 'glints' : 'beams',
    ...(water ? { waves: layer(scene, key('waves'), (p) => drawWaves(p, 134, false)) } : {}),
  });

export const CAPTURE_BG: Partial<Record<Habitat, CaptureBgPainter>> = {
  'floresta-umida': mk(florestaBack, florestaFront, false, 0),
  araucaria: mk(araucariaBack, araucariaFront, false, 0, [70, 190, 270]),
  mangue: mk(mangueBack, mangueFront, true, 741),
};
