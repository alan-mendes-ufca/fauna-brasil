import Phaser from 'phaser';
import { createAnimalAnims, paintAnimals } from '../art/animals';
import { createWildlifeAnims, paintWildlife } from '../art/wildlife';
import { createExplorerAnims, paintExplorer } from '../art/explorer';
import { paintNpcs } from '../art/npc';
import { HABITAT_LABEL } from '../data/biomes';
import { SPECIES, type Habitat } from '../data/species';
import { paintForestProps, paintForestTiles } from '../art/forest';
import { beginEncounter } from '../battle/flow';
import { party } from '../state/party';

const HABITATS = Object.keys(HABITAT_LABEL) as Habitat[];

/** Gera toda a arte procedural uma única vez. Para usar arte desenhada à mão, carregue PNGs com as mesmas chaves. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    paintForestTiles(this);
    paintForestProps(this);
    paintExplorer(this);
    createExplorerAnims(this);
    paintNpcs(this);
    paintAnimals(this);
    paintWildlife(this);
    createWildlifeAnims(this);
    createAnimalAnims(this);
    const params = new URLSearchParams(location.search);
    const dev = import.meta.env.DEV;
    const habitatOf = (sp: (typeof SPECIES)[number]) => {
      const wanted = params.get('habitat') as Habitat | null;
      return wanted && HABITATS.includes(wanted) ? wanted : sp.habitat[0];
    };
    // Atalho de desenvolvimento: ?capture=onca&habitat=agua abre a captura direto.
    const captureId = dev ? params.get('capture') : null;
    const species = captureId ? SPECIES.find((sp) => sp.id === captureId) : undefined;
    // ?battle=onca&habitat=agua[&lv=6] abre o encontro completo (batalha e captura); sem save usa um time de teste.
    const battleId = dev ? params.get('battle') : null;
    const battleSp = battleId ? SPECIES.find((sp) => sp.id === battleId) : undefined;
    // Em desenvolvimento, parâmetros de teste da exploração pulam a escolha do inicial (?nostarter também); ?starter a força.
    const skipStarter = dev && ['at', 'region', 'demo', 'nostarter'].some((k) => params.has(k));
    if (species) {
      this.scene.start('Capture', { speciesId: species.id, habitat: habitatOf(species) });
    } else if (battleSp) {
      if (!party.hasStarter()) party.useTestTeam();
      this.game.events.once('encounter-end', () => this.scene.start('Overworld', { region: 'amazonia' }));
      beginEncounter(this.game, { speciesId: battleSp.id, habitat: habitatOf(battleSp), level: params.has('lv') ? Number(params.get('lv')) : undefined });
      this.scene.stop();
    } else if (dev && params.has('gallery')) this.scene.start('Gallery');
    else if (dev && params.has('starter')) {
      party.ephemeral = true;
      this.scene.start('Starter');
    } else if (!party.hasStarter() && !skipStarter) this.scene.start('Starter');
    else this.scene.start('Overworld', { region: params.get('region') ?? 'amazonia' });
  }
}
