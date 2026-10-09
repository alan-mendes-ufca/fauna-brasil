import type Phaser from 'phaser';
import { envOf, ENV_MODULES } from '../biomes/env';
import type { Habitat } from '../data/species';
import { paintBaseCaptureBackground, type CaptureBgLayers } from './captureBg';

/** Fundo da tela de captura e da batalha para o habitat (Amazônia e Caatinga em captureBg.ts; os outros em src/biomes/). */
export function paintCaptureBackground(scene: Phaser.Scene, habitat: Habitat): CaptureBgLayers {
  const base = paintBaseCaptureBackground(scene, habitat);
  if (base) return base;
  const painter = ENV_MODULES.map((m) => m.captureBg[habitat]).find(Boolean);
  const k = (part: string) => `capbg_${habitat}_${part}`;
  if (painter) return painter(scene, k);
  // Habitat ainda sem fundo próprio: usa o do habitat padrão de algum bioma que o tenha, ou o sub-bosque.
  const owner = ENV_MODULES.find((m) => m.habitats.includes(habitat));
  const fallback = owner ? envOf(owner.biome)?.captureBg[owner.defaultHabitat] : undefined;
  return fallback ? fallback(scene, k) : paintBaseCaptureBackground(scene, 'sub-bosque')!;
}
