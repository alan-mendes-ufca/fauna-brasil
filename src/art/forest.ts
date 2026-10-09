import type Phaser from 'phaser';
import type { Biome } from '../data/species';
import { paint, type Painter } from './canvas';
import { buildTileSheet, tileFramesFor, tileOverlaysFor, TILE_FRAME_NAMES } from './forestTiles';
import { PROP_PAINTERS } from './forestProps';
import { CAATINGA_GROUND, CAATINGA_TILES_KEY, buildCaatingaSheet, caatingaFrames, caatingaOverlays, CAATINGA_FRAME_NAMES } from './caatingaTiles';
import { CAATINGA_PROPS, CAATINGA_PAINTERS } from './caatingaProps';
import { ENV_MODULES } from '../biomes/env';
import { VILLAGE_PAINTERS, VILLAGE_PROPS } from './village';

// CONTRATO DE ARTE DA FLORESTA
// As assinaturas e chaves abaixo são usadas pela cena de exploração. A arte pode ser
// redesenhada à vontade desde que elas continuem iguais. A arte em si fica em forestTiles.ts e forestProps.ts.

/**
 * Legenda do mapa em texto (uma letra por tile de 16×16):
 *   #  mata fechada (sólido, contorna a área)
 *   .  chão de folhas
 *   ,  trilha de terra
 *   "  sub-bosque alto (andável; onde os animais aparecem)
 *   ~  água do igarapé (sólido)
 *   =  ponte de madeira (andável)
 *   _  margem de areia e lama (andável)
 */
export const GROUND = ['#', '.', ',', '"', '~', '=', '_'] as const;
export type GroundChar = (typeof GROUND)[number];

export const SOLID_GROUND: ReadonlySet<string> = new Set(['#', '~']);

/** Spritesheet com todos os quadros de chão (16×16). */
export const TILES_KEY = 'forest_tiles';

/** Gera os spritesheets de chão de todos os biomas (`forest_tiles`, `caatinga_tiles`...). */
export function paintForestTiles(scene: Phaser.Scene): void {
  buildTileSheet(scene, TILES_KEY);
  for (const t of Object.values(TILESETS)) t.paint(scene);
}

/**
 * Quadros do tile (x, y) do mapa, já considerando os vizinhos (bordas da água, da trilha etc.).
 * Um quadro: tile estático. Vários: animação em loop (ex.: água), tocada a `TILE_ANIM_FPS`.
 */
export function tileFrames(map: string[], x: number, y: number): number[] {
  return tileFramesFor(map, x, y);
}

export const TILE_ANIM_FPS = 4;

// CONTRATO DE CHÃO POR BIOMA
// Cada região declara o bioma; o bioma escolhe o tileset (legenda do mapa, colisão e quadros).
// A Amazônia usa a legenda acima; a da Caatinga está em src/art/caatingaTiles.ts.

export interface Tileset {
  /** Spritesheet com os quadros 16×16. */
  key: string;
  /** Caracteres válidos no mapa. */
  ground: readonly string[];
  /** Caracteres sólidos (o jogador não anda). */
  solid: ReadonlySet<string>;
  /** Água aberta: onde nadam os animais aquáticos. */
  water: ReadonlySet<string>;
  /** Vegetação alta (esconderijo de bichos pequenos). */
  brush: ReadonlySet<string>;
  /** Quadros do tile (vários = animação a TILE_ANIM_FPS). */
  frames(map: string[], x: number, y: number): number[];
  /** Quadros estáticos desenhados por cima do chão (franjas, bordas); só em tiles não animados. */
  overlays(map: string[], x: number, y: number): number[];
  /** Nome de cada quadro (galeria). */
  frameNames: readonly string[];
  /** Gera o spritesheet (idempotente). */
  paint(scene: Phaser.Scene): void;
}

export const TILESETS: Record<Biome, Tileset> = {
  amazonia: {
    key: TILES_KEY,
    ground: GROUND,
    solid: SOLID_GROUND,
    water: new Set(['~']),
    brush: new Set(['"']),
    frames: tileFramesFor,
    overlays: tileOverlaysFor,
    frameNames: TILE_FRAME_NAMES,
    paint: (scene) => buildTileSheet(scene, TILES_KEY),
  },
  caatinga: {
    key: CAATINGA_TILES_KEY,
    ground: CAATINGA_GROUND,
    solid: new Set(['#', '%', '~']),
    water: new Set(['~']),
    brush: new Set(['"']),
    frames: caatingaFrames,
    overlays: caatingaOverlays,
    frameNames: CAATINGA_FRAME_NAMES,
    paint: buildCaatingaSheet,
  },
  ...(Object.fromEntries(ENV_MODULES.map((m) => [m.biome, m.tileset])) as Record<(typeof ENV_MODULES)[number]['biome'], Tileset>),
};

export const tilesetFor = (biome: Biome): Tileset => TILESETS[biome];

/** Luz própria de um objeto, relativa ao canto inferior esquerdo da sua textura, em pixels. */
export interface PropLight {
  dx: number;
  dy: number;
  radius: number;
  color: number;
  intensity: number;
  flicker?: 'fire' | 'candle';
}

export interface PropSpec {
  /** Tamanho da textura em pixels. */
  w: number;
  h: number;
  /** Base sólida em tiles: ocupa as colunas x..x+fw-1 e as linhas y-fh+1..y a partir do tile de posição. */
  fw: number;
  fh: number;
  /** Sem colisão (flores, folhagem rasteira, vitória-régia). */
  walkable?: boolean;
  /** Copa alta: fica translúcida quando o jogador passa por trás. */
  canopy?: boolean;
  light?: PropLight;
}

/**
 * Objetos da floresta (os da Caatinga ficam em src/art/caatingaProps.ts). A textura de cada um é `prop_<tipo>`, apoiada no fundo do tile de posição
 * e centrada na largura da base (fw tiles a partir do tile de posição); a profundidade é a base.
 */
const FOREST_PROPS: Record<string, PropSpec> = {
  // placas de trilha nas saídas entre regiões (seta para a direita / para a esquerda)
  placa: { w: 16, h: 32, fw: 1, fh: 1 },
  placa_esq: { w: 16, h: 32, fw: 1, fh: 1 },
  sumauma: { w: 64, h: 96, fw: 2, fh: 1, canopy: true },
  acai: { w: 32, h: 64, fw: 1, fh: 1, canopy: true },
  arvore: { w: 48, h: 64, fw: 1, fh: 1, canopy: true },
  samambaia: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
  bromelia: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
  heliconia: { w: 16, h: 32, fw: 1, fh: 1 },
  cogumelo: { w: 16, h: 16, fw: 1, fh: 1, walkable: true, light: { dx: 8, dy: -6, radius: 28, color: 0x3affd8, intensity: 0.8 } },
  tronco: { w: 32, h: 16, fw: 2, fh: 1 },
  pedra: { w: 16, h: 16, fw: 1, fh: 1 },
  cupinzeiro: { w: 16, h: 32, fw: 1, fh: 1 },
  vitoria_regia: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
  // Objetos extras (a textura é centrada na base: o centro horizontal da textura = centro da base).
  cipo: { w: 16, h: 32, fw: 1, fh: 1, walkable: true, canopy: true },
  raiz: { w: 32, h: 16, fw: 2, fh: 1, walkable: true },
  flores: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
  folhagem: { w: 16, h: 16, fw: 1, fh: 1, walkable: true },
  // Variedade da mata (polimento): tamanhos e silhuetas diferentes para a floresta não virar papel de parede.
  arvore_larga: { w: 64, h: 80, fw: 2, fh: 1, canopy: true },
  arvore_alta: { w: 48, h: 88, fw: 1, fh: 1, canopy: true },
  arvore_jovem: { w: 32, h: 40, fw: 1, fh: 1, canopy: true },
  embauba: { w: 32, h: 72, fw: 1, fh: 1, canopy: true },
  castanheira: { w: 80, h: 120, fw: 2, fh: 1, canopy: true },
};

/** Todos os objetos: os da floresta, os da Caatinga (e da transição: cocais e cerrado), os das vilas e os dos biomas de src/biomes/. */
export const PROPS: Record<string, PropSpec> = { ...FOREST_PROPS, ...CAATINGA_PROPS, ...VILLAGE_PROPS, ...Object.assign({}, ...ENV_MODULES.map((m) => m.props)) };
const MODULE_PAINTERS: Record<string, (p: Painter) => void> = Object.assign({}, ...ENV_MODULES.map((m) => m.painters));

export const propKey = (type: string) => `prop_${type}`;

/** Gera as texturas `prop_<tipo>` de todos os objetos de `PROPS`. */
export function paintForestProps(scene: Phaser.Scene): void {
  for (const [type, s] of Object.entries(PROPS)) {
    const draw = PROP_PAINTERS[type] ?? CAATINGA_PAINTERS[type] ?? VILLAGE_PAINTERS[type] ?? MODULE_PAINTERS[type];
    // Objeto ainda sem desenho: bloco provisório, para o mapa poder usá-lo antes da arte.
    paint(scene, propKey(type), s.w, s.h, (p) => (draw ? draw(p) : p.block(0, 0, s.w, s.h, '#1e5a2a', '#3a8a3a', '#0e3a1a', '#0a1a10')));
  }
}
