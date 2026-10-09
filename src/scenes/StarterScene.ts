import Phaser from 'phaser';
import { CAP_H, CAP_W } from '../art/captureBg';
import { paintCaptureBackground } from '../art/captureBackgrounds';
import { esc, fitStage, spriteUrl, typeChips } from '../battle/ui';
import { MOVES, profileFor, type Stats } from '../data/battle';
import { getSpecies } from '../data/species';
import { STARTING_LEVEL, party } from '../state/party';

// Primeira tela do jogo (sem save): a escolha do companheiro de expedição. Três espécies
// amazônicas de porte pequeno ou médio, cada uma de um tipo diferente.

export interface StarterInit {
  /** Cena que abre depois da escolha. */
  next?: { scene: string; data?: object };
}

const CHOICES: { id: string; note: string }[] = [
  { id: 'ariranha', note: 'Corajosa e veloz. Caça em família, e o mergulho derruba predadores.' },
  { id: 'arara', note: 'Voa alto, longe do alcance dos bichos de chão. Rápida e resistente.' },
  { id: 'perereca', note: 'Pequena e ágil, com a pele tóxica que faz predadores recuarem. Frágil.' },
];

const STAT_ROWS: [keyof Stats, string][] = [
  ['vigor', 'Vigor'],
  ['forca', 'Força'],
  ['defesa', 'Defesa'],
  ['agilidade', 'Agilidade'],
];

export class StarterScene extends Phaser.Scene {
  private root?: HTMLElement;
  private picked = -1;
  private next: StarterInit['next'];
  private offResize?: () => void;
  private onKey?: (e: KeyboardEvent) => void;
  private blink?: number;
  private leaving = false;

  constructor() {
    super('Starter');
  }

  init(data: StarterInit): void {
    this.next = data?.next;
    this.picked = -1;
    this.leaving = false;
  }

  create(): void {
    const cam = this.cameras.main;
    cam.setZoom(3).centerOn(CAP_W / 2, CAP_H / 2).setBackgroundColor('#04302f').fadeIn(400, 4, 16, 15);
    const { back, fx } = paintCaptureBackground(this, 'sub-bosque');
    this.add.image(CAP_W / 2, CAP_H / 2, back);
    this.add.image(CAP_W / 2, CAP_H / 2, fx).setBlendMode(Phaser.BlendModes.ADD);
    this.buildDom();
    const cleanup = () => {
      this.root?.remove();
      this.offResize?.();
      window.clearInterval(this.blink);
      if (this.onKey) window.removeEventListener('keydown', this.onKey);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
  }

  private buildDom(): void {
    const root = document.createElement('div');
    root.className = 'st';
    this.root = root;
    const cards = CHOICES.map(({ id, note }, i) => {
      const sp = getSpecies(id);
      const prof = profileFor(sp);
      const bars = STAT_ROWS.map(
        ([k, label]) =>
          `<li><span>${label}</span><div class="st-bar"><i style="width:${Math.round(Math.min(1, prof.stats[k] / 110) * 100)}%"></i></div></li>`,
      ).join('');
      const moves = prof.moves.map((m) => esc(MOVES[m].name)).join(' · ');
      return `<button type="button" class="st-card" data-i="${i}" aria-pressed="false">
        <span class="st-pin"></span>
        <div class="st-photo"><img class="px" src="${spriteUrl(this.textures, id, 0)}" data-id="${id}" alt="" draggable="false" /></div>
        <b class="st-name">${esc(sp.name)}</b>
        <em class="st-sci">${esc(sp.scientific)}</em>
        <div class="st-types">${typeChips(prof.types)}</div>
        <ul class="st-stats">${bars}</ul>
        <p class="st-note">${esc(note)}</p>
        <p class="st-moves"><b>Golpes</b>${moves}</p>
        <span class="st-stamp">Escolhido</span>
      </button>`;
    }).join('');
    root.innerHTML = `
      <div class="bt-stage st-stage">
        <header class="st-head">
          <span class="st-kicker">Primeira expedição</span>
          <h1>Escolha seu companheiro de campo</h1>
          <p>Ele luta ao seu lado quando um animal grande bloquear o caminho. Os outros você captura pela floresta.</p>
        </header>
        <div class="st-cards">${cards}</div>
        <footer class="st-foot">
          <span class="st-hint">Clique num cartão ou use as teclas <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></span>
          <button type="button" class="st-go" disabled>Levar na expedição</button>
        </footer>
      </div>`;
    document.body.append(root);
    this.offResize = fitStage(root.querySelector<HTMLElement>('.bt-stage')!);
    root.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const card = t.closest<HTMLElement>('.st-card');
      if (card) this.pick(Number(card.dataset.i));
      else if (t.closest('.st-go')) this.confirm();
    });
    this.onKey = (e) => {
      if (/^[1-3]$/.test(e.key)) this.pick(+e.key - 1);
      else if (e.key === 'Enter') this.confirm();
    };
    window.addEventListener('keydown', this.onKey);
    // Os animais "respiram": alterna os dois primeiros quadros do sprite.
    let f = 0;
    this.blink = window.setInterval(() => {
      f = 1 - f;
      root.querySelectorAll<HTMLImageElement>('.st-photo img').forEach((img) => (img.src = spriteUrl(this.textures, img.dataset.id!, f)));
    }, 650);
  }

  private pick(i: number): void {
    if (this.leaving || !CHOICES[i] || !this.root) return;
    this.picked = i;
    this.root.querySelectorAll<HTMLElement>('.st-card').forEach((c, j) => {
      c.classList.toggle('on', j === i);
      c.setAttribute('aria-pressed', String(j === i));
    });
    this.root.querySelector<HTMLButtonElement>('.st-go')!.disabled = false;
  }

  private confirm(): void {
    if (this.picked < 0 || this.leaving || !this.root) return;
    this.leaving = true;
    party.add(CHOICES[this.picked].id, STARTING_LEVEL);
    this.root.classList.add('leaving');
    this.cameras.main.fadeOut(500, 4, 16, 15);
    this.time.delayedCall(540, () => {
      const next = this.next ?? { scene: 'Overworld', data: { region: 'amazonia' } };
      this.scene.start(next.scene, next.data);
    });
  }
}
