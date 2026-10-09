import { beforeEach, describe, expect, it } from '@jest/globals';
import { BATTLE_COIN_FACTOR, CAPTURE_COINS, ITEMS, LURE_MS } from '../data/items';
import { SPECIES } from '../data/species';
import { bag } from './bag';
import { party } from './party';

type Bag = typeof bag;
const reset = () => {
  bag.coins = 100;
  bag.items = {};
  bag.useNet = true;
  bag.lureUntil = 0;
  party.ephemeral = true;
  party.members = [];
  party.team = [];
};

beforeEach(reset);

describe('compra', () => {
  it('desconta as moedas e soma o item', () => {
    expect(bag.buy('frutas', 2)).toBe(true);
    expect(bag.coins).toBe(100 - ITEMS.frutas.price * 2);
    expect(bag.count('frutas')).toBe(2);
  });

  it('recusa sem moedas suficientes e não altera nada', () => {
    bag.coins = ITEMS.rede.price - 1;
    expect(bag.buy('rede')).toBe(false);
    expect(bag.coins).toBe(ITEMS.rede.price - 1);
    expect(bag.count('rede')).toBe(0);
  });

  it('recusa quantidade inválida', () => {
    expect(bag.buy('rede', 0)).toBe(false);
    expect(bag.buy('rede', -1)).toBe(false);
    expect(bag.coins).toBe(100);
  });

  it('avisa quem ouve a mudança', () => {
    let n = 0;
    const off = bag.onChange(() => n++);
    bag.buy('erva');
    off();
    bag.buy('erva');
    expect(n).toBe(1);
  });
});

describe('uso dos itens', () => {
  it('não usa item que não tem', () => {
    expect(bag.use('frutas').ok).toBe(false);
  });

  it('frutas curam metade do vigor de quem está ferido e gastam uma unidade', () => {
    const m = party.add('arara', 10);
    const max = party.maxHp(m);
    m.hp = 1;
    bag.items.frutas = 2;
    const r = bag.use('frutas', Date.now());
    expect(r.ok).toBe(true);
    expect(m.hp).toBe(Math.min(max, 1 + Math.ceil(max * 0.5)));
    expect(bag.count('frutas')).toBe(1);
  });

  it('frutas não são gastas se ninguém precisa', () => {
    party.add('arara', 10);
    bag.items.frutas = 1;
    expect(bag.use('frutas').ok).toBe(false);
    expect(bag.count('frutas')).toBe(1);
  });

  it('erva reanima exausto com metade do vigor', () => {
    const m = party.add('arara', 10);
    m.hp = 0;
    bag.items.erva = 1;
    expect(bag.use('erva').ok).toBe(true);
    expect(m.hp).toBe(Math.ceil(party.maxHp(m) * 0.5));
    expect(bag.count('erva')).toBe(0);
    expect('erva' in bag.items).toBe(false);
  });

  it('erva sem ninguém exausto não gasta', () => {
    party.add('arara', 10);
    bag.items.erva = 1;
    expect(bag.use('erva').ok).toBe(false);
    expect(bag.count('erva')).toBe(1);
  });

  it('rede reforçada não se usa na mochila', () => {
    bag.items.rede = 1;
    expect(bag.use('rede').ok).toBe(false);
    expect(bag.count('rede')).toBe(1);
  });
});

describe('isca', () => {
  it('liga por LURE_MS e acumula ao usar de novo', () => {
    bag.items.isca = 2;
    const now = 1_000_000;
    expect(bag.lureActive(now)).toBe(false);
    expect(bag.use('isca', now).ok).toBe(true);
    expect(bag.lureUntil).toBe(now + LURE_MS);
    expect(bag.lureActive(now + LURE_MS - 1)).toBe(true);
    expect(bag.lureActive(now + LURE_MS)).toBe(false);
    bag.use('isca', now + 1000);
    expect(bag.lureUntil).toBe(now + 2 * LURE_MS);
    expect(bag.count('isca')).toBe(0);
  });
});

describe('rede reforçada', () => {
  it('gasta uma por arremesso quando ativada', () => {
    bag.items.rede = 2;
    expect(bag.consumeNet()).toBe(true);
    expect(bag.count('rede')).toBe(1);
  });

  it('não gasta se desativada ou se não houver', () => {
    bag.items.rede = 1;
    bag.setUseNet(false);
    expect(bag.consumeNet()).toBe(false);
    expect(bag.count('rede')).toBe(1);
    bag.setUseNet(true);
    bag.items = {};
    expect(bag.consumeNet()).toBe(false);
  });
});

describe('moedas por captura', () => {
  const BagClass = bag.constructor as unknown as { reward(ev: { speciesId: string; result: string }): number };
  const big = SPECIES.find((s) => s.size === 'grande')!;
  const small = SPECIES.find((s) => s.size !== 'grande')!;

  it('só captura rende moedas', () => {
    expect(BagClass.reward({ speciesId: small.id, result: 'fled' })).toBe(0);
  });

  it('valor por raridade; grande rende mais metade', () => {
    expect(BagClass.reward({ speciesId: small.id, result: 'captured' })).toBe(CAPTURE_COINS[small.rarity]);
    expect(BagClass.reward({ speciesId: big.id, result: 'captured' })).toBe(Math.round(CAPTURE_COINS[big.rarity] * (1 + BATTLE_COIN_FACTOR)));
  });

  it('earn ignora valor não positivo', () => {
    (bag as Bag).earn(0);
    (bag as Bag).earn(-5);
    expect(bag.coins).toBe(100);
    bag.earn(7.9);
    expect(bag.coins).toBe(107);
  });
});
