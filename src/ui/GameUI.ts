import { SPECIES, type Species } from '../data/species';
import { DEX, dexDetail, dexMove, dexShell, SECTIONS, type DexStatus, type DexView } from './dex';
import { esc, gems, iucnBadge } from './format';

export interface Crop {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UIHandlers {
  /** Converte uma textura do jogo (pixel art) em URL de imagem para a interface. */
  art(key: string, crop?: Crop): string;
  /** True enquanto a cena 'Capture' está ativa (o HUD de exploração some). */
  isCapturing(): boolean;
  /** Avisa quando o caderno abre/fecha (o jogo pode congelar a exploração). */
  onNotebookToggle?(open: boolean): void;
}

type CaptureResult = 'captured' | 'fled' | 'ran';
interface CaptureDone {
  speciesId: string;
  result: CaptureResult;
}

interface SaveData {
  /** id da espécie -> data ISO (AAAA-MM-DD) da captura. */
  caught: Record<string, string>;
  /** Espécies avistadas (encontro iniciado) mas ainda não capturadas. */
  seen?: string[];
  hintDone: boolean;
}

const STORE_KEY = 'fauna-brasil:caderno:v1';
const SPRITE: Crop = { x: 0, y: 0, w: 64, h: 64 };
const BOOK_W = 940;
const BOOK_H = 560;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Interface em DOM sobre o canvas: placa de madeira do HUD, caderno de campo com uma página por
 * espécie, etiquetas de herbário nos avisos de captura. Guarda o progresso em localStorage
 * (opcional: sem ele o jogo funciona, só não lembra).
 */
export class GameUI {
  private caught: Record<string, string> = {};
  private seen = new Set<string>();
  private hintDone = false;
  private persist = true;
  private open = false;
  private page = 0;
  private unseen = false;
  private capturing = false;
  private region = 'Floresta Amazônica';

  private readonly rootEl: HTMLElement;
  private readonly hud: HTMLElement;
  private readonly hint: HTMLElement;
  private readonly toasts: HTMLElement;
  private readonly layer: HTMLElement;
  private readonly wrap: HTMLElement;
  private readonly book: HTMLElement;
  private hintTimer?: number;

  constructor(
    root: HTMLElement,
    private readonly handlers: UIHandlers,
    events: { on(event: string, fn: (p: any) => void): unknown }, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.rootEl = root;
    root.innerHTML = `
      <div class="hud">
        <div class="plaque"></div>
        <button class="nb-btn" data-action="toggle" title="Caderno de campo (C)" aria-label="Abrir o caderno de campo"></button>
      </div>
      <div class="hint" hidden><span>clique para andar</span></div>
      <div class="toasts"></div>
      <div class="nb-layer" data-action="backdrop" role="dialog" aria-modal="true" aria-label="Caderno de campo" hidden>
        <div class="nb-wrap"><div class="nb-book"></div></div>
      </div>`;
    this.hud = root.querySelector('.hud')!;
    this.hint = root.querySelector('.hint')!;
    this.toasts = root.querySelector('.toasts')!;
    this.layer = root.querySelector('.nb-layer')!;
    this.wrap = root.querySelector('.nb-wrap')!;
    this.book = root.querySelector('.nb-book')!;

    this.load();
    this.renderHud();

    // O clique em elementos da interface nunca pode virar movimento do personagem.
    for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend']) {
      root.addEventListener(type, (ev) => ev.stopPropagation());
    }
    root.addEventListener('click', (ev) => this.onClick(ev));
    window.addEventListener('keydown', (ev) => this.onKey(ev));
    window.addEventListener('resize', () => this.fit());
    // Some a dica de controle depois do primeiro clique no jogo (sem interferir nele).
    window.addEventListener('pointerdown', () => this.dismissHint(), { capture: true, once: true });

    events.on('capture-done', (p: CaptureDone) => this.onCaptureDone(p));
    events.on('dna-collected', (p: { speciesId: string; amount: number }) => this.onDna(p));
    events.on('encounter-start', (p: { speciesId: string }) => this.markSeen(p.speciesId));
    window.setInterval(() => this.syncScenes(), 120);

    this.fit();
    this.syncScenes();
    if (!this.hintDone) {
      this.hint.hidden = false;
      this.hintTimer = window.setTimeout(() => this.dismissHint(), 14000);
    }
  }

  setRegion(name: string): void {
    this.region = name;
    this.renderHud();
  }

  /** True enquanto o caderno cobre o jogo. */
  isBlocking(): boolean {
    return this.open;
  }

  /** Desenvolvimento (?demo=caderno): marca algumas espécies sem gravar nada e abre o caderno. */
  demo(): void {
    this.persist = false;
    const ids = ['arara', 'harpia', 'boto', 'morfo', 'preguica'];
    this.caught = {};
    ids.forEach((id, i) => (this.caught[id] = `2026-10-0${i + 1}`));
    this.renderHud();
    this.openBook(ids[0]);
  }

  // ------------------------------------------------------------------ persistência

  private load(): void {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Partial<SaveData>;
      for (const [id, date] of Object.entries(data.caught ?? {})) {
        if (SPECIES.some((s) => s.id === id) && typeof date === 'string') this.caught[id] = date;
      }
      for (const id of data.seen ?? []) if (SPECIES.some((sp) => sp.id === id)) this.seen.add(id);
      this.hintDone = data.hintDone === true;
    } catch {
      /* sem localStorage ou dados corrompidos: começa do zero */
    }
  }

  private save(): void {
    if (!this.persist) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ caught: this.caught, seen: [...this.seen], hintDone: this.hintDone } satisfies SaveData));
    } catch {
      /* ignorado: o jogo continua sem lembrar */
    }
  }

  // ------------------------------------------------------------------ jogo -> interface

  private art(id: string): string {
    return this.handlers.art(`animal_${id}`, SPRITE);
  }

  private sprite(id: string, known: boolean, cls = ''): string {
    const src = this.art(id);
    return src
      ? `<img class="px sprite ${known ? '' : 'sil'} ${cls}" src="${src}" alt="" draggable="false" />`
      : `<span class="sprite ${cls}"></span>`;
  }

  /** Esconde o HUD durante a captura (a cena tem HUD próprio) e fecha o caderno. */
  private syncScenes(): void {
    const cap = this.handlers.isCapturing();
    if (cap === this.capturing) return;
    this.capturing = cap;
    this.hud.hidden = cap;
    this.hint.classList.toggle('away', cap);
    if (cap && this.open) this.closeBook();
  }

  private dismissHint(): void {
    window.clearTimeout(this.hintTimer);
    this.hint.classList.add('gone');
    if (!this.hintDone) {
      this.hintDone = true;
      this.save();
    }
  }

  private onCaptureDone({ speciesId, result }: CaptureDone): void {
    const sp = SPECIES.find((s) => s.id === speciesId);
    if (!sp) return;
    if (result === 'captured') {
      const isNew = !this.caught[sp.id];
      if (isNew) {
        this.caught[sp.id] = today();
        this.unseen = true;
        this.save();
        this.renderHud(true);
      }
      this.toast(isNew ? this.newToast(sp) : this.simpleToast(sp, 'again'), isNew ? sp.id : undefined);
    } else {
      this.toast(this.simpleToast(sp, result));
    }
  }

  private onDna({ speciesId, amount }: { speciesId: string; amount: number }): void {
    const sp = SPECIES.find((s) => s.id === speciesId);
    if (!sp) return;
    this.toast(`
      <span class="toast-string"></span>
      <div class="toast-pic small">${this.sprite(sp.id, true)}</div>
      <div class="toast-body">
        <b class="kicker">Amostra de DNA coletada!</b>
        <span class="plain">${esc(sp.name)}: +${amount}. Leve à bióloga de uma vila para incubar.</span>
      </div>`);
  }

  // ------------------------------------------------------------------ HUD

  private renderHud(pulse = false): void {
    const n = Object.keys(this.caught).length;
    const total = SPECIES.length;
    const pips = SPECIES.map((s) => `<i class="${this.caught[s.id] ? 'on' : ''}"></i>`).join('');
    this.hud.querySelector('.plaque')!.innerHTML = `
      <div class="plaque-title"><i class="leaf"></i><span>${esc(this.region)}</span></div>
      <div class="plaque-count ${pulse ? 'pulse' : ''}">
        <span class="count-label">Espécies catalogadas</span>
        <b class="count-num">${n}<small>/${total}</small></b>
      </div>
      <div class="pips" aria-hidden="true">${pips}</div>`;
    this.hud.querySelector('.nb-btn')!.innerHTML = `
      <span class="nb-icon"><i class="band"></i><i class="mark">${this.unseen ? '!' : ''}</i></span>
      <span class="nb-text">Caderno <kbd>C</kbd></span>`;
  }

  // ------------------------------------------------------------------ avisos

  private newToast(sp: Species): string {
    return `
      <span class="toast-string"></span>
      <div class="toast-pic">${this.sprite(sp.id, true)}</div>
      <div class="toast-body">
        <b class="kicker">Nova espécie catalogada!</b>
        <span class="nm">${esc(sp.name)}</span>
        <em class="sci">${esc(sp.scientific)}</em>
        <span class="meta">${gems(sp.rarity)}${iucnBadge(sp.iucn, false)}<span class="open-tip">ver no caderno</span></span>
      </div>
      <span class="toast-stamp">NOVO</span>`;
  }

  private simpleToast(sp: Species, kind: 'again' | 'fled' | 'ran'): string {
    const text = {
      again: ['Espécime já catalogado', `${sp.name} reencontrado. Anotação atualizada.`],
      fled: ['Fugiu!', `${sp.name} sumiu entre as folhas.`],
      ran: ['Você recuou', `${sp.name} seguiu o caminho dele.`],
    }[kind];
    return `
      <span class="toast-string"></span>
      <div class="toast-pic small">${this.sprite(sp.id, kind === 'again')}</div>
      <div class="toast-body">
        <b class="kicker">${text[0]}</b>
        <span class="plain">${esc(text[1])}</span>
      </div>`;
  }

  private toast(html: string, openId?: string): void {
    const el = document.createElement('div');
    el.className = `toast ${openId ? 'new' : 'plainish'}`;
    if (openId) {
      el.dataset.action = 'open-entry';
      el.dataset.id = openId;
    }
    el.innerHTML = html;
    window.setTimeout(() => {
      this.toasts.append(el);
      while (this.toasts.children.length > 3) this.toasts.firstElementChild?.remove();
      window.setTimeout(() => el.classList.add('out'), openId ? 5600 : 3400);
      window.setTimeout(() => el.remove(), openId ? 6000 : 3800);
    }, 380);
  }

  // ------------------------------------------------------------------ caderno

  private fit(): void {
    const s = Math.max(0.8, Math.min(2, Math.min(window.innerWidth / 960, window.innerHeight / 640)));
    this.rootEl.style.setProperty('--s', s.toFixed(3));
    const k = Math.max(0.35, Math.min(1.5, (window.innerWidth - 20) / BOOK_W, (window.innerHeight - 20) / BOOK_H));
    this.wrap.style.setProperty('--k', k.toFixed(3));
  }

  private markSeen(id: string): void {
    if (this.seen.has(id) || this.caught[id]) return;
    this.seen.add(id);
    this.save();
  }

  private readonly view: DexView = {
    status: (id): DexStatus => (this.caught[id] ? 'caught' : this.seen.has(id) ? 'seen' : 'unknown'),
    caughtOn: (id) => this.caught[id],
    sprite: (id, known, cls) => this.sprite(id, known, cls),
  };

  private openBook(id?: string): void {
    if (this.capturing) return;
    const idx = id ? DEX.findIndex((s) => s.id === id) : -1;
    if (idx >= 0) this.page = idx;
    this.unseen = false;
    this.renderHud();
    this.fit();
    this.renderBook();
    this.layer.hidden = false;
    this.layer.classList.remove('opening');
    void this.layer.offsetWidth;
    this.layer.classList.add('opening');
    if (!this.open) {
      this.open = true;
      this.handlers.onNotebookToggle?.(true);
    }
  }

  private closeBook(): void {
    if (!this.open) return;
    this.open = false;
    this.layer.hidden = true;
    this.handlers.onNotebookToggle?.(false);
  }

  private goto(i: number): void {
    if (i === this.page) return;
    this.page = i;
    this.select();
  }

  /** Monta a dex inteira (ao abrir) e a ficha da espécie escolhida. */
  private renderBook(): void {
    this.book.innerHTML = dexShell(this.view);
    this.select(false);
  }

  /** Marca o cartão escolhido, mostra a ficha e rola a lista até ele. */
  private select(scroll = true): void {
    this.book.querySelectorAll('.dex-card.sel').forEach((el) => el.classList.remove('sel'));
    const card = this.book.querySelector<HTMLElement>(`.dex-card[data-i="${this.page}"]`);
    card?.classList.add('sel');
    const detail = this.book.querySelector<HTMLElement>('.dex-detail');
    if (detail) {
      detail.innerHTML = dexDetail(this.view, this.page);
      detail.scrollTop = 0;
    }
    if (scroll) card?.scrollIntoView({ block: 'nearest' });
    else {
      const list = this.book.querySelector<HTMLElement>('.dex-list');
      if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.offsetTop - 60);
    }
  }

  // ------------------------------------------------------------------ entrada

  private onClick(ev: MouseEvent): void {
    const target = ev.target as HTMLElement;
    const el = target.closest<HTMLElement>('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (action === 'backdrop' && target !== el) return;
    (document.activeElement as HTMLElement | null)?.blur?.();
    switch (action) {
      case 'toggle':
        this.toggle();
        break;
      case 'close':
      case 'backdrop':
        this.closeBook();
        break;
      case 'biome': {
        const sec = SECTIONS[Number(el.dataset.sec)];
        if (sec) this.goto(sec.start);
        break;
      }
      case 'goto':
        this.goto(Number(el.dataset.i));
        break;
      case 'open-entry':
        this.openBook(el.dataset.id);
        el.remove();
        break;
    }
  }

  private toggle(): void {
    if (this.open) this.closeBook();
    else this.openBook();
  }

  private onKey(ev: KeyboardEvent): void {
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
    if (ev.key === 'Tab' || ev.key === 'c' || ev.key === 'C') {
      ev.preventDefault();
      if (!ev.repeat) this.toggle();
      return;
    }
    if (!this.open) return;
    if (ev.key === 'Escape') this.closeBook();
    else {
      const next = dexMove(this.page, ev.key);
      if (next === this.page) return;
      this.goto(next);
    }
    ev.preventDefault();
  }
}
