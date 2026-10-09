import './conservation.css';
import { FARM_CAPACITY, INCUBATOR_SLOTS, incubationMs, releaseReputation, reputationTitle, tradeReputation } from '../data/conservation';
import { getSpecies } from '../data/species';
import { conservation } from '../state/conservation';
import { esc, iucnBadge } from './format';

// PAINEL DO CENTRO DE CONSERVAÇÃO (aberto pela bióloga das vilas, ver VillageUI)
// DNA disponível, 3 incubadoras com barra de tempo, fazenda de filhotes (soltar / trocar) e reputação.
// Estado em src/state/conservation.ts; aqui só desenho e cliques. Painel de papel, como a loja.

/** Retrato da espécie para a interface ('' se a textura ainda não existe). */
export type SpeciesArt = (speciesId: string) => string;

const fmtTime = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export class ConservationPanel {
  readonly el: HTMLElement;
  private msg = '';
  /** Quais incubadoras estavam prontas no último desenho (para redesenhar quando mudar). */
  private readyMask = '';

  constructor(
    box: HTMLElement,
    private readonly art: SpeciesArt,
    private readonly onClose: () => void,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'vl-paper cv-panel';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-label', 'Centro de Conservação');
    this.el.hidden = true;
    box.appendChild(this.el);
    this.el.addEventListener('click', (ev) => this.onClick(ev));
    conservation.onChange(() => this.render());
  }

  get isOpen(): boolean {
    return !this.el.hidden;
  }

  open(owner: string): void {
    this.msg = '';
    this.owner = owner;
    this.el.hidden = false;
    this.render();
  }

  close(): void {
    if (this.el.hidden) return;
    this.el.hidden = true;
    this.onClose();
  }

  private owner = '';

  /** Atualiza barras e tempos sem redesenhar os botões (chamado a cada ~150 ms enquanto aberto). */
  tick(now = Date.now()): void {
    if (this.el.hidden) return;
    const mask = this.mask(now);
    if (mask !== this.readyMask) {
      this.render(now);
      return;
    }
    this.el.querySelectorAll<HTMLElement>('.cv-slot[data-slot]').forEach((row) => {
      const i = Number(row.dataset.slot);
      const s = conservation.slots[i];
      if (!s) return;
      const total = incubationMs(getSpecies(s.speciesId).iucn);
      const left = conservation.remaining(i, now);
      row.querySelector<HTMLElement>('.cv-fill')!.style.width = `${Math.round((1 - left / total) * 100)}%`;
      row.querySelector<HTMLElement>('.cv-time')!.textContent = left > 0 ? fmtTime(left) : 'Pronto!';
    });
  }

  private mask(now: number): string {
    return conservation.slots.map((s, i) => (s ? (conservation.remaining(i, now) > 0 ? 'w' : 'r') : 'e')).join('');
  }

  private pic(id: string): string {
    const src = this.art(id);
    return src ? `<img class="vl-ico cv-pic" src="${src}" alt="" draggable="false" />` : `<span class="vl-ico cv-pic"></span>`;
  }

  private render(now = Date.now()): void {
    if (this.el.hidden) return;
    this.readyMask = this.mask(now);
    const rep = conservation.reputation;
    const dna = conservation.dnaEntries();
    const slotsFree = conservation.slots.some((s) => !s);

    const dnaHtml = dna.length
      ? dna
          .map(([id, n]) => {
            const sp = getSpecies(id);
            return `
          <li class="vl-row">
            ${this.pic(id)}
            <div class="vl-info"><b>${esc(sp.name)} ${iucnBadge(sp.iucn, false)}</b><span class="vl-own">DNA: ×${n} · incubação ${Math.round(incubationMs(sp.iucn) / 60_000)} min</span></div>
            <div class="vl-buy"><button class="vl-btn" data-action="incubate" data-id="${id}" ${slotsFree ? '' : 'disabled'}>Incubar</button></div>
          </li>`;
          })
          .join('')
      : `<li class="cv-empty">Sem amostras. Capture espécies ameaçadas (VU, EN ou CR) para coletar DNA.</li>`;

    const slotsHtml = conservation.slots
      .map((s, i) => {
        if (!s) return `<li class="cv-slot cv-free"><span class="cv-n">${i + 1}</span><span class="vl-desc">Incubadora livre</span></li>`;
        const sp = getSpecies(s.speciesId);
        const left = conservation.remaining(i, now);
        const total = incubationMs(sp.iucn);
        return `
        <li class="cv-slot" data-slot="${i}">
          <span class="cv-n">${i + 1}</span>
          ${this.pic(s.speciesId)}
          <div class="vl-info">
            <b>${esc(sp.name)}</b>
            <div class="cv-bar"><i class="cv-fill" style="width:${Math.round((1 - left / total) * 100)}%"></i></div>
          </div>
          <span class="cv-time">${left > 0 ? fmtTime(left) : 'Pronto!'}</span>
          <button class="vl-btn" data-action="hatch" data-slot="${i}" ${left > 0 ? 'disabled' : ''}>Recolher</button>
        </li>`;
      })
      .join('');

    const farmHtml = conservation.farm.length
      ? conservation.farm
          .map((c) => {
            const sp = getSpecies(c.speciesId);
            return `
          <li class="vl-row">
            ${this.pic(c.speciesId)}
            <div class="vl-info">
              <b>${esc(sp.name)} ${iucnBadge(sp.iucn, false)}</b>
              <span class="vl-desc">Soltar: reputação +${releaseReputation(sp.iucn)} e XP ao time · Trocar: reputação +${tradeReputation(sp.iucn)}, moedas e frutas</span>
            </div>
            <div class="vl-buy">
              <button class="vl-btn" data-action="release" data-uid="${c.uid}">Soltar</button>
              <button class="vl-btn cv-alt" data-action="trade" data-uid="${c.uid}">Trocar</button>
            </div>
          </li>`;
          })
          .join('')
      : `<li class="cv-empty">Nenhum filhote na fazenda.</li>`;

    this.el.innerHTML = `
      <header>
        <b class="vl-title">Centro de Conservação · ${esc(this.owner)}</b>
        <button class="vl-x" data-action="close-cv" aria-label="Fechar o Centro de Conservação">×</button>
      </header>
      <div class="cv-body">
        <p class="cv-rep">Reputação: <b>${rep}</b> · <b>${esc(reputationTitle(rep))}</b></p>
        <h3 class="cv-h">Amostras de DNA</h3>
        <ul class="cv-list">${dnaHtml}</ul>
        <h3 class="cv-h">Incubadoras (${INCUBATOR_SLOTS})</h3>
        <ul class="cv-list">${slotsHtml}</ul>
        <h3 class="cv-h">Fazenda (${conservation.farm.length}/${FARM_CAPACITY})</h3>
        <ul class="cv-list">${farmHtml}</ul>
      </div>
      <p class="vl-msg" aria-live="polite">${esc(this.msg)}</p>
      <p class="vl-foot">Animais silvestres nunca são comprados nem vendidos. Filhotes só são soltos na natureza ou entregues a projetos de reintrodução.</p>`;
  }

  private onClick(ev: MouseEvent): void {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!el) return;
    (document.activeElement as HTMLElement | null)?.blur?.();
    switch (el.dataset.action) {
      case 'close-cv':
        this.close();
        return;
      case 'incubate':
        this.msg = conservation.incubate(el.dataset.id ?? '').msg;
        break;
      case 'hatch':
        this.msg = conservation.hatch(Number(el.dataset.slot)).msg;
        break;
      case 'release':
        this.msg = conservation.release(el.dataset.uid ?? '').msg;
        break;
      case 'trade':
        this.msg = conservation.trade(el.dataset.uid ?? '').msg;
        break;
      default:
        return;
    }
    this.render();
  }
}
