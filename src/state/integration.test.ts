import { beforeEach, describe, expect, it } from '@jest/globals';
import type Phaser from 'phaser';
import { xpReward, xpToNext } from '../battle/engine';
import { FARM_CAPACITY, INCUBATION_MS, INCUBATOR_SLOTS } from '../data/conservation';
import { BATTLE_COIN_FACTOR, CAPTURE_COINS } from '../data/items';
import { getSpecies } from '../data/species';
import { bag, bindBag } from './bag';
import { bindConservation, conservation } from './conservation';
import { STARTING_LEVEL, bindParty, party } from './party';

const LC = 'arara';
const VU = 'uacari';
const EN = 'boto';
const CR = 'ararinha';
const T0 = 5_000_000;

/** Emissor mínimo com on/emit (basta para os bind*). */
class FakeEmitter {
  private handlers = new Map<string, ((p: any) => void)[]>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  on(ev: string, fn: (p: any) => void): this { // eslint-disable-line @typescript-eslint/no-explicit-any
    this.handlers.set(ev, [...(this.handlers.get(ev) ?? []), fn]);
    return this;
  }
  emit(ev: string, p?: unknown): boolean {
    for (const fn of this.handlers.get(ev) ?? []) fn(p);
    return true;
  }
}
const events = new FakeEmitter();
bindParty(events as unknown as Phaser.Events.EventEmitter);
bindBag(events as unknown as Phaser.Events.EventEmitter);
bindConservation(events as unknown as Phaser.Events.EventEmitter);

let dnaEvents: { speciesId: string; amount: number }[] = [];
events.on('dna-collected', (p: { speciesId: string; amount: number }) => dnaEvents.push(p));

const end = (speciesId: string, result: string) => events.emit('encounter-end', { speciesId, result });
const coinsFor = (id: string) => {
  const sp = getSpecies(id);
  const base = CAPTURE_COINS[sp.rarity];
  return Math.round(sp.size === 'grande' ? base * (1 + BATTLE_COIN_FACTOR) : base);
};
/** XP total acumulado (considera subidas de nível). */
const totalXp = (m: { level: number; xp: number }) => {
  let t = m.xp;
  for (let l = 1; l < m.level; l++) t += xpToNext(l);
  return t;
};

beforeEach(() => {
  bag.coins = 0;
  bag.items = {};
  party.ephemeral = true;
  party.members = [];
  party.team = [];
  conservation.dna = {};
  conservation.slots = Array.from({ length: INCUBATOR_SLOTS }, () => null);
  conservation.farm = [];
  conservation.reputation = 0;
  dnaEvents = [];
});

describe('captura -> membro, moedas e DNA', () => {
  it.each([[EN, 1], [CR, 2]] as const)('captura de %s rende %i DNA e emite dna-collected', (id, amount) => {
    end(id, 'captured');
    expect(party.members.map((m) => m.speciesId)).toEqual([id]);
    expect(party.team).toHaveLength(1);
    expect(bag.coins).toBe(coinsFor(id));
    expect(conservation.dnaOf(id)).toBe(amount);
    expect(dnaEvents).toEqual([{ speciesId: id, amount }]);
  });

  it('captura de LC dá membro e moedas, sem DNA', () => {
    end(LC, 'captured');
    expect(party.members).toHaveLength(1);
    expect(bag.coins).toBe(coinsFor(LC));
    expect(conservation.dnaEntries()).toEqual([]);
    expect(dnaEvents).toEqual([]);
  });

  it.each(['fled', 'lost'])('%s não dá DNA nem moedas', (result) => {
    end(CR, result);
    expect(bag.coins).toBe(0);
    expect(conservation.dnaEntries()).toEqual([]);
    expect(dnaEvents).toEqual([]);
    expect(party.members).toHaveLength(0);
  });
});

describe('ciclo completo', () => {
  it('captura VU, incuba, recolhe e solta: reputação +3 e XP ao time vivo', () => {
    const starter = party.add('ariranha', STARTING_LEVEL);
    end(VU, 'captured');
    expect(conservation.dnaOf(VU)).toBe(1);

    expect(conservation.incubate(VU, T0).ok).toBe(true);
    expect(conservation.dnaOf(VU)).toBe(0);
    expect(conservation.hatch(0, T0 + INCUBATION_MS.VU! - 1).ok).toBe(false);
    expect(conservation.hatch(0, T0 + INCUBATION_MS.VU!).ok).toBe(true);
    expect(conservation.farm).toHaveLength(1);

    const alive = party.alive();
    expect(alive).toContain(starter);
    const before = alive.map(totalXp);
    const xp = xpReward(getSpecies(VU).rarity, STARTING_LEVEL);
    expect(conservation.release(conservation.farm[0].uid).ok).toBe(true);
    expect(conservation.reputation).toBe(3);
    expect(alive.map(totalXp)).toEqual(before.map((b) => b + xp));
    expect(conservation.farm).toHaveLength(0);
  });

  it('captura e troca: moedas, frutas e metade da reputação', () => {
    end(VU, 'captured');
    const coins = bag.coins;
    conservation.incubate(VU, T0);
    conservation.hatch(0, T0 + INCUBATION_MS.VU!);
    expect(conservation.trade(conservation.farm[0].uid).ok).toBe(true);
    expect(bag.coins).toBe(coins + CAPTURE_COINS[getSpecies(VU).rarity] * 2);
    expect(bag.count('frutas')).toBe(1);
    expect(conservation.reputation).toBe(2);
  });
});

describe('fazenda cheia', () => {
  it('bloqueia hatch e mantém o ovo na incubadora', () => {
    conservation.farm = Array.from({ length: FARM_CAPACITY }, (_, i) => ({ uid: `x${i}`, speciesId: VU, bornAt: T0 }));
    end(EN, 'captured');
    conservation.incubate(EN, T0);
    const r = conservation.hatch(0, T0 + INCUBATION_MS.EN!);
    expect(r.ok).toBe(false);
    expect(conservation.slots[0]?.speciesId).toBe(EN);
    expect(conservation.farm).toHaveLength(FARM_CAPACITY);
  });
});
