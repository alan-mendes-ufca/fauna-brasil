import type Phaser from 'phaser';
import { paintSheet } from './canvas';
import { SPECIES } from '../data/species';
import { blockDrawer, combatFrame, DRAWERS, EXTRA_COMBAT, Spr } from './animals/index';

// CONTRATO DOS ANIMAIS (tela de captura em primeira pessoa e batalha)
// Cada espécie tem o spritesheet `animal_<id>` com 6 quadros de ANIMAL_SIZE×ANIMAL_SIZE,
// o animal de frente/3-4 com os pés (ou a linha d'água) em ANIMAL_BASE:
//   0, 1  parado (respiração, piscar, bater de asas para quem voa)
//   2, 3  ação do comportamento (bote, pulo, mergulhado, descarga, recolhido no casco...)
//   4     ATAQUE: a investida da espécie, corpo projetado para a frente
//   5     DANO: recuo com olhos "><", corpo comprimido e inclinado, clarão, suor e estrelinhas
// A arte é procedural: src/art/animals/ (kit.ts = formas e sombreado; um arquivo por grupo de espécies;
// index.ts = DRAWERS por id; combat.ts = quadros 4–5 montados sobre os do desenhista).
// Espécie sem desenhista cai num bloco chapado com as cores dela (e ataque/dano derivados dele).

export const ANIMAL_SIZE = 64;
/** Linha (y) do quadro onde o animal toca o chão ou a água. */
export const ANIMAL_BASE = 58;
/** Quadros do spritesheet de cada animal. */
export const ANIMAL_FRAMES = { idle: [0, 1], action: [2, 3], attack: [4], hurt: [5] } as const;
export type AnimalState = keyof typeof ANIMAL_FRAMES;

export const animalKey = (id: string) => `animal_${id}`;
/**
 * Animações `animal-<id>-idle` (0–1) e `animal-<id>-action` (2–3), em loop;
 * `animal-<id>-attack` (4) e `animal-<id>-hurt` (5), de um quadro só.
 */
export const animalAnim = (id: string, state: AnimalState) => `animal-${id}-${state}`;

export function paintAnimals(scene: Phaser.Scene): void {
  for (const sp of SPECIES) {
    const [main, dark, light] = sp.colors;
    const draw = DRAWERS[sp.id];
    paintSheet(
      scene,
      animalKey(sp.id),
      ANIMAL_SIZE,
      ANIMAL_SIZE,
      [0, 1, 2, 3, 4, 5].map((i) => (p) => {
        if (i >= 4) {
          combatFrame(sp.id, draw ?? blockDrawer(main, light ?? main, dark ?? main), i as 4 | 5, EXTRA_COMBAT[sp.id]).emit(p);
        } else if (draw) {
          const spr = new Spr();
          draw(spr, i);
          spr.emit(p);
        } else {
          p.block(16, 22 - (i >= 2 ? 8 : i), 32, ANIMAL_BASE - 22, main, light ?? main, dark ?? main, '#0a0a0a');
        }
      }),
    );
  }
}

export function createAnimalAnims(scene: Phaser.Scene): void {
  for (const sp of SPECIES) {
    for (const state of Object.keys(ANIMAL_FRAMES) as AnimalState[]) {
      const key = animalAnim(sp.id, state);
      const frames = ANIMAL_FRAMES[state];
      if (!scene.anims.exists(key)) {
        scene.anims.create({
          key,
          frames: frames.map((frame) => ({ key: animalKey(sp.id), frame })),
          frameRate: 3,
          repeat: frames.length > 1 ? -1 : 0,
        });
      }
    }
  }
}
