import { bite, burst, dust, type CombatSpec, slash, speed, talons, twinkles } from '../../art/animals/combat';
import type { Drawer } from '../../art/animals/kit';
import { buraqueira, canide, ema, patomergulhao, seriema, tucano } from './animalsBirds';
import { loboguara, raposinha, tamandua, tatucanastra } from './animalsMammals';
import { jiboia, vagalume } from './animalsOthers';

// Fauna do Cerrado na captura e na batalha: DRAWERS (quadros 0–3) e COMBAT (quadros 4 ataque e 5 dano).

export const DRAWERS: Record<string, Drawer> = {
  loboguara, tamandua, tatucanastra, seriema, ema, canide, tucano, patomergulhao, raposinha, jiboia, buraqueira, vagalume,
};

const swoop = (cy: number): [number, number, number, number][] => [[2, cy - 6, 9, cy - 6], [1, cy, 7, cy], [55, cy - 4, 62, cy - 4], [57, cy + 2, 63, cy + 2]];
const side = (cy: number): [number, number, number, number][] => [[50, cy - 6, 62, cy - 6], [52, cy, 63, cy], [50, cy + 6, 61, cy + 6]];

export const COMBAT: Record<string, CombatSpec> = {
  loboguara: {
    attack: { from: 3, over: (s) => bite(s, 32, 14, 3.4, 2.4, false), xf: { s: 1.1, ay: 50 }, fx: (s) => speed(s, swoop(44)) },
    hurt: { head: [32, 17, 9] },
  },
  tamandua: {
    attack: { from: 2, xf: { s: 1.08, dx: -2 }, fx: (s) => { slash(s, 2, 38, 14, 54); speed(s, side(40)); } },
    hurt: { head: [19, 31, 8] },
  },
  tatucanastra: {
    attack: { from: 1, xf: { s: 1.08, dx: -2 }, fx: (s) => { slash(s, 0, 40, 12, 58); dust(s, [[6, 60], [12, 61], [2, 58]]); } },
    hurt: { head: [16, 45, 8] },
  },
  seriema: {
    attack: { from: 3, xf: { s: 1.06, ay: 58 }, fx: (s) => { speed(s, swoop(30)); burst(s, 32, 54, 5); } },
    hurt: { from: 0, head: [32, 16, 8] },
  },
  ema: {
    attack: { from: 0, xf: { s: 1.08, dx: -3 }, fx: (s) => speed(s, side(36)) },
    hurt: { head: [13, 12, 5] },
  },
  canide: { attack: { from: 4, over: (s) => talons(s, 32, 49, 5, '#7A7088', '#2A2832'), xf: { s: 1.06 }, fx: (s) => speed(s, swoop(48)) }, hurt: { from: 5, head: [32, 20, 10] } },
  tucano: {
    attack: { from: 2, xf: { s: 1.08, dx: -3 }, fx: (s) => { speed(s, side(40)); burst(s, 8, 40, 5); } },
    hurt: { head: [29, 22, 8] },
  },
  patomergulhao: {
    attack: { from: 0, xf: { s: 1.1, dy: -2, dx: -2 }, fx: (s) => { speed(s, side(46)); twinkles(s, [[8, 40], [14, 36], [52, 40]], '#C8F6FF'); } },
    hurt: { head: [20, 28, 8] },
  },
  raposinha: {
    attack: { from: 3, over: (s) => bite(s, 32, 28, 3.6, 2.2, false), xf: { s: 1.1, ay: 50 }, fx: (s) => speed(s, swoop(44)) },
    hurt: { head: [32, 29, 10] },
  },
  jiboia: {
    attack: { from: 3, xf: { s: 1.1, ay: 50 }, fx: (s) => speed(s, swoop(26)) },
    hurt: { head: [32, 20, 10] },
  },
  buraqueira: { attack: { from: 4, over: (s) => talons(s, 32, 52, 5, '#D8CCA8', '#3A2C26', 0.9), xf: { s: 1.06 }, fx: (s) => speed(s, swoop(48)) }, hurt: { from: 5, head: [32, 26, 10] } },
  vagalume: {
    attack: { from: 3, xf: { s: 1.1, ay: 50 }, fx: (s) => twinkles(s, [[10, 24], [54, 24], [8, 44], [56, 44], [32, 8]], '#B8FF7A') },
    hurt: { head: [32, 41, 8] },
  },
};
