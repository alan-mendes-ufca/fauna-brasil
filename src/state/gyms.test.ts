import { beforeEach, describe, expect, it } from '@jest/globals';
import { GYMS, GYM_IDS } from '../data/gyms';
import { SPECIES, getSpecies } from '../data/species';
import { gyms } from './gyms';

beforeEach(() => {
  gyms.badges.clear();
  gyms.run = null;
});

describe('dados dos ginásios', () => {
  it('há um por bioma, com 2 a 3 animais do próprio bioma e níveis crescentes', () => {
    expect([...GYM_IDS].sort()).toEqual(['amazonia', 'caatinga', 'cerrado', 'mata-atlantica', 'pampa', 'pantanal']);
    for (const g of Object.values(GYMS)) {
      expect(g.team.length).toBeGreaterThanOrEqual(2);
      expect(g.team.length).toBeLessThanOrEqual(3);
      g.team.forEach((f, i) => {
        expect(SPECIES.some((s) => s.id === f.speciesId)).toBe(true);
        expect(getSpecies(f.speciesId).biome).toBe(g.regionId);
        if (i > 0) expect(f.level).toBeGreaterThan(g.team[i - 1].level);
      });
      expect(g.coins).toBeGreaterThan(0);
    }
  });
});

describe('sequência', () => {
  it('avança animal por animal até o fim do time', () => {
    const team = GYMS.cerrado.team;
    expect(gyms.start('cerrado')).toEqual(team[0]);
    expect(gyms.advance()).toEqual(team[1]);
    expect(gyms.advance()).toEqual(team[2]);
    expect(gyms.advance()).toBeNull();
  });

  it('ginásio desconhecido não começa', () => {
    expect(gyms.start('lua')).toBeNull();
    expect(gyms.run).toBeNull();
  });

  it('derrota encerra o desafio sem insígnia', () => {
    gyms.start('pampa');
    gyms.advance();
    gyms.lose();
    expect(gyms.run).toBeNull();
    expect(gyms.has('pampa')).toBe(false);
  });
});

describe('insígnia', () => {
  const beatAll = (id: string) => {
    gyms.start(id);
    for (let i = 1; i < GYMS[id].team.length; i++) gyms.advance();
  };

  it('só é concedida com o time inteiro derrotado', () => {
    gyms.start('amazonia');
    expect(gyms.win().ok).toBe(false);
    expect(gyms.has('amazonia')).toBe(false);
  });

  it('vitória concede insígnia e moedas na primeira vez', () => {
    beatAll('amazonia');
    const r = gyms.win();
    expect(r).toEqual({ ok: true, firstTime: true, coins: GYMS.amazonia.coins, badge: GYMS.amazonia.badge });
    expect(gyms.has('amazonia')).toBe(true);
    expect(gyms.count()).toBe(1);
    expect(gyms.earned().map((g) => g.regionId)).toEqual(['amazonia']);
  });

  it('revanche mantém a insígnia e não paga de novo', () => {
    beatAll('caatinga');
    gyms.win();
    beatAll('caatinga');
    expect(gyms.win()).toMatchObject({ ok: true, firstTime: false, coins: 0 });
    expect(gyms.count()).toBe(1);
  });

  it('sem desafio em curso não concede nada', () => {
    expect(gyms.win().ok).toBe(false);
  });

  it('avisa quem escuta quando ganha insígnia', () => {
    let n = 0;
    const off = gyms.onChange(() => n++);
    beatAll('pantanal');
    gyms.win();
    off();
    expect(n).toBe(1);
  });
});
