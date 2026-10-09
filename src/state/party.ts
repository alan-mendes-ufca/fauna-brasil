import type Phaser from 'phaser';
import { maxHpFor, MAX_LEVEL, xpReward, xpToNext } from '../battle/engine';
import { getSpecies } from '../data/species';

// COLEÇÃO E TIME
// `members` guarda todos os animais capturados (cada um com nível, XP e vigor atual); `team`
// são os uids dos até 6 que lutam. Persistido em localStorage (sem ele o jogo roda igual,
// só não lembra). A UI do caderno (GameUI) tem o seu próprio registro de espécies catalogadas.
//
// Regras de vigor:
//  - tempo: cada 10 s recupera 5% do vigor máximo de todos (calculado quando alguém pergunta);
//  - ao fim de qualquer encontro, quem ficou exausto (vigor 0) volta com 25%;
//  - 'lost' (todo o time exausto): voltam ao acampamento e todos recuperam o vigor inteiro.
// XP: quem participa de uma batalha vencida recebe `xpReward`; cada captura rende metade disso ao time.

export const TEAM_MAX = 6;
export const STARTING_LEVEL = 5;
const STORE_KEY = 'fauna-brasil:party:v1';
const REGEN_MS = 10_000;
const REGEN_FRACTION = 0.05;
const REVIVE_FRACTION = 0.25;

export interface Member {
  uid: string;
  speciesId: string;
  level: number;
  xp: number;
  hp: number;
}

interface Save {
  members: Member[];
  team: string[];
  lastTick: number;
}

export interface LevelUp {
  member: Member;
  from: number;
  to: number;
}

class PartyState {
  members: Member[] = [];
  team: string[] = [];
  /** Sem gravar (time de teste do atalho de desenvolvimento). */
  ephemeral = false;
  private lastTick = Date.now();

  constructor() {
    this.load();
  }

  // ------------------------------------------------------------ persistência

  private load(): void {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Partial<Save>;
      const members = (data.members ?? []).filter((m) => {
        try {
          getSpecies(m.speciesId);
          return typeof m.level === 'number';
        } catch {
          return false;
        }
      });
      this.members = members;
      this.team = (data.team ?? []).filter((u) => members.some((m) => m.uid === u)).slice(0, TEAM_MAX);
      this.lastTick = data.lastTick ?? Date.now();
    } catch {
      /* sem localStorage ou dados corrompidos: começa do zero */
    }
  }

  save(): void {
    if (this.ephemeral) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ members: this.members, team: this.team, lastTick: this.lastTick } satisfies Save));
    } catch {
      /* sem localStorage: segue sem gravar */
    }
  }

  // ------------------------------------------------------------ consulta

  hasStarter(): boolean {
    return this.members.length > 0;
  }

  maxHp(m: Member): number {
    return maxHpFor(m.speciesId, m.level);
  }

  isExhausted(m: Member): boolean {
    return m.hp <= 0;
  }

  teamMembers(): Member[] {
    return this.team.map((u) => this.members.find((m) => m.uid === u)).filter((m): m is Member => !!m);
  }

  /** Quem ainda pode lutar. */
  alive(): Member[] {
    return this.teamMembers().filter((m) => !this.isExhausted(m));
  }

  topLevel(): number {
    return this.teamMembers().reduce((a, m) => Math.max(a, m.level), STARTING_LEVEL);
  }

  // ------------------------------------------------------------ alterações

  add(speciesId: string, level = STARTING_LEVEL): Member {
    const m: Member = { uid: `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, speciesId, level, xp: 0, hp: 0 };
    m.hp = this.maxHp(m);
    this.members.push(m);
    if (this.team.length < TEAM_MAX) this.team.push(m.uid);
    this.save();
    return m;
  }

  /** Define o time (uids, até 6, ordem = ordem de entrada em batalha). */
  setTeam(uids: string[]): void {
    this.team = uids.filter((u, i) => uids.indexOf(u) === i && this.members.some((m) => m.uid === u)).slice(0, TEAM_MAX);
    this.save();
  }

  /** Time de teste que não é gravado (atalho `?battle=`). */
  useTestTeam(): void {
    this.ephemeral = true;
    this.members = [];
    this.team = [];
    for (const [id, lv] of [['ariranha', 6], ['arara', 5], ['perereca', 5]] as const) this.add(id, lv);
  }

  /** Garante um time para lutar (jogo sem inicial escolhido, só em desenvolvimento). */
  ensureTeam(): void {
    if (!this.teamMembers().length) this.useTestTeam();
  }

  healAll(): void {
    for (const m of this.members) m.hp = this.maxHp(m);
    this.lastTick = Date.now();
    this.save();
  }

  /** Recuperação por tempo (ver regras no alto do arquivo). */
  regen(now = Date.now()): void {
    const steps = Math.floor((now - this.lastTick) / REGEN_MS);
    if (steps <= 0) return;
    this.lastTick += steps * REGEN_MS;
    for (const m of this.members) {
      const max = this.maxHp(m);
      m.hp = Math.min(max, m.hp + Math.ceil(max * REGEN_FRACTION) * steps);
    }
    this.save();
  }

  /** Soma XP e sobe de nível quantas vezes couber; o vigor ganha a diferença do máximo. */
  grantXp(m: Member, amount: number): LevelUp[] {
    const ups: LevelUp[] = [];
    m.xp += amount;
    while (m.level < MAX_LEVEL && m.xp >= xpToNext(m.level)) {
      const before = this.maxHp(m);
      m.xp -= xpToNext(m.level);
      const from = m.level++;
      if (m.hp > 0) m.hp += this.maxHp(m) - before;
      ups.push({ member: m, from, to: m.level });
    }
    if (m.level >= MAX_LEVEL) m.xp = 0;
    return ups;
  }

  /** Fim de qualquer encontro: capturas entram na coleção; exaustos voltam com um pouco de vigor. */
  onEncounterEnd(ev: { speciesId: string; result: string; level?: number }): void {
    if (ev.result === 'captured') {
      this.add(ev.speciesId, ev.level ?? STARTING_LEVEL);
      const sp = getSpecies(ev.speciesId);
      const share = Math.floor(xpReward(sp.rarity, ev.level ?? STARTING_LEVEL) / 2);
      for (const m of this.alive()) this.grantXp(m, share);
    }
    if (ev.result === 'lost') {
      this.healAll();
      return;
    }
    for (const m of this.members) if (m.hp <= 0) m.hp = Math.max(1, Math.ceil(this.maxHp(m) * REVIVE_FRACTION));
    this.save();
  }
}

export const party = new PartyState();

/** Liga o estado aos eventos do jogo (chamado uma vez em main.ts). */
export function bindParty(events: Phaser.Events.EventEmitter): void {
  events.on('encounter-end', (ev: { speciesId: string; result: string; level?: number }) => party.onEncounterEnd(ev));
}
