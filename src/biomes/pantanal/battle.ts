import type { BattleProfile, Stats } from '../../data/battle';

const S = (vigor: number, forca: number, defesa: number, agilidade: number): Stats => ({ vigor, forca, defesa, agilidade });

/** Perfis de batalha da fauna do Pantanal (só golpes de MOVES em src/data/battle.ts). */
export const PROFILES: Record<string, BattleProfile> = {
  jacare: { types: ['reptil', 'aquatico'], stats: S(95, 95, 90, 40), moves: ['bote_rept', 'arrastar', 'batida', 'espera'] },
  capivara: { types: ['aquatico'], stats: S(100, 55, 80, 50), moves: ['investida', 'mergulho', 'dentada', 'camuflagem'] },
  tuiuiu: { types: ['aereo'], stats: S(75, 85, 60, 70), moves: ['bicada', 'rasante', 'rajada', 'olhar'] },
  araraazul: { types: ['aereo'], stats: S(80, 88, 68, 92), moves: ['bicada_azul', 'rasante', 'grito', 'rajada'] },
  cervo: { types: ['aquatico'], stats: S(88, 70, 62, 98), moves: ['chifrada', 'correnteza', 'zigzague', 'investida'] },
  piranha: { types: ['aquatico', 'predador'], stats: S(40, 88, 30, 85), moves: ['dentada', 'bote', 'cacada', 'mergulho'] },
  anta: { types: ['aquatico'], stats: S(105, 72, 98, 35), moves: ['investida', 'cabecada', 'respirar', 'mergulho'] },
  quati: { types: ['arboricola'], stats: S(55, 62, 45, 85), moves: ['salto_galhos', 'garrada', 'cavar', 'dentada'] },
  colhereiro: { types: ['aereo', 'aquatico'], stats: S(55, 52, 50, 82), moves: ['bicada', 'rajada', 'correnteza', 'olhar'] },
  bugio: { types: ['arboricola'], stats: S(72, 62, 60, 50), moves: ['salto_galhos', 'chuva', 'rugido', 'agarrar'] },
  dourado: { types: ['aquatico'], stats: S(68, 88, 52, 92), moves: ['mergulho', 'batida', 'correnteza', 'dentada'] },
  jaguatirica: { types: ['predador'], stats: S(66, 90, 55, 98), moves: ['bote', 'garrada', 'mordida', 'olhar'] },
};
