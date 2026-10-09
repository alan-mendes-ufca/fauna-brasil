import { GYMS, type Gym, type GymFoe } from '../data/gyms';

// GINÁSIOS: insígnias conquistadas e progresso da sequência de batalhas.
// Lógica pura (sem Phaser): quem desenha ou luta consulta e atualiza por aqui.
// Insígnias persistem em localStorage como o time e a mochila; o progresso da sequência é só da luta em curso.

const STORE_KEY = 'fauna-brasil:ginasios:v1';

export type GymResult = { ok: true; firstTime: boolean; coins: number; badge: string } | { ok: false; msg: string };

class GymState {
  /** Ids dos ginásios vencidos. */
  badges = new Set<string>();
  /** Desafio em curso (null fora de uma luta). */
  run: { regionId: string; index: number } | null = null;
  private listeners = new Set<() => void>();

  constructor() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as { badges?: unknown };
      if (Array.isArray(d.badges)) for (const id of d.badges) if (typeof id === 'string' && id in GYMS) this.badges.add(id);
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
      localStorage.setItem(STORE_KEY, JSON.stringify({ badges: [...this.badges] }));
    } catch {
      /* sem localStorage: segue sem gravar */
    }
    for (const fn of this.listeners) fn();
  }

  has(regionId: string): boolean {
    return this.badges.has(regionId);
  }

  count(): number {
    return this.badges.size;
  }

  /** Insígnias conquistadas, na ordem dos ginásios. */
  earned(): Gym[] {
    return Object.values(GYMS).filter((g) => this.badges.has(g.regionId));
  }

  /** Começa (ou recomeça) o desafio: o primeiro animal do líder entra. */
  start(regionId: string): GymFoe | null {
    const gym = GYMS[regionId];
    if (!gym) return null;
    this.run = { regionId, index: 0 };
    return gym.team[0];
  }

  /** Animal do líder em campo agora. */
  current(): GymFoe | null {
    return this.run ? (GYMS[this.run.regionId]?.team[this.run.index] ?? null) : null;
  }

  /** Um animal do líder caiu: devolve o próximo, ou null quando o time acabou (ainda sem insígnia; ver `win`). */
  advance(): GymFoe | null {
    if (!this.run) return null;
    this.run.index++;
    return this.current();
  }

  /** O jogador perdeu: o desafio acaba sem insígnia. */
  lose(): void {
    this.run = null;
  }

  /** Time inteiro derrotado: concede a insígnia. As moedas só vêm na primeira vitória. */
  win(): GymResult {
    const run = this.run;
    const gym = run ? GYMS[run.regionId] : undefined;
    if (!run || !gym) return { ok: false, msg: 'Nenhum desafio em andamento.' };
    if (run.index < gym.team.length - 1) return { ok: false, msg: 'O líder ainda tem animais em pé.' };
    const firstTime = !this.badges.has(gym.regionId);
    this.run = null;
    if (firstTime) {
      this.badges.add(gym.regionId);
      this.changed();
    }
    return { ok: true, firstTime, coins: firstTime ? gym.coins : 0, badge: gym.badge };
  }
}

export const gyms = new GymState();
