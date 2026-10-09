import { rng } from '../art/canvas';
import type { NpcDef, PropPlacement, Region, TilePos } from '../data/types';

// VILAS DENTRO DOS BIOMAS
// `withVillage` aumenta uma região: acrescenta uma faixa de STRIP_W colunas num dos lados (leste ou
// oeste), com mata nova para explorar e, no meio dela, a clareira da vila (casas, loja, poço e
// moradores). Uma trilha de 2 tiles atravessa a borda de mata do mapa original na altura `door`.
// No lado oeste tudo o que já existia (objetos, luzes, saídas, pontos) anda STRIP_W colunas para a direita.
//
// Só usa '#', o chão, o capim alto e a trilha do bioma: caracteres que todo tileset já sabe emendar.

/** Largura da faixa nova (inclui a borda de mata de 2 colunas do lado de fora). */
export const STRIP_W = 30;
const VILLAGE_W = 20;
const VILLAGE_H = 16;
/** Linha da trilha de entrada dentro da clareira (a trilha usa esta e a seguinte). */
const ENTRY_ROW = 7;

/**
 * Clareira da vila vista do lado de quem entra pela esquerda (no lado oeste o desenho é espelhado).
 * 'g' chão, 'p' trilha. As casas ficam sobre o chão da linha de cima e da linha de baixo.
 */
const LAYOUT = [
  'gggggggggggggggggggg',
  'gggggggggggggggggggg',
  'gggggggggggggggggggg',
  'gggggggggggggggggggg',
  'gggggggggggggggggggg',
  'ggpggggggpgggggpgggg',
  'gppppppppppppppppppg',
  'pppppppppppppppppppg',
  'pppppppppppppppppppg',
  'gppppppppppppppppppg',
  'gggpgggggppggggpgggg',
  'gggggggggggggggggggg',
  'gggggggggggggggggggg',
  'gggggggggggggggggggg',
  'gggggggggggggggggggg',
  'gggggggggggggggggggg',
];

/** Objetos da clareira: [tipo, x, y] do tile da base esquerda, para quem entra pela esquerda. */
const LAYOUT_PROPS: [string, number, number][] = [
  ['vila_casa', 1, 4],
  ['vila_loja', 7, 4],
  ['vila_casa2', 14, 4],
  ['vila_casa2', 2, 14],
  ['vila_horta', 6, 13],
  ['vila_poco', 9, 12],
  ['vila_casa', 14, 14],
  ['vila_lampiao', 5, 10],
  ['vila_lampiao', 13, 10],
  ['vila_lampiao', 19, 5],
  ['vila_banco', 11, 10],
  ['vila_cerca', 0, 11],
  ['vila_cerca', 1, 11],
  ['vila_cerca', 18, 11],
  ['vila_cerca', 19, 11],
];

/** Lugares dos moradores, na ordem da lista `npcs` (o primeiro é sempre quem fica na porta da loja). */
const NPC_SLOTS: TilePos[] = [
  { x: 9, y: 5 },
  { x: 4, y: 8 },
  { x: 16, y: 9 },
  { x: 12, y: 12 },
  { x: 8, y: 11 },
  { x: 11, y: 3 },
];

export interface VillageSpec {
  name: string;
  side: 'east' | 'west';
  /** Linha do mapa original onde a trilha de entrada atravessa a borda (usa esta e a seguinte). */
  door: number;
  /** Caracteres do bioma. */
  ground: string;
  brush: string;
  path: string;
  seed: number;
  npcs: Omit<NpcDef, 'x' | 'y'>[];
}

/** Largura de cada objeto da vila, em tiles (para espelhar no lado oeste). */
const PROP_FW: Record<string, number> = { vila_casa: 3, vila_casa2: 3, vila_loja: 4, vila_poco: 2, vila_horta: 2, vila_lampiao: 1, vila_banco: 2, vila_cerca: 1 };

export function withVillage(base: Region, spec: VillageSpec): Region {
  if (spec.npcs.length > NPC_SLOTS.length) throw new Error(`Vila "${spec.name}": no máximo ${NPC_SLOTS.length} moradores`);
  const h = base.map.length;
  const w0 = base.map[0].length;
  const east = spec.side === 'east';
  const dx = east ? 0 : STRIP_W;
  const sx = east ? w0 : 0; // primeira coluna da faixa nova
  const W = w0 + STRIP_W;
  const SOLID = '#';

  // Mapa novo: faixa vazia + mapa original.
  const grid: string[][] = base.map.map((row) => {
    const strip = Array.from({ length: STRIP_W }, () => SOLID);
    return east ? [...row, ...strip] : [...strip, ...row];
  });
  const set = (x: number, y: number, c: string) => {
    if (x >= 0 && y >= 0 && x < W && y < h) grid[y][x] = c;
  };
  const get = (x: number, y: number) => grid[y]?.[x];

  // Clareira: alinhada à trilha de entrada, encostada no lado de dentro da faixa (perto do mapa original).
  const vy = Math.max(3, Math.min(h - 3 - VILLAGE_H, spec.door - ENTRY_ROW));
  const vx = east ? sx + 6 : sx + STRIP_W - 6 - VILLAGE_W;
  const local = (lx: number, ly: number): TilePos => ({ x: east ? vx + lx : vx + VILLAGE_W - 1 - lx, y: vy + ly });

  // Mata nova da faixa: chão com manchas de capim alto e capões de mato (por sorteio fixo).
  const rand = rng(spec.seed);
  const inner = { x0: sx + (east ? 0 : 2), x1: sx + STRIP_W - (east ? 3 : 1), y0: 2, y1: h - 3 };
  for (let y = inner.y0; y <= inner.y1; y++) for (let x = inner.x0; x <= inner.x1; x++) set(x, y, spec.ground);
  const nearVillage = (x: number, y: number, m: number) => x >= vx - m && x < vx + VILLAGE_W + m && y >= vy - m && y < vy + VILLAGE_H + m;
  const blob = (c: string, count: number, rMin: number, rMax: number, margin: number) => {
    for (let i = 0; i < count; i++) {
      const cx = inner.x0 + Math.floor(rand() * (inner.x1 - inner.x0 + 1));
      const cy = inner.y0 + Math.floor(rand() * (inner.y1 - inner.y0 + 1));
      const r = rMin + rand() * (rMax - rMin);
      for (let y = Math.floor(cy - r); y <= cy + r; y++) {
        for (let x = Math.floor(cx - r); x <= cx + r; x++) {
          if (x < inner.x0 || x > inner.x1 || y < inner.y0 || y > inner.y1) continue;
          if (Math.hypot(x - cx, y - cy) > r + rand() * 0.6 || nearVillage(x, y, margin)) continue;
          set(x, y, c);
        }
      }
    }
  };
  blob(spec.brush, Math.round(h / 3), 1.5, 3.2, 1);
  blob(SOLID, Math.round(h / 5), 0.8, 1.8, 2);

  // Clareira.
  LAYOUT.forEach((row, ly) => {
    for (let lx = 0; lx < VILLAGE_W; lx++) {
      const t = local(lx, ly);
      set(t.x, t.y, row[lx] === 'p' ? spec.path : spec.ground);
    }
  });

  // Trilha de entrada: da clareira até o primeiro chão andável do mapa original, abrindo a mata.
  const solidish = (c: string | undefined) => c === SOLID || c === '%' || c === undefined;
  for (const y of [vy + ENTRY_ROW, vy + ENTRY_ROW + 1]) {
    const step = east ? -1 : 1;
    let x = east ? vx - 1 : vx + VILLAGE_W;
    let hitOld = false;
    for (let n = 0; n < W; n++, x += step) {
      const inOld = east ? x < w0 : x >= STRIP_W;
      if (inOld && !solidish(get(x, y))) {
        hitOld = true;
        break;
      }
      set(x, y, spec.path);
    }
    if (!hitOld) throw new Error(`Vila "${spec.name}": a trilha da linha ${y} não encontrou chão no mapa original`);
  }

  // Saídas na borda onde a faixa entrou vão para a nova borda, com a trilha atravessando a faixa
  // (a vila fica no caminho). Pontos e spawn colados nelas vão junto.
  const borderX = east ? w0 - 1 : 0;
  const moved = (base.exits ?? []).filter((e) => e.x === borderX && (e.w ?? 1) === 1);
  for (const e of moved) {
    for (let y = e.y; y < e.y + (e.h ?? 1); y++) {
      const step = east ? -1 : 1;
      for (let x = east ? W - 1 : 0, n = 0; n < W; n++, x += step) {
        const inOld = east ? x < w0 : x >= STRIP_W;
        if (inOld && !solidish(get(x, y))) break;
        set(x, y, spec.path);
      }
    }
  }
  const nearMoved = (t: TilePos) => moved.some((e) => Math.abs(t.x - borderX) <= 3 && t.y >= e.y - 2 && t.y < e.y + (e.h ?? 1) + 2);
  const newX = (x: number) => (east ? W - 1 - (borderX - x) : x);
  const shift = (t: TilePos): TilePos => (nearMoved(t) ? { x: newX(t.x), y: t.y } : { x: t.x + dx, y: t.y });

  const props: PropPlacement[] = [
    ...base.props.map((p) => ({ ...p, x: p.x + dx })),
    ...LAYOUT_PROPS.map(([type, lx, ly]) => {
      const fw = PROP_FW[type] ?? 1;
      const t = local(lx + fw - 1, ly); // no espelho, a base esquerda é a última coluna da base original
      return { type, x: east ? local(lx, ly).x : t.x, y: t.y };
    }),
  ];
  // Placa na entrada da trilha, do lado de fora da clareira.
  const sign = local(-1, ENTRY_ROW - 1);
  props.push({ type: east ? 'placa' : 'placa_esq', x: sign.x, y: sign.y });

  const npcs: NpcDef[] = spec.npcs.map((n, i) => ({ ...n, ...local(NPC_SLOTS[i].x, NPC_SLOTS[i].y) }));

  return {
    ...base,
    map: grid.map((r) => r.join('')),
    props,
    lights: base.lights.map((l) => ({ ...l, x: l.x + dx })),
    spawn: shift(base.spawn),
    places: {
      ...Object.fromEntries(Object.entries(base.places ?? {}).map(([k, t]) => [k, shift(t)])),
      vila: local(3, ENTRY_ROW),
      loja: local(9, 6),
    },
    exits: base.exits?.map((e) => ({ ...e, x: moved.includes(e) ? newX(e.x) : e.x + dx })),
    village: { name: spec.name, x: vx, y: vy, w: VILLAGE_W, h: VILLAGE_H, shift: dx },
    npcs: [...(base.npcs ?? []).map((n) => ({ ...n, x: n.x + dx })), ...npcs],
  };
}
