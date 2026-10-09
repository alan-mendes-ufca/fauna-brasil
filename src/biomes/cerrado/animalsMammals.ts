import { rng } from '../../art/canvas';
import { cap, type Drawer, ell, eye, fuzz, type Mask, path, poly, ramp, rect, Spr, sub, uni } from '../../art/animals/kit';

// Mamíferos do Cerrado na captura (64×64): lobo-guará, tamanduá-bandeira, tatu-canastra e raposinha-do-campo.

// ------------------------------------------------------------------ lobo-guará
const LG = ramp('#CC7A32', { hi: '#E8A258', rim: '#FFDCA4', sh: '#A04E30', dp: '#5E2E36', ol: '#2A1420' });
const LBLK = ramp('#2C2428', { hi: '#4C4248', rim: '#82767C', sh: '#1C161A', dp: '#100A10', ol: '#06040A' });
const LWHITE = ramp('#F8F0DE', { hi: '#FFFFFF', sh: '#D6C6B0', dp: '#A8949A', ol: '#4A3438' });

export const loboguara: Drawer = (s, f) => {
  const rand = rng(51);
  const b = f === 1 ? 1 : 0;
  const crouch = f === 2;
  const air = f === 3;
  const y = air ? -9 : crouch ? 5 : 0;
  const foot = air ? 50 + y : 56;

  // pernas finíssimas e longas: meia preta embaixo
  for (const [dx, top, r0, r1] of [[10, 38, 3.8, 2.1], [5.4, 38, 2.9, 1.8]] as [number, number, number, number][]) {
    for (const sx of [-1, 1]) {
      const kick = air ? sx * 3 : crouch ? sx * 1.5 : 0;
      const x0 = 32 + sx * dx;
      const leg = cap(x0, top + y, r0, x0 + kick, foot, r1);
      s.fill(leg, LBLK, { n: 1 });
      s.fill(sub(leg, rect(0, 46 + y * 0.6, 64, 30)), LG, { n: 1 });
      s.fill(ell(x0 + kick, foot + 1.2, r1 + 1.1, 1.7), LBLK, { n: 1 });
    }
  }
  // cauda curta e peluda atrás
  s.fill(path([[32 + 12, 36 + y, 3.4], [32 + 17, 40 + y, 3], [32 + 18, 45 + y, 2.4]]), LG);
  // tronco
  const body = ell(32, 37 + y, 13, 8.5 + b * 0.5);
  s.fill(body, LG);
  fuzz(s, body, LG.hi, rand, 0.22);
  s.fill(ell(32, 41 + y, 7, 5), LWHITE, { ol: false, rim: false });
  // juba negra atrás do pescoço (só aparece nos lados), depois o pescoço
  for (const sx of [-1, 1]) {
    s.fill(poly([[32 + sx * 4, 25 + y], [32 + sx * 10, 22 + y], [32 + sx * 13, 28 + y], [32 + sx * 11, 35 + y], [32 + sx * 5, 34 + y]]), LBLK, { n: 1 });
    s.dots(LBLK.hi, [32 + sx * 10, 25 + y], [32 + sx * 11, 29 + y]);
  }
  s.fill(cap(32, 33 + y, 6, 32, 23 + y, 5.2), LG);
  s.fill(ell(32, 30 + y, 3.4, 3.6), LWHITE, { ol: false, rim: false });
  const hy = 17 + y + b;
  // orelhonas
  for (const sx of [-1, 1]) {
    const ear = poly([[32 + sx * 3, hy - 2], [32 + sx * 5, hy - 17], [32 + sx * 13, hy - 14], [32 + sx * 11, hy + 1]]);
    s.fill(ear, LG);
    s.paint(poly([[32 + sx * 5.6, hy - 2], [32 + sx * 6.6, hy - 12], [32 + sx * 11, hy - 11], [32 + sx * 9.6, hy - 1]]), '#3A2228');
    s.dots(LWHITE.md, [32 + sx * 8, hy - 3], [32 + sx * 9, hy - 5]);
    s.dots(LBLK.md, [32 + sx * 6, hy - 16], [32 + sx * 7, hy - 15]);
  }
  const head = ell(32, hy, 8.6, 6.6);
  s.fill(head, LG);
  // bochechas brancas, focinho longo e escuro
  for (const sx of [-1, 1]) s.paintIn(head, ell(32 + sx * 6, hy + 3.2, 3, 2), LWHITE.md);
  s.fill(uni(ell(32, hy + 5, 3.6, 4.2), ell(32, hy + 7.5, 2.6, 2)), LBLK, { n: 1 });
  s.fill(ell(32, hy + 9.5, 2.2, 1.2), ramp('#0E080C', { hi: '#3A2E34', ol: '#04020A' }), { n: 1 });
  s.dots('#9A8A94', [31, hy + 9]);
  s.fill(ell(32, hy + 11.5, 3.2, 1.6), LWHITE, { ol: false, rim: false });
  eye(s, 32 - 7.5, hy - 3, 4, 4, '#8A5A22', b === 1);
  eye(s, 32 + 3.5, hy - 3, 4, 4, '#8A5A22', b === 1);
  s.dots(LG.rim, [28, hy - 6], [30, hy - 6], [27, hy - 5]);
  if (air) s.dots('#E8D2A8', [20, 60], [22, 61], [42, 60], [44, 61]);
};

// ------------------------------------------------------------------ tamanduá-bandeira
const TG = ramp('#8C8278', { hi: '#B2A89A', rim: '#E2D8C8', sh: '#645A62', dp: '#443A44', ol: '#1C121A' });
const TBLK = ramp('#2A2226', { hi: '#4A4046', rim: '#7C7076', sh: '#1A1418', dp: '#100A10', ol: '#06040A' });
const TCR = ramp('#EEE6D6', { hi: '#FFFFFF', sh: '#CABCAC', dp: '#8E8088', ol: '#3A2C34' });
const TLEG = ramp('#D8CCBA', { hi: '#F2EADA', rim: '#FFFFFF', sh: '#A89C8E', dp: '#6C6068', ol: '#2A1C26' });

export const tamandua: Drawer = (s, f) => {
  const rand = rng(52);
  const b = f === 1 ? 1 : 0;
  const sniff = f >= 2;
  const k = f === 3 ? 1 : 0;
  // cauda enorme e peluda, em chama, que sobe pelas costas
  const tail = poly([[42, 30], [49, 22], [57, 24], [62, 34], [63, 47], [58, 57], [51, 55], [47, 47], [43, 41]]);
  s.fill(tail, TG);
  fuzz(s, tail, TG.hi, rand, 0.3);
  for (const [x0, y0, x1, y1] of [[49, 26, 55, 30], [53, 30, 59, 38], [55, 38, 59, 48], [50, 33, 54, 44], [52, 45, 55, 52]] as number[][]) s.line(x0, y0, x1, y1, TG.dp);
  s.dots(TG.rim, [50, 24], [54, 25], [58, 28]);
  // pernas traseiras (escuras) e dianteiras (claras com braçadeira preta)
  const hind = cap(42, 44, 5, 43, 57, 3.6);
  s.fill(hind, TG);
  s.fill(ell(44, 58, 5, 1.8), TLEG, { n: 1 });
  s.dots(TBLK.md, [41, 58], [43, 58.5], [46, 58]);
  const fore = cap(26, 43, 4.6, 24, 57, 3.2);
  s.fill(fore, TLEG);
  s.paintIn(fore, rect(0, 48, 64, 3), TBLK.md);
  // garras longas e curvas, de andar sobre os nós dos dedos
  for (const [x0, x1] of [[20, 14], [22, 17], [25, 21]]) s.line(x0 + 1, 56, x1, 58, TBLK.md).line(x1, 58, x1 - 1, 59, TBLK.md);
  // tronco
  const body = ell(35, 38 + b * 0.5, 15, 9.5);
  const neck = ell(24, 36, 7, 6.5);
  const torso: Mask = uni(body, neck);
  s.fill(torso, TG);
  fuzz(s, torso, TG.hi, rand, 0.18);
  // a faixa preta diagonal com borda branca: da garganta até o meio do dorso
  s.paintIn(torso, poly([[17, 34], [24, 31], [47, 22], [47, 30], [28, 42], [20, 44]]), TCR.hi);
  s.paintIn(torso, poly([[19, 36], [25, 33.5], [47, 25], [47, 28], [28, 39.5], [21, 41]]), TBLK.md);
  s.paintIn(torso, poly([[22, 36.5], [28, 34.5], [44, 27.5], [44, 28.5], [28, 37], [23, 39]]), TBLK.sh);
  // cabeça: focinho longuíssimo e fino
  const dip = sniff ? 9 + k * 2 : 0;
  const snout = path([[19, 33 + b, 5], [12, 36 + dip * 0.4 + b, 3], [6, 38 + dip + b, 1.7]]);
  s.fill(snout, TG);
  s.paintIn(snout, rect(0, 40 + dip + b, 24, 8), TG.sh);
  s.fill(ell(19, 31 + b, 5.4, 5), TG);
  s.fill(ell(24, 28 + b, 2.2, 2.2), TG, { n: 1 });
  s.put(24, 28 + b, TBLK.md);
  s.dots(TBLK.dp, [5, 38 + dip + b], [6, 39 + dip + b]);
  eye(s, 15, 30 + b, 3, 3, '#2A1810', b === 1);
  s.dots(TG.rim, [17, 27 + b], [20, 26 + b], [22, 27 + b]);
  // língua fina e rápida que sai da ponta do focinho
  if (sniff) {
    const tx = 4 - k * 3;
    const ty = 39 + dip + b;
    s.line(tx + 2, ty, tx - 1, ty + 1 + k, '#E8788C');
    if (k) s.line(tx - 1, ty + 1, tx - 4, ty + 3, '#E8788C');
    s.put(tx - (k ? 5 : 2), ty + (k ? 4 : 2), '#FFB0BC');
  }
};

// ------------------------------------------------------------------ tatu-canastra
const AS = ramp('#5E4E48', { hi: '#86766A', rim: '#B8A894', sh: '#403038', dp: '#2A1E28', ol: '#120A14' });
const ABAND = ramp('#E6D8BC', { hi: '#FAF0D8', sh: '#B8A488', dp: '#7E6C64', ol: '#3A2A2C' });
const ASKIN = ramp('#B6A692', { hi: '#D8CAB0', rim: '#F2E6D0', sh: '#8A7A74', dp: '#5A4A54', ol: '#241A22' });
const ACLAW = ramp('#F6EEDC', { hi: '#FFFFFF', sh: '#C8B8A0', dp: '#8E7E76', ol: '#2E2024' });

export const tatucanastra: Drawer = (s, f) => {
  const rand = rng(53);
  const hunch = f >= 2;
  const k = f === 3 ? 1 : 0;
  const b = f === 1 ? 1 : 0;
  const y = hunch ? 3 : 0;
  const cx = 36 + (hunch ? k * 2 - 1 : 0);
  // cauda longa e grossa na base, coberta de placas
  const tail = path([[cx + 17, 46 + y, 4], [cx + 23, 52 + y, 3], [62, 57, 1.6]]);
  s.fill(tail, ASKIN);
  for (const x of [cx + 19, cx + 22, cx + 25]) s.dots(AS.md, [x, 49 + y + (x - cx - 19) * 0.6]);
  // patas traseiras e dianteiras curtas, com as garras enormes
  const hind = cap(cx + 8, 50 + y, 5, cx + 9, 57, 4);
  s.fill(hind, ASKIN);
  s.fill(ell(cx + 10, 58, 5, 1.8), ASKIN, { n: 1 });
  s.dots(ACLAW.md, [cx + 6, 59], [cx + 9, 59.5], [cx + 12, 59]);
  const fore = cap(cx - 12, 50 + y, 5, cx - 14, 57, 3.6);
  s.fill(fore, ASKIN);
  s.fill(poly([[cx - 12, 54], [cx - 22, 58.5], [cx - 22.5, 56.5], [cx - 15, 52]]), ACLAW);
  s.fill(poly([[cx - 11, 56], [cx - 19, 60.5], [cx - 19.5, 58.6], [cx - 14, 54.5]]), ACLAW, { n: 1 });
  s.line(cx - 21, 57, cx - 17, 55.5, ACLAW.dp);
  // cabeça: pequena, estreita; recolhida debaixo do casco na ação
  const hx = cx - 20 + (hunch ? 7 : 0);
  const hy = 45 + y - (hunch ? 0 : b);
  const head = uni(ell(hx, hy, 6.2, 5.2), ell(hx - 5.5, hy + 3, 3.6, 2.4));
  if (!hunch) {
    s.fill(head, ASKIN);
    s.fill(ell(hx + 4, hy - 4.5, 1.6, 2.2), ASKIN, { n: 1 });
    s.put(hx + 4, hy - 4.5, AS.md);
    eye(s, hx - 2, hy - 2, 3, 3, '#2A1810', b === 1);
    s.dots(ASKIN.dp, [hx - 9, hy + 3], [hx - 8, hy + 4]);
    s.dots(ASKIN.rim, [hx - 3, hy - 4], [hx - 1, hy - 4]);
  }
  // carapaça em abóbada, escura, com a faixa clara na lateral
  const shell = sub(ell(cx, 42 + y - b * 0.5, 20, 13 + (hunch ? -1 : 0)), rect(0, 53 + y, 64, 12));
  s.fill(shell, AS);
  s.paintIn(shell, sub(shell, ell(cx, 36 + y, 21.5, 12)), ABAND.md);
  s.paintIn(shell, sub(shell, ell(cx, 35.4 + y, 21.5, 12)), ABAND.sh);
  // cintas transversais curvas e escamas
  for (let x = cx - 14; x <= cx + 16; x += 4) s.paintIn(shell, path([[x + 2, 31 + y, 0.5], [x, 40 + y, 0.5], [x - 2, 51 + y, 0.5]]), AS.dp);
  for (let x = cx - 16; x <= cx + 16; x += 4) for (const yy of [35, 41, 46]) if (rand() < 0.8) s.paintIn(shell, rect(x + 0.6, yy + y, 1.2, 0.8), AS.hi);
  s.dots(AS.rim, [cx - 8, 30 + y], [cx - 4, 29 + y], [cx, 29 + y], [cx + 4, 30 + y]);
  for (let x = cx - 16; x < cx + 18; x += 2) s.put(x, 53 + y, ABAND.dp);
  if (k) s.dots('#CDBF9E', [cx - 24, 60], [cx - 28, 59], [cx - 26, 61], [cx - 22, 61]);
};

// ------------------------------------------------------------------ raposinha-do-campo
const RP = ramp('#A8998A', { hi: '#C8BAA8', rim: '#EBDDC6', sh: '#7C6E70', dp: '#524656', ol: '#241A28' });
const RBUFF = ramp('#E4B77C', { hi: '#F6D4A0', rim: '#FFEBC4', sh: '#B88260', dp: '#7A5260', ol: '#3A2430' });
const RDARK = '#2E262C';

function foxHead(s: Spr, cx: number, cy: number, blink: boolean, lean = 0): void {
  for (const sx of [-1, 1]) {
    const ear = poly([[cx + sx * 3, cy - 3], [cx + sx * 6 + lean, cy - 15], [cx + sx * 13 + lean, cy - 11], [cx + sx * 10, cy - 1]]);
    s.fill(ear, RBUFF);
    s.paint(poly([[cx + sx * 5.5, cy - 3], [cx + sx * 7 + lean, cy - 11], [cx + sx * 10.5 + lean, cy - 9], [cx + sx * 9, cy - 2]]), '#4A3238');
    s.dots(RDARK, [cx + sx * 7 + lean, cy - 14], [cx + sx * 8 + lean, cy - 13]);
  }
  const head = uni(ell(cx, cy, 9.5, 7.5), ell(cx, cy + 4.5, 6, 4.8));
  s.fill(head, RP);
  s.paintIn(head, ell(cx, cy - 5.5, 5, 2.2), RP.sh);
  for (const sx of [-1, 1]) s.paintIn(head, ell(cx + sx * 6, cy + 3.5, 3.4, 2.4), RBUFF.md);
  s.fill(ell(cx, cy + 6.3, 3.6, 2.8), RBUFF, { ol: false, rim: false });
  s.fill(ell(cx, cy + 4.3, 2.2, 1.5), ramp('#1E161C', { hi: '#4A3C44', ol: '#06040A' }), { n: 1 });
  s.put(cx - 1, cy + 3.7, '#8A7A86');
  s.dots(RDARK, [cx, cy + 5.8], [cx, cy + 6.8], [cx - 1, cy + 7.6], [cx + 1, cy + 7.6]);
  for (const sx of [-1, 1]) {
    eye(s, cx + sx * 5.2 - 2, cy - 3.2, 4, 4, '#B0702E', blink);
    s.line(cx + sx * 2.8, cy - 0.5, cx + sx * 3.4, cy + 2.5, RDARK);
    s.line(cx + sx * 3, cy - 5.5, cx + sx * 8, cy - 5.5, RP.dp);
  }
}

export const raposinha: Drawer = (s, f) => {
  const rand = rng(54);
  const b = f === 1 ? 1 : 0;
  const air = f === 3;
  const crouch = f === 2;
  const y = air ? -8 : crouch ? 4 : 0;
  // cauda grossa e peluda com a ponta escura, curva ao lado
  const tl: [number, number, number][] = air ? [[42, 46 + y, 4], [51, 50 + y, 4.4], [57, 58 + y, 3.4]] : [[41, 52 + y, 4], [51, 52 + y, 4.6], [57, 46 + y, 4], [58, 38 + y, 3.4]];
  const tail = path(tl);
  s.fill(tail, RP);
  const tip = tl[tl.length - 1];
  s.paintIn(tail, ell(tip[0], tip[1], 4.2, 4.2), RDARK);
  s.dots(RP.rim, [tl[1][0], tl[1][1] - 3]);
  if (air) {
    for (const sx of [-1, 1]) {
      s.fill(cap(32 + sx * 10, 52 + y, 3.4, 32 + sx * 15, 56 + y, 2.4), RBUFF);
      s.fill(cap(32 + sx * 5, 40 + y, 2.6, 32 + sx * 8, 44 + y, 2.2), RBUFF, { n: 1 });
      s.fill(ell(32 + sx * 8, 45 + y, 2.4, 1.5), ramp(RDARK), { n: 1 });
    }
  } else {
    for (const sx of [-1, 1]) {
      s.fill(ell(32 + sx * 11, 53 + y * 0.4, 5.5, 6.5), RP);
      s.fill(ell(32 + sx * 10, 58, 5, 2), RBUFF, { n: 1 });
    }
  }
  const body = ell(32, 47 + y + b * 0.3, 12, air ? 10 : 9.5 - (crouch ? 1 : 0));
  s.fill(body, RP);
  fuzz(s, body, RP.hi, rand, 0.25);
  s.fill(ell(32, 50 + y, 6.5, 7), RBUFF, { ol: false, rim: false });
  if (!air) {
    for (const sx of [-1, 1]) {
      s.fill(cap(32 + sx * 5, 51 + y * 0.5, 2.6, 32 + sx * 5.4, 57, 2.1), RBUFF);
      s.fill(ell(32 + sx * 5.4, 58, 3, 1.8), RBUFF, { n: 1 });
    }
  }
  foxHead(s, 32, 29 + y + b, b === 1, air ? 1 : 0);
  if (air) s.dots('#E8D2A8', [18, 61], [20, 62], [44, 61], [46, 62]);
};
