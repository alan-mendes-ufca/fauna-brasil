import { afterEach, describe, expect, it } from '@jest/globals';
import { getRegion } from '../data/regions';
import { LURE_FACTOR, LURE_MS } from '../data/items';
import type { Biome } from '../data/species';
import { bag } from '../state/bag';
import { habitatMap, pickForTile, habitatsFromMask } from './encounters';

const ids = ['amazonia', 'caatinga', 'cerrado', 'pantanal', 'mata-atlantica', 'pampa'];

afterEach(() => {
  bag.lureUntil = 0;
});

describe('habitatMap', () => {
  it.each(ids)('%s: nenhum habitat dentro da clareira da vila', (id) => {
    const r = getRegion(id);
    const v = r.village!;
    const w = r.map[0].length;
    const m = habitatMap(r);
    let outside = 0;
    for (let y = 0; y < r.map.length; y++) {
      for (let x = 0; x < w; x++) {
        const inside = x >= v.x && x < v.x + v.w && y >= v.y && y < v.y + v.h;
        if (inside) expect(m[y * w + x]).toBe(0);
        else if (m[y * w + x]) outside++;
      }
    }
    expect(outside).toBeGreaterThan(0);
  });
});

describe('peso da isca', () => {
  /** Fração das posições do sorteio (varredura uniforme de rand) que dão raras ou lendárias. */
  const rareShare = (biome: Biome, mask: number): number => {
    const N = 4000;
    let rare = 0;
    for (let i = 0; i < N; i++) {
      const p = pickForTile(biome, mask, false, () => i / N)!;
      if (p.species.rarity === 'rara' || p.species.rarity === 'lendaria') rare++;
    }
    return rare / N;
  };

  const sample = (id: string) => {
    const r = getRegion(id);
    const m = habitatMap(r);
    // tile com o maior número de habitats e ao menos uma espécie rara possível
    let best = 0;
    for (const v of m) if (habitatsFromMask(v).length > habitatsFromMask(best).length) best = v;
    return { biome: r.biome, mask: best };
  };

  it('isca ativa aumenta a fatia de raras e lendárias', () => {
    const picks = ids.map(sample).filter((s) => pickForTile(s.biome, s.mask, false) && rareShare(s.biome, s.mask) > 0);
    expect(picks.length).toBeGreaterThan(0);
    for (const s of picks) {
      bag.lureUntil = 0;
      const without = rareShare(s.biome, s.mask);
      bag.lureUntil = Date.now() + LURE_MS;
      const withLure = rareShare(s.biome, s.mask);
      expect(withLure).toBeGreaterThan(without);
      // o ganho nunca passa de LURE_FACTOR vezes (o resto do peso cai por normalização)
      expect(withLure).toBeLessThanOrEqual(without * LURE_FACTOR + 0.01);
    }
  });

  it('isca expirada não muda o sorteio', () => {
    const s = sample('amazonia');
    bag.lureUntil = Date.now() - 1;
    const a = rareShare(s.biome, s.mask);
    bag.lureUntil = 0;
    expect(rareShare(s.biome, s.mask)).toBe(a);
  });

  it('devolve null quando nenhuma espécie cabe', () => {
    expect(pickForTile('amazonia', 0, false)).toBeNull();
  });
});
