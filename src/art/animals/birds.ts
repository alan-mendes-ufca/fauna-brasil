import { flapAngles, tailWedge } from './wing';
import { and, cap, type Drawer, ell, erode, eye, INK, type Mask, mirror, poly, ramp, rect, rot, Spr, sub, uni, wingPoly, type Pt } from './kit';

type Side = 1 | -1;
const flip = (m: Mask, side: Side): Mask => (side < 0 ? mirror(m) : m);
const fromS = (S: Pt, len: number, ang: number): Pt => [S[0] + Math.cos(ang) * len, S[1] + Math.sin(ang) * len];

/** Região do plano mais perto que `r` do ombro (para faixas de cor concêntricas da asa). */
const disc = (S: Pt, r: number): Mask => ell(S[0], S[1], r, r);

// ------------------------------------------------------------------ arara-vermelha
const RED = ramp('#E3302B', { hi: '#FF6A40', rim: '#FFC890', sh: '#A81C44', dp: '#5E1040', ol: '#2A0A22' });
const BLUE = ramp('#2A62CC', { hi: '#52A6F4', rim: '#B8EAFF', sh: '#1C3C9E', dp: '#14226E', ol: '#0A0F3A' });
const YEL = ramp('#F4C42E', { hi: '#FFE87E', rim: '#FFF8C0', sh: '#D88A20', dp: '#8A4A24', ol: '#3A1A20' });
const GRN = ramp('#33A458', { hi: '#6CD878', rim: '#C8FFB0', sh: '#1E7450', dp: '#124A48', ol: '#0A2A30' });
const IVORY = ramp('#EFE0B8', { hi: '#FFF6D8', rim: '#FFFFFF', sh: '#C8A67E', dp: '#7A5A68', ol: '#2A1824' });
const FACE = ramp('#F8E2DA', { hi: '#FFFFFF', sh: '#E0B4B8', dp: '#B08098', ol: '#7A2A3A' });
const BEAK_DARK = ramp('#3A3444', { hi: '#6A6478', sh: '#241E34', ol: '#120C20' });

function macawWing(s: Spr, theta: number, side: Side): void {
  const S: Pt = [38, 31];
  const S2: Pt = [38, 40];
  const tips: Pt[] = [
    fromS(S, 32, theta - 0.42),
    fromS(S, 35, theta - 0.17),
    fromS(S, 34, theta + 0.08),
    fromS(S, 30, theta + 0.33),
    fromS(S2, 24, theta + 0.55),
  ];
  const wing = flip(poly(wingPoly(S, tips, S2, 0.2)), side);
  const cir = (r: number) => flip(disc(S, r), side);
  s.fill(wing, BLUE);
  s.fill(and(wing, cir(21)), GRN, { ol: false, rim: false });
  s.fill(and(wing, cir(15)), YEL, { ol: false, rim: false });
  s.fill(and(wing, cir(10)), RED, { ol: false, rim: false });
  // separação das penas
  for (let i = 0; i + 1 < tips.length; i++) {
    const a = tips[i];
    const c = tips[i + 1];
    const mx = (a[0] + c[0]) / 2 + (S[0] - (a[0] + c[0]) / 2) * 0.2;
    const my = (a[1] + c[1]) / 2 + (S[1] - (a[1] + c[1]) / 2) * 0.2;
    const sx = (x: number) => (side < 0 ? 63 - x : x);
    const along = (t: number): Pt => [S[0] + (mx - S[0]) * t, S[1] + (my - S[1]) * t];
    const p0 = along(0.58);
    const p1 = along(0.98);
    s.line(sx(p0[0]), p0[1], sx(p1[0]), p1[1], BLUE.sh);
  }
}

export const arara: Drawer = (s, f) => {
  // 4 ataque e 5 dano vêm de flapAngles (asas abertas / caídas)
  const a = flapAngles(f);
  const thetaR = a.r;
  const thetaL = a.l;
  const dy = a.dy;
  const lean = a.lean;

  macawWing(s, thetaL, -1);
  macawWing(s, thetaR, 1);

  // cauda longa: uma peça afilada vermelha com a ponta azul, atrás dos pés
  tailWedge(s, 32, 45 + dy, 11, 61, lean, RED, BLUE, 6);
  // pés
  for (const sx of [-1, 1]) s.fill(ell(32 + sx * 4, 49 + dy, 2.2, 2.2), ramp('#7A7088', { ol: '#241A34' }), { n: 1 });

  // corpo e cabeça
  s.fill(ell(32 + lean * 0.5, 37 + dy, 9.5, 13), RED);
  s.fill(ell(32 + lean, 20 + dy, 10.4, 8.8), RED);
  // face clara (pele nua) e olhos
  s.fill(uni(ell(26.8 + lean, 22 + dy, 4.8, 4.8), ell(37.2 + lean, 22 + dy, 4.8, 4.8)), FACE, { ol: false, rim: false });
  eye(s, 24 + lean, 19.5 + dy, 5, 5, '#F6DC5A', f === 1);
  eye(s, 35 + lean, 19.5 + dy, 5, 5, '#F6DC5A', f === 1);
  s.dots(FACE.dp, [24 + lean, 26 + dy], [26 + lean, 27 + dy], [39 + lean, 26 + dy], [37 + lean, 27 + dy], [23 + lean, 25 + dy], [40 + lean, 25 + dy]);
  // bico em gancho: maxilar claro, mandíbula escura
  s.fill(poly([[29.5 + lean, 28 + dy], [34.5 + lean, 28 + dy], [33.5 + lean, 33 + dy], [32 + lean, 35.5 + dy], [30.5 + lean, 33 + dy]]), BEAK_DARK);
  s.fill(poly([[28.5 + lean, 21 + dy], [35.5 + lean, 21 + dy], [37 + lean, 25 + dy], [35.5 + lean, 30 + dy], [32 + lean, 34 + dy], [28.5 + lean, 30 + dy], [27 + lean, 25 + dy]]), IVORY);
  s.line(30 + lean, 30 + dy, 34 + lean, 30 + dy, IVORY.dp);
  s.dots(IVORY.dp, [30 + lean, 24 + dy], [34 + lean, 24 + dy], [32 + lean, 33 + dy]);
  // peito: penas mais claras
  s.dots(RED.hi, [28, 40 + dy], [31, 43 + dy], [34, 38 + dy], [29, 34 + dy], [36, 42 + dy]);
};

// ------------------------------------------------------------------ harpia
const SLATE = ramp('#5A5E70', { hi: '#8A90A8', rim: '#D4D8EC', sh: '#383A54', dp: '#22213C', ol: '#0E0C20' });
const DARKW = ramp('#2F2E44', { hi: '#52566E', rim: '#9AA0C0', sh: '#1E1C34', dp: '#12102A', ol: '#080618' });
const PALE = ramp('#F2EFE8', { hi: '#FFFFFF', sh: '#C8C4D8', dp: '#8C88A8', ol: '#2E2A48' });
const TALON = ramp('#EDB82E', { hi: '#FFE068', rim: '#FFF4B0', sh: '#C07A20', dp: '#7A4A28', ol: '#2E1A24' });
const HEADG = ramp('#8E92A6', { hi: '#B4B8CA', rim: '#E4E6F2', sh: '#686C84', dp: '#464862', ol: '#14122A' });
const HOOK = ramp('#34323E', { hi: '#6A6A80', sh: '#201E2E', ol: '#0A0818' });

function harpyWing(s: Spr, theta: number, side: Side): void {
  const S: Pt = [38, 31];
  const S2: Pt = [38, 42];
  const tips: Pt[] = [
    fromS(S, 27, theta - 0.5),
    fromS(S, 30, theta - 0.3),
    fromS(S, 31, theta - 0.1),
    fromS(S, 30, theta + 0.1),
    fromS(S, 28, theta + 0.3),
    fromS(S2, 22, theta + 0.5),
  ];
  const wing = flip(poly(wingPoly(S, tips, S2, 0.18)), side);
  const cir = (r: number) => flip(disc(S, r), side);
  s.fill(wing, DARKW);
  s.fill(and(wing, cir(19)), SLATE, { ol: false, rim: false });
  s.fill(and(wing, cir(11)), PALE, { ol: false, rim: false });
  const sx = (x: number) => (side < 0 ? 63 - x : x);
  for (let i = 0; i + 1 < tips.length; i++) {
    const a = tips[i];
    const c = tips[i + 1];
    const mx = (a[0] + c[0]) / 2 + (S[0] - (a[0] + c[0]) / 2) * 0.18;
    const my = (a[1] + c[1]) / 2 + (S[1] - (a[1] + c[1]) / 2) * 0.18;
    const p0: Pt = [S[0] + (mx - S[0]) * 0.55, S[1] + (my - S[1]) * 0.55];
    s.line(sx(p0[0]), p0[1], sx(mx), my, DARKW.dp);
    // barras claras nas penas
    const p2: Pt = [S[0] + (mx - S[0]) * 0.75, S[1] + (my - S[1]) * 0.75];
    s.put(sx(p2[0]), p2[1], '#B8BCD0');
  }
}

export const harpia: Drawer = (s, f) => {
  const glide = f === 2 || f === 3;
  const thetaR = glide ? (f === 2 ? -0.35 : -0.22) : f === 0 ? -1.0 : f === 4 ? -0.55 : f === 5 ? 1.0 : 0.7;
  const thetaL = glide ? (f === 2 ? 0.15 : 0.28) : thetaR;
  const dy = f === 1 ? -1 : f === 4 ? -2 : f === 5 ? 2 : 0;

  harpyWing(s, thetaL, -1);
  harpyWing(s, thetaR, 1);

  // cauda larga com faixa clara
  const tail = poly([[26, 48], [38, 48], [41, 61], [23, 61]]);
  s.fill(tail, DARKW);
  s.paintIn(tail, rect(22, 54, 20, 2), '#C8C4D8');

  // pernas grossas e garras enormes
  const stretch = glide ? 2 : 0;
  for (const sx of [-1, 1]) {
    const x = 32 + sx * 5.5;
    s.fill(cap(x, 47 + dy, 4.2, x + sx * 1.5, 55 + stretch, 3.4), TALON);
    s.fill(ell(x + sx * 1.5, 57 + stretch, 5, 2.8), TALON);
    for (const k of [-3, 0, 3]) s.fill(cap(x + sx * 1.5 + k, 58 + stretch, 1.2, x + sx * 1.5 + k * 1.5, 62, 0.5), HOOK, { n: 1 });
  }

  // corpo: peito claro com faixa preta
  s.fill(ell(32, 39 + dy, 11.5, 13.5), PALE);
  s.fill(poly([[21, 34 + dy], [26, 30 + dy], [32, 33 + dy], [38, 30 + dy], [43, 34 + dy], [40, 38 + dy], [32, 36 + dy], [24, 38 + dy]]), DARKW, { ol: false, rim: false });
  s.dots('#B8B4CC', [27, 43 + dy], [32, 46 + dy], [37, 43 + dy], [30, 49 + dy], [35, 40 + dy]);

  // crista dupla
  for (const sx of [-1, 1]) {
    const c = cap(32 + sx * 5, 13 + dy, 3, 32 + sx * 11, 1 + dy, 0.8);
    s.fill(c, SLATE);
    s.line(32 + sx * 6, 11 + dy, 32 + sx * 10, 3 + dy, DARKW.dp);
  }
  s.fill(cap(32, 11 + dy, 3, 32, 2 + dy, 0.7), SLATE);
  // cabeça cinza
  s.fill(ell(32, 20 + dy, 10.8, 9.5), HEADG);
  s.fill(ell(32, 25 + dy, 8, 5), ramp('#C4C6D4', { sh: '#9A9CB0', dp: '#6E7088' }), { ol: false, rim: false });
  // sobrancelha e olhos intensos
  eye(s, 23, 17 + dy, 5, 5, '#E0902A', f === 1);
  eye(s, 36, 17 + dy, 5, 5, '#E0902A', f === 1);
  s.line(22, 15 + dy, 28, 17 + dy, DARKW.dp);
  s.line(42, 15 + dy, 36, 17 + dy, DARKW.dp);
  s.line(22, 14 + dy, 27, 16 + dy, HEADG.sh);
  s.line(42, 14 + dy, 37, 16 + dy, HEADG.sh);
  s.dots(HEADG.rim, [27, 12 + dy], [28, 12 + dy], [30, 11 + dy]);
  // bico em gancho com cera amarela
  s.fill(poly([[27, 22 + dy], [37, 22 + dy], [38, 27 + dy], [35, 32 + dy], [32.5, 35 + dy], [31, 31 + dy], [28, 28 + dy]]), HOOK);
  s.fill(rect(27.5, 22 + dy, 9, 2), TALON, { ol: false, rim: false });
  s.dots(INK, [30, 24 + dy], [34, 24 + dy]);
  s.dots('#9A9AB4', [29, 26 + dy], [30, 27 + dy]);
};

// ------------------------------------------------------------------ morfo-azul
const MBLACK = '#14102A';

export const morfo: Drawer = (s, f) => {
  // f0 asas abertas, f1 meio fechadas, f2/f3 planando inclinado
  const sx = [1, 0.55, 0.9, 0.82][f];
  const ang = [0, 0, -0.28, 0.22][f];
  const cy = f === 1 ? 31 : 33;
  const T = (p: Pt): Pt => {
    const x = 32 + (p[0] - 32) * sx;
    const q = rot([x, p[1] - 34 + cy], ang, 32, cy);
    return q;
  };
  const fore: Pt[] = [[33, 29], [37, 17], [45, 8], [56, 5], [61, 10], [58, 20], [52, 29], [43, 35], [34, 36]];
  const hind: Pt[] = [[33, 34], [45, 35], [53, 40], [55, 47], [50, 53], [42, 53], [35, 46]];
  const wing = (pts: Pt[], side: Side) => {
    const m = poly(pts.map(T));
    return side < 0 ? mirror(m) : m;
  };
  const center = T([32, 34]);
  const paintWing = (m: Mask) => {
    s.fill(m, ramp(MBLACK, { hi: '#262050', rim: '#5A68B0', sh: '#0C0A1C' }), { n: 1 });
    const inner = erode(m, 3);
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 64; x++) {
        if (!inner[y * 64 + x]) continue;
        const d = Math.hypot(x - center[0], (y - center[1]) * 1.1);
        let c = d < 9 ? '#8FE4FF' : d < 17 ? '#46B0FA' : d < 26 ? '#2878E8' : '#1C4FC8';
        // transições pontilhadas, brilho do azul metálico
        const edge = [9, 17, 26].some((t) => Math.abs(d - t) < 1.1);
        if (edge && (x + y) % 2 === 0) c = d < 17 ? '#8FE4FF' : d < 26 ? '#46B0FA' : '#2878E8';
        if (d > 20 && (x * 3 + y * 5) % 11 === 0) c = '#70C8FF';
        s.put(x, y, c);
      }
    // pontinhos brancos na borda escura
    const border = sub(m, erode(m, 2));
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (border[y * 64 + x] && (x * 7 + y * 13) % 8 === 0) s.put(x, y, '#F3EFE0');
  };
  for (const side of [1, -1] as Side[]) {
    paintWing(wing(hind, side));
    paintWing(wing(fore, side));
  }
  // corpo peludo, cabeça e antenas
  const head = T([32, 25]);
  const b0 = T([32, 29]);
  const b1 = T([32, 44]);
  s.fill(cap(b0[0], b0[1], 2.4, b1[0], b1[1], 1.8), ramp('#3A2430', { hi: '#6A4A50', sh: '#241420', ol: '#0C0614' }), { n: 1 });
  s.fill(ell(head[0], head[1], 3.2, 3), ramp('#3A2430', { hi: '#6A4A50', sh: '#241420', ol: '#0C0614' }), { n: 1 });
  s.dots('#FFFFFF', [head[0] - 1, head[1] - 0.5], [head[0] + 1, head[1] - 0.5]);
  const aL = T([27, 12]);
  const aR = T([37, 12]);
  s.line(head[0] - 1, head[1] - 2, aL[0], aL[1], '#2A1A36');
  s.line(head[0] + 1, head[1] - 2, aR[0], aR[1], '#2A1A36');
  s.dots('#5A4A70', [aL[0], aL[1]], [aR[0], aR[1]]);
  s.dots('#B8A0D0', [aL[0] - 1, aL[1] - 1], [aR[0] + 1, aR[1] - 1]);
};
