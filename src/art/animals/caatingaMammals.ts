import { and, cap, type Drawer, ell, erode, eye, fuzz, INK, type Mask, path, poly, ramp, rect, Spr, sub, uni, type Pt } from './kit';
import { rng } from '../canvas';

// ------------------------------------------------------------------ tatu-bola
const SHELL = ramp('#C8A466', { hi: '#E6C886', rim: '#FFF0B8', sh: '#9A7444', dp: '#6A4A34', ol: '#2A1A1A' });
const BAND = ramp('#B08E58', { hi: '#D4B276', sh: '#87643E', dp: '#5A3E2E' });
const TSKIN = ramp('#B8968A', { hi: '#DAB8A8', rim: '#F4DCCC', sh: '#8E6A6A', dp: '#5E4250', ol: '#2A1A22' });
const TCLAW = '#F2E6CC';

/** Tubérculos da carapaça: pontinhos claros com sombra embaixo, em grade alternada. */
function tubercles(s: Spr, clip: Mask, step = 4): void {
  const inner = erode(clip, 1);
  for (let y = 0; y < 64; y += step - 1)
    for (let x = ((y / (step - 1)) % 2) * (step / 2); x < 64; x += step) {
      if (!inner[y * 64 + x]) continue;
      s.put(x, y, SHELL.hi);
      if (inner[(y + 1) * 64 + x]) s.put(x, y + 1, SHELL.sh);
    }
}

export const tatubola: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  if (f < 2) {
    // patas: traseiras plantígradas; dianteiras andando na ponta das garras
    for (const x of [16, 25]) {
      s.fill(cap(x, 50, 3, x, 56, 2.6), TSKIN, { n: 1 });
      s.dots(TCLAW, [x - 2, 58], [x, 58], [x + 2, 58]);
    }
    for (const x of [39, 46]) {
      s.fill(cap(x, 50, 2.6, x + 1, 55, 1.6), TSKIN, { n: 1 });
      s.fill(cap(x + 1, 55, 1.2, x + 2, 58, 0.7), ramp(TCLAW, { ol: '#4A3A30' }), { n: 1 });
    }
    // cauda curta e grossa, encouraçada
    const tail = cap(9, 47, 3, 4, 52, 2);
    s.fill(tail, SHELL);
    s.dots(SHELL.dp, [7, 49], [6, 50]);
    // carapaça em domo
    const shell = sub(ell(29, 40 - b * 0.5, 21, 14), rect(0, 52, 64, 12));
    s.fill(shell, SHELL);
    tubercles(s, shell);
    // as três cintas móveis no meio
    for (const x of [24, 29, 34]) {
      const band = and(shell, rect(x, 0, 4, 64));
      s.fill(band, BAND, { ol: false, rim: false });
      s.paintIn(shell, rect(x, 0, 1, 64), SHELL.dp);
      for (let y = 30; y < 52; y += 3) s.put(x + 2, y, BAND.hi);
    }
    s.paintIn(shell, rect(38, 0, 1, 64), SHELL.dp);
    // borda de baixo serrilhada
    for (let x = 9; x < 50; x += 2) s.put(x, 52, SHELL.dp);
    // cabeça triangular com escudo na testa
    const hy = 44 + b;
    const head = poly([[44, hy - 6], [52, hy - 7], [59, hy + 3], [58, hy + 6], [51, hy + 6], [45, hy + 3]]);
    s.fill(head, TSKIN);
    const shield = poly([[46, hy - 6], [52, hy - 7.5], [57, hy + 0.5], [52, hy + 0]]);
    s.fill(shield, SHELL, { ol: SHELL.dp });
    s.dots(SHELL.hi, [49, hy - 5], [52, hy - 5], [54, hy - 3]);
    // orelha pequena e olho miúdo
    s.fill(ell(47, hy - 7, 2, 2.6), TSKIN, { n: 1 });
    s.put(47, hy - 7, TSKIN.dp);
    eye(s, 50, hy + 0.5, 3, 3, '#3A2418', b === 1);
    s.dots(TSKIN.dp, [58, hy + 4], [57, hy + 5]);
    s.dots(TSKIN.rim, [53, hy + 3], [55, hy + 4]);
  } else {
    // enrolado numa bola: a cabeça e a cauda fecham a abertura
    const r = f === 3 ? 1 : 0;
    const cx = 32 + r;
    const ball = ell(cx, 44, 15, 14);
    s.fill(ball, SHELL);
    tubercles(s, ball);
    for (const dy of [-5, 0, 5]) {
      const arc = sub(ell(cx, 44 + dy + 6, 18, 8), ell(cx, 44 + dy + 7, 18, 8));
      s.paintIn(ball, arc, SHELL.dp);
      s.paintIn(ball, sub(ell(cx, 44 + dy + 7.5, 18, 8), ell(cx, 44 + dy + 8.5, 18, 8)), BAND.hi);
    }
    // escudos da cabeça (em cima) e da cauda (embaixo) encaixados
    s.fill(poly([[cx - 5, 38], [cx + 5, 38], [cx + 1, 46], [cx - 1, 46]]), SHELL, { ol: SHELL.dp });
    s.fill(poly([[cx - 1, 47], [cx + 1, 47], [cx + 5, 54], [cx - 5, 54]]), BAND, { ol: SHELL.dp });
    s.dots(SHELL.hi, [cx - 2, 40], [cx + 2, 40], [cx, 42], [cx - 2, 52], [cx + 2, 52], [cx, 50]);
    // frestas escuras e, no quadro 2, um olho espiando
    s.line(cx - 6, 46, cx - 2, 46.5, '#1A1018');
    s.line(cx + 6, 46, cx + 2, 46.5, '#1A1018');
    if (f === 2) s.dots('#F2E6A0', [cx - 4, 46]);
    s.dots(SHELL.rim, [cx - 9, 35], [cx - 10, 37], [cx - 7, 33]);
  }
};

// ------------------------------------------------------------------ mocó
const MOCO = ramp('#8E806E', { hi: '#B2A48E', rim: '#E2D6BE', sh: '#665866', dp: '#443A4C', ol: '#1E1824' });
const RUFUS = ramp('#B86A3A', { hi: '#D88E56', sh: '#8A4636', dp: '#5A2E30', ol: '#2A141A' });
const MBELLY = ramp('#E2D2B0', { hi: '#F6EAD0', sh: '#BCA88C', dp: '#8E7A74', ol: '#3A2E30' });

function mocoHead(s: Spr, cx: number, cy: number, blink: boolean): void {
  for (const sx of [-1, 1]) {
    s.fill(ell(cx + sx * 9, cy - 8, 3.6, 3.4), MOCO, { n: 1 });
    s.paint(ell(cx + sx * 9, cy - 7.5, 2, 1.8), '#D89A9A');
  }
  const head = uni(ell(cx, cy, 11.5, 9), ell(cx, cy + 4, 7.5, 6));
  s.fill(head, MOCO);
  // faixa clara sob o olho, focinho e queixo claros
  for (const sx of [-1, 1]) s.paintIn(head, ell(cx + sx * 7, cy + 3.5, 3.6, 1.4), MBELLY.hi);
  s.fill(ell(cx, cy + 6, 4.6, 3.4), MBELLY, { ol: false, rim: false });
  eye(s, cx - 9, cy - 3, 5, 5, '#2E1C18', blink);
  eye(s, cx + 4, cy - 3, 5, 5, '#2E1C18', blink);
  s.paint(poly([[cx - 2, cy + 3], [cx + 2, cy + 3], [cx, cy + 5]]), '#5A3A3E');
  s.line(cx, cy + 5, cx, cy + 6, INK);
  s.dots(INK, [cx - 1, cy + 7], [cx - 2, cy + 7], [cx + 1, cy + 7], [cx + 2, cy + 7]);
  s.paint(rect(cx - 1, cy + 8, 2, 1.4), '#FFFFFF');
  for (const sx of [-1, 1]) {
    s.line(cx + sx * 4, cy + 5, cx + sx * 12, cy + 3, '#3A3038');
    s.line(cx + sx * 4, cy + 6, cx + sx * 12, cy + 7, '#3A3038');
  }
  s.dots(MOCO.rim, [cx - 5, cy - 7], [cx - 4, cy - 8], [cx - 2, cy - 8]);
}

export const moco: Drawer = (s, f) => {
  const rand = rng(41);
  const b = f === 1 ? 1 : 0;
  if (f < 2) {
    for (const sx of [-1, 1]) {
      // coxas ruivas e pés com almofadas
      s.fill(ell(32 + sx * 12, 51, 6, 6.5), RUFUS);
      s.fill(ell(32 + sx * 10, 57, 5.5, 2.2), ramp('#4A3A3A', { hi: '#6E5A58', ol: '#1A1014' }), { n: 1 });
    }
    const body = ell(32, 47, 13, 11 + b * 0.5);
    s.fill(body, MOCO);
    fuzz(s, body, MOCO.hi, rand, 0.25);
    s.fill(ell(32, 50, 7, 7), MBELLY, { ol: false });
    for (const sx of [-1, 1]) s.fill(ell(32 + sx * 4, 55, 2.6, 2), MOCO, { n: 1 });
    mocoHead(s, 32, 30 + b, b === 1);
  } else {
    const air = f === 3;
    const y = air ? -7 : 2;
    if (air) {
      for (const sx of [-1, 1]) {
        s.fill(cap(32 + sx * 8, 47 + y, 4.5, 32 + sx * 13, 57 + y, 3), RUFUS);
        s.fill(ell(32 + sx * 14, 58.5 + y, 4.5, 2), ramp('#4A3A3A', { ol: '#1A1014' }), { n: 1 });
        s.fill(cap(32 + sx * 9, 40 + y, 2.5, 32 + sx * 15, 35 + y, 2), MOCO, { n: 1 });
      }
    } else {
      for (const sx of [-1, 1]) {
        s.fill(ell(32 + sx * 13, 52, 7, 6), RUFUS);
        s.fill(ell(32 + sx * 11, 57, 6, 2.2), ramp('#4A3A3A', { ol: '#1A1014' }), { n: 1 });
      }
    }
    const body = ell(32, 46 + y, air ? 11 : 14, air ? 12 : 9.5);
    s.fill(body, MOCO);
    fuzz(s, body, MOCO.hi, rand, 0.25);
    s.fill(ell(32, 49 + y, 6.5, air ? 8 : 6), MBELLY, { ol: false });
    mocoHead(s, 32, 31 + y + (air ? 0 : 1), false);
    if (air) s.dots('#E2D6BE', [22, 60], [20, 61], [42, 60], [44, 61], [32, 61]);
  }
};

// ------------------------------------------------------------------ onça-parda (suçuarana)
const PUMA = ramp('#C8985E', { hi: '#E4BA7E', rim: '#FFE6B4', sh: '#9A6A48', dp: '#6A443E', ol: '#2A1620' });
const PCREAM = ramp('#F6EADA', { sh: '#D4BCA8', dp: '#A08A8E', ol: '#4A2C3A' });
const PDARK = '#3A2226';

export const oncaparda: Drawer = (s, f) => {
  const pounce = f >= 2;
  const g = f === 3 ? 1 : 0;
  const b = f === 1 ? 1 : 0;

  // cauda longa com ponta preta
  const tailPts: [number, number, number][] = pounce ? [[50, 50, 3], [58, 47, 2.8], [61, 38, 2.6], [57, 28, 2.6]] : [[48, 52, 3], [57, 53, 2.8], [61, 45, 2.6], [59, 33, 2.6]];
  const tail = path(tailPts);
  s.fill(tail, PUMA);
  const tip = tailPts[tailPts.length - 1];
  s.paintIn(tail, ell(tip[0], tip[1], 4, 4.5), PDARK);

  // corpo esguio
  const body = ell(32, pounce ? 49 : 47, pounce ? 21 : 19, pounce ? 10 : 12 + b * 0.5);
  s.fill(body, PUMA);

  if (!pounce) {
    for (const sx of [-1, 1]) {
      const leg = uni(cap(32 + sx * 9.5, 42, 5, 32 + sx * 10, 55, 4.2), ell(32 + sx * 10, 55.5, 5.6, 3));
      s.fill(leg, PUMA);
      s.dots(PUMA.dp, [32 + sx * 12, 57], [32 + sx * 10, 57.5], [32 + sx * 8, 57]);
    }
    s.fill(ell(32, 49, 6, 8), PCREAM, { ol: false });
  } else {
    const leg = uni(cap(44, 44, 5.5, 45, 56, 4.5), ell(45, 55.5, 6.5, 3));
    s.fill(leg, PUMA);
    s.dots('#FFFFFF', [42, 58], [45, 58.5], [48, 58]);
    s.fill(cap(21, 43, 5.5, 12, 35 - g * 2, 4.5), PUMA);
    s.fill(ell(10, 32 - g * 2, 6.5, 5.5), PUMA);
    for (const k of [-4, -1, 2, 5]) s.line(10 + k, 36 - g * 2, 9 + k, 40 - g * 2, '#FFF7E0');
  }

  // orelhas triangulares de ponta redonda, verso escuro
  const ey = pounce ? 15 + g : 12 + b;
  for (const sx of [-1, 1]) {
    const ear = poly([[32 + sx * 5, ey + 5], [32 + sx * 10, ey - 5], [32 + sx * 13, ey - 5], [32 + sx * 15, ey + 4]]);
    s.fill(ear, PUMA);
    s.paint(poly([[32 + sx * 8, ey + 4], [32 + sx * 10.5, ey - 2.5], [32 + sx * 13, ey + 3]]), '#5A3036');
    s.dots('#E8C8B8', [32 + sx * 10, ey + 2]);
    s.dots(PDARK, [32 + sx * 11, ey - 5], [32 + sx * 12, ey - 5], [32 + sx * 13, ey - 4]);
  }
  // cabeça pequena e arredondada
  const hy = pounce ? 26 + g : 23 + b;
  s.fill(ell(32, hy, pounce ? 15 : 13, pounce ? 12 : 11), PUMA);
  // focinho branco e manchas pretas na base dos bigodes
  s.fill(uni(ell(27.5, hy + 6, 4.6, 3.4), ell(36.5, hy + 6, 4.6, 3.4)), PCREAM, { ol: false, rim: false });
  s.fill(ell(32, hy + 8, 4.5, 3.4), PCREAM, { ol: false, rim: false });
  for (const sx of [-1, 1]) {
    s.paint(ell(32 + sx * 6, hy + 4.2, 1.8, 1.3), PDARK);
    s.line(32 + sx * 9, hy + 6, 32 + sx * 14, hy + 5, '#FFFFFF');
    s.line(32 + sx * 9, hy + 8, 32 + sx * 14, hy + 9, '#FFFFFF');
  }
  if (!pounce) {
    for (const sx of [-1, 1]) {
      eye(s, 32 + sx * 6.5 - 3, hy - 5.5, 6, 6, '#C8B43A', b === 1);
      s.line(32 + sx * 3.5, hy - 7, 32 + sx * 9.5, hy - 6.5, PUMA.dp);
      // linha escura do canto do olho ao focinho
      s.line(32 + sx * 3, hy - 1, 32 + sx * 3, hy + 1, PUMA.dp);
      s.dots(PCREAM.md, [32 + sx * 6, hy - 7]);
    }
    s.paint(poly([[29.5, hy + 1.5], [34.5, hy + 1.5], [32, hy + 4.5]]), '#D88A8A');
    s.line(29.5, hy + 1, 34.5, hy + 1, INK);
    s.dots(INK, [32, hy + 5], [32, hy + 6]);
    s.line(32, hy + 6, 29, hy + 8, INK);
    s.line(32, hy + 6, 35, hy + 8, INK);
  } else {
    s.fill(ell(32, hy + 8, 8.5, 4.5 + g * 1.5), ramp('#9A1F3B', { ol: '#2B0F1E' }), { rim: false });
    s.paint(ell(32, hy + 10 + g, 4.5, 1.8), '#EE7C8E');
    s.paint(poly([[25.5, hy + 4.5], [28, hy + 4.5], [26.8, hy + 8]]), '#FFFFFF');
    s.paint(poly([[36, hy + 4.5], [38.5, hy + 4.5], [37.2, hy + 8]]), '#FFFFFF');
    s.paint(poly([[27, hy + 12 + g], [29, hy + 12 + g], [28, hy + 9]]), '#FFF2D8');
    s.paint(poly([[35, hy + 12 + g], [37, hy + 12 + g], [36, hy + 9]]), '#FFF2D8');
    s.paint(poly([[29.5, hy + 1], [34.5, hy + 1], [32, hy + 4]]), '#D88A8A');
    s.line(29.5, hy, 34.5, hy, INK);
    for (const sx of [-1, 1]) {
      const x = 32 + sx * 7.5;
      s.paint(ell(x, hy - 4, 3.2, 2.5), INK);
      s.paint(ell(x, hy - 3.7, 2.3, 1.7), '#E8D040');
      s.paint(ell(x, hy - 3.6, 0.8, 1.4), INK);
      s.put(x - 1, hy - 4.5, '#FFFFFF');
      s.line(x - sx * 4, hy - 8, x + sx * 3, hy - 5.5, PUMA.dp);
    }
  }
};

// ------------------------------------------------------------------ veado-catingueiro
const DEER = ramp('#A07E5C', { hi: '#C4A07A', rim: '#ECD4B0', sh: '#765A50', dp: '#4E3A44', ol: '#221822' });
const DCREAM = ramp('#F4ECDE', { hi: '#FFFFFF', sh: '#D2C2B4', dp: '#9C8C94', ol: '#3A2C34' });
const HOOF = ramp('#3A2E30', { hi: '#5E4E50', ol: '#120A10' });
const ANTLER = ramp('#5A4436', { hi: '#8A6E58', rim: '#C4A88A', sh: '#3E2E2A', ol: '#160E10' });

function deerHead(s: Spr, cx: number, hy: number, f: number, earsBack: boolean): void {
  // orelhas grandes abertas para os lados
  for (const sx of [-1, 1]) {
    const tip: Pt = earsBack ? [cx + sx * 15, hy - 9] : [cx + sx * 16, hy - 3];
    const ear = poly([[cx + sx * 4, hy - 6], [cx + sx * 9, hy - 10], tip, [cx + sx * 12, hy + 1], [cx + sx * 6, hy - 1]]);
    s.fill(ear, DEER);
    s.paintIn(ear, erode(ear, 2), DCREAM.md);
    s.paintIn(erode(ear, 2), ell(cx + sx * 9, hy - 4, 2.5, 1.5), '#E0B0A8');
  }
  // chifres curtos e retos (macho)
  for (const sx of [-1, 1]) s.fill(cap(cx + sx * 3, hy - 7, 1.5, cx + sx * 3.8, hy - 15, 0.8), ANTLER, { n: 1 });
  const head = uni(ell(cx, hy - 2, 7.5, 7), ell(cx, hy + 5, 4.8, 5));
  s.fill(head, DEER);
  s.paintIn(head, ell(cx, hy - 6, 4, 2.4), DEER.sh);
  // focinho claro, nariz preto e queixo branco
  s.fill(ell(cx, hy + 7, 4.2, 3.2), DCREAM, { ol: false, rim: false });
  s.fill(ell(cx, hy + 6.3, 2.8, 1.8), ramp('#24181E', { hi: '#5A4A50', ol: '#0A0610' }), { n: 1 });
  s.put(cx - 1, hy + 5.6, '#8A7A86');
  s.line(cx, hy + 8, cx, hy + 9, DCREAM.dp);
  for (const sx of [-1, 1]) {
    // anel claro em volta do olho grande
    s.paint(ell(cx + sx * 5, hy - 1.5, 3.4, 3.2), DCREAM.hi);
    eye(s, cx + sx * 5 - 2.5, hy - 4, 5, 5, '#3A2418', f === 1);
  }
}

export const veado: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const crouch = f === 2;
  const air = f === 3;
  const y = air ? -8 : crouch ? 3 : 0;

  // pernas traseiras (atrás) e dianteiras finas com cascos
  if (air) {
    for (const sx of [-1, 1]) {
      s.fill(cap(32 + sx * 8, 44 + y, 2.8, 32 + sx * 13, 49 + y, 2), DEER, { n: 1 });
      s.fill(cap(32 + sx * 13, 49 + y, 2, 32 + sx * 10, 54 + y, 1.6), DEER, { n: 1 });
      s.fill(ell(32 + sx * 10, 55 + y, 1.8, 1.4), HOOF, { n: 1 });
      s.fill(cap(32 + sx * 4, 46 + y, 2.6, 32 + sx * 6, 52 + y, 1.6), DEER, { n: 1 });
      s.fill(cap(32 + sx * 6, 52 + y, 1.6, 32 + sx * 3, 56 + y, 1.4), DEER, { n: 1 });
      s.fill(ell(32 + sx * 3, 57 + y, 1.7, 1.3), HOOF, { n: 1 });
    }
  } else {
    const k = crouch ? 2 : 0;
    for (const sx of [-1, 1]) {
      s.fill(cap(32 + sx * 10, 44 + y, 3, 32 + sx * (11 + k), 56, 1.5), DEER, { n: 1 });
      s.fill(ell(32 + sx * (11 + k), 57, 1.8, 1.4), HOOF, { n: 1 });
    }
    for (const sx of [-1, 1]) {
      s.fill(cap(32 + sx * 5, 44 + y, 3.2, 32 + sx * (5 + k), 56, 1.6), DEER, { n: 1 });
      s.fill(ell(32 + sx * (5 + k), 57, 2, 1.5), HOOF, { n: 1 });
      s.dots(DCREAM.md, [32 + sx * (5 + k), 52], [32 + sx * (5 + k), 53]);
    }
  }
  // corpo e peito
  s.fill(ell(32, 40 + y, 13, 8.5), DEER);
  s.fill(ell(32, 41 + y, 8, 8), DEER);
  s.fill(ell(32, 44 + y, 4.5, 4), DCREAM, { ol: false, rim: false });
  // pescoço
  s.fill(cap(32, 38 + y, 5.5, 32, 28 + y, 4.6), DEER);
  s.fill(ell(32, 32 + y, 3.4, 4), DCREAM, { ol: false, rim: false });
  deerHead(s, 32, 20 + y + (crouch ? 0 : b), f, air);
  if (air) s.dots('#E8DCC8', [18, 62], [20, 61], [44, 62], [46, 61], [32, 62]);
};
