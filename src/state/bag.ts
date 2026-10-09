import type Phaser from 'phaser';
import { BATTLE_COIN_FACTOR, CAPTURE_COINS, ITEMS, LURE_MS, STARTING_COINS, type ItemId } from '../data/items';
import { getSpecies } from '../data/species';
import { party } from './party';

// MOEDAS E MOCHILA
// Moedas vêm das capturas (por raridade; animais grandes, que exigem batalha, rendem mais) e
// compram itens nas lojas das vilas. Persistido em localStorage como o time (sem ele, nada é lembrado).
// Quem precisa redesenhar ouve `bag.onChange`.

const STORE_KEY = 'fauna-brasil:mochila:v1';
const HEAL_FRACTION = 0.5;

interface Save {
  coins: number;
  items: Partial<Record<ItemId, number>>;
  /** Usar a rede reforçada nas capturas (quando houver). */
  useNet: boolean;
  lureUntil: number;
}

export type UseResult = { ok: true; msg: string } | { ok: false; msg: string };

class BagState {
  coins = STARTING_COINS;
  items: Partial<Record<ItemId, number>> = {};
  useNet = true;
  /** Fim da isca (ms desde 1970); 0 = sem isca. */
  lureUntil = 0;
  private listeners = new Set<() => void>();

  constructor() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Partial<Save>;
      if (typeof d.coins === 'number' && d.coins >= 0) this.coins = Math.floor(d.coins);
      for (const id of Object.keys(ITEMS) as ItemId[]) {
        const n = d.items?.[id];
        if (typeof n === 'number' && n > 0) this.items[id] = Math.floor(n);
      }
      this.useNet = d.useNet ?? true;
      this.lureUntil = d.lureUntil ?? 0;
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
      localStorage.setItem(STORE_KEY, JSON.stringify({ coins: this.coins, items: this.items, useNet: this.useNet, lureUntil: this.lureUntil } satisfies Save));
    } catch {
      /* sem localStorage: segue sem gravar */
    }
    for (const fn of this.listeners) fn();
  }

  count(id: ItemId): number {
    return this.items[id] ?? 0;
  }

  earn(n: number): void {
    if (n <= 0) return;
    this.coins += Math.floor(n);
    this.changed();
  }

  buy(id: ItemId, qty = 1): boolean {
    const cost = ITEMS[id].price * qty;
    if (qty <= 0 || cost > this.coins) return false;
    this.coins -= cost;
    this.items[id] = this.count(id) + qty;
    this.changed();
    return true;
  }

  /** Gasta uma unidade do item e grava. */
  private spend(id: ItemId): void {
    const n = this.count(id) - 1;
    if (n > 0) this.items[id] = n;
    else delete this.items[id];
    this.changed();
  }

  setUseNet(on: boolean): void {
    this.useNet = on;
    this.changed();
  }

  /** A captura gasta uma rede reforçada por arremesso que acerta (se o jogador deixou ativada). */
  consumeNet(): boolean {
    if (!this.useNet || !this.count('rede')) return false;
    this.spend('rede');
    return true;
  }

  lureActive(now = Date.now()): boolean {
    return now < this.lureUntil;
  }

  /** Usa um item da mochila. A mensagem explica o efeito ou por que não deu. */
  use(id: ItemId, now = Date.now()): UseResult {
    if (!this.count(id)) return { ok: false, msg: 'Você não tem esse item.' };
    party.regen(now);
    const team = party.teamMembers();
    switch (id) {
      case 'frutas': {
        const hurt = team.filter((m) => m.hp > 0 && m.hp < party.maxHp(m));
        if (!hurt.length) return { ok: false, msg: 'Ninguém do time precisa de frutas agora.' };
        for (const m of hurt) m.hp = Math.min(party.maxHp(m), m.hp + Math.ceil(party.maxHp(m) * HEAL_FRACTION));
        party.save();
        this.spend(id);
        return { ok: true, msg: `${hurt.length} do time recuperaram vigor.` };
      }
      case 'erva': {
        const down = team.filter((m) => m.hp <= 0);
        if (!down.length) return { ok: false, msg: 'Ninguém do time está exausto.' };
        for (const m of down) m.hp = Math.ceil(party.maxHp(m) * HEAL_FRACTION);
        party.save();
        this.spend(id);
        return { ok: true, msg: `${down.length} do time voltaram a lutar.` };
      }
      case 'isca': {
        this.lureUntil = Math.max(now, this.lureUntil) + LURE_MS;
        this.spend(id);
        return { ok: true, msg: 'Isca espalhada: espécies raras vão aparecer mais por alguns minutos.' };
      }
      case 'rede':
        return { ok: false, msg: 'A rede reforçada é usada sozinha na captura.' };
    }
  }

  /** Moedas de um encontro terminado (0 se não houve captura). */
  static reward(ev: { speciesId: string; result: string }): number {
    if (ev.result !== 'captured') return 0;
    const sp = getSpecies(ev.speciesId);
    const base = CAPTURE_COINS[sp.rarity];
    return Math.round(sp.size === 'grande' ? base * (1 + BATTLE_COIN_FACTOR) : base);
  }
}

export const bag = new BagState();

/** Liga as moedas aos encontros (chamado uma vez em main.ts). Emite 'coins-earned' { amount }. */
export function bindBag(events: Phaser.Events.EventEmitter): void {
  events.on('encounter-end', (ev: { speciesId: string; result: string }) => {
    const amount = BagState.reward(ev);
    if (!amount) return;
    bag.earn(amount);
    events.emit('coins-earned', { amount });
  });
}
