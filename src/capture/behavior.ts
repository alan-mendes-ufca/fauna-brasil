import type { Behavior } from '../data/species';

// Comportamentos periódicos do animal na captura. Tudo é função pura do tempo (ms),
// então a rede, o anel e a animação leem o mesmo estado. Cada ciclo: parado -> aviso -> ação.

/** O que acontece com a rede que chega dentro da caixa do animal neste instante. */
export type NetFate = 'catch' | 'splash' | 'deflect' | 'burn' | 'slide';

export type Phase = 'idle' | 'telegraph' | 'active';

export interface BehaviorFrame {
  phase: Phase;
  /** Usar a animação "action" do animal. */
  action: boolean;
  /** Deslocamento do animal (px de arte). */
  dx: number;
  dy: number;
  scale: number;
  alpha: number;
  fate: NetFate;
}

interface Cycle {
  length: number;
  /** Início do aviso e da ação dentro do ciclo, e duração da ação. */
  warnAt: number;
  actAt: number;
  actMs: number;
}

const CYCLES: Record<Behavior, Cycle | null> = {
  calmo: null,
  pula: { length: 3000, warnAt: 1900, actAt: 2300, actMs: 700 },
  voa: { length: 4200, warnAt: 1200, actAt: 1600, actMs: 2500 },
  mergulha: { length: 4600, warnAt: 2300, actAt: 2800, actMs: 1800 },
  bote: { length: 3600, warnAt: 1800, actAt: 2300, actMs: 700 },
  choque: { length: 3800, warnAt: 2000, actAt: 2500, actMs: 900 },
  casco: { length: 3600, warnAt: 1700, actAt: 2100, actMs: 1200 },
};

export const JUMP_HEIGHT = 36;
export const FLY_AMPLITUDE = 58;
export const LUNGE_SCALE = 0.38;
export const LUNGE_DROP = 10;
export const SINK_DEPTH = 14;
/** Caixa de acerto do animal (px de arte, centrada no corpo). */
export const BOX_W = 44;
export const BOX_H = 48;

const FATE_ON_ACTIVE: Record<Behavior, NetFate> = {
  calmo: 'catch',
  pula: 'catch',
  voa: 'catch',
  mergulha: 'splash',
  bote: 'deflect',
  choque: 'burn',
  casco: 'slide',
};

const ease = (p: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, p)));

/** Estado do comportamento no instante t (o `offset` desfasa o ciclo de cada encontro). */
export function behaviorFrame(behavior: Behavior, t: number, offset = 0): BehaviorFrame {
  const base: BehaviorFrame = { phase: 'idle', action: false, dx: 0, dy: 0, scale: 1, alpha: 1, fate: 'catch' };
  const c = CYCLES[behavior];
  if (!c) return base;
  const k = (((t + offset) % c.length) + c.length) % c.length;
  if (k >= c.actAt && k < c.actAt + c.actMs) {
    const p = (k - c.actAt) / c.actMs;
    const f: BehaviorFrame = { ...base, phase: 'active', action: true, fate: FATE_ON_ACTIVE[behavior] };
    switch (behavior) {
      case 'pula':
        f.dy = -JUMP_HEIGHT * ease(p);
        break;
      case 'voa':
        // Senoide horizontal com entrada e saída suaves (1,5 oscilação).
        f.dx = FLY_AMPLITUDE * ease(p) * Math.sin(p * Math.PI * 3);
        f.dy = -6 * ease(p) - 2 * Math.sin(p * Math.PI * 7);
        break;
      case 'mergulha':
        f.dy = SINK_DEPTH * Math.min(1, ease(p) * 2.5);
        f.alpha = 1 - 0.55 * Math.min(1, ease(p) * 2.5);
        break;
      case 'bote':
        f.scale = 1 + LUNGE_SCALE * ease(p);
        f.dy = LUNGE_DROP * ease(p);
        break;
      case 'casco':
        f.scale = 1 - 0.18 * Math.min(1, ease(p) * 2.5);
        f.dy = 6 * Math.min(1, ease(p) * 2.5);
        break;
      default:
        break;
    }
    return f;
  }
  if (k >= c.warnAt && k < c.actAt) return { ...base, phase: 'telegraph' };
  return base;
}

/** O pouso da rede (x, y) cai na caixa do animal, com o centro do corpo em (cx, cy)? */
export function netInsideBox(landX: number, landY: number, cx: number, cy: number, f: BehaviorFrame): boolean {
  const bx = cx + f.dx;
  const by = cy + f.dy;
  return Math.abs(landX - bx) <= (BOX_W / 2) * f.scale && Math.abs(landY - by) <= (BOX_H / 2) * f.scale;
}
