import { cap, type Drawer, ell, INK, mix, N, poly, pose, ramp, Spr, type Pt } from './kit';

// Quadros de combate: 4 ATAQUE (investida da espécie, corpo projetado para a frente) e
// 5 DANO (recuo: olhos "><", corpo comprimido e inclinado, clarão, suor e estrelinhas).
// Cada quadro parte de um quadro do desenhista (`from`), desenhado com `pose.mode` ligado,
// recebe detalhes por cima (`over`), uma transformação (`xf`) e efeitos fora do corpo (`fx`).
// Espécie sem entrada em COMBAT ganha a derivação automática a partir do quadro 0.

/** Transformação afim em torno da âncora (padrão: centro da base do animal). */
export interface Xf {
  s?: number;
  sx?: number;
  sy?: number;
  /** Inclinação: o topo anda `shear` px para a direita a cada px acima da âncora (negativo = esquerda). */
  shear?: number;
  rot?: number;
  ax?: number;
  ay?: number;
  dx?: number;
  dy?: number;
}

export interface FrameSpec {
  /** Quadro do desenhista usado como base (0–3, ou 4/5 se ele tiver pose própria). */
  from?: number;
  over?: (s: Spr) => void;
  xf?: Xf;
  /** Efeitos desenhados depois da transformação; `T` leva um ponto do desenho base para o quadro final. */
  fx?: (s: Spr, T: (p: Pt) => Pt) => void;
}

export interface HurtSpec extends FrameSpec {
  /** Centro e raio da cabeça no quadro base, para o suor e as estrelinhas. */
  head: [number, number, number];
}

export interface CombatSpec {
  attack?: FrameSpec;
  hurt?: HurtSpec;
}

// ------------------------------------------------------------------ transformação
function forward(xf: Xf): (p: Pt) => Pt {
  const ax = xf.ax ?? 32;
  const ay = xf.ay ?? 58;
  const sx = xf.sx ?? xf.s ?? 1;
  const sy = xf.sy ?? xf.s ?? 1;
  const c = Math.cos(xf.rot ?? 0);
  const sn = Math.sin(xf.rot ?? 0);
  const sh = xf.shear ?? 0;
  return ([x, y]) => {
    let u = x - ax;
    let v = y - ay;
    [u, v] = [u * c - v * sn, u * sn + v * c];
    u *= sx;
    v *= sy;
    u -= sh * v;
    return [u + ax + (xf.dx ?? 0), v + ay + (xf.dy ?? 0)];
  };
}

function applyXf(s: Spr, xf: Xf): void {
  const ax = xf.ax ?? 32;
  const ay = xf.ay ?? 58;
  const sx = xf.sx ?? xf.s ?? 1;
  const sy = xf.sy ?? xf.s ?? 1;
  const c = Math.cos(-(xf.rot ?? 0));
  const sn = Math.sin(-(xf.rot ?? 0));
  const sh = xf.shear ?? 0;
  s.warp((x, y) => {
    let u = x - ax - (xf.dx ?? 0);
    let v = y - ay - (xf.dy ?? 0);
    u += sh * v;
    u /= sx;
    v /= sy;
    [u, v] = [u * c - v * sn, u * sn + v * c];
    return [u + ax, v + ay];
  });
}

// ------------------------------------------------------------------ efeitos
const WHITE = '#FFFFFF';
const TRAIL = 'rgba(255,255,255,0.75)';

/** Copia para `s` só os pixels de `t` que caem fora do animal (o efeito fica "atrás"). */
function behind(s: Spr, t: Spr): void {
  for (let k = 0; k < t.g.length; k++) if (t.g[k] && !s.g[k]) s.g[k] = t.g[k];
}

/** Riscos de velocidade atrás do animal: [x0, y0, x1, y1]. */
export function speed(s: Spr, segs: [number, number, number, number][], c = TRAIL): void {
  const t = new Spr();
  for (const [x0, y0, x1, y1] of segs) t.line(x0, y0, x1, y1, c);
  behind(s, t);
}

/** Pixels soltos com contorno escuro de 1px (para ler em qualquer fundo). */
function sticker(s: Spr, px: [number, number, string][], ol = INK): void {
  const t = new Spr();
  for (const [x, y, c] of px) t.put(x, y, c);
  const m = new Uint8Array(N * N);
  t.g.forEach((v, k) => (m[k] = v ? 1 : 0));
  t.outline(m, ol);
  for (let k = 0; k < t.g.length; k++) if (t.g[k]) s.g[k] = t.g[k];
}

/** Estrelinha de 4 pontas (tontura). */
export function star(s: Spr, x: number, y: number, c = '#FFE45A'): void {
  x = Math.round(x);
  y = Math.round(y);
  sticker(s, [[x, y, WHITE], [x - 1, y, c], [x + 1, y, c], [x, y - 1, c], [x, y + 1, c], [x, y - 2, c], [x, y + 2, c], [x - 2, y, c], [x + 2, y, c]], '#5A2A10');
}

/** Gota de suor. */
export function sweat(s: Spr, x: number, y: number): void {
  x = Math.round(x);
  y = Math.round(y);
  const L = '#8AD4FA';
  const D = '#3A8ED8';
  sticker(s, [[x, y, L], [x, y + 1, L], [x - 1, y + 2, L], [x, y + 2, WHITE], [x + 1, y + 2, D], [x - 1, y + 3, D], [x, y + 3, D], [x + 1, y + 3, D]], '#14306A');
}

/** Estalo de impacto: raios amarelos com miolo branco. */
export function burst(s: Spr, x: number, y: number, r = 6, c = '#FFD23A', edge = '#E8601E'): void {
  const t = new Spr();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const len = i % 2 ? r * 0.6 : r;
    const x0 = x + Math.cos(a) * 2;
    const y0 = y + Math.sin(a) * 2;
    t.line(x0, y0, x + Math.cos(a) * len, y + Math.sin(a) * len, i % 2 ? edge : c);
  }
  t.paint(ell(x, y, 1.6, 1.6), WHITE);
  for (let k = 0; k < t.g.length; k++) if (t.g[k]) s.g[k] = t.g[k];
}

/** Três rasgos de garra em diagonal. */
export function slash(s: Spr, x0: number, y0: number, x1: number, y1: number, gap = 4): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l;
  const ny = dx / l;
  for (const k of [-1, 0, 1]) {
    const ox = nx * gap * k;
    const oy = ny * gap * k;
    const sh = k === 0 ? 0 : 0.15;
    s.line(x0 + ox + dx * sh + nx, y0 + oy + dy * sh + ny, x1 + ox - dx * sh + nx, y1 + oy - dy * sh + ny, '#FF8A3A');
    s.line(x0 + ox + dx * sh, y0 + oy + dy * sh, x1 + ox - dx * sh, y1 + oy - dy * sh, WHITE);
  }
}

/** Respingos d'água subindo dos lados. */
export function splash(s: Spr, cx: number, y: number, w: number): void {
  const drops: Pt[] = [[cx - w, y - 6], [cx - w - 4, y - 11], [cx - w + 3, y - 14], [cx + w, y - 7], [cx + w + 4, y - 12], [cx + w - 2, y - 16], [cx - w - 7, y - 3], [cx + w + 7, y - 4]];
  for (const [x, yy] of drops) sticker(s, [[x, yy, '#C8F6FF'], [x + 1, yy, '#6FD0EA'], [x, yy + 1, '#6FD0EA'], [x + 1, yy + 1, '#2C86B6']], '#10285C');
}

/** Poeira levantada no chão. */
export function dust(s: Spr, pts: Pt[]): void {
  const t = new Spr();
  pts.forEach(([x, y], i) => {
    const r = 2 + (i % 2);
    t.fill(ell(x, y, r + 0.5, r), ramp('#E6D6B4', { hi: '#FFF4DC', sh: '#BCA88A', ol: '#6A5A4A' }), { n: 1 });
  });
  behind(s, t);
}

/** Brilhos de 4 pontas espalhados (pó das asas, faíscas). */
export function twinkles(s: Spr, pts: Pt[], c = '#8FE4FF'): void {
  for (const [x, y] of pts) s.dots(c, [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]).put(x, y, WHITE);
}

/** Pés de ave com garras abertas, lançados para a frente. */
export function talons(s: Spr, cx: number, y: number, spread: number, skin: string, claw: string, big = 1): void {
  const SK = ramp(skin);
  const CL = ramp(claw, { hi: mix(claw, '#ffffff', 0.35), ol: '#0A0818' });
  for (const sx of [-1, 1]) {
    const x = cx + sx * spread;
    s.fill(ell(x, y, 3.2 * big, 2.4 * big), SK, { n: 1 });
    for (const k of [-1, 0, 1]) {
      const bx = x + k * 2.6 * big;
      s.fill(cap(bx, y + 1.5 * big, 1.1 * big, bx + k * 1.4 * big, y + 4.5 * big, 0.5), CL, { n: 1 });
    }
    s.fill(cap(x - sx * 3 * big, y - 0.5, 1 * big, x - sx * 4.5 * big, y + 2.5 * big, 0.5), CL, { n: 1 });
  }
}

/** Boca aberta com dentes, para quem morde (rosto de frente). */
export function bite(s: Spr, cx: number, cy: number, rx: number, ry: number, fangs = true): void {
  s.fill(ell(cx, cy, rx, ry), ramp('#9A1F3B', { ol: '#2B0F1E' }), { rim: false, n: 1 });
  s.paint(ell(cx, cy + ry * 0.45, rx * 0.55, ry * 0.4), '#EE7C8E');
  if (fangs) {
    s.paint(poly([[cx - rx * 0.7, cy - ry + 0.5], [cx - rx * 0.3, cy - ry + 0.5], [cx - rx * 0.5, cy]]), WHITE);
    s.paint(poly([[cx + rx * 0.3, cy - ry + 0.5], [cx + rx * 0.7, cy - ry + 0.5], [cx + rx * 0.5, cy]]), WHITE);
  }
}

// ------------------------------------------------------------------ por espécie
const swoop = (cy: number): [number, number, number, number][] => [
  [2, cy - 6, 9, cy - 6],
  [1, cy, 7, cy],
  [55, cy - 4, 62, cy - 4],
  [57, cy + 2, 63, cy + 2],
];
const birdAttack = (skin: string, claw: string, y: number, spread = 6, big = 1): FrameSpec => ({
  from: 4,
  over: (s) => talons(s, 32, y, spread, skin, claw, big),
  xf: { s: 1.06 },
  fx: (s) => speed(s, swoop(48)),
});

export const COMBAT: Record<string, CombatSpec> = {
  onca: {
    attack: { from: 3, xf: { s: 1.1, ay: 50 }, fx: (s, T) => { const p = T([10, 30]); slash(s, p[0] - 7, p[1] - 12, p[0] + 5, p[1] + 2); speed(s, swoop(44).slice(2)); } },
    hurt: { head: [32, 23, 16] },
  },
  oncaparda: {
    attack: { from: 3, xf: { s: 1.1, ay: 50 }, fx: (s, T) => { const p = T([10, 30]); slash(s, p[0] - 7, p[1] - 12, p[0] + 5, p[1] + 2); speed(s, swoop(44).slice(2)); } },
    hurt: { head: [32, 23, 14] },
  },
  preguica: {
    attack: { from: 0, xf: { s: 1.06, shear: 0.06 }, fx: (s) => { slash(s, 46, 6, 60, 22); slash(s, 4, 22, 16, 6); } },
    hurt: { head: [32, 25, 14] },
  },
  uacari: {
    attack: {
      from: 3,
      over: (s) => bite(s, 32, 25.5, 4.6, 3),
      xf: { s: 1.08, ay: 40 },
      fx: (s) => speed(s, [[20, 60, 20, 63], [44, 60, 44, 63], [26, 58, 26, 63], [38, 58, 38, 63]]),
    },
    hurt: { head: [32, 23, 15] },
  },
  ariranha: {
    attack: {
      from: 0,
      over: (s) => bite(s, 32, 31, 5.5, 3.2),
      xf: { s: 1.1, dy: -2 },
      fx: (s) => splash(s, 32, 56, 22),
    },
    hurt: { head: [32, 22, 14] },
  },
  boto: {
    attack: {
      from: 0,
      over: (s) => {
        s.paint(poly([[46, 32], [61, 38.5], [60, 41], [46, 35]]), '#9A1F3B');
        s.dots(WHITE, [49, 34], [52, 35.5], [55, 37]);
      },
      xf: { s: 1.08, dy: -2 },
      fx: (s) => splash(s, 28, 56, 24),
    },
    hurt: { head: [38, 22, 12] },
  },
  perereca: {
    attack: {
      from: 3,
      over: (s) => bite(s, 32, 31, 7, 2.8, false),
      xf: { s: 1.12, ay: 40 },
      fx: (s) => speed(s, [[14, 60, 14, 63], [50, 60, 50, 63], [22, 61, 22, 63], [42, 61, 42, 63]]),
    },
    hurt: { head: [32, 36, 16] },
  },
  sucuri: {
    attack: { from: 3, xf: { s: 1.1, ay: 50 }, fx: (s) => speed(s, swoop(26)) },
    hurt: { head: [32, 17, 10] },
  },
  harpia: {
    attack: { ...birdAttack('#EDB82E', '#34323E', 56, 8, 1.4), xf: { s: 1.04, ay: 40 } },
    hurt: { from: 5, head: [32, 20, 11] },
  },
  poraque: {
    attack: { from: 3, over: (s) => s.tint('#F4FF9A', 0.4, 50), xf: { s: 1.08, ay: 30 } },
    hurt: { head: [30, 27, 14] },
  },
  morfo: {
    attack: {
      from: 0,
      xf: { s: 1.08, ay: 34 },
      fx: (s) => twinkles(s, [[6, 40], [58, 42], [12, 56], [52, 58], [32, 60], [4, 24], [60, 26], [22, 62], [42, 61]]),
    },
    hurt: { head: [32, 25, 8] },
  },
  tracaja: {
    attack: {
      from: 0,
      over: (s) => {
        s.fill(ell(32, 56, 5.2, 3), ramp('#9A1F3B', { ol: '#2B0F1E' }), { rim: false, n: 1 });
        s.paint(ell(32, 56.5, 2.4, 1), '#EE7C8E');
      },
      xf: { s: 1.08 },
      fx: (s) => { burst(s, 46, 50, 5); burst(s, 18, 50, 4); },
    },
    hurt: { head: [32, 40, 20] },
  },
  tatubola: {
    attack: {
      from: 3,
      xf: { rot: 0.7, ax: 33, ay: 44, s: 1.06, dx: 4 },
      fx: (s) => {
        speed(s, [[2, 36, 14, 36], [0, 42, 13, 42], [2, 48, 14, 48], [4, 54, 15, 54]]);
        dust(s, [[14, 58], [9, 56], [5, 59], [20, 60]]);
      },
    },
    hurt: { head: [52, 44, 8] },
  },
  ararinha: { attack: birdAttack('#7A7088', '#2A2832', 49, 5), hurt: { from: 5, head: [32, 20, 10] } },
  arara: { attack: birdAttack('#7A7088', '#3A3444', 49, 5), hurt: { from: 5, head: [32, 20, 11] } },
  asabranca: { attack: birdAttack('#D2485A', '#3A1020', 50, 4, 0.8), hurt: { from: 5, head: [32, 23, 7] } },
  carcara: { attack: birdAttack('#F0C83A', '#2E1C18', 48, 6, 1.1), hurt: { from: 5, head: [32, 20, 10] } },
  soldadinho: { attack: birdAttack('#5A4E5A', '#1A1420', 51, 3.5, 0.7), hurt: { from: 5, head: [32, 26, 9] } },
  moco: {
    attack: {
      from: 0,
      over: (s) => {
        s.paint(ell(32, 38.5, 3.4, 2.2), '#5A1236');
        s.paint(ell(32, 39.5, 1.8, 0.8), '#EE7C8E');
        s.paint(poly([[30.5, 36.5], [33.5, 36.5], [33.5, 38.5], [30.5, 38.5]]), WHITE);
        s.line(32, 36.5, 32, 38, '#C8C0C0');
      },
      xf: { s: 1.1 },
      fx: (s) => speed(s, swoop(40)),
    },
    hurt: { head: [32, 30, 12] },
  },
  veado: {
    attack: { from: 2, xf: { s: 1.1, sy: 1.04 }, fx: (s, T) => { const p = T([32, 8]); burst(s, p[0] - 9, p[1] + 1, 6); burst(s, p[0] + 9, p[1] + 1, 6); } },
    hurt: { head: [32, 20, 9] },
  },
  cascavel: {
    attack: { from: 3, xf: { s: 1.1, ay: 50 }, fx: (s) => speed(s, swoop(24)) },
    hurt: { head: [32, 18, 10] },
  },
  teiu: {
    attack: {
      from: 2,
      over: (s) => {
        s.fill(poly([[52, 39.5], [61, 38.5], [60, 42.5], [52, 41.5]]), ramp('#9A1F3B', { ol: '#2B0F1E' }), { rim: false, n: 1 });
        s.dots(WHITE, [54, 39], [56, 39], [58, 39]);
      },
      xf: { s: 1.06, dx: 2 },
      fx: (s) => speed(s, [[0, 40, 6, 40], [0, 46, 4, 46], [0, 34, 5, 34]]),
    },
    hurt: { head: [50, 40, 8] },
  },
  cururu: {
    attack: {
      from: 2,
      over: (s) => bite(s, 32, 45.5, 9, 3.2, false),
      xf: { sx: 1.16, sy: 1.08 },
      fx: (s) => dust(s, [[8, 59], [56, 59], [4, 57], [60, 57]]),
    },
    hurt: { head: [32, 36, 14] },
  },
  jandaira: {
    attack: {
      from: 3,
      over: (s) => {
        s.fill(poly([[31.5, 55], [36.5, 55], [34, 61]]), ramp('#2A1A16', { hi: '#6A4A3A', ol: '#0C0608' }), { n: 1 });
        s.dots('#8A5A2E', [29, 28], [36, 28]);
      },
      xf: { s: 1.1, ay: 40, rot: 0.12 },
      fx: (s) => speed(s, [[18, 2, 22, 10], [26, 0, 28, 8], [44, 2, 40, 10], [50, 6, 46, 12]]),
    },
    hurt: { head: [32, 23, 10] },
  },
};

// ------------------------------------------------------------------ montagem
const ATTACK_XF: Xf = { s: 1.08 };
const HURT_XF: Xf = { sx: 1.05, sy: 0.9, shear: 0.09, dx: -1 };

function frame(draw: Drawer, spec: FrameSpec, mode: 'attack' | 'hurt', defXf: Xf): { s: Spr; T: (p: Pt) => Pt } {
  const s = new Spr();
  pose.mode = mode;
  try {
    draw(s, spec.from ?? 0);
    spec.over?.(s);
  } finally {
    pose.mode = '';
  }
  const xf = spec.xf ?? defXf;
  applyXf(s, xf);
  return { s, T: forward(xf) };
}

/** Quadro 4 ou 5 de uma espécie (com derivação automática quando não há entrada em COMBAT). */
export function combatFrame(id: string, draw: Drawer, f: 4 | 5, extra?: CombatSpec): Spr {
  const spec = extra ?? COMBAT[id] ?? {};
  if (f === 4) {
    const a = spec.attack ?? { from: 0, fx: (s: Spr) => speed(s, swoop(40)) };
    const { s, T } = frame(draw, a, 'attack', ATTACK_XF);
    a.fx?.(s, T);
    return s;
  }
  const h: HurtSpec = spec.hurt ?? { head: [32, 24, 12] };
  const { s, T } = frame(draw, h, 'hurt', HURT_XF);
  s.tint('#FFF0F0', 0.22, 70);
  h.fx?.(s, T);
  const [hx, hy, r] = h.head;
  const top = T([hx, hy - r]);
  const side = T([hx + r * 0.85, hy - r * 0.35]);
  const hit = T([hx - r * 0.9, hy]);
  star(s, top[0] - 6, Math.max(2, top[1] - 1));
  star(s, top[0] + 5, Math.max(3, top[1] - 3));
  sweat(s, Math.min(60, side[0] + 1), Math.max(1, side[1] - 2));
  burst(s, Math.max(4, hit[0] - 2), hit[1] + 3, 5, '#FFFFFF', '#FF6A4A');
  return s;
}

/** Ataque/dano de quem não tem desenhista: o bloco chapado vira sprite e passa pela mesma derivação. */
export function blockDrawer(main: string, light: string, dark: string): Drawer {
  return (s) => {
    s.fill(poly([[16, 22], [48, 22], [48, 58], [16, 58]]), ramp(main, { hi: light, sh: dark }));
    s.put(26, 32, INK).put(38, 32, INK);
  };
}
