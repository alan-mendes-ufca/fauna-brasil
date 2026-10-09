import type { BattleProfile, Stats } from '../../data/battle';

// Perfis de batalha da fauna do Pampa (tipos, stats base e 4 golpes de MOVES em src/data/battle.ts).

const S = (vigor: number, forca: number, defesa: number, agilidade: number): Stats => ({ vigor, forca, defesa, agilidade });

export const PROFILES: Record<string, BattleProfile> = {
  veadocampeiro: { types: ['arboricola'], stats: S(85, 60, 55, 95), moves: ['chifrada', 'zigzague', 'investida', 'olhar'] },
  graxaim: { types: ['predador'], stats: S(60, 65, 50, 85), moves: ['bote', 'dentada', 'zigzague', 'cavar'] },
  zorrilho: { types: ['predador'], stats: S(65, 55, 75, 45), moves: ['garrada', 'cavar', 'olhar', 'camuflagem'] },
  tucotuco: { types: ['predador'], stats: S(55, 55, 70, 45), moves: ['cavar', 'dentada', 'camuflagem', 'investida'] },
  gatopalheiro: { types: ['predador'], stats: S(60, 78, 50, 90), moves: ['bote', 'garrada', 'camuflagem', 'olhar'] },
  queroquero: { types: ['aereo'], stats: S(60, 65, 55, 85), moves: ['rasante', 'grito', 'rajada', 'bicada'] },
  joaodebarro: { types: ['aereo'], stats: S(50, 45, 85, 70), moves: ['bicada', 'cera', 'canto', 'rajada'] },
  cisne: { types: ['aquatico', 'aereo'], stats: S(85, 75, 65, 60), moves: ['batida', 'rajada', 'bicada', 'correnteza'] },
  mulita: { types: ['reptil'], stats: S(75, 55, 100, 40), moves: ['cavar', 'enrolar', 'casco', 'investida'] },
  ratao: { types: ['aquatico'], stats: S(80, 70, 55, 65), moves: ['mergulho', 'dentada', 'correnteza', 'respirar'] },
  cardeal: { types: ['aereo'], stats: S(55, 60, 55, 95), moves: ['canto', 'bicada', 'danca', 'rasante'] },
  sapinho: { types: ['anfibio'], stats: S(45, 50, 50, 70), moves: ['secrecao', 'salto', 'inchar', 'glandula'] },
};
