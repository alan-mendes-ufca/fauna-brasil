import { describe, expect, it } from '@jest/globals';
import { RARITY } from '../data/species';
import {
  RING_FORGIVENESS, RING_MIN, SHAKES, STUN_MIN_QUALITY,
  catchProbability, effectiveQuality, qualityLabel, ringFraction, rollFlee, rollShakes, shakePassChance, throwQuality,
} from './rules';

describe('anel da captura', () => {
  it('começa em 1, chega perto do mínimo e recomeça a cada período', () => {
    expect(ringFraction(0, 1000)).toBe(1);
    expect(ringFraction(500, 1000)).toBeCloseTo(1 - 0.5 * (1 - RING_MIN));
    expect(ringFraction(999.999, 1000)).toBeCloseTo(RING_MIN, 3);
    expect(ringFraction(1000, 1000)).toBe(1);
    expect(ringFraction(2500, 1000)).toBeCloseTo(ringFraction(500, 1000));
  });

  it('aceita tempo negativo sem sair do intervalo', () => {
    const f = ringFraction(-250, 1000);
    expect(f).toBeGreaterThanOrEqual(RING_MIN);
    expect(f).toBeLessThanOrEqual(1);
  });
});

describe('qualidade do arremesso', () => {
  it('é 0 fora do anel e respeita a folga', () => {
    expect(throwQuality(0.5, 100, 100)).toBe(0);
    expect(throwQuality(0.5, 50 + RING_FORGIVENESS + 0.1, 100)).toBe(0);
    expect(throwQuality(0.5, 50 + RING_FORGIVENESS, 100)).toBeGreaterThan(0);
  });

  it('é 1 com o anel no mínimo e cresce conforme o anel fecha', () => {
    expect(throwQuality(RING_MIN, 0, 100)).toBe(1);
    expect(throwQuality(1, 0, 100)).toBe(0);
    expect(throwQuality(0.4, 0, 100)).toBeGreaterThan(throwQuality(0.8, 0, 100));
  });

  it('atordoamento garante a qualidade mínima, sem reduzir uma melhor', () => {
    expect(effectiveQuality(0, true)).toBe(STUN_MIN_QUALITY);
    expect(effectiveQuality(0.9, true)).toBe(0.9);
    expect(effectiveQuality(0, false)).toBe(0);
  });

  it('rótulos por limiar', () => {
    expect(qualityLabel(0.29)).toBeNull();
    expect(qualityLabel(0.3)).toBe('Boa!');
    expect(qualityLabel(0.6)).toBe('Ótimo!');
    expect(qualityLabel(0.85)).toBe('Excelente!');
  });
});

describe('probabilidade e sacudidas', () => {
  it('vai de minP a maxP conforme a qualidade, limitada a 0..1', () => {
    for (const r of Object.keys(RARITY) as (keyof typeof RARITY)[]) {
      expect(catchProbability(r, 0)).toBeCloseTo(RARITY[r].minP);
      expect(catchProbability(r, 1)).toBeCloseTo(RARITY[r].maxP);
      expect(catchProbability(r, 5)).toBeCloseTo(RARITY[r].maxP);
      expect(catchProbability(r, -1)).toBeCloseTo(RARITY[r].minP);
    }
    expect(catchProbability('comum', 0.5)).toBeGreaterThan(catchProbability('lendaria', 0.5));
  });

  it('as sacudidas juntas valem P', () => {
    expect(shakePassChance(0.512) ** SHAKES).toBeCloseTo(0.512);
  });

  it('passa as três sacudidas quando o sorteio é baixo', () => {
    expect(rollShakes(0.5, () => 0)).toEqual({ passed: SHAKES, escaped: false });
  });

  it('escapa na sacudida em que o sorteio falha', () => {
    const each = shakePassChance(0.5);
    const seq = [0, each - 0.01, each];
    let i = 0;
    expect(rollShakes(0.5, () => seq[i++])).toEqual({ passed: 2, escaped: true });
    expect(rollShakes(0.5, () => 0.999)).toEqual({ passed: 0, escaped: true });
  });

  it('P = 1 nunca escapa', () => {
    expect(rollShakes(1, () => 0.9999).escaped).toBe(false);
  });

  it('fuga depende da chance da raridade', () => {
    expect(rollFlee('lendaria', () => RARITY.lendaria.flee - 0.001)).toBe(true);
    expect(rollFlee('lendaria', () => RARITY.lendaria.flee)).toBe(false);
  });
});
