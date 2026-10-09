import { ariranha, arara, boto, harpia, morfo, onca, perereca, poraque, preguica, sucuri, tracaja, uacari } from './amazonia';
import { ararinha, asabranca, carcara, cascavel, cururu, jandaira, moco, oncaparda, soldadinho, tatubola, teiu, veado } from './caatinga';
import { MODULE_OW_DRAWERS } from '../../biomes/fauna';
import type { OwDrawer } from './parts';

export type { OwDrawer } from './parts';
/** Um desenhista de exploração por espécie: (painter 32×32, quadro 0–3). */
export const OW_DRAWERS: Record<string, OwDrawer> = {
  onca, arara, boto, preguica, perereca, sucuri, uacari, harpia, ariranha, poraque, morfo, tracaja,
  tatubola, ararinha, asabranca, carcara, soldadinho, moco, oncaparda, veado, cascavel, teiu, cururu, jandaira,
  ...MODULE_OW_DRAWERS,
};
