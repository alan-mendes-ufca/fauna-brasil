import type { BattleProfile, Stats } from '../../data/battle';

// Perfis de batalha da fauna da Mata Atlântica (tipos, stats base e 4 golpes de MOVES em src/data/battle.ts).

const S = (vigor: number, forca: number, defesa: number, agilidade: number): Stats => ({ vigor, forca, defesa, agilidade });

export const PROFILES: Record<string, BattleProfile> = {
  micoleao: { types: ['arboricola'], stats: S(50, 55, 45, 95), moves: ['salto_galhos', 'rosto', 'dentada', 'zigzague'] },
  muriqui: { types: ['arboricola'], stats: S(105, 75, 80, 40), moves: ['agarrar', 'chuva', 'soneca', 'investida'] },
  tucanoverde: { types: ['aereo'], stats: S(60, 68, 50, 70), moves: ['bicada', 'bicada_azul', 'grito', 'investida'] },
  saira: { types: ['aereo'], stats: S(35, 40, 35, 100), moves: ['rajada', 'canto', 'bicada', 'voo'] },
  jacutinga: { types: ['aereo'], stats: S(80, 60, 65, 55), moves: ['bicada', 'rajada', 'grito', 'camuflagem'] },
  pingodeouro: { types: ['anfibio'], stats: S(40, 50, 50, 80), moves: ['secrecao', 'salto', 'camuflagem', 'investida'] },
  jararaca: { types: ['reptil'], stats: S(60, 90, 50, 70), moves: ['bote_veneno', 'bote_rept', 'camuflagem', 'espera'] },
  ourico: { types: ['arboricola'], stats: S(70, 55, 100, 30), moves: ['agarrar', 'investida', 'camuflagem', 'cavar'] },
  caranguejo: { types: ['aquatico'], stats: S(55, 70, 90, 40), moves: ['garrada', 'cavar', 'casco', 'correnteza'] },
  botocinza: { types: ['aquatico'], stats: S(75, 70, 55, 85), moves: ['mergulho', 'batida', 'ecoloc', 'respirar'] },
  cararoxa: { types: ['aereo'], stats: S(65, 70, 55, 80), moves: ['bicada', 'rasante', 'grito', 'canto'] },
  gralhaazul: { types: ['aereo'], stats: S(55, 60, 50, 85), moves: ['bicada_azul', 'rasante', 'grito', 'zigzague'] },
};
