import type { Habitat } from '../../data/species';
import type { HabitatCtx } from '../types';

/** Habitats do bioma, do mais específico ao mais geral (o primeiro presente no tile vira o fundo da captura). */
export const HABITATS: Habitat[] = ['vereda', 'cerradao', 'campo'];
export const DEFAULT_HABITAT: Habitat = 'campo';

/**
 * campo: campo limpo, campo sujo, chapada e trilhas.
 * cerradao: chão do cerradão e a borda de quem encosta nas árvores fechadas.
 * vereda: brejo, margem e a água do córrego (os tiles de água e os vizinhos, para quem nada e mergulha).
 */
export function markHabitats(ctx: HabitatCtx): void {
  const { region, ts } = ctx;
  region.map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (ts.water.has(c)) ctx.mark(x, y, 'vereda', 1);
      else if (c === 'v' || c === '_') ctx.mark(x, y, 'vereda');
      else if (c === 'm') ctx.mark(x, y, 'cerradao');
      else if (c === '#') ctx.mark(x, y, 'cerradao', 1);
      else ctx.mark(x, y, DEFAULT_HABITAT);
    }
  });
}
