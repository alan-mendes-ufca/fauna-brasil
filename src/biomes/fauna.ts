import type { CombatSpec } from '../art/animals/combat';
import type { Drawer } from '../art/animals/kit';
import type { OwDrawer } from '../art/wildlife/parts';
import * as cerrado from './cerrado/animals';
import { OW_DRAWERS as cerradoOw } from './cerrado/wildlife';
import * as mata from './mata-atlantica/animals';
import { OW_DRAWERS as mataOw } from './mata-atlantica/wildlife';
import * as pampa from './pampa/animals';
import { OW_DRAWERS as pampaOw } from './pampa/wildlife';
import * as pantanal from './pantanal/animals';
import { OW_DRAWERS as pantanalOw } from './pantanal/wildlife';

// Registro da arte da fauna dos biomas de src/biomes/ (contrato em ./types.ts).

export const MODULE_DRAWERS: Record<string, Drawer> = { ...cerrado.DRAWERS, ...pantanal.DRAWERS, ...mata.DRAWERS, ...pampa.DRAWERS };
export const MODULE_COMBAT: Record<string, CombatSpec> = { ...cerrado.COMBAT, ...pantanal.COMBAT, ...mata.COMBAT, ...pampa.COMBAT };
export const MODULE_OW_DRAWERS: Record<string, OwDrawer> = { ...cerradoOw, ...pantanalOw, ...mataOw, ...pampaOw };
