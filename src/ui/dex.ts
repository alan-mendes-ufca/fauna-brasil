import './dex.css';
import { BIOMES, HABITAT_LABEL, type BiomeInfo } from '../data/biomes';
import { SPECIES, type Species } from '../data/species';
import { esc, fmtDate, gems, iucnBadge, RARITY_INFO } from './format';

// FAUNADEX: o caderno de campo organizado como uma "dex". Uma tela só, com todas as espécies do
// jogo agrupadas por bioma (grade numerada à esquerda) e a ficha da espécie escolhida à direita.
// Aqui ficam só a montagem do HTML e a navegação; o estado (vistos/capturados) é do GameUI.

export type DexStatus = 'unknown' | 'seen' | 'caught';

export interface DexSection {
  biome: BiomeInfo;
  /** Índice (em DEX) da primeira espécie do bioma. */
  start: number;
  count: number;
}

/** Ordem da dex (e da numeração): biomas na ordem de BIOMES; dentro de cada um, a ordem de SPECIES. */
export const DEX: Species[] = BIOMES.flatMap((b) => SPECIES.filter((s) => s.biome === b.id));

export const SECTIONS: DexSection[] = (() => {
  let start = 0;
  const out: DexSection[] = [];
  for (const biome of BIOMES) {
    const count = SPECIES.filter((s) => s.biome === biome.id).length;
    if (count === 0) continue;
    out.push({ biome, start, count });
    start += count;
  }
  return out;
})();

/** Colunas da grade (também usadas pelas setas ↑/↓). */
export const DEX_COLS = 6;

export interface DexView {
  status(id: string): DexStatus;
  caughtOn(id: string): string | undefined;
  sprite(id: string, known: boolean, cls?: string): string;
}

const no3 = (i: number) => String(i + 1).padStart(3, '0');
const sectionIndex = (i: number) => SECTIONS.findIndex((s) => i >= s.start && i < s.start + s.count);
const wrap = (i: number, n: number) => (i + n) % n;

function tally(view: DexView, list: Species[]): { seen: number; caught: number } {
  let seen = 0;
  let caught = 0;
  for (const s of list) {
    const st = view.status(s.id);
    if (st !== 'unknown') seen++;
    if (st === 'caught') caught++;
  }
  return { seen, caught };
}

/** Próxima seleção para uma tecla de navegação (a mesma se a tecla não navega). */
export function dexMove(i: number, key: string): number {
  const si = sectionIndex(i);
  if (si < 0) return 0;
  const sec = SECTIONS[si];
  const local = i - sec.start;
  const col = local % DEX_COLS;
  const n = SECTIONS.length;
  switch (key) {
    case 'ArrowLeft':
      return wrap(i - 1, DEX.length);
    case 'ArrowRight':
      return wrap(i + 1, DEX.length);
    case 'ArrowDown': {
      if (local + DEX_COLS < sec.count) return i + DEX_COLS;
      const lastRow = Math.floor((sec.count - 1) / DEX_COLS);
      if (Math.floor(local / DEX_COLS) < lastRow) return sec.start + sec.count - 1;
      const next = SECTIONS[wrap(si + 1, n)];
      return next.start + Math.min(col, next.count - 1);
    }
    case 'ArrowUp': {
      if (local >= DEX_COLS) return i - DEX_COLS;
      const prev = SECTIONS[wrap(si - 1, n)];
      const lastRowStart = Math.floor((prev.count - 1) / DEX_COLS) * DEX_COLS;
      return prev.start + Math.min(lastRowStart + col, prev.count - 1);
    }
    case 'PageDown':
      return SECTIONS[wrap(si + 1, n)].start;
    case 'PageUp':
      return local > 0 ? sec.start : SECTIONS[wrap(si - 1, n)].start;
    case 'Home':
      return 0;
    case 'End':
      return DEX.length - 1;
  }
  return i;
}

const STATE_LABEL: Record<DexStatus, string> = {
  unknown: 'Não visto',
  seen: 'Avistado',
  caught: 'Capturado',
};

function card(view: DexView, sp: Species, i: number): string {
  const st = view.status(sp.id);
  const known = st !== 'unknown';
  const label = known ? `${no3(i)} ${sp.name} (${STATE_LABEL[st].toLowerCase()})` : `${no3(i)} espécie não vista`;
  return `<button class="dex-card ${st}" data-action="goto" data-i="${i}" aria-label="${esc(label)}" title="${known ? esc(sp.name) : '???'}">
      <span class="dex-no">${no3(i)}</span>${st === 'caught' ? '<i class="dex-ball" aria-hidden="true"></i>' : ''}
      <span class="dex-pic">${view.sprite(sp.id, known, 'dex-sprite')}</span>
      <span class="dex-name">${known ? esc(sp.name) : '???'}</span>
    </button>`;
}

function counter(seen: number, caught: number, total: number): string {
  return `<span class="dex-tally"><i class="dex-eye" aria-hidden="true"></i>${seen}<i class="dex-ball" aria-hidden="true"></i>${caught}<small>/${total}</small></span>`;
}

/** Moldura inteira da dex (a ficha da direita é preenchida por `dexDetail`). */
export function dexShell(view: DexView): string {
  const all = tally(view, DEX);
  const total = DEX.length;
  const chips = SECTIONS.map((sec, si) => {
    const t = tally(view, DEX.slice(sec.start, sec.start + sec.count));
    return `<button class="dex-chip" style="--bc:${sec.biome.color}" data-action="biome" data-sec="${si}" title="${esc(sec.biome.name)}: ${t.seen} vistos, ${t.caught} capturados de ${sec.count}">
        <span>${esc(sec.biome.name)}</span><b>${t.caught}<small>/${sec.count}</small></b>
      </button>`;
  }).join('');
  const sections = SECTIONS.map((sec, si) => {
    const list = DEX.slice(sec.start, sec.start + sec.count);
    const t = tally(view, list);
    return `<section class="dex-sec" style="--bc:${sec.biome.color}" data-sec="${si}">
        <h3 class="dex-sec-title"><span class="dex-sec-name">${esc(sec.biome.name)}</span>${counter(t.seen, t.caught, sec.count)}</h3>
        <div class="dex-grid">${list.map((sp, k) => card(view, sp, sec.start + k)).join('')}</div>
      </section>`;
  }).join('');
  return `
    <div class="dex">
      <header class="dex-head">
        <div class="dex-lens" aria-hidden="true"><i></i></div>
        <div class="dex-leds" aria-hidden="true"><i class="r"></i><i class="y"></i><i class="g"></i></div>
        <div class="dex-title"><b>Faunadex</b><span>Caderno de campo · fauna do Brasil</span></div>
        <div class="dex-totals">
          <div class="dex-total"><span><i class="dex-eye" aria-hidden="true"></i>Vistos</span><b>${no3(all.seen - 1)}<small>/${no3(total - 1)}</small></b></div>
          <div class="dex-total"><span><i class="dex-ball" aria-hidden="true"></i>Capturados</span><b>${no3(all.caught - 1)}<small>/${no3(total - 1)}</small></b></div>
        </div>
        <button class="dex-close" data-action="close" aria-label="Fechar o caderno">Fechar <kbd>Esc</kbd></button>
      </header>
      <div class="dex-body">
        <section class="dex-left">
          <nav class="dex-jump" aria-label="Biomas">${chips}</nav>
          <div class="dex-list">${sections}</div>
          <p class="dex-keys"><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> escolher <kbd>PgUp</kbd><kbd>PgDn</kbd> bioma <kbd>Enter</kbd> ficha <kbd>C</kbd> fechar</p>
        </section>
        <aside class="dex-detail" aria-live="polite"></aside>
      </div>
    </div>`;
}

/** Ficha da espécie `i` (índice em DEX). */
export function dexDetail(view: DexView, i: number): string {
  const sp = DEX[i];
  const st = view.status(sp.id);
  const known = st !== 'unknown';
  const got = st === 'caught';
  const biome = SECTIONS[sectionIndex(i)].biome;
  const scribble = (cls = '') => `<span class="dex-scribble ${cls}"></span>`;
  const habitat = known ? sp.habitat.map((h) => `<span class="dex-chipx">${HABITAT_LABEL[h]}</span>`).join('') : scribble();
  const rarity = got ? `${gems(sp.rarity)}<span class="rar-name ${sp.rarity}">${RARITY_INFO[sp.rarity].label}</span>` : scribble('short');
  const iucn = got ? iucnBadge(sp.iucn) : scribble('short');
  const fact = got
    ? `<p class="dex-d-fact">${esc(sp.fact)}</p>`
    : `<p class="dex-d-fact dim">${
        known
          ? 'Avistado na trilha, mas ainda não capturado. Capture este animal para completar a ficha.'
          : `Nenhum registro. Explore ${esc(biome.name)} para encontrar esta espécie.`
      }</p>`;
  const foot = got
    ? `<span class="dex-stamp">Capturado<small>${fmtDate(view.caughtOn(sp.id)!)}</small></span>`
    : '';
  return `
    <div class="dex-d-top">
      <span class="dex-d-no">Nº ${no3(i)}</span>
      <span class="dex-d-state ${st}">${st === 'caught' ? '<i class="dex-ball" aria-hidden="true"></i>' : ''}${STATE_LABEL[st]}</span>
    </div>
    <div class="dex-d-screen ${st}" style="--bc:${biome.color}">
      <span class="dex-d-biome">${esc(biome.name)}</span>
      ${view.sprite(sp.id, known, 'dex-big')}${known ? '' : '<b class="dex-q">?</b>'}
    </div>
    <div class="dex-d-info">
      <h2 class="${known ? '' : 'unk'}">${known ? esc(sp.name) : '???'}</h2>
      <p class="dex-d-sci">${known ? esc(sp.scientific) : '?????? ??????'}</p>
      <dl class="dex-d-sheet">
        <div><dt>Habitat</dt><dd>${habitat}</dd></div>
        <div><dt>Raridade</dt><dd>${rarity}</dd></div>
        <div><dt>IUCN</dt><dd>${iucn}</dd></div>
      </dl>
      <p class="dex-d-label">Anotações de campo</p>
      ${fact}
      ${foot}
    </div>`;
}
