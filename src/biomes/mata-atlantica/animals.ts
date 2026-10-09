import { burst, dust, type CombatSpec, slash, speed, splash, talons, twinkles } from '../../art/animals/combat';
import type { Drawer } from '../../art/animals/kit';
import { cararoxa, gralhaazul, jacutinga, saira, tucanoverde } from './animalsBirds';
import { micoleao, muriqui, ourico } from './animalsMammals';
import { botocinza, caranguejo, jararaca, pingodeouro } from './animalsOthers';

// Fauna da Mata Atlântica na captura e na batalha: DRAWERS (quadros 0–3) e COMBAT (quadros 4 ataque e 5 dano).

export const DRAWERS: Record<string, Drawer> = {
  micoleao, muriqui, tucanoverde, saira, jacutinga, pingodeouro, jararaca, ourico, caranguejo, botocinza, cararoxa, gralhaazul,
};

const swoop = (cy: number): [number, number, number, number][] => [[2, cy - 6, 9, cy - 6], [1, cy, 7, cy], [55, cy - 4, 62, cy - 4], [57, cy + 2, 63, cy + 2]];
const side = (cy: number): [number, number, number, number][] => [[50, cy - 6, 62, cy - 6], [52, cy, 63, cy], [50, cy + 6, 61, cy + 6]];

export const COMBAT: Record<string, CombatSpec> = {
  micoleao: {
    attack: { from: 3, xf: { s: 1.1, ay: 50 }, fx: (s) => { speed(s, swoop(34)); burst(s, 32, 54, 5); } },
    hurt: { from: 0, head: [32, 28, 13] },
  },
  muriqui: {
    attack: { from: 2, xf: { s: 1.06, dx: -2 }, fx: (s) => { speed(s, side(30)); slash(s, 4, 10, 16, 30); } },
    hurt: { from: 0, head: [32, 17, 10] },
  },
  tucanoverde: {
    attack: { from: 2, xf: { s: 1.08, dx: -3 }, fx: (s) => { speed(s, side(32)); burst(s, 8, 36, 5); } },
    hurt: { head: [34, 21, 8] },
  },
  saira: {
    attack: { from: 4, over: (s) => talons(s, 32, 50, 4, '#7A7088', '#2A2832', 0.7), xf: { s: 1.08 }, fx: (s) => speed(s, swoop(44)) },
    hurt: { from: 5, head: [32, 22, 9] },
  },
  jacutinga: {
    attack: { from: 3, xf: { s: 1.08, dx: -2 }, fx: (s) => { speed(s, side(40)); dust(s, [[6, 60], [12, 61]]); } },
    hurt: { from: 0, head: [46, 15, 7] },
  },
  pingodeouro: {
    attack: { from: 3, xf: { s: 1.1, ay: 50 }, fx: (s) => { speed(s, swoop(44)); twinkles(s, [[10, 24], [54, 24], [8, 44], [56, 44]], '#FFE070'); } },
    hurt: { head: [32, 34, 10] },
  },
  jararaca: {
    attack: { from: 3, xf: { s: 1.1, ay: 50 }, fx: (s) => speed(s, swoop(26)) },
    hurt: { head: [32, 20, 10] },
  },
  ourico: {
    attack: { from: 3, xf: { s: 1.06, dx: -2 }, fx: (s) => { speed(s, side(40)); twinkles(s, [[56, 22], [60, 34]], '#F0E2A8'); } },
    hurt: { from: 0, head: [46, 44, 9] },
  },
  caranguejo: {
    attack: { from: 3, xf: { s: 1.08, dx: -2 }, fx: (s) => { slash(s, 6, 8, 18, 24); dust(s, [[6, 60], [58, 60]]); } },
    hurt: { head: [32, 26, 9] },
  },
  botocinza: {
    attack: { from: 0, xf: { s: 1.1, dy: -2, dx: -2 }, fx: (s) => { splash(s, 30, 58, 22); speed(s, side(40)); } },
    hurt: { head: [37, 22, 9] },
  },
  cararoxa: {
    attack: { from: 4, over: (s) => talons(s, 32, 50, 5, '#7A7088', '#2A2832'), xf: { s: 1.06 }, fx: (s) => speed(s, swoop(48)) },
    hurt: { from: 5, head: [32, 20, 10] },
  },
  gralhaazul: {
    attack: { from: 4, over: (s) => talons(s, 32, 50, 5, '#2E2C34', '#16141C'), xf: { s: 1.06 }, fx: (s) => speed(s, swoop(48)) },
    hurt: { from: 5, head: [32, 20, 10] },
  },
};
