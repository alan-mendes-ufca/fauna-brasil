import type Phaser from 'phaser';
import { ANIMAL_SIZE, animalKey } from '../art/animals';
import { TYPE_INFO, type BType, type MoveType, type StatKey } from '../data/battle';

// Peças de interface (HTML) compartilhadas pela batalha e pela escolha do inicial.
// Estilos em style.css (seção "Batalha"), na mesma linguagem do caderno: madeira, kraft e couro.

export const STAT_NAMES: Record<StatKey, string> = { forca: 'Força', defesa: 'Defesa', agilidade: 'Agilidade' };

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

const spriteCache = new Map<string, string>();
/** Um quadro do animal como imagem (data URL), para plaquinhas e cartões. */
export function spriteUrl(textures: Phaser.Textures.TextureManager, speciesId: string, frame = 0): string {
  const cacheKey = `${speciesId}:${frame}`;
  const cached = spriteCache.get(cacheKey);
  if (cached) return cached;
  const key = animalKey(speciesId);
  if (!textures.exists(key)) return '';
  const src = textures.get(key).getSourceImage() as HTMLCanvasElement;
  const out = document.createElement('canvas');
  out.width = out.height = ANIMAL_SIZE;
  out.getContext('2d')!.drawImage(src, frame * ANIMAL_SIZE, 0, ANIMAL_SIZE, ANIMAL_SIZE, 0, 0, ANIMAL_SIZE, ANIMAL_SIZE);
  const url = out.toDataURL();
  spriteCache.set(cacheKey, url);
  return url;
}

/** Selo de tipo: etiqueta colorida com o nome. */
export function typeChip(t: MoveType): string {
  const i = TYPE_INFO[t];
  return `<i class="tchip" data-t="${t}" style="--c:${i.color};--d:${i.dark}">${i.name}</i>`;
}

export const typeChips = (types: readonly BType[]) => types.map(typeChip).join('');

/** Cor do vigor pela fração restante. */
export const hpClass = (f: number) => (f > 0.5 ? 'ok' : f > 0.2 ? 'warn' : 'low');

/** Escala da área 960x640 de design para a janela (igual ao modo FIT do canvas). */
export function fitStage(el: HTMLElement): () => void {
  const fit = () => el.style.setProperty('--bs', Math.min(window.innerWidth / 960, window.innerHeight / 640).toFixed(4));
  fit();
  window.addEventListener('resize', fit);
  return () => window.removeEventListener('resize', fit);
}
