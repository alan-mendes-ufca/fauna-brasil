import type { Biome, Habitat } from './species';

// Biomas do jogo: nome, cor de destaque (caderno, minimapa) e ordem de apresentação.

export interface BiomeInfo {
  id: Biome;
  name: string;
  /** Cor de destaque do bioma (cabeçalhos do caderno, etiquetas). */
  color: string;
}

/** Ordem de apresentação (a mesma de SPECIES e da numeração do caderno). */
export const BIOMES: BiomeInfo[] = [
  { id: 'amazonia', name: 'Amazônia', color: '#2f8a4a' },
  { id: 'caatinga', name: 'Caatinga', color: '#c98a3e' },
  { id: 'cerrado', name: 'Cerrado', color: '#b8a03a' },
  { id: 'pantanal', name: 'Pantanal', color: '#3a8ab0' },
  { id: 'mata-atlantica', name: 'Mata Atlântica', color: '#2a9a7a' },
  { id: 'pampa', name: 'Pampa', color: '#8aa84a' },
];

export const biomeInfo = (id: Biome): BiomeInfo => BIOMES.find((b) => b.id === id)!;

export const HABITAT_LABEL: Record<Habitat, string> = {
  dossel: 'Dossel',
  'sub-bosque': 'Sub-bosque',
  chao: 'Chão da mata',
  agua: 'Rios e igarapés',
  praia: 'Praias de rio',
  'mata-seca': 'Mata seca',
  lajedo: 'Lajedos',
  acude: 'Açudes e riachos',
  campo: 'Campo cerrado',
  cerradao: 'Cerradão',
  vereda: 'Veredas e buritizais',
  alagado: 'Campos alagados',
  baia: 'Baías e rios',
  cordilheira: 'Cordilheiras (ilhas de mata)',
  'floresta-umida': 'Floresta úmida',
  araucaria: 'Mata de araucárias',
  mangue: 'Manguezal e restinga',
  'campo-nativo': 'Campo nativo',
  banhado: 'Banhados',
  butiazal: 'Butiazais e capões',
};
