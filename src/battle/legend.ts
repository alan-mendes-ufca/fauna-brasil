import type { Legend, LegendMechanic, LegendPhase } from '../data/legends';

// MECÂNICAS DO GUARDIÃO LENDÁRIO: funções puras (sem Phaser nem DOM). A BattleScene só chama estes
// helpers para saber em que fase o guardião está e como ela altera a luta. Toda aleatoriedade vem de um `Rng`.

export type Rng = () => number;

export const FURIA_DAMAGE_MULT = 1.5;
export const ESCUDO_DAMAGE_MULT = 0.5;
export const CONFUSAO_MISS_CHANCE = 0.3;
export const REGENERA_FRACTION = 0.08;
export const INVESTIDA_ATTACKS = 2;

/** Nome e efeito de cada mecânica, para mostrar ao jogador. */
export const MECHANIC_INFO: Record<LegendMechanic, { name: string; text: string }> = {
  furia: { name: 'Fúria', text: 'os golpes dele ficam 50% mais fortes' },
  escudo: { name: 'Escudo', text: 'ele recebe metade do dano' },
  regenera: { name: 'Regeneração', text: 'ele recupera vigor a cada turno' },
  confusao: { name: 'Confusão', text: 'seus golpes podem errar o alvo' },
  investida: { name: 'Investida', text: 'ele ataca duas vezes por turno' },
};

/** Índice da fase ativa para esta fração de vigor (0 a 1): a última cujo limiar `at` já foi cruzado. */
export function phaseIndexFor(legend: Legend, hpFrac: number): number {
  let idx = 0;
  legend.phases.forEach((p, i) => {
    if (hpFrac <= p.at) idx = i;
  });
  return idx;
}

export function phaseFor(legend: Legend, hpFrac: number): LegendPhase {
  return legend.phases[phaseIndexFor(legend, hpFrac)];
}

/** Vigor máximo do guardião a partir do vigor do corpo-base. */
export const legendMaxHp = (legend: Legend, baseMaxHp: number): number => Math.max(1, Math.floor(baseMaxHp * legend.hpMultiplier));

/** Multiplicador do dano que o guardião causa. */
export const damageDealtMult = (m: LegendMechanic): number => (m === 'furia' ? FURIA_DAMAGE_MULT : 1);

/** Multiplicador do dano que o guardião recebe. */
export const damageTakenMult = (m: LegendMechanic): number => (m === 'escudo' ? ESCUDO_DAMAGE_MULT : 1);

/** Chance de um golpe do jogador errar por causa da mecânica. */
export const missChance = (m: LegendMechanic): number => (m === 'confusao' ? CONFUSAO_MISS_CHANCE : 0);

/** O golpe do jogador erra por causa da confusão? */
export const playerMisses = (m: LegendMechanic, rng: Rng): boolean => {
  const c = missChance(m);
  return c > 0 && rng() < c;
};

/** Vigor recuperado pelo guardião ao fim do turno dele (já limitado ao que falta). */
export function healPerTurn(m: LegendMechanic, hp: number, maxHp: number): number {
  if (m !== 'regenera' || hp <= 0) return 0;
  return Math.max(0, Math.min(maxHp - hp, Math.ceil(maxHp * REGENERA_FRACTION)));
}

/** Quantas vezes o guardião ataca por turno. */
export const attacksPerTurn = (m: LegendMechanic): number => (m === 'investida' ? INVESTIDA_ATTACKS : 1);

/**
 * Reescala o dano de um golpe já calculado (o motor aplicou `dealt` a um alvo que tinha `hpBefore`).
 * Devolve o dano final: nunca zera um golpe que acertou, nem passa do vigor que o alvo tinha.
 */
export function scaleDamage(dealt: number, mult: number, hpBefore: number): number {
  if (dealt <= 0) return 0;
  return Math.min(hpBefore, Math.max(1, Math.floor(dealt * mult)));
}

/** Índices das fases cruzadas ao ir da fase `fromIdx` para a de `hpFrac`, em ordem (vazio se nenhuma). */
export function crossedPhases(legend: Legend, fromIdx: number, hpFrac: number): number[] {
  const to = phaseIndexFor(legend, hpFrac);
  const out: number[] = [];
  for (let i = fromIdx + 1; i <= to; i++) out.push(i);
  return out;
}
