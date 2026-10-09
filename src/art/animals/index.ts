import { MODULE_COMBAT, MODULE_DRAWERS } from '../../biomes/fauna';
import type { Drawer } from './kit';
import { arara, harpia, morfo } from './birds';
import { boto } from './boto';
import { ararinha, asabranca, carcara, soldadinho } from './caatingaBirds';
import { moco, oncaparda, tatubola, veado } from './caatingaMammals';
import { cascavel, cururu, jandaira, teiu } from './caatingaOthers';
import { ariranha, onca, preguica, uacari } from './mammals';
import { perereca, poraque, sucuri, tracaja } from './reptiles';

export { Spr, N } from './kit';
export { blockDrawer, combatFrame } from './combat';
/** Um desenhista por espécie: (sprite, quadro 0–3); os quadros 4–5 saem de combat.ts. */
export const DRAWERS: Record<string, Drawer> = { onca, arara, boto, preguica, perereca, sucuri, uacari, harpia, ariranha, poraque, morfo, tracaja,
  ararinha, asabranca, carcara, soldadinho, tatubola, moco, oncaparda, veado,
  cascavel, teiu, cururu, jandaira, ...MODULE_DRAWERS };
/** Quadros de combate dos biomas de src/biomes/ (os da Amazônia e da Caatinga ficam em combat.ts). */
export const EXTRA_COMBAT = MODULE_COMBAT;
