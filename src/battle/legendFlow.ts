import type Phaser from 'phaser';
import { ITEMS } from '../data/items';
import { LEGENDS, type Legend } from '../data/legends';
import { getSpecies } from '../data/species';
import { bag } from '../state/bag';
import { legends } from '../state/legends';
import { party } from '../state/party';

// FLUXO DA BATALHA DE GUARDIÃO LENDÁRIO
// A exploração congela, chama beginLegend() e volta ao receber 'legend-end' (emitido exatamente uma vez).
// A BattleScene luta em modo guardião (ver BattleInit.legend): um só adversário, em fases, sem captura. A fuga sempre funciona.
//
//   'won'   -> recompensa (moedas, item, título; o XP é dado pela própria batalha)
//   'lost'  -> o guardião volta a dormir
//   'fled'  -> o guardião volta a dormir (sem recompensa e sem marcar vitória)
//
// Eventos: 'legend-end' { legendId, result }; 'coins-earned' { amount } quando há moedas.

export type LegendEndResult = 'won' | 'lost' | 'fled';

export interface LegendEnd {
  legendId: string;
  result: LegendEndResult;
}

let current: (() => void) | null = null;

/** Aplica a recompensa da vitória (moedas, item, título) e devolve a mensagem final. */
function awardWin(game: Phaser.Game, legend: Legend): string {
  const r = legends.win(legend.id);
  if (!r.ok) return r.msg;
  if (!r.firstTime) return `${legend.name} dorme de novo. O título ${r.title} continua seu.`;
  const { coins, item } = legend.reward;
  if (coins > 0) {
    bag.earn(coins);
    game.events.emit('coins-earned', { amount: coins });
  }
  if (item) bag.grant(item.id, item.qty);
  const itemText = item ? ` e ${item.qty}x ${ITEMS[item.id].name}` : '';
  return `Você apaziguou ${legend.name}! Ganhou ${coins} moedas${itemText} e o título ${r.title}!`;
}

export function beginLegend(game: Phaser.Game, legendId: string): void {
  current?.(); // uma batalha nova substitui qualquer restante de uma anterior
  const legend = LEGENDS.find((l) => l.id === legendId);
  if (!legend) return;
  party.ensureTeam();
  party.regen();

  const teardown = () => {
    game.events.off('battle-done', onBattle);
    current = null;
  };
  const onBattle = ({ result }: { result: string }) => {
    teardown();
    // Vitória ou fuga: quem caiu volta com um pouco de vigor; derrota: o time descansa por inteiro (regras do party).
    const outcome: LegendEndResult = result === 'won' ? 'won' : result === 'ran' ? 'fled' : 'lost';
    party.onEncounterEnd({ speciesId: legend.baseSpecies, result: outcome === 'lost' ? 'lost' : 'ran' });
    game.events.emit('legend-end', { legendId, result: outcome } satisfies LegendEnd);
  };
  current = teardown;
  game.events.on('battle-done', onBattle);
  game.scene.run('Battle', {
    speciesId: legend.baseSpecies,
    habitat: getSpecies(legend.baseSpecies).habitat[0],
    level: legend.level,
    legend: { legend, onWin: () => awardWin(game, legend) },
  });
}
