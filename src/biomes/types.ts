import type { Painter } from '../art/canvas';
import type { Tileset } from '../art/forest';
import type { Habitat } from '../data/species';
import type { Region } from '../data/types';

// CONTRATO DOS BIOMAS EM src/biomes/<bioma>/
// Cada bioma novo (cerrado, pantanal, mata-atlantica, pampa) é uma pasta com arquivos de nomes fixos.
// Os registros compartilhados (TILESETS, PROPS, DRAWERS, REGIONS, captura, minimapa...) importam daqui;
// a pasta de um bioma não importa nada de outro bioma.
//
// Ambiente (chão, objetos, mapa, fundos de captura):
//   tiles.ts      export const TILESET: Tileset            (spritesheet `<bioma>_tiles`)
//   props.ts      export const PROPS: Record<string, PropSpec>; export const PAINTERS: Record<string, PropPainter>
//   habitats.ts   export const HABITATS: Habitat[]; export const DEFAULT_HABITAT: Habitat; export function markHabitats(ctx)
//   captureBg.ts  export const CAPTURE_BG: Partial<Record<Habitat, CaptureBgPainter>>
//   region.ts     export const REGION: Region
//   meta.ts       export const META: BiomeMeta
// Fauna:
//   species.ts    export const SPECIES: Species[]
//   animals.ts    export const DRAWERS: Record<string, Drawer>; export const COMBAT: Record<string, CombatSpec>
//   wildlife.ts   export const OW_DRAWERS: Record<string, OwDrawer>
//   battle.ts     export const PROFILES: Record<string, BattleProfile>

export type PropPainter = (p: Painter) => void;

/** Ajuda para marcar habitats nos tiles de uma região (ver `markHabitats`). */
export interface HabitatCtx {
  region: Region;
  ts: Tileset;
  w: number;
  h: number;
  /** Marca o habitat no tile (x, y) e, com `reach` > 0, num quadrado de raio `reach` em volta. */
  mark(x: number, y: number, habitat: Habitat, reach?: number): void;
}

/** Faixa de transição dentro de uma região (o minimapa mostra o nome quando o jogador está nela). */
export interface TransitionZone {
  name: string;
  /** Retângulo em tiles: x..x+w-1, y..y+h-1. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BiomeMeta {
  /** Cor do minimapa por caractere do mapa (todos os caracteres de TILESET.ground). */
  minimap: Record<string, string>;
  /** Entradas da legenda do minimapa próprias deste bioma (cor + texto curto). */
  legend: { c: string; t: string }[];
  /** Folhas/pétalas/sementes que caem na exploração: pares [claro, escuro]. */
  leafColors: string[][];
  /** Clima seco ou aberto: menos folhas caindo e sem vaga-lumes. */
  dry: boolean;
  /** Faixas de transição (ex.: mata de araucárias) dentro da região. */
  transitions: TransitionZone[];
  /** Mini-área (5 a 8 linhas, mesma largura) para a galeria de tiles (?gallery). */
  gallerySample: string[];
  /** Texto curto da galeria (ex.: "campo, vereda, buritis e trilha"). */
  galleryNote: string;
}
