import type { CaptureBgPainter } from '../art/captureBg';
import type { PropSpec, Tileset } from '../art/forest';
import type { Biome, Habitat } from '../data/species';
import type { Region } from '../data/types';
import type { BiomeMeta, HabitatCtx, PropPainter } from './types';
import * as cerradoBg from './cerrado/captureBg';
import * as cerradoHab from './cerrado/habitats';
import { META as cerradoMeta } from './cerrado/meta';
import * as cerradoProps from './cerrado/props';
import { REGION as cerradoRegion } from './cerrado/region';
import { TILESET as cerradoTiles } from './cerrado/tiles';
import * as mataBg from './mata-atlantica/captureBg';
import * as mataHab from './mata-atlantica/habitats';
import { META as mataMeta } from './mata-atlantica/meta';
import * as mataProps from './mata-atlantica/props';
import { REGION as mataRegion } from './mata-atlantica/region';
import { TILESET as mataTiles } from './mata-atlantica/tiles';
import * as pampaBg from './pampa/captureBg';
import * as pampaHab from './pampa/habitats';
import { META as pampaMeta } from './pampa/meta';
import * as pampaProps from './pampa/props';
import { REGION as pampaRegion } from './pampa/region';
import { TILESET as pampaTiles } from './pampa/tiles';
import * as pantanalBg from './pantanal/captureBg';
import * as pantanalHab from './pantanal/habitats';
import { META as pantanalMeta } from './pantanal/meta';
import * as pantanalProps from './pantanal/props';
import { REGION as pantanalRegion } from './pantanal/region';
import { TILESET as pantanalTiles } from './pantanal/tiles';

// Registro do ambiente dos biomas de src/biomes/ (contrato em ./types.ts).
// Amazônia e Caatinga continuam em src/art/ e src/data/regions/.

export type ModuleBiome = Exclude<Biome, 'amazonia' | 'caatinga'>;

interface EnvModule {
  biome: ModuleBiome;
  tileset: Tileset;
  props: Record<string, PropSpec>;
  painters: Record<string, PropPainter>;
  habitats: readonly Habitat[];
  defaultHabitat: Habitat;
  markHabitats(ctx: HabitatCtx): void;
  captureBg: Partial<Record<Habitat, CaptureBgPainter>>;
  region: Region;
  meta: BiomeMeta;
}

const mod = (
  biome: ModuleBiome,
  tileset: Tileset,
  props: { PROPS: Record<string, PropSpec>; PAINTERS: Record<string, PropPainter> },
  hab: { HABITATS: readonly Habitat[]; DEFAULT_HABITAT: Habitat; markHabitats(ctx: HabitatCtx): void },
  bg: { CAPTURE_BG: Partial<Record<Habitat, CaptureBgPainter>> },
  region: Region,
  meta: BiomeMeta,
): EnvModule => ({
  biome,
  tileset,
  props: props.PROPS,
  painters: props.PAINTERS,
  habitats: hab.HABITATS,
  defaultHabitat: hab.DEFAULT_HABITAT,
  markHabitats: hab.markHabitats,
  captureBg: bg.CAPTURE_BG,
  region,
  meta,
});

export const ENV_MODULES: EnvModule[] = [
  mod('cerrado', cerradoTiles, cerradoProps, cerradoHab, cerradoBg, cerradoRegion, cerradoMeta),
  mod('pantanal', pantanalTiles, pantanalProps, pantanalHab, pantanalBg, pantanalRegion, pantanalMeta),
  mod('mata-atlantica', mataTiles, mataProps, mataHab, mataBg, mataRegion, mataMeta),
  mod('pampa', pampaTiles, pampaProps, pampaHab, pampaBg, pampaRegion, pampaMeta),
];

export const envOf = (biome: Biome): EnvModule | undefined => ENV_MODULES.find((m) => m.biome === biome);
