import { beforeEach, describe, expect, it } from '@jest/globals';
import { xpReward } from '../battle/engine';
import { FARM_CAPACITY, INCUBATION_MS, INCUBATOR_SLOTS, REPUTATION_TITLES, reputationTitle } from '../data/conservation';
import { CAPTURE_COINS } from '../data/items';
import { getSpecies } from '../data/species';
import { bag } from './bag';
import { conservation } from './conservation';
import { STARTING_LEVEL, party } from './party';

// Espécies de exemplo (status confirmados nos dados do jogo).
const LC = 'arara';
const NT = 'onca';
const VU = 'uacari'; // rara
const EN = 'boto'; // rara
const CR = 'ararinha'; // lendária
const T0 = 1_000_000;

beforeEach(() => {
  conservation.dna = {};
  conservation.slots = Array.from({ length: INCUBATOR_SLOTS }, () => null);
  conservation.farm = [];
  conservation.reputation = 0;
  bag.coins = 0;
  bag.items = {};
  party.ephemeral = true;
  party.members = [];
  party.team = [];
});

/** Põe um filhote na fazenda pelo caminho normal (DNA, incubar, esperar, recolher). */
function chickOf(id: string): string {
  conservation.addDna(id);
  conservation.incubate(id, T0);
  const slot = conservation.slots.findIndex((s) => s?.speciesId === id);
  expect(conservation.hatch(slot, T0 + INCUBATION_MS.CR!).ok).toBe(true);
  return conservation.farm[conservation.farm.length - 1].uid;
}

describe('DNA', () => {
  it('confere os status usados nos testes', () => {
    expect([LC, NT, VU, EN, CR].map((id) => getSpecies(id).iucn)).toEqual(['LC', 'NT', 'VU', 'EN', 'CR']);
  });

  it('LC e NT não rendem; VU e EN rendem 1; CR rende 2', () => {
    expect(conservation.addDna(LC)).toBe(0);
    expect(conservation.addDna(NT)).toBe(0);
    expect(conservation.addDna(VU)).toBe(1);
    expect(conservation.addDna(EN)).toBe(1);
    expect(conservation.addDna(CR)).toBe(2);
    expect(conservation.dna).toEqual({ [VU]: 1, [EN]: 1, [CR]: 2 });
  });
});

describe('incubadoras', () => {
  it('incubar sem DNA falha', () => {
    const r = conservation.incubate(VU, T0);
    expect(r.ok).toBe(false);
    expect(conservation.slots.every((s) => s === null)).toBe(true);
  });

  it.each([[VU, 'VU'], [EN, 'EN'], [CR, 'CR']] as const)('%s leva o tempo do status %s e gasta 1 DNA', (id, iucn) => {
    conservation.addDna(id);
    const before = conservation.dnaOf(id);
    expect(conservation.incubate(id, T0).ok).toBe(true);
    expect(conservation.dnaOf(id)).toBe(before - 1);
    expect(conservation.slots[0]?.readyAt).toBe(T0 + INCUBATION_MS[iucn]!);
  });

  it('tempos: VU 2 min, EN 3 min, CR 4 min', () => {
    expect([INCUBATION_MS.VU, INCUBATION_MS.EN, INCUBATION_MS.CR]).toEqual([120_000, 180_000, 240_000]);
  });

  it('recolher antes da hora falha e mantém o ovo', () => {
    conservation.addDna(EN);
    conservation.incubate(EN, T0);
    const r = conservation.hatch(0, T0 + INCUBATION_MS.EN! - 1);
    expect(r.ok).toBe(false);
    expect(conservation.slots[0]).not.toBeNull();
    expect(conservation.farm).toHaveLength(0);
    expect(conservation.hatch(0, T0 + INCUBATION_MS.EN!).ok).toBe(true);
    expect(conservation.slots[0]).toBeNull();
    expect(conservation.farm).toHaveLength(1);
  });

  it('só há 3 incubadoras', () => {
    conservation.dna = { [CR]: 5 };
    for (let i = 0; i < INCUBATOR_SLOTS; i++) expect(conservation.incubate(CR, T0).ok).toBe(true);
    expect(conservation.incubate(CR, T0).ok).toBe(false);
  });

  it('fazenda cheia não recolhe e explica', () => {
    conservation.farm = Array.from({ length: FARM_CAPACITY }, (_, i) => ({ uid: `x${i}`, speciesId: VU, bornAt: T0 }));
    conservation.dna = { [VU]: 1 };
    conservation.incubate(VU, T0);
    const r = conservation.hatch(0, T0 + INCUBATION_MS.VU!);
    expect(r.ok).toBe(false);
    expect(r.msg).toMatch(/cheia/);
    expect(conservation.slots[0]).not.toBeNull();
    expect(conservation.farm).toHaveLength(FARM_CAPACITY);
  });
});

describe('soltar e trocar', () => {
  it.each([[VU, 3], [EN, 5], [CR, 8]] as const)('soltar %s dá reputação %i e XP ao time vivo', (id, rep) => {
    party.add('ariranha', STARTING_LEVEL);
    const down = party.add('arara', STARTING_LEVEL);
    down.hp = 0;
    const uid = chickOf(id);
    const r = conservation.release(uid);
    expect(r.ok).toBe(true);
    expect(conservation.reputation).toBe(rep);
    expect(conservation.farm).toHaveLength(0);
    const xp = xpReward(getSpecies(id).rarity, STARTING_LEVEL);
    expect(down.xp).toBe(0);
    expect(r.msg).toContain(`${xp} XP`);
    expect(r.msg).toContain(`+${rep}`);
  });

  it('o XP de soltar chega ao membro vivo', () => {
    const m = party.add('ariranha', STARTING_LEVEL);
    const xp = xpReward(getSpecies(CR).rarity, STARTING_LEVEL);
    const uid = chickOf(CR);
    conservation.release(uid);
    // xpToNext(5) = 70: um filhote lendário (60 XP em nível 5) pode ou não subir; o total é conservado
    expect(m.xp + (m.level > STARTING_LEVEL ? 20 + 10 * STARTING_LEVEL : 0)).toBe(xp);
  });

  it('soltar filhote inexistente falha', () => {
    expect(conservation.release('nada').ok).toBe(false);
  });

  it.each([[VU, 2], [EN, 3], [CR, 4]] as const)('trocar %s dá metade da reputação (%i), moedas e frutas', (id, rep) => {
    const uid = chickOf(id);
    const r = conservation.trade(uid);
    expect(r.ok).toBe(true);
    expect(conservation.reputation).toBe(rep);
    expect(bag.coins).toBe(CAPTURE_COINS[getSpecies(id).rarity] * 2);
    expect(bag.count('frutas')).toBe(1);
    expect(conservation.farm).toHaveLength(0);
  });
});

describe('reputação', () => {
  it('títulos pelos limites', () => {
    expect(reputationTitle(0)).toBe('Visitante');
    expect(reputationTitle(9)).toBe('Visitante');
    expect(reputationTitle(10)).toBe('Amigo da fauna');
    expect(reputationTitle(24)).toBe('Amigo da fauna');
    expect(reputationTitle(25)).toBe('Guardião do bioma');
    expect(reputationTitle(49)).toBe('Guardião do bioma');
    expect(reputationTitle(50)).toBe('Protetor do Brasil');
    expect(REPUTATION_TITLES.map((t) => t.min)).toEqual([50, 25, 10, 0]);
  });
});

describe('persistência', () => {
  it('save corrompido é ignorado', () => {
    for (const raw of ['{{{', 'null', '42', '"x"', '{"dna":[1],"slots":"x","farm":{},"reputation":"y"}']) {
      conservation.loadFrom(raw);
      expect(conservation.slots).toHaveLength(INCUBATOR_SLOTS);
      expect(Array.isArray(conservation.farm)).toBe(true);
      expect(conservation.reputation).toBe(0);
    }
  });

  it('descarta espécies inexistentes e aceita o resto', () => {
    conservation.loadFrom(
      JSON.stringify({
        dna: { [CR]: 2, fantasma: 4, [VU]: -1 },
        slots: [{ speciesId: 'fantasma', readyAt: 5 }, { speciesId: EN, readyAt: T0 }, null],
        farm: [{ uid: 'a', speciesId: 'fantasma', bornAt: 1 }, { uid: 'b', speciesId: VU, bornAt: 2 }],
        reputation: 12.7,
      }),
    );
    expect(conservation.dna).toEqual({ [CR]: 2 });
    expect(conservation.slots[0]).toBeNull();
    expect(conservation.slots[1]).toEqual({ speciesId: EN, readyAt: T0 });
    expect(conservation.farm).toEqual([{ uid: 'b', speciesId: VU, bornAt: 2 }]);
    expect(conservation.reputation).toBe(12);
  });
});
