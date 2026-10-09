import { PROPS, tilesetFor } from '../art/forest';
import type { Region, TilePos } from '../data/types';
import { ENV_MODULES, envOf } from '../biomes/env';
import { OPEN_WATER, SPECIES, type Biome, type Habitat, type Rarity, type Species } from '../data/species';
import { LURE_FACTOR } from '../data/items';
import { bag } from '../state/bag';

// Habitats do mapa e sorteio de espécies. Cada tile recebe uma máscara de habitats (um tile pode
// ser de vários: chão perto da água e sob uma copa, por exemplo); o bioma da região decide quais.

/** Peso de sorteio de cada raridade. */
export const RARITY_WEIGHT: Record<Rarity, number> = { comum: 50, incomum: 30, rara: 15, lendaria: 5 };
/** Animais grandes aparecem menos. */
const SIZE_WEIGHT = { pequeno: 1, medio: 1, grande: 0.45 } as const;

/** Distância (em tiles) até a água, a praia ou uma copa para o tile contar como desse habitat. */
const WATER_REACH = 3;
const SHORE_REACH = 2;
const CANOPY_REACH = 2;
const ROCK_REACH = 1;
const POND_REACH = 2;

const BASE_HABITATS: Habitat[] = ['dossel', 'sub-bosque', 'chao', 'agua', 'praia', 'mata-seca', 'lajedo', 'acude'];
const ALL_HABITATS: Habitat[] = [...BASE_HABITATS, ...ENV_MODULES.flatMap((m) => m.habitats)];
const BIT = Object.fromEntries(ALL_HABITATS.map((h, i) => [h, 1 << i])) as Record<Habitat, number>;
/** Ordem de preferência ao escolher o habitat "principal" de um tile (o fundo da captura). */
// Os biomas de src/biomes/ entram na ordem dos seus HABITATS (um tile só tem habitats do próprio bioma).
const PRIORITY: Habitat[] = ['agua', 'acude', 'praia', 'lajedo', 'dossel', 'sub-bosque', 'mata-seca', 'chao', ...ENV_MODULES.flatMap((m) => m.habitats)];

export const habitatBit = (h: Habitat) => BIT[h];
export const hasHabitat = (mask: number, h: Habitat) => (mask & BIT[h]) !== 0;

/** Animal que só vive na água aberta (nada e mergulha; não anda em terra). */
export function isSwimmer(sp: Species): boolean {
  if (sp.behavior === 'mergulha' || sp.behavior === 'choque') return true;
  return sp.habitat.every((h) => OPEN_WATER.includes(h));
}

/** Máscara de habitats de cada tile (índice y * w + x). */
export function habitatMap(region: Region): Uint32Array {
  const out = rawHabitatMap(region);
  // Dentro da vila não há bicho para encontrar: sem habitat, nada nasce ali.
  const v = region.village;
  if (v) {
    const w = region.map[0].length;
    for (let y = v.y; y < v.y + v.h; y++) out.fill(0, y * w + v.x, y * w + v.x + v.w);
  }
  return out;
}

function rawHabitatMap(region: Region): Uint32Array {
  const map = region.map;
  const h = map.length;
  const w = map[0].length;
  const ts = tilesetFor(region.biome);
  const out = new Uint32Array(w * h);
  const stamp = (cx: number, cy: number, r: number, bit: number) => {
    for (let y = Math.max(0, cy - r); y <= Math.min(h - 1, cy + r); y++) for (let x = Math.max(0, cx - r); x <= Math.min(w - 1, cx + r); x++) out[y * w + x] |= bit;
  };
  const env = envOf(region.biome);
  if (env) {
    env.markHabitats({ region, ts, w, h, mark: (x, y, hab, reach = 0) => stamp(x, y, reach, BIT[hab]) });
    return out;
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = map[y][x];
      const i = y * w + x;
      if (region.biome === 'amazonia') {
        if (ts.water.has(ch)) {
          out[i] |= BIT.agua;
          stamp(x, y, WATER_REACH, BIT.agua);
        } else if (!ts.solid.has(ch)) out[i] |= BIT.chao;
        if (ch === '_') stamp(x, y, SHORE_REACH, BIT.praia);
        if (ts.brush.has(ch)) out[i] |= BIT['sub-bosque'];
      } else {
        if (!ts.solid.has(ch)) out[i] |= BIT['mata-seca'];
        if (ts.water.has(ch)) {
          out[i] |= BIT.acude;
          stamp(x, y, POND_REACH, BIT.acude);
        }
        if (ch === '_' || ch === 's') out[i] |= BIT.acude;
        if (ch === 'r') stamp(x, y, ROCK_REACH, BIT.lajedo);
      }
    }
  }
  for (const p of region.props) {
    const spec = PROPS[p.type];
    if (!spec) continue;
    if (region.biome === 'amazonia' && spec.canopy && p.type !== 'cipo') stamp(p.x, p.y, CANOPY_REACH, BIT.dossel);
    if (region.biome === 'caatinga' && (p.type === 'matacao' || p.type === 'seixos')) stamp(p.x, p.y, ROCK_REACH, BIT.lajedo);
  }
  return out;
}

/** Habitats do tile, do mais específico ao mais geral. */
export function habitatsFromMask(mask: number): Habitat[] {
  return PRIORITY.filter((h) => mask & BIT[h]);
}

/** Habitat principal do tile pelo entorno (água e praia vencem, depois lajedo e copas). */
export function habitatAt(region: Region, at: TilePos): Habitat {
  const m = habitatMap(region)[at.y * region.map[0].length + at.x] ?? 0;
  return habitatsFromMask(m)[0] ?? envOf(region.biome)?.defaultHabitat ?? (region.biome === 'caatinga' ? 'mata-seca' : 'chao');
}

/** Máscara dos habitats da espécie. */
function speciesMask(sp: Species): number {
  let m = 0;
  for (const h of sp.habitat) m |= BIT[h];
  return m;
}

/** O habitat do tile que melhor combina com a espécie (vai para a captura), ou null. */
export function matchHabitat(sp: Species, tileMask: number): Habitat | null {
  const both = speciesMask(sp) & tileMask;
  if (!both) return null;
  return PRIORITY.find((h) => both & BIT[h]) ?? null;
}

/**
 * Sorteia uma espécie do bioma que caiba no tile (máscara de habitats e água/terra),
 * ponderada por raridade e porte; `penalty(id)` divide o peso (ex.: quantas já estão no mapa).
 */
export function pickForTile(biome: Biome, tileMask: number, water: boolean, rand: () => number = Math.random, penalty: (id: string) => number = () => 1): { species: Species; habitat: Habitat } | null {
  const pool: { species: Species; habitat: Habitat; w: number }[] = [];
  // Isca de frutos (mochila): raras e lendárias pesam mais enquanto durar.
  const lured = bag.lureActive();
  for (const sp of SPECIES) {
    if (sp.biome !== biome || isSwimmer(sp) !== water) continue;
    const habitat = matchHabitat(sp, tileMask);
    if (!habitat) continue;
    const lure = lured && (sp.rarity === 'rara' || sp.rarity === 'lendaria') ? LURE_FACTOR : 1;
    pool.push({ species: sp, habitat, w: (RARITY_WEIGHT[sp.rarity] * SIZE_WEIGHT[sp.size] * lure) / Math.max(1, penalty(sp.id)) });
  }
  if (!pool.length) return null;
  const total = pool.reduce((s, p) => s + p.w, 0);
  let r = rand() * total;
  for (const p of pool) {
    r -= p.w;
    if (r < 0) return p;
  }
  return pool[pool.length - 1];
}

/** Sorteia a espécie do habitat, ponderada pela raridade. O chão da mata conta como sub-bosque. */
export function pickSpecies(habitat: Habitat, rand: () => number = Math.random): Species {
  const pool = SPECIES.filter((s) => s.habitat.includes(habitat) || (habitat === 'sub-bosque' && s.habitat.includes('chao')));
  const total = pool.reduce((sum, s) => sum + RARITY_WEIGHT[s.rarity], 0);
  let r = rand() * total;
  for (const s of pool) {
    r -= RARITY_WEIGHT[s.rarity];
    if (r < 0) return s;
  }
  return pool[pool.length - 1];
}
