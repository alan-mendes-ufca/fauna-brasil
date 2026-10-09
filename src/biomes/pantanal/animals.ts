import { bite, burst, dust, slash, speed, splash, talons, type CombatSpec } from '../../art/animals/combat';
import type { Drawer } from '../../art/animals/kit';
import { araraazul, colhereiro, tuiuiu } from './birds';
import { capivara, anta, bugio, cervo, jaguatirica, quati } from './mammals';
import { dourado, jacare, piranha } from './aquatic';

export const DRAWERS: Record<string, Drawer> = { jacare, capivara, tuiuiu, araraazul, cervo, piranha, anta, quati, colhereiro, bugio, dourado, jaguatirica };

const swoop: [number, number, number, number][] = [[2, 40, 9, 40], [1, 46, 7, 46], [55, 42, 62, 42], [57, 48, 63, 48]];

export const COMBAT: Record<string, CombatSpec> = {
  jacare: { attack: { from: 3, xf: { s: 1.1, ay: 50 }, fx: (s) => speed(s, swoop) }, hurt: { head: [32, 40, 14] } },
  capivara: {
    attack: { from: 2, xf: { s: 1.08 }, fx: (s) => dust(s, [[8, 59], [56, 59], [4, 57], [60, 57]]) },
    hurt: { head: [32, 29, 14] },
  },
  tuiuiu: {
    attack: { from: 3, over: (s) => talons(s, 32, 56, 6, '#3A3640', '#1E1A24'), xf: { s: 1.05, ay: 40 }, fx: (s) => speed(s, swoop) },
    hurt: { from: 5, head: [34, 12, 8] },
  },
  araraazul: {
    attack: { from: 3, over: (s) => talons(s, 32, 50, 5, '#6E6678', '#2A2832'), xf: { s: 1.06 }, fx: (s) => speed(s, swoop) },
    hurt: { from: 5, head: [32, 20, 10] },
  },
  cervo: {
    attack: { from: 2, xf: { s: 1.1, sy: 1.04 }, fx: (s, T) => { const p = T([32, 8]); burst(s, p[0] - 10, p[1] + 2, 6); burst(s, p[0] + 10, p[1] + 2, 6); } },
    hurt: { head: [32, 21, 9] },
  },
  piranha: {
    attack: { from: 3, over: (s) => bite(s, 46, 40, 4, 2.4), xf: { s: 1.08, ay: 50 }, fx: (s) => splash(s, 30, 56, 20) },
    hurt: { head: [42, 38, 8] },
  },
  anta: {
    attack: { from: 2, xf: { s: 1.08, ay: 50 }, fx: (s) => dust(s, [[10, 59], [54, 59], [5, 57], [60, 57]]) },
    hurt: { head: [32, 25, 12] },
  },
  quati: {
    attack: { from: 3, over: (s) => bite(s, 32, 44, 3.4, 2, false), xf: { s: 1.1, ay: 40 }, fx: (s) => slash(s, 46, 8, 58, 22) },
    hurt: { head: [32, 29, 10] },
  },
  colhereiro: {
    attack: { from: 0, xf: { s: 1.08 }, fx: (s) => splash(s, 32, 56, 22) },
    hurt: { head: [38, 11, 7] },
  },
  bugio: {
    attack: { from: 3, xf: { s: 1.08, ay: 40 }, fx: (s) => speed(s, swoop) },
    hurt: { head: [32, 21, 10] },
  },
  dourado: {
    attack: { from: 3, xf: { s: 1.08, ay: 50 }, fx: (s) => splash(s, 30, 56, 22) },
    hurt: { head: [44, 32, 9] },
  },
  jaguatirica: {
    attack: { from: 3, xf: { s: 1.1, ay: 50 }, fx: (s, T) => { const p = T([10, 30]); slash(s, p[0] - 7, p[1] - 12, p[0] + 5, p[1] + 2); } },
    hurt: { head: [32, 23, 13] },
  },
};
