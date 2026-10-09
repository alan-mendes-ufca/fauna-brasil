import type Phaser from 'phaser';
import { xpReward } from '../battle/engine';
import { CAPTURE_COINS } from '../data/items';
import {
  FARM_CAPACITY,
  INCUBATOR_SLOTS,
  TRADE_COIN_FACTOR,
  TRADE_ITEM,
  dnaYield,
  incubationMs,
  releaseReputation,
  tradeReputation,
} from '../data/conservation';
import { getSpecies } from '../data/species';
import { bag } from './bag';
import { STARTING_LEVEL, party, type LevelUp } from './party';

// CENTRO DE CONSERVAÇÃO: DNA, incubadoras, fazenda de filhotes e reputação.
// Global (o mesmo em qualquer vila). Persistido em localStorage; tempos em Date.now() como a isca.
// Quem precisa redesenhar ouve `conservation.onChange`.

const STORE_KEY = 'fauna-brasil:conservacao:v1';

export interface Slot {
  speciesId: string;
  readyAt: number;
}

export interface Chick {
  uid: string;
  speciesId: string;
  bornAt: number;
}

interface Save {
  dna: Record<string, number>;
  slots: (Slot | null)[];
  farm: Chick[];
  reputation: number;
}

export type Result = { ok: true; msg: string } | { ok: false; msg: string };

const fail = (msg: string): Result => ({ ok: false, msg });
const known = (id: unknown): id is string => {
  if (typeof id !== 'string') return false;
  try {
    getSpecies(id);
    return true;
  } catch {
    return false;
  }
};
const nat = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;

class ConservationState {
  dna: Record<string, number> = {};
  slots: (Slot | null)[] = Array.from({ length: INCUBATOR_SLOTS }, () => null);
  farm: Chick[] = [];
  reputation = 0;
  private listeners = new Set<() => void>();

  constructor() {
    try {
      this.loadFrom(localStorage.getItem(STORE_KEY));
    } catch {
      /* sem localStorage: começa do zero */
    }
  }

  /** Carrega um save (texto JSON). Dados corrompidos ou espécies inexistentes são ignorados. */
  loadFrom(raw: string | null): void {
    if (!raw) return;
    try {
      const d = JSON.parse(raw) as Partial<Save> | null;
      if (!d || typeof d !== 'object') return;
      const dna: Record<string, number> = {};
      if (d.dna && typeof d.dna === 'object') {
        for (const [id, n] of Object.entries(d.dna)) if (known(id) && nat(n) && Math.floor(n) > 0) dna[id] = Math.floor(n);
      }
      const slots: (Slot | null)[] = Array.from({ length: INCUBATOR_SLOTS }, () => null);
      if (Array.isArray(d.slots)) {
        d.slots.slice(0, INCUBATOR_SLOTS).forEach((s, i) => {
          if (s && known(s.speciesId) && nat(s.readyAt)) slots[i] = { speciesId: s.speciesId, readyAt: s.readyAt };
        });
      }
      const farm = Array.isArray(d.farm)
        ? d.farm
            .filter((c): c is Chick => !!c && typeof c.uid === 'string' && known(c.speciesId) && nat(c.bornAt))
            .map((c) => ({ uid: c.uid, speciesId: c.speciesId, bornAt: c.bornAt }))
            .slice(0, FARM_CAPACITY)
        : [];
      this.dna = dna;
      this.slots = slots;
      this.farm = farm;
      this.reputation = nat(d.reputation) ? Math.floor(d.reputation) : 0;
    } catch {
      /* dados corrompidos: começa do zero */
    }
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private changed(): void {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ dna: this.dna, slots: this.slots, farm: this.farm, reputation: this.reputation } satisfies Save));
    } catch {
      /* sem localStorage: segue sem gravar */
    }
    for (const fn of this.listeners) fn();
  }

  // ------------------------------------------------------------ DNA

  dnaOf(speciesId: string): number {
    return this.dna[speciesId] ?? 0;
  }

  /** Espécies com DNA disponível. */
  dnaEntries(): [string, number][] {
    return Object.entries(this.dna).filter(([, n]) => n > 0);
  }

  /** Captura de espécie ameaçada rende DNA. Devolve quantas amostras (0 se a espécie não rende). */
  addDna(speciesId: string): number {
    const amount = dnaYield(getSpecies(speciesId).iucn);
    if (!amount) return 0;
    this.dna[speciesId] = this.dnaOf(speciesId) + amount;
    this.changed();
    return amount;
  }

  // ------------------------------------------------------------ incubadoras

  incubate(speciesId: string, now = Date.now()): Result {
    if (!known(speciesId)) return fail('Espécie desconhecida.');
    if (this.dnaOf(speciesId) < 1) return fail('Sem amostra de DNA dessa espécie.');
    const free = this.slots.findIndex((s) => !s);
    if (free < 0) return fail('Todas as incubadoras estão ocupadas.');
    const sp = getSpecies(speciesId);
    const ms = incubationMs(sp.iucn);
    if (!ms) return fail('Essa espécie não precisa de incubação.');
    this.dna[speciesId] = this.dnaOf(speciesId) - 1;
    if (this.dna[speciesId] <= 0) delete this.dna[speciesId];
    this.slots[free] = { speciesId, readyAt: now + ms };
    this.changed();
    return { ok: true, msg: `${sp.name}: ovo na incubadora ${free + 1}. Fica pronto em ${Math.round(ms / 60_000)} min.` };
  }

  /** Milissegundos que faltam para o slot ficar pronto (0 se pronto ou vazio). */
  remaining(slot: number, now = Date.now()): number {
    const s = this.slots[slot];
    return s ? Math.max(0, s.readyAt - now) : 0;
  }

  /** Recolhe o filhote pronto de uma incubadora para a fazenda. */
  hatch(slot: number, now = Date.now()): Result {
    const s = this.slots[slot];
    if (!s) return fail('Essa incubadora está vazia.');
    const name = getSpecies(s.speciesId).name;
    if (now < s.readyAt) return fail(`${name} ainda não nasceu: faltam ${Math.ceil((s.readyAt - now) / 1000)} s.`);
    if (this.farm.length >= FARM_CAPACITY) return fail(`A fazenda está cheia (${FARM_CAPACITY}). Solte ou troque um filhote antes de recolher.`);
    this.farm.push({ uid: `f${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`, speciesId: s.speciesId, bornAt: now });
    this.slots[slot] = null;
    this.changed();
    return { ok: true, msg: `Um filhote de ${name} foi para a fazenda!` };
  }

  // ------------------------------------------------------------ filhotes

  /** Solta o filhote na natureza: reputação e XP para o time. */
  release(uid: string): Result {
    const i = this.farm.findIndex((c) => c.uid === uid);
    if (i < 0) return fail('Esse filhote não está na fazenda.');
    const sp = getSpecies(this.farm[i].speciesId);
    const rep = releaseReputation(sp.iucn);
    const xp = xpReward(sp.rarity, STARTING_LEVEL);
    this.farm.splice(i, 1);
    this.reputation += rep;
    const ups: LevelUp[] = [];
    for (const m of party.alive()) ups.push(...party.grantXp(m, xp));
    party.save();
    this.changed();
    let msg = `${sp.name} solto na natureza! Reputação +${rep}. Cada animal vivo do time ganhou ${xp} XP.`;
    for (const u of ups) msg += ` ${getSpecies(u.member.speciesId).name} subiu para o nível ${u.to}.`;
    return { ok: true, msg };
  }

  /** Entrega o filhote a um projeto de reintrodução de outra vila: metade da reputação, moedas e frutas. */
  trade(uid: string): Result {
    const i = this.farm.findIndex((c) => c.uid === uid);
    if (i < 0) return fail('Esse filhote não está na fazenda.');
    const sp = getSpecies(this.farm[i].speciesId);
    const rep = tradeReputation(sp.iucn);
    const coins = CAPTURE_COINS[sp.rarity] * TRADE_COIN_FACTOR;
    this.farm.splice(i, 1);
    this.reputation += rep;
    bag.earn(coins);
    bag.grant(TRADE_ITEM);
    this.changed();
    return { ok: true, msg: `${sp.name} enviado a um projeto de reintrodução de outra vila. Reputação +${rep}, ${coins} moedas e uma cesta de frutas.` };
  }
}

export const conservation = new ConservationState();

/** Liga o DNA às capturas (chamado uma vez em main.ts). Emite 'dna-collected' { speciesId, amount }. */
export function bindConservation(events: Phaser.Events.EventEmitter): void {
  events.on('encounter-end', (ev: { speciesId: string; result: string }) => {
    if (ev.result !== 'captured') return;
    const amount = conservation.addDna(ev.speciesId);
    if (amount) events.emit('dna-collected', { speciesId: ev.speciesId, amount });
  });
}
