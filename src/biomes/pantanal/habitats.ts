import type { Habitat } from '../../data/species';
import type { HabitatCtx } from '../types';

/** Habitats do bioma, do mais específico ao mais geral (o primeiro presente no tile vira o fundo da captura). */
export const HABITATS: Habitat[] = ['baia', 'cordilheira', 'alagado'];
export const DEFAULT_HABITAT: Habitat = 'alagado';

/**
 * baia: a água aberta (~) e a margem a 1 tile dela, onde nadam os peixes e o jacaré toma sol.
 * cordilheira: o chão da mata (.), o campo seco de terra firme (s) e a beira da mata fechada.
 * alagado: todo o resto andável (campo, capim alto, água rasa, lama, aterro).
 */
export function markHabitats(ctx: HabitatCtx): void {
  const { region, ts } = ctx;
  region.map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ts.water.has(ch)) ctx.mark(x, y, 'baia', 1);
      else if (ch === '.' || ch === 's') ctx.mark(x, y, 'cordilheira');
      else if (ch === '#') ctx.mark(x, y, 'cordilheira', 1);
      if (!ts.solid.has(ch)) ctx.mark(x, y, DEFAULT_HABITAT);
    }
  });
}
