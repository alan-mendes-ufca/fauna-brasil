import { describe, it, expect } from '@jest/globals';
import { LEGENDS, legendForRegion, legendTriggeredBy } from './legends';
import { ITEMS } from './items';
import { SPECIES } from './species';

const BIOMES = ['amazonia', 'caatinga', 'cerrado', 'pantanal', 'mata-atlantica', 'pampa'];

const biomeOf = (speciesId: string): string | undefined => SPECIES.find((s) => s.id === speciesId)?.biome;

describe('guardiões do folclore', () => {
  it('há 6 guardiões, um por bioma, com regionIds distintos', () => {
    expect(LEGENDS).toHaveLength(6);
    const regionIds = LEGENDS.map((l) => l.regionId);
    expect(new Set(regionIds).size).toBe(6);
    expect([...regionIds].sort()).toEqual([...BIOMES].sort());
  });

  it('ids dos guardiões são únicos', () => {
    expect(new Set(LEGENDS.map((l) => l.id)).size).toBe(LEGENDS.length);
  });

  it('triggers e baseSpecies existem e são do bioma do guardião', () => {
    for (const l of LEGENDS) {
      expect(l.triggers.length).toBeGreaterThanOrEqual(1);
      expect(l.triggers.length).toBeLessThanOrEqual(3);
      for (const t of l.triggers) {
        expect(biomeOf(t)).toBe(l.regionId);
      }
      expect(biomeOf(l.baseSpecies)).toBe(l.regionId);
    }
  });

  it('fases têm 2 a 3 itens, primeira em 1 e estritamente decrescentes dentro de (0,1]', () => {
    for (const l of LEGENDS) {
      expect(l.phases.length).toBeGreaterThanOrEqual(2);
      expect(l.phases.length).toBeLessThanOrEqual(3);
      expect(l.phases[0].at).toBe(1);
      for (let i = 0; i < l.phases.length; i++) {
        const { at, line } = l.phases[i];
        expect(at).toBeGreaterThan(0);
        expect(at).toBeLessThanOrEqual(1);
        expect(line.length).toBeGreaterThan(0);
        expect(line.length).toBeLessThanOrEqual(90);
        if (i > 0) expect(at).toBeLessThan(l.phases[i - 1].at);
      }
    }
  });

  it('level, hpMultiplier, coins e xp estão nas faixas', () => {
    for (const l of LEGENDS) {
      expect(l.level).toBeGreaterThanOrEqual(12);
      expect(l.level).toBeLessThanOrEqual(22);
      expect(l.hpMultiplier).toBeGreaterThanOrEqual(2);
      expect(l.hpMultiplier).toBeLessThanOrEqual(3.5);
      expect(l.reward.coins).toBeGreaterThanOrEqual(200);
      expect(l.reward.coins).toBeLessThanOrEqual(400);
      expect(l.reward.xp).toBeGreaterThanOrEqual(150);
      expect(l.reward.xp).toBeLessThanOrEqual(400);
    }
  });

  it('cor do tint é 0xRRGGBB válido', () => {
    for (const l of LEGENDS) {
      expect(Number.isInteger(l.tint)).toBe(true);
      expect(l.tint).toBeGreaterThanOrEqual(0);
      expect(l.tint).toBeLessThanOrEqual(0xffffff);
    }
  });

  it('itens de recompensa existem em items.ts', () => {
    for (const l of LEGENDS) {
      if (l.reward.item) {
        expect(ITEMS[l.reward.item.id]).toBeDefined();
        expect(l.reward.item.qty).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('legendForRegion devolve o guardião do bioma e undefined para região desconhecida', () => {
    expect(legendForRegion('mata-atlantica')?.id).toBe('curupira');
    expect(legendForRegion('amazonia')?.name).toBe('Boiúna');
    expect(legendForRegion('marte')).toBeUndefined();
  });

  it('legendTriggeredBy acha o guardião pela espécie e região certas', () => {
    const trigger = LEGENDS[0].triggers[0];
    const region = LEGENDS[0].regionId;
    expect(legendTriggeredBy(trigger, region)?.id).toBe(LEGENDS[0].id);
  });

  it('legendTriggeredBy devolve undefined para espécie sem guardião', () => {
    expect(legendTriggeredBy('onca', 'amazonia')).toBeUndefined();
    expect(legendTriggeredBy('nao-existe', 'amazonia')).toBeUndefined();
  });

  it('legendTriggeredBy devolve undefined para região errada', () => {
    // 'muriqui' dispara o Curupira só na Mata Atlântica
    expect(legendTriggeredBy('muriqui', 'mata-atlantica')?.id).toBe('curupira');
    expect(legendTriggeredBy('muriqui', 'amazonia')).toBeUndefined();
  });
});
