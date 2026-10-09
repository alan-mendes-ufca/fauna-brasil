import type Phaser from 'phaser';
import './minimap.css';
import { ENV_MODULES } from '../biomes/env';
import type { TransitionZone } from '../biomes/types';
import { exitTiles, REGIONS } from '../data/regions';
import type { Region } from '../data/types';

/**
 * Atlas da expedição: posição (coluna, linha) de cada região, aproximando a geografia do Brasil.
 * Amazônia (NO) e Caatinga (NE) em cima; Cerrado e Mata Atlântica no meio; Pantanal e Pampa embaixo.
 */
const ATLAS: Record<string, [number, number]> = {
  amazonia: [0, 0],
  caatinga: [1, 0],
  cerrado: [0, 1],
  'mata-atlantica': [1, 1],
  pantanal: [0, 2],
  pampa: [1, 2],
};
const GAP = 6;

type Rgb = string;
// Cor por caractere do mapa; os símbolos de cada bioma estão em src/art/forest.ts, caatingaTiles.ts e src/biomes/<bioma>/tiles.ts.
const COLORS: Record<string, Record<string, Rgb>> = {
  amazonia: { '#': '#1d4a27', '.': '#5f9a3e', ',': '#c9a56a', '"': '#3f7a3a', '~': '#2f7fb0', '=': '#8a6535', _: '#8fb36a' },
  caatinga: {
    '#': '#6f7a4b', '%': '#2f6d3a', '.': '#d9a366', ':': '#b7b25a', ',': '#ecd49a',
    '"': '#a58b4e', r: '#a9a3a0', s: '#e9d9b4', '~': '#2f7fb0', _: '#b48660',
  },
  ...Object.fromEntries(ENV_MODULES.map((m) => [m.biome, m.meta.minimap])),
};

/** Faixas de transição por região (a mata dos cocais ocupa o começo da Caatinga). */
const ZONES: Record<string, TransitionZone[]> = {
  caatinga: [{ name: 'Mata dos Cocais', x: 0, y: 0, w: 22, h: 45 }],
  ...Object.fromEntries(ENV_MODULES.map((m) => [m.region.id, m.meta.transitions])),
};

const LEGEND: { c: string; t: string }[] = [
  { c: '#1d4a27', t: 'Mata fechada (Amazônia)' },
  { c: '#5f9a3e', t: 'Chão de floresta' },
  { c: '#2f7fb0', t: 'Rio e açude' },
  { c: '#c9a56a', t: 'Trilha' },
  { c: '#2f6d3a', t: 'Mata dos Cocais' },
  { c: '#b7b25a', t: 'Cerrado da transição' },
  { c: '#d9a366', t: 'Terra da Caatinga' },
  { c: '#6f7a4b', t: 'Caatinga fechada' },
  { c: '#a9a3a0', t: 'Lajedo de granito' },
  { c: '#e9d9b4', t: 'Leito seco do riacho' },
  ...ENV_MODULES.flatMap((m) => m.meta.legend),
  { c: '#ffd23a', t: 'Passagem entre regiões' },
];

const ROSE = `<svg class="mm-rose" viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0-11 3 0 0 11-3 0Z" fill="#8a6535"/><path d="M-11 0 0-3 11 0 0 3Z" fill="#c8322b" opacity=".85"/><circle r="2" fill="#efe3c0" stroke="#3a2111" stroke-width="1"/><text y="-12.5" text-anchor="middle" font-size="7" font-family="Pixelify Sans,monospace" fill="#2c2013">N</text></svg>`;

function drawRegion(ctx: CanvasRenderingContext2D, r: Region, ox: number, oy: number, k: number): void {
  const pal = COLORS[r.biome] ?? COLORS.amazonia;
  r.map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      ctx.fillStyle = pal[row[x]] ?? '#888';
      ctx.fillRect(ox + x * k, oy + y * k, k, k);
    }
  });
  ctx.fillStyle = '#ffd23a';
  ctx.strokeStyle = '#3a2111';
  for (const e of r.exits ?? []) {
    for (const t of exitTiles(e)) {
      ctx.fillRect(ox + t.x * k, oy + t.y * k, k, k);
      if (k > 2) ctx.strokeRect(ox + t.x * k + 0.5, oy + t.y * k + 0.5, k - 1, k - 1);
    }
  }
}

interface Placed {
  r: Region;
  x: number;
  y: number;
}

/** Atlas: cada coluna tem a largura da maior região dela, cada linha a altura da maior; regiões alinhadas ao centro da célula. */
function layout(): { placed: Placed[]; w: number; h: number } {
  const regions = Object.values(REGIONS).filter((r) => ATLAS[r.id]);
  const colW: number[] = [];
  const rowH: number[] = [];
  for (const r of regions) {
    const [c, l] = ATLAS[r.id];
    colW[c] = Math.max(colW[c] ?? 0, r.map[0].length);
    rowH[l] = Math.max(rowH[l] ?? 0, r.map.length);
  }
  const start = (sizes: number[], i: number) => sizes.slice(0, i).reduce((a, b) => a + (b ?? 0) + GAP, 0);
  const placed = regions.map((r) => {
    const [c, l] = ATLAS[r.id];
    return {
      r,
      x: start(colW, c) + Math.floor((colW[c] - r.map[0].length) / 2),
      y: start(rowH, l) + Math.floor((rowH[l] - r.map.length) / 2),
    };
  });
  return { placed, w: start(colW, colW.length) - GAP, h: start(rowH, rowH.length) - GAP };
}

/**
 * Mapa da expedição: o mini (canto da tela) mostra só a região atual; o grande (M) mostra o atlas
 * com todas as regiões, as passagens e as faixas de transição.
 */
export class Minimap {
  private placed: Placed[];
  private totalW: number;
  private totalH: number;
  private current = 'amazonia';
  private pos = { x: 0, y: 0 };
  private mini: HTMLElement;
  private layer: HTMLElement;
  private dots: HTMLElement[] = [];
  private veils: HTMLElement[] = [];
  private miniStage: HTMLElement;
  private miniInner: HTMLElement;
  private foot: HTMLElement;

  constructor(
    root: HTMLElement,
    events: Phaser.Events.EventEmitter,
    private readonly fullScreen: () => boolean,
  ) {
    ({ placed: this.placed, w: this.totalW, h: this.totalH } = layout());

    this.mini = document.createElement('div');
    this.mini.className = 'mm off';
    this.mini.title = 'Mapa da expedição (M)';
    this.mini.innerHTML = `<div class="mm-tape"></div><div class="mm-paper"><div class="mm-crop">${this.stage(1, 'mini')}</div></div>
      <div class="mm-foot"><span class="mm-here"></span><span>Mapa <kbd>M</kbd></span></div>`;
    this.foot = this.mini.querySelector('.mm-here')!;
    this.miniStage = this.mini.querySelector('.mm-crop')!;
    this.miniInner = this.mini.querySelector('.mm-stage')!;
    this.layer = document.createElement('div');
    this.layer.className = 'mm-layer';
    this.layer.hidden = true;
    this.layer.innerHTML = `<div class="mm-sheet" role="dialog" aria-modal="true" aria-label="Mapa da expedição">
      <button class="mm-close" aria-label="Fechar o mapa">X</button>
      <h2><span>Mapa da expedição</span><small>Esc fecha</small></h2>
      <div class="mm-paper">${this.stage(5, 'big')}</div>
      <ul class="mm-legend">${LEGEND.map((l) => `<li><i style="background:${l.c}"></i>${l.t}</li>`).join('')}<li class="me"><i></i>Você está aqui</li></ul>
    </div>`;
    root.append(this.mini, this.layer);

    for (const stage of [this.mini, this.layer]) {
      stage.querySelectorAll<HTMLCanvasElement>('canvas').forEach((c) => this.paint(c));
      this.dots.push(stage.querySelector<HTMLElement>('.mm-dot')!);
    }
    this.veils = [...this.layer.querySelectorAll<HTMLElement>('.mm-veil')];

    // A interface não pode virar clique de movimento no jogo.
    for (const el of [this.mini, this.layer]) {
      for (const ev of ['pointerdown', 'pointerup', 'mousedown', 'touchstart']) el.addEventListener(ev, (e) => e.stopPropagation());
    }
    this.mini.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle(true);
    });
    this.layer.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target === this.layer || (e.target as HTMLElement).closest('.mm-close')) this.toggle(false);
    });
    window.addEventListener('keydown', (ev) => {
      if (ev.key === 'm' || ev.key === 'M') {
        if (!this.layer.hidden || !this.fullScreen()) this.toggle(this.layer.hidden === true);
      } else if (ev.key === 'Escape' && !this.layer.hidden) {
        ev.stopImmediatePropagation();
        this.toggle(false);
      }
    }, true);

    events.on('region-enter', ({ id }: { id: string }) => {
      this.current = id;
      this.refresh();
    });
    events.on('player-move', (p: { region: string; x: number; y: number }) => {
      this.current = p.region;
      this.pos = p;
      this.refresh();
    });
    window.setInterval(() => this.syncVisibility(), 250);
    this.refresh();
  }

  private stage(k: number, cls: string): string {
    const pct = (v: number, t: number) => `${(v / t) * 100}%`;
    const W = this.totalW;
    const H = this.totalH;
    const box = (x: number, y: number, w: number, h: number) => `left:${pct(x, W)};top:${pct(y, H)};width:${pct(w, W)};height:${pct(h, H)}`;
    const tags = this.placed.map((p) => `<span class="mm-tag" style="left:${pct(p.x, W)};top:${pct(p.y, H)}">${p.r.name}</span>`).join('');
    const veils = this.placed.map((p) => `<div class="mm-veil" data-id="${p.r.id}" style="${box(p.x, p.y, p.r.map[0].length, p.r.map.length)}"></div>`).join('');
    const zones = this.placed
      .flatMap((p) => (ZONES[p.r.id] ?? []).map((z) => `<div class="mm-zone" style="${box(p.x + z.x, p.y + z.y, z.w, z.h)}"><b>${z.name}</b></div>`))
      .join('');
    return `<div class="mm-stage ${cls}" style="aspect-ratio:${W}/${H}" data-k="${k}">
      <canvas width="${W * k}" height="${H * k}"></canvas>${veils}${zones}${tags}
      <i class="mm-dot"></i>${cls === 'big' ? ROSE : ''}</div>`;
  }

  private paint(c: HTMLCanvasElement): void {
    const k = c.width / this.totalW;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of this.placed) drawRegion(ctx, p.r, p.x * k, p.y * k, k);
  }

  private toggle(open: boolean): void {
    this.layer.hidden = !open;
    this.syncVisibility();
  }

  private syncVisibility(): void {
    const hide = this.fullScreen() || !document.body.contains(this.mini);
    this.mini.classList.toggle('off', hide);
    if (hide && !this.layer.hidden) this.layer.hidden = true;
  }

  private refresh(): void {
    const p = this.placed.find((q) => q.r.id === this.current);
    if (!p) return;
    const { r } = p;
    const rw = r.map[0].length;
    const rh = r.map.length;
    for (const dot of this.dots) {
      dot.style.left = `${((p.x + this.pos.x + 0.5) / this.totalW) * 100}%`;
      dot.style.top = `${((p.y + this.pos.y + 0.5) / this.totalH) * 100}%`;
    }
    // Mini: recorta o atlas na região atual (o palco interno é maior que a moldura e desliza por trás dela).
    this.miniStage.style.aspectRatio = `${rw}/${rh}`;
    this.miniInner.style.width = `${(this.totalW / rw) * 100}%`;
    this.miniInner.style.left = `${(-p.x / rw) * 100}%`;
    this.miniInner.style.top = `${(-p.y / rh) * 100}%`;
    this.veils.forEach((v) => v.classList.toggle('dim', v.dataset.id !== r.id));
    const zone = (ZONES[r.id] ?? []).find((z) => this.pos.x >= z.x && this.pos.y >= z.y && this.pos.x < z.x + z.w && this.pos.y < z.y + z.h);
    this.foot.innerHTML = `<b>${zone?.name ?? r.name}</b>`;
  }

}
