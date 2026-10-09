import { describe, expect, it } from '@jest/globals';
import { PROPS } from '../art/forest';
import { REGIONS, arrivalOf, exitAt, exitTiles, getRegion, validateRegion } from '../data/regions';
import type { Region } from '../data/types';
import { VILLAGES } from '../data/villages';
import { buildGrid } from './grid';
import { STRIP_W, withVillage } from './village';

const ids = ['amazonia', 'caatinga', 'cerrado', 'pantanal', 'mata-atlantica', 'pampa'];
const all = ids.map((id) => getRegion(id));

describe('regiões com vila', () => {
  it('existem as 6 regiões e cada uma tem vila', () => {
    expect(Object.keys(REGIONS).sort()).toEqual([...ids].sort());
    for (const r of all) {
      expect(r.village).toBeDefined();
      expect(VILLAGES[r.id]).toBeDefined();
    }
  });

  it.each(ids)('validateRegion aceita %s', (id) => {
    expect(() => validateRegion(getRegion(id))).not.toThrow();
  });

  it.each(ids)('%s: saídas e chegadas são andáveis e a chegada não cai em saída', (id) => {
    const r = getRegion(id);
    const g = buildGrid(r);
    expect(r.exits?.length).toBeGreaterThan(0);
    for (const e of r.exits ?? []) {
      for (const t of exitTiles(e)) expect(g.blocked[t.y * g.w + t.x]).toBe(0);
      const dest = getRegion(e.to);
      const a = arrivalOf(e);
      const dg = buildGrid(dest);
      expect(dg.blocked[a.y * dg.w + a.x]).toBe(0);
      expect(exitAt(dest, a.x, a.y)).toBeUndefined();
    }
  });

  it.each(ids)('%s: moradores em tile andável, dentro da vila, sem sobrepor outro', (id) => {
    const r = getRegion(id);
    const g = buildGrid({ ...r, npcs: [] }); // a grade já bloqueia o tile de cada morador
    const v = r.village!;
    const seen = new Set<string>();
    expect(r.npcs?.[r.npcs.length - 1]).toBeDefined();
    for (const n of r.npcs ?? []) {
      expect(g.blocked[n.y * g.w + n.x]).toBe(0);
      expect(n.x >= v.x && n.x < v.x + v.w && n.y >= v.y && n.y < v.y + v.h).toBe(true);
      const key = `${n.x},${n.y}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
    expect(r.npcs?.some((n) => n.role === 'loja')).toBe(true);
  });

  it.each(ids)('%s: moradores não ficam sobre a base de objetos', (id) => {
    const r = getRegion(id);
    for (const n of r.npcs ?? []) {
      for (const p of r.props) {
        const s = PROPS[p.type];
        if (!s || s.walkable) continue;
        const inside = n.x >= p.x && n.x <= p.x + s.fw - 1 && n.y <= p.y && n.y >= p.y - s.fh + 1;
        expect(inside).toBe(false);
      }
    }
  });

  it.each(ids)('%s: pontos "vila" e "loja" existem dentro da clareira e são alcançáveis do spawn', (id) => {
    const r = getRegion(id);
    const g = buildGrid(r);
    const spawnArea = g.area[r.spawn.y * g.w + r.spawn.x];
    expect(spawnArea).toBeGreaterThan(0);
    for (const k of ['vila', 'loja']) {
      const t = r.places![k];
      expect(t).toBeDefined();
      expect(g.area[t.y * g.w + t.x]).toBe(spawnArea);
    }
  });
});

describe('withVillage', () => {
  const baseOf = (id: string): Region => {
    // a região original = a final sem a faixa nova
    const r = getRegion(id);
    const spec = VILLAGES[id];
    const map = r.map.map((row) => (spec.side === 'east' ? row.slice(0, row.length - STRIP_W) : row.slice(STRIP_W)));
    return { ...r, map, village: undefined };
  };

  it('a faixa nova aumenta o mapa em STRIP_W colunas', () => {
    for (const id of ids) expect(getRegion(id).map[0].length - baseOf(id).map[0].length).toBe(STRIP_W);
  });

  it('recusa moradores demais', () => {
    const spec = { ...VILLAGES.amazonia, npcs: Array.from({ length: 6 }, (_, i) => ({ ...VILLAGES.amazonia.npcs[0], id: `n${i}` })) };
    expect(() => withVillage(getRegion('amazonia'), spec)).toThrow(/no máximo/);
  });
});
