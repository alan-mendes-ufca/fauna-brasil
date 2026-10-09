import { bite, burst, dust, type CombatSpec, slash, speed, splash, twinkles } from '../../art/animals/combat';
import type { Drawer } from '../../art/animals/kit';
import { cardeal, cisne, joaodebarro, queroquero } from './animalsBirds';
import { gatopalheiro, graxaim, mulita, ratao, tucotuco, veadocampeiro, zorrilho } from './animalsMammals';
import { sapinho } from './animalsOthers';

// Fauna do Pampa na captura e na batalha: DRAWERS (quadros 0–3) e COMBAT (quadros 4 ataque e 5 dano).

export const DRAWERS: Record<string, Drawer> = {
  veadocampeiro, graxaim, zorrilho, tucotuco, gatopalheiro, queroquero, joaodebarro, cisne, mulita, ratao, cardeal, sapinho,
};

const swoop = (cy: number): [number, number, number, number][] => [[2, cy - 6, 9, cy - 6], [1, cy, 7, cy], [55, cy - 4, 62, cy - 4], [57, cy + 2, 63, cy + 2]];
const side = (cy: number): [number, number, number, number][] => [[50, cy - 6, 62, cy - 6], [52, cy, 63, cy], [50, cy + 6, 61, cy + 6]];

export const COMBAT: Record<string, CombatSpec> = {
  veadocampeiro: {
    attack: { from: 2, xf: { s: 1.1, sy: 1.04 }, fx: (s, T) => { const p = T([32, 8]); burst(s, p[0] - 10, p[1] + 2, 6); burst(s, p[0] + 10, p[1] + 2, 6); } },
    hurt: { head: [32, 19, 7] },
  },
  graxaim: {
    attack: { from: 3, over: (s) => bite(s, 32, 29, 3.4, 2.4, false), xf: { s: 1.1, ay: 50 }, fx: (s) => speed(s, swoop(44)) },
    hurt: { head: [32, 28, 9] },
  },
  zorrilho: {
    attack: { from: 3, xf: { s: 1.1 }, fx: (s) => { dust(s, [[6, 59], [58, 59]]); burst(s, 10, 36, 5, '#C8F060', '#6A9A2A'); } },
    hurt: { head: [32, 33, 9] },
  },
  tucotuco: {
    attack: { from: 3, xf: { s: 1.12, ay: 52 }, fx: (s) => dust(s, [[6, 58], [58, 58], [10, 54], [54, 54]]) },
    hurt: { head: [32, 36, 10] },
  },
  gatopalheiro: {
    attack: { from: 3, xf: { s: 1.1, ay: 50 }, fx: (s, T) => { const p = T([14, 34]); slash(s, p[0] - 7, p[1] - 12, p[0] + 5, p[1] + 2); speed(s, swoop(44).slice(2)); } },
    hurt: { head: [32, 28, 9] },
  },
  queroquero: {
    attack: { from: 2, xf: { s: 1.06, ay: 40 }, fx: (s) => { speed(s, swoop(40)); burst(s, 32, 56, 5); } },
    hurt: { from: 0, head: [32, 21, 7] },
  },
  joaodebarro: {
    attack: { from: 3, xf: { s: 1.1, ay: 48 }, fx: (s) => speed(s, side(40)) },
    hurt: { head: [32, 20, 7] },
  },
  cisne: {
    attack: { from: 3, xf: { s: 1.06, dx: 2 }, fx: (s) => splash(s, 34, 56, 26) },
    hurt: { head: [15, 20, 5] },
  },
  mulita: {
    attack: { from: 0, xf: { s: 1.08 }, fx: (s) => { slash(s, 6, 40, 16, 56); dust(s, [[6, 60], [58, 60], [14, 62]]); } },
    hurt: { head: [32, 48, 8] },
  },
  ratao: {
    attack: { from: 0, over: (s) => bite(s, 32, 48, 4.2, 2.6, true), xf: { s: 1.1, dy: -2 }, fx: (s) => splash(s, 32, 56, 22) },
    hurt: { head: [32, 38, 10] },
  },
  cardeal: {
    attack: { from: 2, xf: { s: 1.08, ay: 40 }, fx: (s) => { speed(s, swoop(36)); twinkles(s, [[8, 20], [56, 22], [10, 50], [54, 50]], '#FFF08A'); } },
    hurt: { from: 0, head: [32, 22, 7] },
  },
  sapinho: {
    attack: { from: 3, over: (s) => bite(s, 32, 31, 6, 2.4, false), xf: { s: 1.1, ay: 50 }, fx: (s) => dust(s, [[8, 59], [56, 59], [4, 57], [60, 57]]) },
    hurt: { head: [32, 37, 11] },
  },
};
