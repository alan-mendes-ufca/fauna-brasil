import { TILE } from '../art/canvas';
import { isBlocked, type Grid } from './grid';

export interface Pt {
  x: number;
  y: number;
}

const SQRT2 = Math.SQRT2;
/** Vizinhos: 4 ortogonais e 4 diagonais. */
const DIRS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
];
/** Meia largura do corpo do jogador (em tiles) usada nos testes de linha de visão. */
const BODY_HALF = 0.3;
/** Passo (em tiles) da amostragem ao longo de um segmento. */
const SAMPLE_STEP = 0.2;

/** Heap binário mínimo sobre índices de nós, ordenado por `score`. */
class MinHeap {
  private readonly items: number[] = [];
  constructor(private readonly score: Float32Array) {}
  get size() {
    return this.items.length;
  }
  push(n: number): void {
    const a = this.items;
    a.push(n);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.score[a[p]] <= this.score[a[i]]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): number {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && this.score[a[l]] < this.score[a[m]]) m = l;
        if (r < a.length && this.score[a[r]] < this.score[a[m]]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

/**
 * A* em 8 direções sem cortar quinas (a diagonal só vale se as duas ortogonais estiverem livres).
 * Devolve os tiles do início ao fim, inclusive, ou null se não houver caminho.
 */
export function findPath(g: Grid, sx: number, sy: number, tx: number, ty: number): Pt[] | null {
  if (isBlocked(g, sx, sy) || isBlocked(g, tx, ty)) return null;
  const n = g.w * g.h;
  const gScore = new Float32Array(n).fill(Infinity);
  const fScore = new Float32Array(n);
  const from = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const open = new MinHeap(fScore);
  const heuristic = (x: number, y: number) => {
    const dx = Math.abs(x - tx);
    const dy = Math.abs(y - ty);
    return dx + dy + (SQRT2 - 2) * Math.min(dx, dy);
  };
  const start = sy * g.w + sx;
  const goal = ty * g.w + tx;
  gScore[start] = 0;
  fScore[start] = heuristic(sx, sy);
  open.push(start);
  while (open.size) {
    const cur = open.pop();
    if (closed[cur]) continue;
    closed[cur] = 1;
    if (cur === goal) break;
    const cx = cur % g.w;
    const cy = (cur - cx) / g.w;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (isBlocked(g, nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (isBlocked(g, cx + dx, cy) || isBlocked(g, cx, cy + dy))) continue;
      const ni = ny * g.w + nx;
      if (closed[ni]) continue;
      const cost = gScore[cur] + (dx !== 0 && dy !== 0 ? SQRT2 : 1);
      if (cost < gScore[ni]) {
        gScore[ni] = cost;
        from[ni] = cur;
        // Leve preferência por caminhos mais retos entre empates.
        fScore[ni] = cost + heuristic(nx, ny) * 1.001;
        open.push(ni);
      }
    }
  }
  if (from[goal] < 0 && goal !== start) return null;
  const path: Pt[] = [];
  for (let i = goal; i !== -1; i = from[i]) path.push({ x: i % g.w, y: Math.floor(i / g.w) });
  return path.reverse();
}

/** O corpo do jogador (caixa) cabe em todo o segmento a→b (pixels de arte)? */
export function lineClear(g: Grid, a: Pt, b: Pt): boolean {
  const dx = (b.x - a.x) / TILE;
  const dy = (b.y - a.y) / TILE;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / SAMPLE_STEP));
  for (let i = 0; i <= steps; i++) {
    const px = a.x / TILE + (dx * i) / steps;
    const py = a.y / TILE + (dy * i) / steps;
    for (const ox of [-BODY_HALF, BODY_HALF]) {
      for (const oy of [-BODY_HALF, BODY_HALF]) {
        if (isBlocked(g, Math.floor(px + ox), Math.floor(py + oy))) return false;
      }
    }
  }
  return true;
}

/**
 * Suaviza o caminho (string pulling): de cada ponto salta para o mais distante com linha de visão.
 * `from` é a posição real do jogador em pixels; os tiles viram pontos no centro. Devolve os pontos a visitar.
 */
export function smoothPath(g: Grid, from: Pt, tiles: Pt[]): Pt[] {
  const pts: Pt[] = [from, ...tiles.map((t) => ({ x: (t.x + 0.5) * TILE, y: (t.y + 0.5) * TILE }))];
  const out: Pt[] = [];
  let i = 0;
  while (i < pts.length - 1) {
    let j = pts.length - 1;
    while (j > i + 1 && !lineClear(g, pts[i], pts[j])) j--;
    out.push(pts[j]);
    i = j;
  }
  return out;
}
