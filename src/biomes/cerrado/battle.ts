import type { BattleProfile, Stats } from '../../data/battle';

// Perfis de batalha da fauna do Cerrado (tipos, stats base e 4 golpes de MOVES em src/data/battle.ts).

const S = (vigor: number, forca: number, defesa: number, agilidade: number): Stats => ({ vigor, forca, defesa, agilidade });

export const PROFILES: Record<string, BattleProfile> = {
  loboguara: { types: ['predador'], stats: S(80, 80, 55, 90), moves: ['bote', 'dentada', 'zigzague', 'olhar'] },
  tamandua: { types: ['predador'], stats: S(100, 85, 85, 30), moves: ['garrada', 'cavar', 'olhar', 'investida'] },
  tatucanastra: { types: ['reptil'], stats: S(100, 85, 105, 35), moves: ['cavar', 'garrada', 'casco', 'cabecada'] },
  seriema: { types: ['aereo', 'predador'], stats: S(65, 75, 55, 85), moves: ['bicada', 'garrada', 'zigzague', 'grito'] },
  ema: { types: ['aereo'], stats: S(90, 75, 65, 80), moves: ['investida', 'bicada', 'rajada', 'zigzague'] },
  canide: { types: ['aereo'], stats: S(60, 65, 60, 85), moves: ['bicada_azul', 'rasante', 'grito', 'rajada'] },
  tucano: { types: ['aereo'], stats: S(60, 70, 50, 70), moves: ['bicada', 'bicada_azul', 'grito', 'investida'] },
  patomergulhao: { types: ['aquatico', 'aereo'], stats: S(80, 85, 70, 100), moves: ['mergulho', 'correnteza', 'rajada', 'respirar'] },
  raposinha: { types: ['predador'], stats: S(55, 55, 50, 95), moves: ['dentada', 'zigzague', 'cavar', 'bote'] },
  jiboia: { types: ['reptil'], stats: S(75, 85, 60, 40), moves: ['constricao', 'bote_rept', 'espera', 'camuflagem'] },
  buraqueira: { types: ['aereo', 'predador'], stats: S(45, 50, 45, 80), moves: ['bicada', 'olhar', 'cavar', 'rajada'] },
  vagalume: { types: ['inseto'], stats: S(45, 40, 65, 85), moves: ['brilho', 'po', 'voo', 'investida'] },
};
