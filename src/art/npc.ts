import type Phaser from 'phaser';
import type { NpcLook } from '../data/types';
import { paintExplorer, type Facing } from './explorer';

// MORADORES DAS VILAS
// Mesmo corpo do explorador (16×24, quadros na mesma ordem), com outras cores: chapéu ou lenço,
// cabelo, pele, roupa. A "mochila" do explorador vira parte da roupa. Spritesheet `npc_<look>`.

const SHIRT = (o: string, O: string, d: string, r: string) => ({ o, O, d, r, y: d, Y: d, Z: O, w: o, W: O, t: d, j: d });

const LOOKS: Record<NpcLook, Partial<Record<string, string>>> = {
  // lenço vermelho na cabeça, blusa clara e saia azul
  vendedora: {
    H: '#c83a2e', h: '#e85a4a', g: '#8a2418', b: '#f2d050', c: '#1a0e0a', C: '#3a2418', s: '#8a5232', S: '#6a3a20', n: '#a86a42',
    ...SHIRT('#efe2c4', '#fff6e0', '#c8b896', '#e8d0a0'), p: '#3a5a8a', P: '#2a4068', q: '#5a7aaa', f: '#3a2410', F: '#5a3a20',
  },
  // chapéu de palha, camisa listrada azul
  pescador: {
    H: '#d8c070', h: '#f2dc94', g: '#a88a3a', b: '#3a5a8a', s: '#c88a5a', S: '#9a6038', n: '#e0a070',
    ...SHIRT('#3a6aa8', '#5a8ac8', '#2a4a7a', '#8ab0e0'), p: '#c8b896', P: '#9a8a6a', q: '#e0d4b4', f: '#5a3a1e', F: '#7a5a32',
  },
  // chapéu de palha largo, camisa xadrez vermelha
  agricultora: {
    H: '#e8c86a', h: '#f8e0a0', g: '#b89040', b: '#7a3a24', c: '#5a2a14', C: '#7a4024', s: '#a86a42', S: '#7a4a28', n: '#c88a5a',
    ...SHIRT('#a83a2e', '#c85a4a', '#7a2418', '#e8a090'), p: '#3a4a6a', P: '#2a3450', q: '#5a6a8a',
  },
  // chapéu claro, cabelo grisalho, guayabera branca
  idoso: {
    H: '#e8e0d0', h: '#fbf5e8', g: '#b8b0a0', b: '#4a3a2a', c: '#a0a0a0', C: '#d0d0d0', s: '#9a6a48', S: '#7a4a30', n: '#b88a62',
    ...SHIRT('#e8e0c8', '#fbf5e2', '#c0b498', '#f8f0dc'), p: '#6a4a2a', P: '#4a3018', q: '#8a6a42',
  },
  // sem chapéu: o "chapéu" vira o cabelo preso; vestido rosa
  menina: {
    H: '#2a1810', h: '#4a2a1a', g: '#1a0e0a', b: '#e8507a', c: '#2a1810', C: '#4a2a1a', s: '#b9784c', S: '#8c5232', n: '#d99c6a',
    ...SHIRT('#e87aa0', '#f8a8c4', '#b84a74', '#fcd0e0'), p: '#e87aa0', P: '#b84a74', q: '#f8a8c4',
  },
  // guarda-parque: farda cáqui e chapéu verde
  guarda: {
    H: '#4a6a2a', h: '#6a8a3a', g: '#2a4a1a', b: '#d8a020', s: '#7a4a2a', S: '#5a3018', n: '#9a6a42',
    ...SHIRT('#8a7a42', '#aa9a5a', '#5a4e24', '#c8b878'), p: '#5a4e24', P: '#3a3214', q: '#7a6a3a',
  },
};

export const NPC_LOOKS = Object.keys(LOOKS) as NpcLook[];
export const npcKey = (look: NpcLook) => `npc_${look}`;
/** Quadro parado de cada direção (mesma ordem do explorador: baixo 0, cima 4, lado 8). */
export const npcFrame = (f: Facing) => ({ down: 0, up: 4, side: 8 })[f];
export const npcIdleAnim = (look: NpcLook, f: Facing) => `${npcKey(look)}-idle-${f}`;

export function paintNpcs(scene: Phaser.Scene): void {
  for (const look of NPC_LOOKS) {
    const key = npcKey(look);
    paintExplorer(scene, key, LOOKS[look]);
    (['down', 'up', 'side'] as const).forEach((f) => {
      const b = npcFrame(f);
      const anim = npcIdleAnim(look, f);
      if (!scene.anims.exists(anim)) scene.anims.create({ key: anim, frames: [b, b + 1].map((frame) => ({ key, frame })), frameRate: 1.4, repeat: -1 });
    });
  }
}
