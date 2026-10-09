import type { Habitat } from '../../data/species';
import type { HabitatCtx } from '../types';

/** Habitats do bioma, do mais específico ao mais geral (o primeiro presente no tile vira o fundo da captura). */
export const HABITATS: Habitat[] = ['banhado', 'butiazal', 'campo-nativo'];
export const DEFAULT_HABITAT: Habitat = 'campo-nativo';

/**
 * campo-nativo: coxilhas, macega, campo de altitude e trilhas.
 * butiazal: chão do butiazal e a borda de quem encosta nos capões de mato.
 * banhado: juncal, margem de lama e a água da lagoa (e os vizinhos, para quem nada e mergulha).
 * Três passadas, para que o habitat mais específico não seja apagado pelo mais geral.
 */
export function markHabitats(ctx: HabitatCtx): void {
  const { region, ts } = ctx;
  const each = (fn: (c: string, x: number, y: number) => void) =>
    region.map.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) fn(row[x], x, y);
    });
  each((c, x, y) => {
    if (!ts.solid.has(c)) ctx.mark(x, y, DEFAULT_HABITAT);
  });
  each((c, x, y) => {
    if (c === 'b') ctx.mark(x, y, 'butiazal');
    else if (c === '#') ctx.mark(x, y, 'butiazal', 1);
  });
  each((c, x, y) => {
    if (ts.water.has(c)) ctx.mark(x, y, 'banhado', 1);
    else if (c === 'j' || c === '_') ctx.mark(x, y, 'banhado');
  });
}
