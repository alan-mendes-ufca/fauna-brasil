import './gym.css';
import { GYMS, GYM_IDS } from '../data/gyms';
import { getSpecies } from '../data/species';
import { gyms } from '../state/gyms';
import { esc } from './format';

// PAINEL DO GINÁSIO (aberto pelo líder da vila, ver VillageUI)
// Mostra o líder, o time dele e se a insígnia já é sua; "Desafiar" inicia a sequência de batalhas.
// Estado em src/state/gyms.ts; o fluxo da luta em src/battle/gym.ts. Painel de papel, como a loja.

/** Retrato da espécie para a interface ('' se a textura ainda não existe). */
export type SpeciesArt = (speciesId: string) => string;

export class GymPanel {
  readonly el: HTMLElement;
  private regionId = '';

  constructor(
    box: HTMLElement,
    private readonly art: SpeciesArt,
    private readonly onChallenge: (regionId: string) => void,
    private readonly onClose: () => void,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'vl-paper gy-panel';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-label', 'Ginásio');
    this.el.hidden = true;
    box.appendChild(this.el);
    this.el.addEventListener('click', (ev) => this.onClick(ev));
    gyms.onChange(() => this.render());
  }

  get isOpen(): boolean {
    return !this.el.hidden;
  }

  open(regionId: string): void {
    if (!GYMS[regionId]) return;
    this.regionId = regionId;
    this.el.hidden = false;
    this.render();
  }

  close(): void {
    if (this.el.hidden) return;
    this.el.hidden = true;
    this.onClose();
  }

  private pic(id: string): string {
    const src = this.art(id);
    return src ? `<img class="vl-ico gy-pic" src="${src}" alt="" draggable="false" />` : `<span class="vl-ico gy-pic"></span>`;
  }

  private render(): void {
    if (this.el.hidden) return;
    const gym = GYMS[this.regionId];
    const won = gyms.has(gym.regionId);
    const team = gym.team
      .map((f) => {
        const sp = getSpecies(f.speciesId);
        return `
        <li class="vl-row">
          ${this.pic(f.speciesId)}
          <div class="vl-info"><b>${esc(sp.name)}</b><span class="vl-own">Nível ${f.level}</span></div>
        </li>`;
      })
      .join('');
    const badges = GYM_IDS.map((id) => {
      const g = GYMS[id];
      const has = gyms.has(id);
      return `<li class="gy-badge ${has ? 'has' : ''}" title="${esc(g.badge)}"><i aria-hidden="true"></i><span>${has ? esc(g.badge) : '???'}</span></li>`;
    }).join('');

    this.el.innerHTML = `
      <header>
        <b class="vl-title">${esc(gym.name)}</b>
        <button class="vl-x" data-action="close-gy" aria-label="Fechar o ginásio">×</button>
      </header>
      <div class="gy-body">
        <p class="gy-leader"><b>${esc(gym.leader.name)}</b>, líder do ginásio: “${esc(gym.leader.line)}”</p>
        <p class="gy-status ${won ? 'won' : ''}">${won ? `Você já tem a ${esc(gym.badge)}. Dá para enfrentar o líder de novo, sem novo prêmio.` : `Vença o time inteiro para ganhar a ${esc(gym.badge)} e ${gym.coins} moedas.`}</p>
        <h3 class="gy-h">Time do líder</h3>
        <ul class="gy-list">${team}</ul>
        <p class="vl-foot">Uma batalha de cada vez, sem captura nem fuga. Se o seu time cair, o desafio termina; descanse e volte.</p>
        <button class="vl-btn gy-go" data-action="challenge">${won ? 'Desafiar de novo' : 'Desafiar'}</button>
        <h3 class="gy-h">Insígnias (${gyms.count()}/${GYM_IDS.length})</h3>
        <ul class="gy-badges">${badges}</ul>
      </div>`;
  }

  private onClick(ev: MouseEvent): void {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!el) return;
    (document.activeElement as HTMLElement | null)?.blur?.();
    if (el.dataset.action === 'close-gy') this.close();
    else if (el.dataset.action === 'challenge') {
      const id = this.regionId;
      this.close();
      this.onChallenge(id);
    }
  }
}
