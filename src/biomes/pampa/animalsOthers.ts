import { cap, type Drawer, ell, erode, hurtEye, INK, type Mask, pose, ramp, Spr } from '../../art/animals/kit';

// Anfíbio do Pampa na captura (64×64): sapinho-de-barriga-vermelha.

const SK = ramp('#34342E', { hi: '#5A5A48', rim: '#8E8E70', sh: '#222220', dp: '#14141A', ol: '#07070A' });
const SRED = ramp('#E0402A', { hi: '#FF7A4A', rim: '#FFC090', sh: '#B02430', dp: '#701834', ol: '#2E0C22' });
const SYEL = ramp('#EAD030', { hi: '#FFF070', rim: '#FFFAB0', sh: '#C0962A', dp: '#7E5A26', ol: '#3A2214' });

function warts(s: Spr, clip: Mask, seed: number): void {
  const inner = erode(clip, 1);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      if (!inner[y * 64 + x]) continue;
      const h = (x * 59 + y * 131 + seed * 41) % 17;
      if (h === 0) s.put(x, y, SK.rim);
      else if (h === 1) s.put(x, y, '#9AA040');
    }
}

function toadEye(s: Spr, x: number, y: number, blink: boolean): void {
  s.fill(ell(x, y, 4.2, 3.8), SK);
  if (pose.mode === 'hurt') hurtEye(s, x - 2.5, y - 2.5, 5, 5, INK);
  else if (blink && pose.mode !== 'attack') s.line(x - 2.6, y, x + 2.6, y, SK.rim);
  else {
    s.paint(ell(x, y + 0.2, 3, 2.8), '#1A1218');
    s.paint(ell(x, y + 0.1, 2.2, 2), '#E8C040');
    s.paint(ell(x, y + 0.2, 1.6, 1.4), INK);
    s.put(x - 1, y - 1, '#FFFFFF');
  }
  if (pose.mode === 'attack') s.line(x < 32 ? x - 4 : x + 4, y - 4, x < 32 ? x + 1 : x - 1, y - 2, INK);
}

export const sapinho: Drawer = (s, f) => {
  const b = f === 1 ? 1 : 0;
  const crouch = f === 2;
  const air = f === 3;
  const y = air ? -10 : crouch ? 2 : 0;
  // coxas dobradas e pés espalmados
  for (const sx of [-1, 1]) {
    if (air) {
      const th = ell(32 + sx * 14, 52 + y, 6, 5.6);
      s.fill(th, SK);
      s.paintIn(th, ell(32 + sx * 14, 55 + y, 4, 2.4), SRED.md);
      s.fill(cap(32 + sx * 14, 55 + y, 2.2, 32 + sx * 12, 61 + y * 0.4, 1.6), SK, { n: 1 });
      s.fill(ell(32 + sx * 12.5, 62 + y * 0.4, 4.4, 1.5), SRED, { n: 1 });
    } else {
      const th = ell(32 + sx * 13, 51 + y * 0.5, 6.4, 6.6);
      s.fill(th, SK);
      warts(s, th, 3 + sx);
      s.fill(ell(32 + sx * 13.5, 57.6, 6, 2), SK, { n: 1 });
      s.dots(SK.rim, [32 + sx * 9, 58], [32 + sx * 12, 58.4], [32 + sx * 16, 58]);
    }
  }
  const body = ell(32, 47 + y, 13, 10 + b * 0.5);
  s.fill(body, SK);
  warts(s, body, 7);
  // barriga: preta, com manchas vermelhas e amarelas (aparece de lado e no pulo)
  const belly = ell(32, 51 + y, air ? 10 : 6.6, air ? 7.4 : 5.4);
  s.fill(belly, SK, { ol: false, rim: false });
  s.paintIn(belly, ell(29, 51 + y, 3.4, 3.2), SRED.md);
  s.paintIn(belly, ell(36, 52 + y, 3.4, 3), SRED.md);
  s.paintIn(belly, ell(32.5, 49.6 + y, 2.2, 1.8), SYEL.md);
  s.dots(SRED.hi, [28, 50 + y], [35, 51 + y]);
  s.dots(SYEL.hi, [32, 49 + y]);
  // braços curtos com palmas vermelhas
  for (const sx of [-1, 1]) {
    const ax = air ? 32 + sx * 11 : 32 + sx * 8;
    s.fill(cap(32 + sx * 9, 47 + y, 2.8, ax, air ? 55 + y : 56 + y * 0.3, 2.4), SK);
    s.fill(ell(ax, air ? 56.4 + y : 57.2, 3.2, 1.5), SRED, { n: 1 });
  }
  // cabeça larga, olhos grandes
  const hy = 36 + y + b * 0.5;
  const head = ell(32, hy + 1, 11, 7.4);
  s.fill(head, SK);
  warts(s, head, 11);
  toadEye(s, 25, hy - 3.4, b === 1);
  toadEye(s, 39, hy - 3.4, b === 1);
  s.dots(SK.dp, [30, hy + 1], [34, hy + 1]);
  s.line(24, hy + 4.4, 40, hy + 4.4, SK.dp);
  s.dots(SK.hi, [27, hy - 6], [37, hy - 6]);
  s.paint(ell(32, hy - 4.6, 1.8, 1), '#9AA040');
  if (crouch) s.dots(SRED.md, [26, hy + 6], [38, hy + 6]);
};
