import { PROPS, tilesetFor } from '../../art/forest';
import type { Region, RegionExit, TilePos } from '../types';
import { amazonia } from './amazonia';
import { caatinga } from './caatinga';
import { ENV_MODULES } from '../../biomes/env';
import { withVillage } from '../../world/village';
import { VILLAGES } from '../villages';

/** Tiles de uma saída (retângulo x..x+w-1, y..y+h-1). */
export function exitTiles(e: RegionExit): TilePos[] {
  const out: TilePos[] = [];
  for (let y = e.y; y < e.y + (e.h ?? 1); y++) for (let x = e.x; x < e.x + (e.w ?? 1); x++) out.push({ x, y });
  return out;
}

/** A saída que contém o tile, se houver. */
export function exitAt(r: Region, x: number, y: number): RegionExit | undefined {
  return r.exits?.find((e) => x >= e.x && y >= e.y && x < e.x + (e.w ?? 1) && y < e.y + (e.h ?? 1));
}

/** Tile de chegada de uma saída na região de destino. */
export function arrivalOf(e: RegionExit): TilePos {
  const dest = getRegion(e.to);
  if (typeof e.at !== 'string') return e.at;
  const t = dest.places?.[e.at];
  if (!t) throw new Error(`Região "${dest.id}" não tem o ponto "${e.at}"`);
  return t;
}

/** Confere uma região e lança um erro descritivo na primeira inconsistência. */
export function validateRegion(r: Region): void {
  const fail = (msg: string): never => {
    throw new Error(`Região "${r.id}": ${msg}`);
  };
  const ts = tilesetFor(r.biome);
  if (!ts) fail(`bioma desconhecido "${r.biome}"`);
  if (!r.map.length) fail('mapa vazio');
  const w = r.map[0].length;
  const h = r.map.length;
  r.map.forEach((row, y) => {
    if (row.length !== w) fail(`linha ${y} tem ${row.length} colunas, esperado ${w}`);
    for (let x = 0; x < w; x++) {
      if (!ts.ground.includes(row[x])) fail(`caractere inválido "${row[x]}" em (${x}, ${y}); válidos: ${ts.ground.join(' ')}`);
    }
  });

  const inMap = (x: number, y: number) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < w && y < h;
  const solidProp = new Set<number>();
  r.props.forEach((p, i) => {
    const spec = PROPS[p.type];
    if (!spec) return fail(`objeto #${i} com tipo desconhecido "${p.type}"`);
    const x1 = p.x + spec.fw - 1;
    const y0 = p.y - spec.fh + 1;
    if (!inMap(p.x, y0) || !inMap(x1, p.y)) fail(`objeto #${i} (${p.type}) em (${p.x}, ${p.y}) sai do mapa ${w}×${h}`);
    if (!spec.walkable) for (let yy = y0; yy <= p.y; yy++) for (let xx = p.x; xx <= x1; xx++) solidProp.add(yy * w + xx);
  });

  r.lights.forEach((l, i) => {
    if (l.x < 0 || l.y < 0 || l.x > w || l.y > h) fail(`luz #${i} em (${l.x}, ${l.y}) fora do mapa`);
  });

  const walkable = (x: number, y: number) => inMap(x, y) && !ts.solid.has(r.map[y][x]) && !solidProp.has(y * w + x);
  const checkSpot = (name: string, t: { x: number; y: number }) => {
    if (!inMap(t.x, t.y)) fail(`${name} (${t.x}, ${t.y}) fora do mapa ${w}×${h}`);
    if (!walkable(t.x, t.y)) fail(`${name} (${t.x}, ${t.y}) não é andável (tile "${r.map[t.y][t.x]}" ou base de objeto)`);
  };
  checkSpot('spawn', r.spawn);
  for (const [name, t] of Object.entries(r.places ?? {})) checkSpot(`ponto "${name}"`, t);
  (r.exits ?? []).forEach((e, i) => exitTiles(e).forEach((t) => checkSpot(`saída #${i} (para ${e.to})`, t)));
  for (const n of r.npcs ?? []) checkSpot(`morador "${n.id}"`, n);
}

// Cada bioma ganha a sua vila (a região cresce para um dos lados; ver src/world/village.ts).
const ALL: Region[] = [amazonia, caatinga, ...ENV_MODULES.map((m) => m.region)].map((r) => (VILLAGES[r.id] ? withVillage(r, VILLAGES[r.id]) : r));
ALL.forEach(validateRegion);

export const REGIONS: Record<string, Region> = Object.fromEntries(ALL.map((r) => [r.id, r]));

// Saídas: o destino existe e a chegada é andável e não cai em outra saída (senão o jogador volta na hora).
for (const r of ALL) {
  for (const e of r.exits ?? []) {
    if (!REGIONS[e.to]) throw new Error(`Região "${r.id}": saída para "${e.to}", que não existe`);
    const t = arrivalOf(e);
    if (exitAt(REGIONS[e.to], t.x, t.y)) throw new Error(`Região "${r.id}": a chegada em "${e.to}" (${t.x}, ${t.y}) fica sobre uma saída`);
  }
}

export function getRegion(id: string): Region {
  const r = REGIONS[id];
  if (!r) throw new Error(`Região "${id}" não existe; disponíveis: ${Object.keys(REGIONS).join(', ')}`);
  return r;
}
