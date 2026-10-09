import type Phaser from 'phaser';
import { paintSheet } from './canvas';
import { SPECIES } from '../data/species';
import { OW_DRAWERS } from './wildlife/index';

// CONTRATO DOS ANIMAIS NA EXPLORAÇÃO (vista de cima 3/4, como o explorador)
// Cada espécie tem o spritesheet `ow_<id>` com 4 quadros de OW_SIZE×OW_SIZE, olhando para a DIREITA
// (a cena espelha com flipX), com as patas/base em OW_BASE:
//   0, 1  parado (respiração; aves e borboleta batendo asas no lugar)
//   2, 3  andando / voando / nadando
// Animais de água podem mostrar só cabeça e dorso na superfície.
// Escala coerente com o explorador (16×24): pequenos ~10–14 px, médios ~16–22, grandes ~24–30.
// A arte é procedural: src/art/wildlife/ (kit.ts = formas e sombreado em 32 px; parts.ts = quadrúpede,
// ave em voo, sombra e ondulação; um arquivo por bioma; index.ts = OW_DRAWERS por id).
// Espécie sem desenhista cai numa bolinha com as cores dela.

export const OW_SIZE = 32;
export const OW_BASE = 28;

export const owKey = (id: string) => `ow_${id}`;
/** Animações `ow-<id>-idle` (0–1) e `ow-<id>-move` (2–3), em loop. */
export const owAnim = (id: string, state: 'idle' | 'move') => `ow-${id}-${state}`;

export function paintWildlife(scene: Phaser.Scene): void {
  for (const sp of SPECIES) {
    const [main, dark] = sp.colors;
    const r = sp.size === 'grande' ? 9 : sp.size === 'medio' ? 6 : 4;
    paintSheet(
      scene,
      owKey(sp.id),
      OW_SIZE,
      OW_SIZE,
      [0, 1, 2, 3].map((i) => (p) => {
        const draw = OW_DRAWERS[sp.id];
        if (draw) draw(p, i);
        else p.block(16 - r, OW_BASE - 2 * r - (i % 2), 2 * r, 2 * r, main, main, dark ?? main, '#0a0a0a');
      }),
    );
  }
}

export function createWildlifeAnims(scene: Phaser.Scene): void {
  for (const sp of SPECIES) {
    for (const [state, frames] of [['idle', [0, 1]], ['move', [2, 3]]] as const) {
      const key = owAnim(sp.id, state);
      if (!scene.anims.exists(key)) {
        scene.anims.create({ key, frames: frames.map((frame) => ({ key: owKey(sp.id), frame })), frameRate: 4, repeat: -1 });
      }
    }
  }
}
