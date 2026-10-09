import type Phaser from 'phaser';
import { getSpecies, type Habitat } from '../data/species';
import { party } from '../state/party';
import { rollWildLevel } from './engine';

// CONTRATO DO FLUXO DE ENCONTRO
// A exploração chama beginEncounter() e congela ao receber 'encounter-start'; volta ao receber
// 'encounter-end' (emitido exatamente uma vez por encontro). Animais grandes passam pela batalha
// por turnos (atordoar) antes da captura; pequenos e médios vão direto para a captura.
//
//   grande  -> Battle -> 'stunned' -> Capture (stunned: true) -> captured | fled | ran
//                     -> 'ran' (fugiu da batalha) | 'lost' (time todo exausto)
//   pequeno/médio -> Capture -> captured | fled | ran
//
// Eventos do jogo: 'battle-done' { speciesId, result } e 'capture-done' { speciesId, result }
// são internos do fluxo; quem observa o encontro ouve só 'encounter-start' / 'encounter-end'.

export interface EncounterRequest {
  speciesId: string;
  habitat: Habitat;
  /** Nível do animal selvagem; se faltar, o fluxo sorteia perto do melhor do time. */
  level?: number;
}

export type EncounterResult = 'captured' | 'fled' | 'ran' | 'lost';

export interface EncounterEnd extends EncounterRequest {
  result: EncounterResult;
}

export type BattleResult = 'stunned' | 'ran' | 'lost';

interface Teardown {
  (): void;
}
let current: Teardown | null = null;

export function beginEncounter(game: Phaser.Game, req: EncounterRequest): void {
  current?.(); // um encontro novo substitui qualquer restante de um anterior
  const species = getSpecies(req.speciesId);
  party.regen();
  const level = req.level ?? rollWildLevel(species.rarity, party.topLevel(), Math.random);
  const full: EncounterRequest = { ...req, level };

  let ended = false;
  const onBattle = ({ result }: { result: BattleResult }) => {
    game.events.off('battle-done', onBattle);
    if (result === 'stunned') startCapture(true);
    else end(result);
  };
  const onCapture = ({ result }: { result: EncounterResult }) => {
    game.events.off('capture-done', onCapture);
    end(result);
  };
  const teardown = () => {
    game.events.off('battle-done', onBattle);
    game.events.off('capture-done', onCapture);
    ended = true;
    current = null;
  };
  const end = (result: EncounterResult) => {
    if (ended) return;
    teardown();
    game.events.emit('encounter-end', { ...full, result } satisfies EncounterEnd);
  };
  const startCapture = (stunned: boolean) => {
    game.events.on('capture-done', onCapture);
    game.scene.run('Capture', { speciesId: full.speciesId, habitat: full.habitat, stunned });
  };

  current = teardown;
  game.events.emit('encounter-start', full);
  if (species.size === 'grande') {
    party.ensureTeam();
    game.events.on('battle-done', onBattle);
    game.scene.run('Battle', { speciesId: full.speciesId, habitat: full.habitat, level });
  } else startCapture(false);
}
