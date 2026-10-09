import { beforeEach, describe, expect, it } from '@jest/globals';
import { LEGENDS } from '../data/legends';
import { legends } from './legends';

beforeEach(() => legends.defeated.clear());

describe('despertar', () => {
  it('captura gatilho desperta o guardião do bioma, mas só no bioma certo', () => {
    expect(legends.awakenedBy('sucuri', 'amazonia')?.id).toBe('boiuna');
    expect(legends.awakenedBy('boto', 'amazonia')?.id).toBe('boiuna');
    expect(legends.awakenedBy('sucuri', 'pantanal')).toBeUndefined();
    expect(legends.awakenedBy('onca', 'amazonia')).toBeUndefined();
  });

  it('perder não marca nada: o guardião pode despertar de novo', () => {
    expect(legends.awakenedBy('sucuri', 'amazonia')).toBeDefined();
    expect(legends.awakenedBy('sucuri', 'amazonia')).toBeDefined();
    expect(legends.count()).toBe(0);
  });

  it('vencido, nunca mais desperta', () => {
    legends.win('boiuna');
    expect(legends.awakenedBy('sucuri', 'amazonia')).toBeUndefined();
  });
});

describe('vitória', () => {
  it('registra o título e só dá prêmio na primeira vez', () => {
    expect(legends.win('curupira')).toEqual({ ok: true, firstTime: true, title: 'Amigo da Mata' });
    expect(legends.win('curupira')).toEqual({ ok: true, firstTime: false, title: 'Amigo da Mata' });
    expect(legends.isDefeated('curupira')).toBe(true);
    expect(legends.titles()).toEqual(['Amigo da Mata']);
    expect(legends.count()).toBe(1);
  });

  it('guardião desconhecido falha', () => {
    expect(legends.win('saci').ok).toBe(false);
    expect(legends.count()).toBe(0);
  });

  it('avisa quem ouve as mudanças só quando algo muda', () => {
    let n = 0;
    const off = legends.onChange(() => n++);
    legends.win(LEGENDS[0].id);
    legends.win(LEGENDS[0].id);
    off();
    legends.win(LEGENDS[1].id);
    expect(n).toBe(1);
  });
});
