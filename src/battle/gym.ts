import type Phaser from 'phaser';
import { GYMS } from '../data/gyms';
import { getSpecies } from '../data/species';
import { bag } from '../state/bag';
import { gyms } from '../state/gyms';
import { party } from '../state/party';

// FLUXO DO DESAFIO DE GINÁSIO
// A exploração congela, chama beginGym() e volta ao receber 'gym-end' (emitido exatamente uma vez).
// A BattleScene luta em modo ginásio (ver BattleInit.gym): um animal do líder por vez, sem captura nem fuga.
//
//   'won'  -> insígnia (e moedas, só na primeira vez) | 'lost' -> time exausto, sem insígnia
//
// Eventos: 'gym-end' { regionId, result }; 'coins-earned' { amount } quando há moedas.

export type GymEndResult = 'won' | 'lost';

export interface GymEnd {
  regionId: string;
  result: GymEndResult;
}

let current: (() => void) | null = null;

/** Aplica o prêmio da vitória (insígnia + moedas) e devolve a mensagem final. */
function awardWin(game: Phaser.Game, regionId: string): string {
  const leader = GYMS[regionId].leader.name;
  const r = gyms.win();
  if (!r.ok) return r.msg;
  if (r.coins > 0) {
    bag.earn(r.coins);
    game.events.emit('coins-earned', { amount: r.coins });
  }
  return r.firstTime
    ? `Você venceu o time de ${leader}! Ganhou a ${r.badge} e ${r.coins} moedas!`
    : `Você venceu o time de ${leader} de novo! A ${r.badge} continua sua.`;
}

export function beginGym(game: Phaser.Game, regionId: string): void {
  current?.(); // um desafio novo substitui qualquer restante de um anterior
  const gym = GYMS[regionId];
  const first = gyms.start(regionId);
  if (!gym || !first) return;
  party.ensureTeam();
  party.regen();

  const teardown = () => {
    game.events.off('battle-done', onBattle);
    current = null;
  };
  const onBattle = ({ result }: { result: string }) => {
    teardown();
    const won = result === 'won';
    if (!won) gyms.lose();
    // Vitória: quem caiu volta com um pouco de vigor; derrota: o time descansa por inteiro (regras do party).
    party.onEncounterEnd({ speciesId: first.speciesId, result: won ? 'ran' : 'lost' });
    game.events.emit('gym-end', { regionId, result: won ? 'won' : 'lost' } satisfies GymEnd);
  };
  current = teardown;
  game.events.on('battle-done', onBattle);
  game.scene.run('Battle', {
    speciesId: first.speciesId,
    habitat: getSpecies(first.speciesId).habitat[0],
    level: first.level,
    gym: { leader: gym.leader.name, next: () => gyms.advance(), onWin: () => awardWin(game, regionId) },
  });
}
