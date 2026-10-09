import type { Habitat } from '../../data/species';
import type { HabitatCtx } from '../types';

/** Habitats do bioma, do mais específico ao mais geral (o primeiro presente no tile vira o fundo da captura). */
export const HABITATS: Habitat[] = ['mangue', 'araucaria', 'floresta-umida'];
export const DEFAULT_HABITAT: Habitat = 'floresta-umida';

/** Coluna a partir da qual o litoral começa (restinga, manguezal e estuário). */
const COAST_X = 47;
/** Linha a partir da qual o campo frio e o pinhal começam (Mata de Araucárias). */
const PINE_Y = 35;

/**
 * floresta-umida: floresta ombrófila de encosta (chão, sub-bosque, trilhas, lajes), agreste e o riacho da cachoeira.
 * araucaria: campo frio, capim alto, pinhal e a trilha que corta a Mata de Araucárias (sul).
 * mangue: manguezal, restinga, areia da praia e a água do estuário/mar (e os vizinhos da água, para quem nada e mergulha).
 */
export function markHabitats(ctx: HabitatCtx): void {
  const { region, ts } = ctx;
  region.map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (ts.water.has(c)) {
        // o riacho e o poço da cachoeira são água doce da mata; do estuário para leste é mangue
        if (x >= COAST_X) ctx.mark(x, y, 'mangue', 1);
        else ctx.mark(x, y, 'floresta-umida', 1);
      } else if (c === '#') ctx.mark(x, y, y >= PINE_Y ? 'araucaria' : x >= COAST_X ? 'mangue' : 'floresta-umida', 1);
      else if (c === '_' || c === 'l' || c === 'g') ctx.mark(x, y, 'mangue');
      else if (c === 'a' || c === 'q' || c === 'p') ctx.mark(x, y, 'araucaria');
      else if (c === ',') ctx.mark(x, y, x >= COAST_X ? 'mangue' : y >= PINE_Y ? 'araucaria' : DEFAULT_HABITAT);
      else ctx.mark(x, y, DEFAULT_HABITAT);
    }
  });
}
