import { RARITY, type Rarity } from '../data/species';

// Regras puras da captura (sem Phaser): fáceis de testar.

/** Menor tamanho do anel, em fração do círculo-alvo. */
export const RING_MIN = 0.2;
/** Folga (px de arte) ao testar se o impacto caiu dentro do anel. */
export const RING_FORGIVENESS = 3;
/** Quantas sacudidas a rede dá antes de fechar a captura. */
export const SHAKES = 3;
/** Expoente da qualidade na probabilidade: favorece muito o arremesso bom. */
export const QUALITY_EXPONENT = 1;
/** Curva da qualidade pelo anel: expoente < 1 dá mais crédito a quem acerta no meio do anel. */
export const RING_QUALITY_CURVE = 0.7;
/** Limiares de qualidade para "Boa!", "Ótimo!" e "Excelente!". */
export const QUALITY_TIERS = [0.3, 0.6, 0.85] as const;

/** Animal atordoado (vindo da batalha): qualidade mínima do arremesso que acerta. */
export const STUN_MIN_QUALITY = 0.5;

export const RING_COLORS: Record<Rarity, number> = {
  comum: 0x4cff6a,
  incomum: 0xffe03a,
  rara: 0xff8a1f,
  lendaria: 0xff3b3b,
};

/** Raio do anel (fração do alvo, de 1 a RING_MIN) no instante t; recomeça a cada período. */
export function ringFraction(timeMs: number, periodMs: number): number {
  const phase = (((timeMs % periodMs) + periodMs) % periodMs) / periodMs;
  return 1 - phase * (1 - RING_MIN);
}

/** Qualidade 0..1: 1 com o anel no mínimo; 0 se o impacto ficou fora do anel. */
export function throwQuality(ringFrac: number, impactDist: number, targetRadius: number): number {
  if (impactDist > ringFrac * targetRadius + RING_FORGIVENESS) return 0;
  const norm = (ringFrac - RING_MIN) / (1 - RING_MIN);
  return Math.pow(clamp01(1 - norm), RING_QUALITY_CURVE);
}

/** Qualidade efetiva: o atordoamento garante pelo menos STUN_MIN_QUALITY, mesmo fora do anel. */
export function effectiveQuality(q: number, stunned: boolean): number {
  return stunned ? Math.max(q, STUN_MIN_QUALITY) : q;
}

/** Chance de capturar um arremesso que acertou, por raridade e qualidade. */
export function catchProbability(rarity: Rarity, quality: number): number {
  const { minP, maxP } = RARITY[rarity];
  return minP + (maxP - minP) * Math.pow(clamp01(quality), QUALITY_EXPONENT);
}

/** Chance de passar em cada sacudida, de modo que as SHAKES juntas valham P. */
export function shakePassChance(p: number): number {
  return Math.pow(p, 1 / SHAKES);
}

/** Resultado das sacudidas: quantas passaram e se o animal escapou. */
export function rollShakes(p: number, rand: () => number = Math.random): { passed: number; escaped: boolean } {
  const each = shakePassChance(p);
  for (let i = 0; i < SHAKES; i++) {
    if (rand() >= each) return { passed: i, escaped: true };
  }
  return { passed: SHAKES, escaped: false };
}

/** Depois de escapar, o animal pode fugir de vez. */
export function rollFlee(rarity: Rarity, rand: () => number = Math.random): boolean {
  return rand() < RARITY[rarity].flee;
}

export type QualityLabel = 'Boa!' | 'Ótimo!' | 'Excelente!' | null;

export function qualityLabel(q: number): QualityLabel {
  if (q >= QUALITY_TIERS[2]) return 'Excelente!';
  if (q >= QUALITY_TIERS[1]) return 'Ótimo!';
  if (q >= QUALITY_TIERS[0]) return 'Boa!';
  return null;
}

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
