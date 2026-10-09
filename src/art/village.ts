import { rng, type Painter } from './canvas';
import type { PropSpec } from './forest';

// OBJETOS DAS VILAS (iguais em todos os biomas): casas de taipa caiada com telhado de telha de barro,
// a mercearia com toldo listrado, poço, horta, lampiões, banco e cerca. Texturas `prop_vila_<tipo>`.

export const VILLAGE_PROPS: Record<string, PropSpec> = {
  vila_casa: { w: 48, h: 48, fw: 3, fh: 2 },
  vila_casa2: { w: 48, h: 48, fw: 3, fh: 2 },
  vila_loja: { w: 64, h: 56, fw: 4, fh: 2 },
  vila_poco: { w: 32, h: 32, fw: 2, fh: 1 },
  vila_horta: { w: 32, h: 16, fw: 2, fh: 1, walkable: true },
  vila_lampiao: { w: 16, h: 32, fw: 1, fh: 1, light: { dx: 8, dy: -25, radius: 46, color: 0xffb860, intensity: 0.75, flicker: 'fire' } },
  vila_banco: { w: 32, h: 16, fw: 2, fh: 1 },
  vila_cerca: { w: 16, h: 16, fw: 1, fh: 1 },
};

const OUT = '#2a1a12';
const WOOD = { base: '#8a5a32', light: '#b07a46', dark: '#5e3a1e' };
const ROOF = { a: '#b4502e', b: '#9a4026', light: '#d8784a', dark: '#6e2a18' };
const GLASS = { base: '#f2c860', light: '#fff0a8' };

interface Wall {
  base: string;
  light: string;
  dark: string;
  /** Barrado (faixa colorida na base da parede, comum nas casas do interior). */
  trim: string;
}
const WHITE: Wall = { base: '#ece2c8', light: '#fbf5e2', dark: '#c8b896', trim: '#3a7a9a' };
const BLUE: Wall = { base: '#8cc0d8', light: '#b8dcea', dark: '#5e94b0', trim: '#e8d8a8' };
const OCHRE: Wall = { base: '#e2b25a', light: '#f2d088', dark: '#b88638', trim: '#7a3a24' };

/** Telhado de telhas de barro (fileiras alternadas), com cumeeira clara e beiral escuro. */
function roof(p: Painter, x: number, y: number, w: number, h: number): void {
  p.rect(x, y, w, h, ROOF.a);
  for (let row = 0; row * 3 < h; row++) {
    const yy = y + row * 3;
    p.hline(x, yy + 2, w, ROOF.b);
    for (let xx = x + (row % 2) * 2; xx < x + w; xx += 4) p.px(xx, yy + 1, ROOF.light);
  }
  p.hline(x + 1, y, w - 2, ROOF.light).hline(x + 1, y + 1, w - 2, ROOF.light);
  p.hline(x, y + h - 1, w, ROOF.dark);
  p.frame(x, y, w, h, OUT);
}

/** Janela de madeira com a vidraça acesa (luz de dentro de casa). */
function window_(p: Painter, x: number, y: number): void {
  p.rect(x - 1, y, 1, 7, WOOD.base).rect(x + 7, y, 1, 7, WOOD.base);
  p.block(x, y, 7, 7, GLASS.base, GLASS.light, '#c89a40', OUT);
  p.vline(x + 3, y + 1, 5, WOOD.dark).hline(x + 1, y + 3, 5, WOOD.dark);
}

function door(p: Painter, x: number, y: number, h: number): void {
  p.block(x, y, 8, h, WOOD.base, WOOD.light, WOOD.dark, OUT);
  p.vline(x + 3, y + 1, h - 2, WOOD.dark);
  p.px(x + 6, y + Math.floor(h / 2), '#f2d050');
}

/** Casa: parede de taipa caiada sobre a base (2 tiles) e o telhado em cima. */
function house(p: Painter, wall: Wall, seed: number): void {
  const rand = rng(seed);
  p.rect(3, 45, 42, 3, 'rgba(10,20,10,0.35)');
  p.block(4, 24, 40, 22, wall.base, wall.light, wall.dark, OUT);
  p.speckle(5, 26, 38, 15, [wall.light, wall.dark], 0.05, rand);
  p.rect(5, 41, 38, 4, wall.trim).hline(5, 41, 38, OUT);
  window_(p, 9, 29);
  window_(p, 32, 29);
  door(p, 20, 31, 14);
  roof(p, 1, 4, 46, 21);
  // chaminé do fogão a lenha
  p.block(34, 0, 6, 7, '#9a8a7a', '#c0b0a0', '#6a5a4a', OUT);
}

function shop(p: Painter): void {
  const rand = rng(77);
  p.rect(3, 53, 58, 3, 'rgba(10,20,10,0.35)');
  p.block(4, 30, 56, 24, OCHRE.base, OCHRE.light, OCHRE.dark, OUT);
  p.speckle(5, 32, 54, 16, [OCHRE.light, OCHRE.dark], 0.05, rand);
  p.rect(5, 49, 54, 4, OCHRE.trim).hline(5, 49, 54, OUT);
  // vitrine com frutas e redes
  p.block(8, 38, 16, 10, '#5a3a22', '#7a5a3a', '#3a2412', OUT);
  for (let i = 0; i < 6; i++) p.px(10 + i * 2, 41, ['#d8445a', '#f2d050', '#7a4a8a'][i % 3]).px(11 + i * 2, 42, ['#4f9a3a', '#e8704a'][i % 2]);
  p.hline(9, 45, 14, '#e8d8a8').hline(9, 46, 14, '#a88a4a');
  door(p, 30, 38, 15);
  window_(p, 46, 39);
  // toldo listrado
  for (let x = 6; x < 58; x++) {
    const red = Math.floor((x - 6) / 4) % 2 === 0;
    p.vline(x, 31, 5, red ? '#c83a2e' : '#f4ead2');
    p.px(x, 36, x % 4 < 2 ? (red ? '#9a2a20' : '#d8ccb0') : 'rgba(0,0,0,0)');
  }
  p.hline(6, 30, 52, OUT);
  roof(p, 1, 6, 62, 24);
  // placa da mercearia: cesta e moeda
  p.block(20, 0, 24, 11, WOOD.base, WOOD.light, WOOD.dark, OUT);
  p.vline(24, 11, 3, OUT).vline(39, 11, 3, OUT);
  p.rect(24, 4, 6, 4, '#c8944e').hline(24, 4, 6, '#3a2410').px(25, 3, '#d8445a').px(28, 3, '#4f9a3a');
  p.rect(33, 3, 6, 6, '#f2c84a').frame(33, 3, 6, 6, '#8a6a10').px(35, 5, '#fff0a8');
}

function well(p: Painter): void {
  // telhadinho sobre dois postes
  p.vline(6, 6, 20, WOOD.dark).vline(7, 6, 20, WOOD.base).vline(24, 6, 20, WOOD.dark).vline(25, 6, 20, WOOD.base);
  roof(p, 2, 1, 28, 7);
  p.hline(8, 12, 16, WOOD.dark).vline(16, 12, 6, '#a88a4a');
  p.rect(14, 18, 5, 4, WOOD.base).frame(14, 18, 5, 4, OUT);
  // boca de pedra
  p.rect(4, 29, 24, 3, 'rgba(10,20,10,0.35)');
  p.block(4, 20, 24, 10, '#9a948a', '#c8c2b4', '#6a6458', OUT);
  for (let x = 6; x < 26; x += 5) p.vline(x, 21, 8, '#7a7468');
  p.hline(5, 24, 22, '#7a7468');
  p.rect(7, 20, 18, 2, '#1a3a4a');
}

function garden(p: Painter): void {
  const rand = rng(5);
  p.block(0, 2, 32, 13, '#6a4a2a', '#8a6a3a', '#4a3018', '#3a2410');
  for (let row = 0; row < 3; row++) {
    const y = 4 + row * 4;
    p.hline(1, y + 2, 30, '#4a3018');
    for (let x = 3; x < 30; x += 4) {
      const c = rand() < 0.3 ? '#d8445a' : '#5aa83a';
      p.px(x, y, '#3a7a2a').px(x - 1, y + 1, c).px(x + 1, y + 1, '#7ac24a');
    }
  }
}

function lamp(p: Painter): void {
  p.rect(5, 29, 6, 2, 'rgba(10,20,10,0.35)');
  p.vline(7, 10, 20, WOOD.dark).vline(8, 10, 20, WOOD.base);
  p.hline(5, 29, 6, WOOD.dark);
  p.hline(8, 4, 4, WOOD.dark);
  p.block(4, 3, 8, 8, '#f2a83a', '#fff0a8', '#c87a20', OUT);
  p.rect(6, 5, 4, 4, '#fff8d0');
  p.hline(3, 2, 10, '#3a3a3a');
}

function bench(p: Painter): void {
  p.rect(2, 14, 28, 2, 'rgba(10,20,10,0.35)');
  p.block(1, 6, 30, 4, WOOD.base, WOOD.light, WOOD.dark, OUT);
  p.rect(4, 10, 2, 5, WOOD.dark).rect(26, 10, 2, 5, WOOD.dark);
  p.block(1, 1, 30, 4, WOOD.base, WOOD.light, WOOD.dark, OUT);
}

function fence(p: Painter): void {
  p.rect(1, 13, 14, 2, 'rgba(10,20,10,0.3)');
  p.block(2, 3, 3, 12, WOOD.base, WOOD.light, WOOD.dark, OUT).block(11, 3, 3, 12, WOOD.base, WOOD.light, WOOD.dark, OUT);
  p.hline(0, 6, 16, WOOD.light).hline(0, 7, 16, WOOD.dark).hline(0, 10, 16, WOOD.light).hline(0, 11, 16, WOOD.dark);
}

export const VILLAGE_PAINTERS: Record<string, (p: Painter) => void> = {
  vila_casa: (p) => house(p, WHITE, 11),
  vila_casa2: (p) => house(p, BLUE, 23),
  vila_loja: shop,
  vila_poco: well,
  vila_horta: garden,
  vila_lampiao: lamp,
  vila_banco: bench,
  vila_cerca: fence,
};
