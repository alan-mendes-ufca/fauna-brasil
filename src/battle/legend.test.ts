import { describe, expect, it } from '@jest/globals';
import { LEGENDS } from '../data/legends';
import {
  attacksPerTurn,
  crossedPhases,
  damageDealtMult,
  damageTakenMult,
  healPerTurn,
  legendMaxHp,
  missChance,
  phaseFor,
  phaseIndexFor,
  playerMisses,
  scaleDamage,
} from './legend';

const boiuna = LEGENDS.find((l) => l.id === 'boiuna')!; // fases: 1 investida, 0.5 escudo, 0.2 furia

describe('fases', () => {
  it('a fase muda ao cruzar cada limiar', () => {
    expect(phaseIndexFor(boiuna, 1)).toBe(0);
    expect(phaseIndexFor(boiuna, 0.51)).toBe(0);
    expect(phaseIndexFor(boiuna, 0.5)).toBe(1);
    expect(phaseIndexFor(boiuna, 0.21)).toBe(1);
    expect(phaseIndexFor(boiuna, 0.2)).toBe(2);
    expect(phaseIndexFor(boiuna, 0.01)).toBe(2);
    expect(phaseFor(boiuna, 0.3).mechanic).toBe('escudo');
  });

  it('crossedPhases lista as fases puladas em ordem', () => {
    expect(crossedPhases(boiuna, 0, 0.9)).toEqual([]);
    expect(crossedPhases(boiuna, 0, 0.4)).toEqual([1]);
    expect(crossedPhases(boiuna, 0, 0.1)).toEqual([1, 2]);
    expect(crossedPhases(boiuna, 2, 0.1)).toEqual([]);
  });

  it('todas as lendas começam na primeira fase com vigor cheio', () => {
    for (const l of LEGENDS) expect(phaseIndexFor(l, 1)).toBe(0);
  });
});

describe('modificadores', () => {
  it('fúria e escudo mexem só no dano da sua direção', () => {
    expect(damageDealtMult('furia')).toBe(1.5);
    expect(damageDealtMult('escudo')).toBe(1);
    expect(damageTakenMult('escudo')).toBe(0.5);
    expect(damageTakenMult('furia')).toBe(1);
  });

  it('confusão faz o jogador errar com 30% de chance', () => {
    expect(missChance('confusao')).toBe(0.3);
    expect(missChance('furia')).toBe(0);
    expect(playerMisses('confusao', () => 0.29)).toBe(true);
    expect(playerMisses('confusao', () => 0.3)).toBe(false);
    expect(playerMisses('escudo', () => 0)).toBe(false);
  });

  it('regeneração cura 8% do máximo, sem passar do que falta nem reviver', () => {
    expect(healPerTurn('regenera', 10, 100)).toBe(8);
    expect(healPerTurn('regenera', 97, 100)).toBe(3);
    expect(healPerTurn('regenera', 100, 100)).toBe(0);
    expect(healPerTurn('regenera', 0, 100)).toBe(0);
    expect(healPerTurn('furia', 10, 100)).toBe(0);
  });

  it('investida dá dois ataques por turno', () => {
    expect(attacksPerTurn('investida')).toBe(2);
    expect(attacksPerTurn('escudo')).toBe(1);
  });

  it('scaleDamage respeita o vigor restante e nunca zera um golpe que acertou', () => {
    expect(scaleDamage(20, 0.5, 100)).toBe(10);
    expect(scaleDamage(1, 0.5, 100)).toBe(1);
    expect(scaleDamage(20, 1.5, 100)).toBe(30);
    expect(scaleDamage(20, 1.5, 25)).toBe(25);
    expect(scaleDamage(0, 1.5, 25)).toBe(0);
  });

  it('vigor do guardião = base x multiplicador', () => {
    expect(legendMaxHp(boiuna, 100)).toBe(300);
  });
});
