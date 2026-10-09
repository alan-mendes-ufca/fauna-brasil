import Phaser from 'phaser';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/600.css';
import './style.css';
import { BootScene } from './scenes/BootScene';
import { BattleScene } from './scenes/BattleScene';
import { CaptureScene } from './scenes/CaptureScene';
import { GalleryScene } from './scenes/GalleryScene';
import { OverworldScene } from './scenes/OverworldScene';
import { StarterScene } from './scenes/StarterScene';
import { bindParty } from './state/party';
import { bindBag } from './state/bag';
import { bindConservation } from './state/conservation';
import { Minimap } from './ui/minimap';
import { GameUI, type Crop } from './ui/GameUI';
import { VillageUI } from './ui/village';
import { Music, type Mood } from './audio/music';

// ?canvas força o renderizador Canvas (o mesmo usado quando o navegador não tem WebGL).
const forceCanvas = import.meta.env.DEV && new URLSearchParams(location.search).has('canvas');

const game = new Phaser.Game({
  type: forceCanvas ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 640,
  backgroundColor: '#04100e',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, StarterScene, OverworldScene, GalleryScene, BattleScene, CaptureScene],
});

// Capturas entram na coleção e o time recupera vigor ao fim de cada encontro.
bindParty(game.events);
// Moedas ganhas nas capturas (e gastas nas lojas das vilas).
bindBag(game.events);
// DNA coletado nas capturas de espécies ameaçadas (Centro de Conservação das vilas).
bindConservation(game.events);

/** Cenas de tela cheia com HUD próprio (captura, batalha, escolha do inicial): o HUD do caderno some. */
const fullScreenScene = () => ['Capture', 'Battle', 'Starter'].some((key) => game.scene.isActive(key));

/** Recorta uma textura do jogo e devolve como imagem para a interface (com cache). */
const artCache = new Map<string, string>();
function art(key: string, crop?: Crop): string {
  const cacheKey = `${key}|${crop ? Object.values(crop).join(',') : ''}`;
  const cached = artCache.get(cacheKey);
  if (cached) return cached;
  if (!game.textures.exists(key)) return '';
  const src = game.textures.get(key).getSourceImage() as HTMLCanvasElement;
  const c = crop ?? { x: 0, y: 0, w: src.width, h: src.height };
  const out = document.createElement('canvas');
  out.width = c.w;
  out.height = c.h;
  out.getContext('2d')!.drawImage(src, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
  const url = out.toDataURL();
  artCache.set(cacheKey, url);
  return url;
}

// Com um painel de interface aberto (caderno, diálogo, loja, mochila) a exploração fica congelada;
// volta ao fechar, se fomos nós que a pausamos.
let pausedByUi = false;
function setUiModal(open: boolean): void {
  if (open) {
    if (game.scene.isActive('Overworld')) {
      game.scene.pause('Overworld');
      pausedByUi = true;
    }
  } else if (pausedByUi) {
    pausedByUi = false;
    if (game.scene.isPaused('Overworld') && !fullScreenScene()) game.scene.resume('Overworld');
  }
}

const ui = new GameUI(
  document.getElementById('ui')!,
  {
    art,
    isCapturing: fullScreenScene,
    onNotebookToggle: setUiModal,
  },
  game.events,
);

// Moedas, diálogo com moradores, loja e mochila das vilas.
const village = new VillageUI(
  document.getElementById('ui')!,
  { onModal: setUiModal, isFullScreen: fullScreenScene, speciesArt: (id) => art(`animal_${id}`, { x: 0, y: 0, w: 64, h: 64 }) },
  game.events,
);

// O painel acompanha a região atual (Amazônia, Caatinga...).
game.events.on('region-enter', ({ name }: { name: string }) => ui.setRegion(name));

new Minimap(document.getElementById('ui')!, game.events, fullScreenScene);

// Trilha: tema da região na exploração; temas próprios na batalha e na captura. N liga/desliga o som.
const music = new Music();
let regionMood: Mood = 'amazonia';
game.events.on('region-enter', ({ id }: { id: string }) => {
  regionMood = id as Mood;
});
window.setInterval(() => {
  music.play(game.scene.isActive('Battle') ? 'battle' : game.scene.isActive('Capture') ? 'capture' : regionMood);
}, 250);
const toast = document.createElement('div');
toast.className = 'sound-toast';
document.getElementById('ui')!.appendChild(toast);
let toastTimer = 0;
window.addEventListener('keydown', (ev) => {
  if (ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey || (ev.key !== 'n' && ev.key !== 'N')) return;
  toast.textContent = music.toggleMute() ? 'Som desligado (N)' : 'Som ligado (N)';
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1400);
});

// ?demo=caderno abre o caderno com 5 espécies marcadas (sem gravar no localStorage).
if (import.meta.env.DEV && new URLSearchParams(location.search).get('demo') === 'caderno') {
  const wait = window.setInterval(() => {
    if (!game.textures.exists('animal_arara')) return;
    window.clearInterval(wait);
    ui.demo();
  }, 100);
}

// Acesso pelo console durante o desenvolvimento (ex.: __game.scene.getScene('Overworld')).
if (import.meta.env.DEV) Object.assign(window, { __game: game, __ui: ui, __village: village });
