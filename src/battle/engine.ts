import { getMove, profileFor, typeMultiplier, type BType, type Move, type StatKey } from '../data/battle';
import { getSpecies, type Rarity } from '../data/species';

// MOTOR DA BATALHA: lógica pura (sem Phaser nem DOM), toda aleatoriedade vem de um `Rng`.
//
// Stats: stat = floor(base * nível / 50) + 5; vigor máximo = floor(base * nível / 25) + nível + 10.
// Dano:  floor((2*nível/5 + 2) * poder * força/defesa / 50 + 2) * STAB * eficácia * crítico * variação
//        STAB = 1,5 se o golpe é de um dos tipos de quem ataca; crítico = 1 em 12 (golpes `highCrit`: 1 em 6), x1,5;
//        variação = 0,85 a 1,00; selvagem causa WILD_DAMAGE_MULT do dano (batalha pensada para o time vencer).
// Estágios (-3 a +3): multiplicador (2+n)/2 se n>0, 2/(2-n) se n<0, em força, defesa e agilidade.

export type Rng = () => number;
export type Side = 'player' | 'wild';

export const MAX_LEVEL = 50;
export const STAGE_LIMIT = 3;
export const STAB = 1.5;
export const CRIT_CHANCE = 1 / 12;
export const HIGH_CRIT_CHANCE = 1 / 6;
export const CRIT_MULT = 1.5;
export const WILD_DAMAGE_MULT = 0.85;
const DMG_DIV = 40;

export interface Combatant {
  /** uid do membro do time (jogador) ou 'wild'. */
  uid: string;
  speciesId: string;
  name: string;
  side: Side;
  level: number;
  types: BType[];
  stats: Record<StatKey, number>;
  maxHp: number;
  hp: number;
  moves: Move[];
  stages: Record<StatKey, number>;
  /** Perde a próxima ação (susto ou choque). */
  dazed: boolean;
}

export const statAt = (base: number, level: number) => Math.floor((base * level) / 50) + 5;
export const maxHpAt = (base: number, level: number) => Math.floor((base * level) / 20) + level + 10;

export function maxHpFor(speciesId: string, level: number): number {
  return maxHpAt(profileFor(getSpecies(speciesId)).stats.vigor, level);
}

/** `hp` omitido = vigor cheio. */
export function makeCombatant(speciesId: string, level: number, side: Side, uid: string, hp?: number): Combatant {
  const sp = getSpecies(speciesId);
  const prof = profileFor(sp);
  const maxHp = maxHpAt(prof.stats.vigor, level);
  return {
    uid,
    speciesId,
    name: sp.name,
    side,
    level,
    types: [...prof.types],
    stats: {
      forca: statAt(prof.stats.forca, level),
      defesa: statAt(prof.stats.defesa, level),
      agilidade: statAt(prof.stats.agilidade, level),
    },
    maxHp,
    hp: Math.max(0, Math.min(maxHp, hp ?? maxHp)),
    moves: prof.moves.slice(0, 4).map(getMove),
    stages: { forca: 0, defesa: 0, agilidade: 0 },
    dazed: false,
  };
}

export const stageMult = (n: number) => (n >= 0 ? (2 + n) / 2 : 2 / (2 - n));
export const effStat = (c: Combatant, k: StatKey) => c.stats[k] * stageMult(c.stages[k]);
export const isStab = (c: Combatant, m: Move) => m.type !== 'neutro' && c.types.includes(m.type);
export const effectiveness = (m: Move, target: Combatant) => typeMultiplier(m.type, target.types);

export interface DamageRoll {
  damage: number;
  eff: number;
  crit: boolean;
  stab: boolean;
}

/** Dano médio sem crítico (variação 0,925): para a IA escolher golpes. */
export function expectedDamage(att: Combatant, def: Combatant, move: Move): number {
  if (move.power <= 0) return 0;
  return rawDamage(att, def, move, 0.925, false).damage;
}

function rawDamage(att: Combatant, def: Combatant, move: Move, variation: number, crit: boolean): DamageRoll {
  const eff = effectiveness(move, def);
  const stab = isStab(att, move);
  const base = Math.floor(((2 * att.level) / 5 + 2) * move.power * (effStat(att, 'forca') / effStat(def, 'defesa')) / DMG_DIV + 2);
  let dmg = base * (stab ? STAB : 1) * eff * (crit ? CRIT_MULT : 1) * variation;
  if (att.side === 'wild') dmg *= WILD_DAMAGE_MULT;
  return { damage: eff === 0 ? 0 : Math.max(1, Math.floor(dmg)), eff, crit, stab };
}

export function rollDamage(att: Combatant, def: Combatant, move: Move, rng: Rng): DamageRoll {
  const crit = rng() < (move.highCrit ? HIGH_CRIT_CHANCE : CRIT_CHANCE);
  const variation = 0.85 + rng() * 0.15;
  return rawDamage(att, def, move, variation, crit);
}

export type Step =
  | { kind: 'miss' }
  | { kind: 'hit'; damage: number; eff: number; crit: boolean }
  | { kind: 'stat'; who: 'user' | 'target'; stat: StatKey; delta: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'daze' };

const clampStage = (n: number) => Math.max(-STAGE_LIMIT, Math.min(STAGE_LIMIT, n));

/**
 * Executa um golpe, alterando vigor, estágios e susto dos dois lados, e devolve o que aconteceu
 * (para a cena animar). `delta` 0 em 'stat' = já estava no limite.
 */
export function useMove(att: Combatant, def: Combatant, move: Move, rng: Rng): Step[] {
  const steps: Step[] = [];
  if (rng() * 100 >= move.accuracy) return [{ kind: 'miss' }];
  if (move.power > 0) {
    const r = rollDamage(att, def, move, rng);
    const dealt = Math.min(def.hp, r.damage);
    def.hp -= dealt;
    steps.push({ kind: 'hit', damage: dealt, eff: r.eff, crit: r.crit });
  }
  const fx = move.effect;
  if (!fx) return steps;
  if (def.hp <= 0 && fx.kind !== 'heal' && fx.kind !== 'raise') return steps;
  if (fx.kind !== 'heal' && fx.chance !== undefined && rng() >= fx.chance) return steps;
  switch (fx.kind) {
    case 'drop':
    case 'raise': {
      const who = fx.kind === 'drop' ? 'target' : 'user';
      const c = fx.kind === 'drop' ? def : att;
      const before = c.stages[fx.stat];
      c.stages[fx.stat] = clampStage(before + (fx.kind === 'drop' ? -fx.stages : fx.stages));
      steps.push({ kind: 'stat', who, stat: fx.stat, delta: c.stages[fx.stat] - before });
      break;
    }
    case 'daze':
      def.dazed = true;
      steps.push({ kind: 'daze' });
      break;
    case 'heal': {
      const amount = Math.min(att.maxHp - att.hp, Math.ceil(att.maxHp * fx.fraction));
      att.hp += amount;
      steps.push({ kind: 'heal', amount });
      break;
    }
  }
  return steps;
}

/** Se estava assustado, perde a ação e o susto passa. */
export function consumeDaze(c: Combatant): boolean {
  if (!c.dazed) return false;
  c.dazed = false;
  return true;
}

/** `a` age antes de `b`? Mais ágil primeiro; empate no cara ou coroa. */
export function actsFirst(a: Combatant, b: Combatant, rng: Rng): boolean {
  const sa = effStat(a, 'agilidade');
  const sb = effStat(b, 'agilidade');
  return sa === sb ? rng() < 0.5 : sa > sb;
}

/** Escolha do selvagem: em geral o golpe de maior dano esperado, às vezes outro (ou um golpe de efeito). */
export function pickWildMove(wild: Combatant, target: Combatant, rng: Rng): Move {
  const dmg = wild.moves.filter((m) => m.power > 0);
  const status = wild.moves.filter((m) => m.power === 0);
  const r = rng();
  if (status.length && r < 0.22) {
    const s = status[Math.floor(rng() * status.length)];
    const fx = s.effect;
    const useless = fx?.kind === 'heal' ? wild.hp > wild.maxHp * 0.6 : fx?.kind === 'raise' && wild.stages[fx.stat] >= 2;
    if (!useless) return s;
  }
  if (!dmg.length) return wild.moves[0];
  if (r > 0.82) return dmg[Math.floor(rng() * dmg.length)];
  // Maior dano esperado ponderado pela precisão.
  return dmg.reduce((best, m) => (expectedDamage(wild, target, m) * m.accuracy > expectedDamage(wild, target, best) * best.accuracy ? m : best));
}

/** Chance de escapar; cada tentativa falha aumenta a seguinte. */
export function fleeChance(player: Combatant, wild: Combatant, failed: number): number {
  const base = 0.55 + (effStat(player, 'agilidade') - effStat(wild, 'agilidade')) / 80;
  return Math.max(0.3, Math.min(0.95, base + failed * 0.15));
}

// ---------------------------------------------------------------- níveis e XP

const RARITY_LEVEL_OFFSET: Record<Rarity, number> = { comum: -2, incomum: -1, rara: 0, lendaria: 2 };
const RARITY_XP: Record<Rarity, number> = { comum: 40, incomum: 55, rara: 75, lendaria: 110 };

/** Nível do selvagem: perto do melhor do time, mais alto nas espécies raras. */
export function rollWildLevel(rarity: Rarity, topLevel: number, rng: Rng): number {
  const l = topLevel + RARITY_LEVEL_OFFSET[rarity] + Math.floor(rng() * 3) - 1;
  return Math.max(2, Math.min(MAX_LEVEL, l));
}

/** XP necessário para sair do nível `level` para o seguinte. */
export const xpToNext = (level: number) => 20 + 10 * level;

/** XP de quem participa de uma batalha vencida (atordoar). */
export function xpReward(rarity: Rarity, wildLevel: number): number {
  return Math.floor((RARITY_XP[rarity] * wildLevel) / 5);
}
