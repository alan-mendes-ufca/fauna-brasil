import { LEGENDS, legendTriggeredBy, type Legend } from '../data/legends';

// GUARDIÕES LENDÁRIOS: quais já foram vencidos e os títulos conquistados.
// Lógica pura (sem Phaser): persiste em localStorage como as insígnias, o time e a mochila.

const STORE_KEY = 'fauna-brasil:lendas:v1';

export type LegendWin = { ok: true; firstTime: boolean; title: string } | { ok: false; msg: string };

class LegendState {
  /** Ids dos guardiões vencidos. */
  defeated = new Set<string>();
  private listeners = new Set<() => void>();

  constructor() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as { defeated?: unknown };
      if (Array.isArray(d.defeated)) for (const id of d.defeated) if (typeof id === 'string' && LEGENDS.some((l) => l.id === id)) this.defeated.add(id);
    } catch {
      /* sem localStorage ou dados corrompidos: começa do zero */
    }
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private changed(): void {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ defeated: [...this.defeated] }));
    } catch {
      /* sem localStorage: segue sem gravar */
    }
    for (const fn of this.listeners) fn();
  }

  isDefeated(id: string): boolean {
    return this.defeated.has(id);
  }

  count(): number {
    return this.defeated.size;
  }

  /** Guardião que desperta ao capturar esta espécie nesta região, se ainda não foi vencido. */
  awakenedBy(speciesId: string, regionId: string): Legend | undefined {
    const l = legendTriggeredBy(speciesId, regionId);
    return l && !this.defeated.has(l.id) ? l : undefined;
  }

  /** Títulos conquistados, na ordem dos guardiões. */
  titles(): string[] {
    return LEGENDS.filter((l) => this.defeated.has(l.id)).map((l) => l.reward.title);
  }

  /** O jogador venceu o guardião: marca como vencido (o prêmio só vale na primeira vez). */
  win(id: string): LegendWin {
    const l = LEGENDS.find((x) => x.id === id);
    if (!l) return { ok: false, msg: 'Guardião desconhecido.' };
    const firstTime = !this.defeated.has(id);
    if (firstTime) {
      this.defeated.add(id);
      this.changed();
    }
    return { ok: true, firstTime, title: l.reward.title };
  }
}

export const legends = new LegendState();
