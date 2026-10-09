import { describe, expect, it } from '@jest/globals';
import { SPECIES } from '../data/species';
import { MAX_LEVEL, fleeChance, makeCombatant, maxHpAt, rollWildLevel, statAt, xpReward, xpToNext } from './engine';

const sp = SPECIES[0].id;
const seq = (...v: number[]) => {
  let i = 0;
  return () => v[i++ % v.length];
};

describe('stats e XP', () => {
  it('fórmulas de stat e vigor', () => {
    expect(statAt(50, 10)).toBe(15);
    expect(maxHpAt(50, 10)).toBe(Math.floor(500 / 20) + 10 + 10);
  });

  it('xpToNext cresce com o nível', () => {
    expect(xpToNext(1)).toBe(30);
    expect(xpToNext(10)).toBe(120);
  });

  it('xpReward depende da raridade e do nível do selvagem', () => {
    expect(xpReward('comum', 10)).toBe(80);
    expect(xpReward('incomum', 10)).toBe(110);
    expect(xpReward('rara', 10)).toBe(150);
    expect(xpReward('lendaria', 10)).toBe(220);
    expect(xpReward('rara', 3)).toBe(45);
  });
});

describe('nível do selvagem', () => {
  it('fica perto do topo do time, deslocado pela raridade', () => {
    expect(rollWildLevel('rara', 10, seq(0.5))).toBe(10);
    expect(rollWildLevel('comum', 10, seq(0.5))).toBe(8);
    expect(rollWildLevel('lendaria', 10, seq(0.5))).toBe(12);
    expect(rollWildLevel('rara', 10, seq(0))).toBe(9);
    expect(rollWildLevel('rara', 10, seq(0.99))).toBe(11);
  });

  it('respeita o mínimo 2 e o máximo', () => {
    expect(rollWildLevel('comum', 1, seq(0))).toBe(2);
    expect(rollWildLevel('lendaria', MAX_LEVEL, seq(0.99))).toBe(MAX_LEVEL);
  });
});

describe('chance de fuga', () => {
  const player = makeCombatant(sp, 10, 'player', 'p1');
  const wild = makeCombatant(sp, 10, 'wild', 'wild');

  it('com agilidades iguais vale 0,55 e sobe 0,15 por falha', () => {
    expect(fleeChance(player, wild, 0)).toBeCloseTo(0.55);
    expect(fleeChance(player, wild, 1)).toBeCloseTo(0.7);
    expect(fleeChance(player, wild, 2)).toBeCloseTo(0.85);
  });

  it('fica entre 0,3 e 0,95', () => {
    expect(fleeChance(player, wild, 10)).toBe(0.95);
    const slow = { ...player, stats: { ...player.stats, agilidade: 1 }, stages: { ...player.stages } };
    const fast = { ...wild, stats: { ...wild.stats, agilidade: 1000 } };
    expect(fleeChance(slow, fast, 0)).toBe(0.3);
  });

  it('agilidade maior do jogador aumenta a chance', () => {
    const quick = { ...player, stats: { ...player.stats, agilidade: player.stats.agilidade + 20 } };
    expect(fleeChance(quick, wild, 0)).toBeGreaterThan(fleeChance(player, wild, 0));
  });
});
