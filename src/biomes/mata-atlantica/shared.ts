import { cap, ell, poly, ramp, rect, type Spr } from '../../art/animals/kit';

// Peças de cenário compartilhadas pela fauna da Mata Atlântica (retratos 64×64).

export const BARK = ramp('#7A5A3E', { hi: '#A07C54', rim: '#D0AE7C', sh: '#56402E', dp: '#3A2A26', ol: '#1A1014' });
export const LEAFG = ramp('#3E9A4A', { hi: '#6CC45A', rim: '#B4F08A', sh: '#2A7040', dp: '#1A4A38', ol: '#0A2220' });

/** Galho grosso na base do quadro, com musgo e folhas. `y` é a linha de cima do galho. */
export function branch(s: Spr, y = 56): void {
  const m = poly([[2, y + 1], [14, y - 1], [32, y - 1.5], [50, y - 1], [62, y + 1], [62, y + 5], [48, y + 6], [30, y + 6.5], [14, y + 6], [2, y + 5]]);
  s.fill(m, BARK, { n: 2 });
  s.paintIn(m, rect(0, y + 3, 64, 1), BARK.sh);
  s.dots(BARK.dp, [12, y + 2], [20, y + 4], [39, y + 2], [47, y + 4]);
  s.paintIn(m, ell(34, y - 1, 9, 1.6), LEAFG.md);
  s.dots(LEAFG.hi, [29, y - 2], [34, y - 2], [38, y - 2]);
}

/** Folha simples de lado, para enfeitar galhos. */
export function leaf(s: Spr, x: number, y: number, dir = 1): void {
  s.fill(cap(x, y, 1.6, x + dir * 7, y - 2, 0.5), LEAFG, { n: 1 });
}
