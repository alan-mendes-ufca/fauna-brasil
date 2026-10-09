import type Phaser from 'phaser';
import { checkTemplate, paintSheet, type Painter } from './canvas';

// CONTRATO DO PERSONAGEM
// Spritesheet `explorer` com quadros de 16×24 e as animações exp-idle-<facing> / exp-walk-<facing>.
//
// Protagonista: jovem bióloga ou biólogo de campo. Chapéu de aba cáqui, cabelo escuro cacheado
// aparecendo, pele morena, camisa verde-oliva de manga dobrada, mochila laranja com rede
// enrolada em cima, calça cargo e botas marrons.

export const CHAR_W = 16;
export const CHAR_H = 24;
export const EXPLORER_KEY = 'explorer';

export type Facing = 'down' | 'up' | 'side';

/** Animações: `exp-idle-<facing>` e `exp-walk-<facing>`. O lado é desenhado olhando para a direita. */
export const explorerAnim = (state: 'idle' | 'walk', facing: Facing) => `exp-${state}-${facing}`;

const PALETTE: Record<string, string> = {
  k: '#2a1810',
  H: '#d8b46a',
  h: '#f6dc94',
  g: '#a67c3a',
  b: '#7a3a24',
  c: '#2a1a22',
  C: '#56394c',
  s: '#b9784c',
  S: '#8c5232',
  n: '#d99c6a',
  e: '#160c10',
  m: '#7a2e30',
  o: '#6f9030',
  O: '#a2c646',
  d: '#46621f',
  r: '#bcd45e',
  p: '#9c8650',
  P: '#6c5832',
  q: '#c4ac68',
  f: '#5e3620',
  F: '#8e5a34',
  y: '#c4562a',
  Y: '#8a3418',
  Z: '#ee8650',
  w: '#2c8aa4',
  W: '#8ae4f0',
  t: '#4a3426',
  j: '#4a3426',
};

// Cabeça e tronco ocupam 20 linhas; pernas, 3; mais 1 de folga embaixo (24 no total).

const HAT_FRONT = [
  '................',
  '................',
  '.....kkkkkk.....',
  '....khhhHHHk....',
  '...khhhHHHHHk...',
  '...kgbbbbbbgk...',
  '..kkhhhhHHHHkk..',
  '.kHhhhHHHHHHHHgk',
];

const DOWN = [
  ...HAT_FRONT,
  '.kggggggggggggk.',
  '..kcCssssssCck..',
  '..kcsessssesck..',
  '..kcsssmmsssck..',
  '...kcSssssSck...',
  '....kkSSSSkk....',
  '.koOOooooooOOok.',
  'ykootOooooOtookY',
  'ykrrtooooootrrky',
  '.kssdoooooodssk.',
  '.kSsjjjjjjjjsSk.',
  '..kPppqpppqpPk..',
];

const UP = [
  ...HAT_FRONT,
  '.kggggggggggggk.',
  '..kcCccccccCck..',
  '..kcccCcccccck..',
  '..kcccccccCcck..',
  '...kcccccccck...',
  '....kkcSSckk....',
  '.kwWWWwwWWWWwwk.',
  '.kooyZZZZZZyook.',
  '.krryZYYYYZyrrk.',
  '.kssyYYtYYYyssk.',
  '.kSsyYYYYYYysSk.',
  '..kPpppppppPpk..',
];

const SIDE = [
  '................',
  '................',
  '......kkkkk.....',
  '.....khhhHHk....',
  '....khhhhHHHk...',
  '....kgbbbbbbgk..',
  '...kkhhhhHHHHkk.',
  '.kHhhhHHHHHHHHgk',
  '..kcggggggggggk.',
  '...kccCsssssssk.',
  '...kcccssessssk.',
  '...kcccsssssssnk',
  '....kcccsssmmk..',
  '.....kcSsssSk...',
  '.....kkSSSkk....',
  '.kyZZyoOOOooook.',
  '.kyZYyoOrrrrook.',
  '.kyYYyoosssdook.',
  '.kyYYyjjssjjjjk.',
  '..kYYkPppppppPk.',
];

const LEGS = {
  idle: ['...kpppPPpppk...', '...kpqpPPpqpk...', '...kffFkkFffk...'],
  walkA: ['...kpppPPpppk...', '...kpppk..kppk..', '...kfffk........'],
  walkB: ['...kpppPPpppk...', '..kppk..kpppk...', '.........kfffk..'],
  sideIdle: ['....kpppppppk...', '....kpppqpppk...', '....kfffffFFk...'],
  sideA: ['....kpppppppk...', '...kppk..kpppk..', '..kfffk...kfffk.'],
  sideB: ['....kpppppppk...', '..kpppk..kppk...', '.kfffk...kfffk..'],
};

/** Desce 1px a parte de cima do corpo (respiração e passada). */
function bob(rows: string[]): string[] {
  return ['................', ...rows.slice(0, rows.length - 1)];
}

function frame(upper: string[], legs: string[], palette: Record<string, string>) {
  const rows = [...upper, ...legs, '................'];
  return (p: Painter) => p.template(rows, palette);
}

// Sombra suave sob os pés, desenhada antes do corpo.
function withShadow(draw: (p: Painter) => void) {
  return (p: Painter) => {
    p.rect(3, 22, 10, 1, 'rgba(4,32,46,0.28)').rect(4, 23, 8, 1, 'rgba(4,32,46,0.18)');
    draw(p);
  };
}

/**
 * 12 quadros: por direção (baixo, cima, lado) quatro quadros:
 * 0 parado · 1 parado (respirando) · 2 passo A · 3 passo B.
 */
export function paintExplorer(scene: Phaser.Scene, key = EXPLORER_KEY, colors: Partial<Record<string, string>> = {}): void {
  for (const [n, t] of Object.entries({ DOWN, UP, SIDE })) checkTemplate(n, t, 16);
  for (const [n, rows] of Object.entries(LEGS)) checkTemplate(`LEGS.${n}`, rows, 16);
  const pal = { ...PALETTE, ...colors } as Record<string, string>;
  paintSheet(scene, key, CHAR_W, CHAR_H, [
    withShadow(frame(DOWN, LEGS.idle, pal)),
    withShadow(frame(bob(DOWN), LEGS.idle, pal)),
    withShadow(frame(bob(DOWN), LEGS.walkA, pal)),
    withShadow(frame(bob(DOWN), LEGS.walkB, pal)),
    withShadow(frame(UP, LEGS.idle, pal)),
    withShadow(frame(bob(UP), LEGS.idle, pal)),
    withShadow(frame(bob(UP), LEGS.walkA, pal)),
    withShadow(frame(bob(UP), LEGS.walkB, pal)),
    withShadow(frame(SIDE, LEGS.sideIdle, pal)),
    withShadow(frame(bob(SIDE), LEGS.sideIdle, pal)),
    withShadow(frame(bob(SIDE), LEGS.sideA, pal)),
    withShadow(frame(bob(SIDE), LEGS.sideB, pal)),
  ]);
}

export function createExplorerAnims(scene: Phaser.Scene): void {
  (['down', 'up', 'side'] as const).forEach((f, i) => {
    const b = i * 4;
    const mk = (state: 'idle' | 'walk', frames: number[], frameRate: number) => {
      const key = explorerAnim(state, f);
      if (!scene.anims.exists(key)) scene.anims.create({ key, frames: frames.map((frame) => ({ key: EXPLORER_KEY, frame })), frameRate, repeat: -1 });
    };
    // Respiração lenta; passos A, parado, B, parado.
    mk('idle', [b, b + 1], 1.6);
    mk('walk', [b + 2, b, b + 3, b], 8);
  });
}
