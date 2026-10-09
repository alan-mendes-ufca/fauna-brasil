import { PROPS, tilesetFor } from '../art/forest';
import type { Region } from '../data/types';

/** Grade de colisão e de zonas de uma região, em tiles. Fora do mapa conta como sólido. */
export interface Grid {
  w: number;
  h: number;
  /** 1 = bloqueado (chão sólido ou base de objeto). */
  blocked: Uint8Array;
  /** 1 = vegetação alta (sub-bosque, capim seco). */
  brush: Uint8Array;
  /** 1 = água aberta (onde nadam os animais aquáticos). */
  water: Uint8Array;
  /** Rótulo da área andável conectada (0 = bloqueado): destinos em outra área são inalcançáveis. */
  area: Int32Array;
}

export function buildGrid(region: Region): Grid {
  const h = region.map.length;
  const w = region.map[0].length;
  const ts = tilesetFor(region.biome);
  const blocked = new Uint8Array(w * h);
  const brush = new Uint8Array(w * h);
  const water = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = region.map[y][x];
      if (ts.solid.has(ch)) blocked[y * w + x] = 1;
      if (ts.brush.has(ch)) brush[y * w + x] = 1;
      if (ts.water.has(ch)) water[y * w + x] = 1;
    }
  }
  // Base dos objetos: colunas x..x+fw-1 e linhas y-fh+1..y.
  for (const p of region.props) {
    const spec = PROPS[p.type];
    if (!spec || spec.walkable) continue;
    for (let yy = p.y - spec.fh + 1; yy <= p.y; yy++) {
      for (let xx = p.x; xx < p.x + spec.fw; xx++) {
        if (xx >= 0 && yy >= 0 && xx < w && yy < h) blocked[yy * w + xx] = 1;
      }
    }
  }
  return { w, h, blocked, brush, water, area: labelAreas(w, h, blocked) };
}

export const inBounds = (g: Grid, x: number, y: number) => x >= 0 && y >= 0 && x < g.w && y < g.h;

export const isBlocked = (g: Grid, x: number, y: number) => !inBounds(g, x, y) || g.blocked[y * g.w + x] === 1;

/** Preenchimento por inundação (4 vizinhos; com diagonais sem cortar quina a conectividade é a mesma). */
function labelAreas(w: number, h: number, blocked: Uint8Array): Int32Array {
  const area = new Int32Array(w * h);
  const stack: number[] = [];
  let next = 0;
  for (let start = 0; start < w * h; start++) {
    if (blocked[start] || area[start]) continue;
    next++;
    area[start] = next;
    stack.push(start);
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % w;
      const y = (i - x) / w;
      if (x > 0) visit(i - 1);
      if (x < w - 1) visit(i + 1);
      if (y > 0) visit(i - w);
      if (y < h - 1) visit(i + w);
    }
    function visit(j: number): void {
      if (!blocked[j] && !area[j]) {
        area[j] = next;
        stack.push(j);
      }
    }
  }
  return area;
}

/** O tile andável mais próximo de (x, y) que pertence à área `area` (busca em anéis crescentes). */
export function nearestWalkable(g: Grid, x: number, y: number, area: number): { x: number; y: number } | null {
  let best: { x: number; y: number } | null = null;
  let bestD = Infinity;
  const maxR = Math.max(g.w, g.h);
  for (let r = 0; r <= maxR; r++) {
    if (best && r > Math.sqrt(bestD) + 1) break;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const tx = x + dx;
        const ty = y + dy;
        if (!inBounds(g, tx, ty) || g.area[ty * g.w + tx] !== area) continue;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = { x: tx, y: ty };
        }
      }
    }
  }
  return best;
}
