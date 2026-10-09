import './village.css';
import { ITEMS, ITEM_IDS, type ItemId } from '../data/items';
import type { NpcDef } from '../data/types';
import { LEGENDS } from '../data/legends';
import { REGIONS } from '../data/regions';
import { bag } from '../state/bag';
import { legends } from '../state/legends';
import { ConservationPanel } from './conservation';
import { GymPanel } from './gym';
import { esc } from './format';

// INTERFACE DAS VILAS
// Moedas e mochila no topo; diálogo com moradores na parte de baixo; loja e mochila em painéis
// de papel. Tudo em DOM sobre o canvas, com o mesmo `--s` do GameUI. Quem escuta `bag.onChange`
// redesenha os números; o clique nunca vira movimento do personagem.

export interface VillageHandlers {
  /** Avisa quando algum painel desta interface abre ou fecha (o jogo pausa a exploração). */
  onModal(open: boolean): void;
  /** True em cenas de tela cheia (captura, batalha, escolha do inicial): a interface some. */
  isFullScreen(): boolean;
  /** Retrato de uma espécie para o Centro de Conservação ('' se não houver). */
  speciesArt?(speciesId: string): string;
  /** O jogador pediu para desafiar o ginásio da região (o jogo começa a sequência de batalhas). */
  onGymChallenge?(regionId: string): void;
}

interface Bus {
  on(event: string, fn: (p: any) => void): unknown; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** Moeda 10×10 (mesma convenção de `icon` de items.ts: '.' é transparente). */
const COIN_ICON = [
  '..oooooo..',
  '.oYYYYYYo.',
  'oYYyyyyyDo',
  'oYyyyyyyDo',
  'oYyyyyyyDo',
  'oYyyyyyyDo',
  'oyyyyyyDDo',
  'oDDDDDDDDo',
  '.oDDDDDDo.',
  '..oooooo..',
];
const COIN_PALETTE: Record<string, string> = { o: '#8a5e10', Y: '#fff3b0', y: '#ffc23a', D: '#d08a18' };

/** Desenha um desenho em texto num canvas pequeno e devolve como imagem (1 pixel = 1 célula). */
function pixelUrl(rows: string[], palette: Record<string, string>): string {
  const canvas = document.createElement('canvas');
  canvas.width = rows[0]?.length ?? 0;
  canvas.height = rows.length;
  const g = canvas.getContext('2d');
  if (!g) return '';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      if (row[x] === '.' || !color) continue;
      g.fillStyle = color;
      g.fillRect(x, y, 1, 1);
    }
  });
  return canvas.toDataURL();
}

const COIN_URL = pixelUrl(COIN_ICON, COIN_PALETTE);
const iconCache = new Map<ItemId, string>();
function itemIcon(id: ItemId): string {
  let url = iconCache.get(id);
  if (url === undefined) {
    url = pixelUrl(ITEMS[id].icon, ITEMS[id].palette);
    iconCache.set(id, url);
  }
  return url;
}

/** Caderno de campo aberto? (o GameUI esconde o painel com `hidden`). */
function notebookOpen(): boolean {
  const layer = document.querySelector<HTMLElement>('.nb-layer');
  return !!layer && !layer.hidden;
}

const ROLE_LABEL: Record<NpcDef['role'], string> = { loja: 'Mercearia', centro: 'Centro de Conservação', ginasio: 'Líder de ginásio', morador: 'Morador da vila' };

export class VillageUI {
  private readonly hud: HTMLElement;
  private readonly coinsNum: HTMLElement;
  private readonly gain: HTMLElement;
  private readonly veil: HTMLElement;
  private readonly dialog: HTMLElement;
  private readonly shop: HTMLElement;
  private readonly bagPanel: HTMLElement;
  private readonly center: ConservationPanel;
  private readonly gymPanel: GymPanel;

  /** Índice da próxima fala de cada morador (em memória, recomeça no fim). */
  private readonly talkIdx = new Map<string, number>();
  private dialogNpc: NpcDef | null = null;
  private dialogRegion = '';
  private dialogLine = '';
  private shopMsg = '';
  private bagMsg = '';
  private gainTimer?: number;
  /** Último valor de "algum painel aberto" enviado a handlers.onModal. */
  private modal = false;

  constructor(
    root: HTMLElement,
    private readonly handlers: VillageHandlers,
    events: Bus,
  ) {
    const box = document.createElement('div');
    box.className = 'vl-box';
    box.innerHTML = `
      <div class="vl-hud">
        <div class="vl-chip" aria-label="Moedas">
          <img class="vl-coin" src="${COIN_URL}" alt="" draggable="false" />
          <b class="vl-coins-num">${bag.coins}</b>
          <span class="vl-gain" aria-live="polite"></span>
        </div>
        <button class="vl-bag-btn" data-action="bag" title="Mochila (I)" aria-label="Abrir a mochila">Mochila <kbd>I</kbd></button>
      </div>
      <div class="vl-veil" data-action="veil" hidden></div>
      <div class="vl-dialog" role="dialog" aria-label="Conversa" hidden>
        <div class="vl-speaker"><b class="vl-name"></b><span class="vl-role"></span></div>
        <p class="vl-line"></p>
        <button class="vl-btn vl-next" data-action="next"></button>
      </div>
      <div class="vl-paper vl-shop" role="dialog" aria-modal="true" aria-label="Loja" hidden>
        <header>
          <b class="vl-title"></b>
          <span class="vl-wallet"></span>
          <button class="vl-x" data-action="close-shop" aria-label="Fechar a loja">×</button>
        </header>
        <ul class="vl-list"></ul>
        <p class="vl-msg" aria-live="polite"></p>
        <p class="vl-foot">A loja não vende animais: bicho silvestre é da natureza.</p>
      </div>
      <div class="vl-paper vl-bag-panel" role="dialog" aria-modal="true" aria-label="Mochila" hidden>
        <header>
          <b class="vl-title">Mochila</b>
          <button class="vl-x" data-action="close-bag" aria-label="Fechar a mochila">×</button>
        </header>
        <p class="vl-lure" hidden></p>
        <ul class="vl-list"></ul>
        <p class="vl-empty" hidden>Mochila vazia. Compre itens na loja da vila.</p>
        <p class="vl-msg" aria-live="polite"></p>
        <section class="vl-legends" aria-label="Guardiões do folclore"></section>
      </div>`;
    root.appendChild(box);
    this.hud = box.querySelector('.vl-hud')!;
    this.coinsNum = box.querySelector('.vl-coins-num')!;
    this.gain = box.querySelector('.vl-gain')!;
    this.veil = box.querySelector('.vl-veil')!;
    this.dialog = box.querySelector('.vl-dialog')!;
    this.shop = box.querySelector('.vl-shop')!;
    this.bagPanel = box.querySelector('.vl-bag-panel')!;
    this.center = new ConservationPanel(box, (id) => this.handlers.speciesArt?.(id) ?? '', () => this.sync());
    this.gymPanel = new GymPanel(box, (id) => this.handlers.speciesArt?.(id) ?? '', (id) => this.handlers.onGymChallenge?.(id), () => this.sync());

    // O clique nos painéis nunca pode virar movimento do personagem.
    for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend']) {
      box.addEventListener(type, (ev) => ev.stopPropagation());
    }
    box.addEventListener('click', (ev) => this.onClick(ev));
    box.addEventListener('change', (ev) => this.onChange(ev));
    window.addEventListener('keydown', (ev) => this.onKey(ev), { capture: true });

    events.on('npc-talk', (p: { npc: NpcDef; regionId?: string }) => this.openDialog(p.npc, p.regionId ?? ''));
    events.on('coins-earned', (p: { amount: number }) => this.showGain(p.amount));
    bag.onChange(() => this.onBagChange());
    window.setInterval(() => this.tick(), 150);

    this.renderHud();
  }

  // ------------------------------------------------------------------ estado

  private anyOpen(): boolean {
    return !this.dialog.hidden || !this.shop.hidden || !this.bagPanel.hidden || this.center.isOpen || this.gymPanel.isOpen;
  }

  /** Atualiza o véu e avisa o jogo só quando o estado "algum painel aberto" muda. */
  private sync(): void {
    const open = this.anyOpen();
    this.veil.hidden = !open;
    this.veil.classList.toggle('dim', open && this.dialog.hidden === true);
    if (open !== this.modal) {
      this.modal = open;
      this.handlers.onModal(open);
    }
  }

  private tick(): void {
    const full = this.handlers.isFullScreen();
    if (full !== this.hud.hidden) this.hud.hidden = full;
    if (full && this.anyOpen()) this.closeAll();
    if (!this.bagPanel.hidden) this.renderLure();
    this.center.tick();
  }

  private closeAll(): void {
    this.dialog.hidden = true;
    this.shop.hidden = true;
    this.bagPanel.hidden = true;
    this.center.close();
    this.gymPanel.close();
    this.dialogNpc = null;
    this.sync();
  }

  // ------------------------------------------------------------------ moedas

  private renderHud(): void {
    this.coinsNum.textContent = String(bag.coins);
  }

  private showGain(amount: number): void {
    this.gain.textContent = `+${amount} moedas`;
    this.gain.classList.remove('show');
    void this.gain.offsetWidth;
    this.gain.classList.add('show');
    window.clearTimeout(this.gainTimer);
    this.gainTimer = window.setTimeout(() => this.gain.classList.remove('show'), 1700);
  }

  private onBagChange(): void {
    this.renderHud();
    if (!this.shop.hidden) this.refreshShop();
    if (!this.bagPanel.hidden) this.renderBag();
  }

  // ------------------------------------------------------------------ diálogo

  private openDialog(npc: NpcDef, regionId = ''): void {
    if (this.anyOpen() || this.handlers.isFullScreen()) return;
    const lines = npc.lines.length ? npc.lines : ['...'];
    const i = this.talkIdx.get(npc.id) ?? 0;
    this.dialogLine = lines[i % lines.length];
    this.talkIdx.set(npc.id, (i + 1) % lines.length);
    this.dialogNpc = npc;
    this.dialogRegion = regionId;

    this.dialog.querySelector('.vl-name')!.textContent = npc.name;
    this.dialog.querySelector('.vl-role')!.textContent = ROLE_LABEL[npc.role];
    this.dialog.querySelector('.vl-line')!.textContent = this.dialogLine;
    const next = this.dialog.querySelector<HTMLElement>('.vl-next')!;
    next.textContent = npc.role === 'loja' ? 'Ver a loja ›' : npc.role === 'centro' ? 'Abrir o Centro ›' : npc.role === 'ginasio' ? 'Ver o desafio ›' : 'Até mais ›';
    this.dialog.hidden = false;
    this.sync();
    next.focus({ preventScroll: true });
  }

  /** Avança o diálogo: a loja abre (se for vendedor); os demais moradores só se despedem. */
  private advanceDialog(): void {
    const npc = this.dialogNpc;
    if (!npc) return;
    this.dialog.hidden = true;
    this.dialogNpc = null;
    if (npc.role === 'loja') this.openShop(npc.name);
    else if (npc.role === 'centro') {
      this.center.open(npc.name);
      this.sync();
    } else if (npc.role === 'ginasio') {
      this.gymPanel.open(this.dialogRegion);
      this.sync();
    } else this.sync();
  }

  // ------------------------------------------------------------------ loja

  private openShop(owner: string): void {
    this.shopMsg = '';
    const list = this.shop.querySelector<HTMLElement>('.vl-list')!;
    list.innerHTML = ITEM_IDS.map((id) => {
      const it = ITEMS[id];
      return `
        <li class="vl-row" data-id="${id}">
          <img class="vl-ico" src="${itemIcon(id)}" alt="" draggable="false" />
          <div class="vl-info">
            <b>${esc(it.name)}</b>
            <span class="vl-desc">${esc(it.desc)}</span>
            <span class="vl-own"></span>
          </div>
          <div class="vl-buy">
            <span class="vl-price">${it.price} <img class="vl-mini-coin" src="${COIN_URL}" alt="" draggable="false" /></span>
            <button class="vl-btn" data-action="buy" data-id="${id}">Comprar</button>
          </div>
        </li>`;
    }).join('');
    this.shop.querySelector('.vl-title')!.textContent = `Loja · ${owner}`;
    this.shop.hidden = false;
    this.refreshShop();
    this.sync();
  }

  private closeShop(): void {
    this.shop.hidden = true;
    this.sync();
  }

  private refreshShop(): void {
    this.shop.querySelector('.vl-wallet')!.innerHTML = `Moedas: ${bag.coins} <img class="vl-mini-coin" src="${COIN_URL}" alt="" draggable="false" />`;
    this.shop.querySelectorAll<HTMLElement>('.vl-row').forEach((row) => {
      const id = row.dataset.id as ItemId;
      const it = ITEMS[id];
      row.querySelector('.vl-own')!.textContent = `Você tem: ${bag.count(id)}`;
      const btn = row.querySelector<HTMLButtonElement>('button')!;
      btn.disabled = bag.coins < it.price;
    });
    this.shop.querySelector<HTMLElement>('.vl-msg')!.textContent = this.shopMsg;
  }

  private buy(id: ItemId): void {
    const it = ITEMS[id];
    this.shopMsg = bag.buy(id) ? `${it.name} guardada na mochila.` : `Moedas insuficientes: ${it.name} custa ${it.price}.`;
    this.refreshShop();
  }

  // ------------------------------------------------------------------ mochila

  private openBag(): void {
    if (this.handlers.isFullScreen() || notebookOpen() || this.anyOpen()) return;
    this.bagMsg = '';
    this.bagPanel.hidden = false;
    this.renderBag();
    this.sync();
  }

  private closeBag(): void {
    this.bagPanel.hidden = true;
    this.sync();
  }

  private renderBag(): void {
    const list = this.bagPanel.querySelector<HTMLElement>('.vl-list')!;
    const owned = ITEM_IDS.filter((id) => bag.count(id) > 0);
    list.innerHTML = owned
      .map((id) => {
        const it = ITEMS[id];
        let action: string;
        if (it.use === 'mochila') {
          action = `<button class="vl-btn" data-action="use" data-id="${id}">Usar</button>`;
        } else {
          action = `<label class="vl-switch"><input type="checkbox" data-action="net" ${bag.useNet ? 'checked' : ''} /> <span>Usar nas capturas</span></label>`;
        }
        return `
        <li class="vl-row">
          <img class="vl-ico" src="${itemIcon(id)}" alt="" draggable="false" />
          <div class="vl-info">
            <b>${esc(it.name)} <span class="vl-own">×${bag.count(id)}</span></b>
            <span class="vl-desc">${esc(it.desc)}</span>
          </div>
          <div class="vl-buy">${action}</div>
        </li>`;
      })
      .join('');
    this.bagPanel.querySelector<HTMLElement>('.vl-empty')!.hidden = owned.length > 0;
    this.bagPanel.querySelector<HTMLElement>('.vl-msg')!.textContent = this.bagMsg;
    this.renderLure();
    this.renderLegends();
  }

  /** Guardiões do folclore: vencidos com título e lenda; os outros só como "???" e o bioma onde dormem. */
  private renderLegends(): void {
    const items = LEGENDS.map((l) => {
      const biome = esc(REGIONS[l.regionId]?.name ?? l.regionId);
      return legends.isDefeated(l.id)
        ? `<li class="vl-legend won"><b>${esc(l.name)}</b> <em>${esc(l.reward.title)}</em><span>${esc(l.lore)}</span></li>`
        : `<li class="vl-legend"><b>???</b> <em>${biome}</em><span>Um guardião dorme neste bioma. Capture um animal de peso cultural para despertá-lo.</span></li>`;
    }).join('');
    this.bagPanel.querySelector<HTMLElement>('.vl-legends')!.innerHTML = `<h3 class="vl-legends-h">Guardiões do folclore (${legends.count()}/${LEGENDS.length})</h3><ul>${items}</ul>`;
  }

  private renderLure(): void {
    const lure = this.bagPanel.querySelector<HTMLElement>('.vl-lure')!;
    const now = Date.now();
    if (!bag.lureActive(now)) {
      lure.hidden = true;
      return;
    }
    const min = Math.max(1, Math.ceil((bag.lureUntil - now) / 60_000));
    lure.hidden = false;
    lure.textContent = `Isca ativa: faltam ${min} min para espécies raras aparecerem mais.`;
  }

  private use(id: ItemId): void {
    const r = bag.use(id);
    this.bagMsg = r.msg;
    this.renderBag();
  }

  // ------------------------------------------------------------------ entrada

  private onClick(ev: MouseEvent): void {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!el) return;
    (document.activeElement as HTMLElement | null)?.blur?.();
    const id = el.dataset.id as ItemId | undefined;
    switch (el.dataset.action) {
      case 'bag':
        this.openBag();
        break;
      case 'veil':
        if (ev.target !== el) return;
        if (this.gymPanel.isOpen) this.gymPanel.close();
        else if (this.center.isOpen) this.center.close();
        else if (!this.shop.hidden) this.closeShop();
        else if (!this.bagPanel.hidden) this.closeBag();
        break;
      case 'next':
        this.advanceDialog();
        break;
      case 'close-shop':
        this.closeShop();
        break;
      case 'close-bag':
        this.closeBag();
        break;
      case 'buy':
        if (id) this.buy(id);
        break;
      case 'use':
        if (id) this.use(id);
        break;
    }
  }

  private onChange(ev: Event): void {
    const el = ev.target as HTMLElement;
    if (el.dataset.action === 'net') bag.setUseNet((el as HTMLInputElement).checked);
  }

  /** Esc fecha o painel de cima; com um painel aberto, C, Tab e N não chegam ao caderno nem à trilha. */
  private onKey(ev: KeyboardEvent): void {
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
    const key = ev.key;
    if (!this.anyOpen()) {
      if ((key === 'i' || key === 'I') && !ev.repeat && !this.handlers.isFullScreen() && !notebookOpen()) {
        ev.preventDefault();
        this.openBag();
      }
      return;
    }
    if (key === 'Escape') {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      if (this.gymPanel.isOpen) this.gymPanel.close();
      else if (this.center.isOpen) this.center.close();
      else if (!this.bagPanel.hidden) this.closeBag();
      else if (!this.shop.hidden) this.closeShop();
      else {
        this.dialog.hidden = true;
        this.dialogNpc = null;
        this.sync();
      }
      return;
    }
    if (key === 'c' || key === 'C' || key === 'Tab' || key === 'n' || key === 'N') {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      return;
    }
    if ((key === 'i' || key === 'I') && !this.bagPanel.hidden) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      this.closeBag();
      return;
    }
    if ((key === 'Enter' || key === ' ') && !this.dialog.hidden) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      if (!ev.repeat) this.advanceDialog();
    }
  }
}
