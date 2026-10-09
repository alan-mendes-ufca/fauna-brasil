import type { Biome } from './species';

export interface TilePos {
  x: number;
  y: number;
}

/** Objeto do cenário (tipos em `src/art/forest.ts`), posicionado pelo tile da base esquerda. */
export interface PropPlacement extends TilePos {
  type: string;
}

/** Luz solta no cenário, em tiles (raio também em tiles). */
export interface LightDef extends TilePos {
  radius: number;
  color: number;
  intensity: number;
  /** Halo brilhante (bloom) no ponto da luz, com este raio em tiles. */
  glow?: number;
  /** Quantos "god rays" (faixas de luz diagonais) caem desta luz. */
  rays?: number;
}

/**
 * Saída da região: pisar num destes tiles leva (com fade) a outra região.
 * O retângulo vai de (x, y) a (x + w - 1, y + h - 1); os tiles precisam ser andáveis.
 */
export interface RegionExit extends TilePos {
  w?: number;
  h?: number;
  /** Id da região de destino. */
  to: string;
  /** Ponto de chegada na região de destino: nome em `places` ou tile. Não pode estar numa saída. */
  at: string | TilePos;
  /** Texto curto para a dica ao passar o mouse (ex.: "Caatinga"). */
  label?: string;
}

/** Aparência de um morador (cores do spritesheet `npc_<look>`, em src/art/npc.ts). */
export type NpcLook = 'vendedora' | 'pescador' | 'agricultora' | 'idoso' | 'menina' | 'guarda' | 'biologa';

/** Morador de uma vila. Ocupa (bloqueia) o próprio tile; o jogador conversa com ele ao clicar. */
export interface NpcDef extends TilePos {
  id: string;
  name: string;
  look: NpcLook;
  /** 'loja' abre a loja depois da fala; 'centro' abre o Centro de Conservação; 'ginasio' abre o desafio do ginásio. */
  role: 'loja' | 'centro' | 'ginasio' | 'morador';
  /** Falas, uma por conversa (em sequência, recomeçando no fim). */
  lines: string[];
  facing?: 'down' | 'up' | 'side';
}

/** Clareira da vila dentro da região (retângulo em tiles): nenhum animal aparece ali. */
export interface VillageZone extends TilePos {
  name: string;
  w: number;
  h: number;
  /** Colunas que o mapa original andou para a direita (vila a oeste): coordenadas antigas + shift. */
  shift: number;
}

/** Uma área explorável do jogo. */
export interface Region {
  id: string;
  name: string;
  /** Bioma: escolhe o conjunto de tiles (legenda do mapa) e as espécies que aparecem. */
  biome: Biome;
  /** Mapa em texto; legenda no tileset do bioma (`src/art/forest.ts`, `TILESETS`). Linhas do mesmo tamanho. */
  map: string[];
  props: PropPlacement[];
  lights: LightDef[];
  /** Cor da luz ambiente (o "escuro" sob a copa, ou a sombra do sol forte). */
  ambient: number;
  /** Névoa colorida das luzes (camada de brilho), 0..1; padrão 0.16. Sol forte e aberto pede menos. */
  spill?: number;
  spawn: TilePos;
  /** Pontos nomeados (praia, ponte...) para testes e para a navegação; `?at=nome` posiciona o jogador. */
  places?: Record<string, TilePos>;
  /** Passagens para outras regiões. */
  exits?: RegionExit[];
  /** Vila dentro da região (src/world/village.ts). */
  village?: VillageZone;
  npcs?: NpcDef[];
}
