import type { Iucn } from './species';

// CENTRO DE CONSERVAÇÃO (regras puras; o estado fica em src/state/conservation.ts)
// Capturar espécie ameaçada rende DNA; o DNA vira filhote na incubadora; o filhote é solto na natureza
// ou entregue a um projeto de reintrodução. Animais nunca são comprados nem vendidos.

/** Status IUCN que rendem DNA, e quantas amostras por captura. LC, NT e NE não rendem. */
export const DNA_YIELD: Partial<Record<Iucn, number>> = { VU: 1, EN: 1, CR: 2 };

export const INCUBATOR_SLOTS = 3;
export const FARM_CAPACITY = 6;
/** Tempo real de incubação (ms) por status. */
export const INCUBATION_MS: Partial<Record<Iucn, number>> = { VU: 2 * 60_000, EN: 3 * 60_000, CR: 4 * 60_000 };
/** Reputação por filhote solto na natureza, por status. */
export const RELEASE_REPUTATION: Partial<Record<Iucn, number>> = { VU: 3, EN: 5, CR: 8 };
/** Troca com outro projeto: moedas = CAPTURE_COINS[raridade] * este fator, mais 1 item. */
export const TRADE_COIN_FACTOR = 2;
export const TRADE_ITEM = 'frutas' as const;

/** Títulos de reputação, do maior limite para o menor. */
export const REPUTATION_TITLES: { min: number; title: string }[] = [
  { min: 50, title: 'Protetor do Brasil' },
  { min: 25, title: 'Guardião do bioma' },
  { min: 10, title: 'Amigo da fauna' },
  { min: 0, title: 'Visitante' },
];

export function reputationTitle(n: number): string {
  return (REPUTATION_TITLES.find((t) => n >= t.min) ?? REPUTATION_TITLES[REPUTATION_TITLES.length - 1]).title;
}

export const dnaYield = (iucn: Iucn): number => DNA_YIELD[iucn] ?? 0;
export const incubationMs = (iucn: Iucn): number => INCUBATION_MS[iucn] ?? 0;
export const releaseReputation = (iucn: Iucn): number => RELEASE_REPUTATION[iucn] ?? 0;
/** Reputação da troca: metade (arredondada para cima) da reputação de soltar. */
export const tradeReputation = (iucn: Iucn): number => Math.ceil(releaseReputation(iucn) / 2);
