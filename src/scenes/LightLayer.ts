import type Phaser from 'phaser';

export type Flicker = 'fire' | 'candle' | 'siren';

export interface SceneLight {
  x: number;
  y: number;
  radius: number;
  color: number;
  intensity: number;
  /** Retângulo (em pixels do mundo) que a luz não ultrapassa: o cômodo onde ela está. */
  clip?: { x: number; y: number; w: number; h: number };
  /** Halo brilhante (bloom) no ponto da lâmpada. */
  glow?: { x: number; y: number; radius: number; color: number };
  flicker?: Flicker;
  /** Luzes de dentro da casa somem sob o telhado; as do telhado só existem com ele visível. */
  group?: 'interior' | 'roof';
  seed: number;
}

/** Luz de preenchimento de um cômodo: ilumina o ambiente todo de forma suave e uniforme. */
export interface RoomFill {
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
  intensity: number;
}

const SIREN_RED = 0xff2a3a;
const SIREN_BLUE = 0x2a6aff;

/** As camadas de luz são desenhadas nesta fração da resolução do jogo e ampliadas pelo CSS. */
const LIGHT_SCALE = 0.5;
/** Luzes animadas (fogo, vela, sirene) são redesenhadas, no máximo, nesta frequência. */
const ANIMATED_FPS = 30;
/** Tamanho (px) dos gradientes pré-renderizados. */
const SPRITE = 128;
/** Abaixo disso a contribuição da luz é invisível e não vale desenhar. */
const MIN_ALPHA = 0.02;

type SpriteKind = 'light' | 'spill' | 'halo';

function rgba(color: number, alpha: number): string {
  return `rgba(${(color >> 16) & 255},${(color >> 8) & 255},${color & 255},${Math.max(0, Math.min(1, alpha))})`;
}

/** Gradiente radial desenhado uma única vez por cor; depois só se escala e se aplica globalAlpha. */
function makeSprite(kind: SpriteKind, color: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = SPRITE;
  const ctx = c.getContext('2d')!;
  const m = SPRITE / 2;
  const grad = ctx.createRadialGradient(m, m, 0, m, m, m);
  if (kind === 'light') {
    grad.addColorStop(0, rgba(color, 1));
    grad.addColorStop(0.35, rgba(color, 0.7));
    grad.addColorStop(0.7, rgba(color, 0.25));
    grad.addColorStop(1, rgba(color, 0));
  } else if (kind === 'spill') {
    grad.addColorStop(0, rgba(color, 1));
    grad.addColorStop(1, rgba(color, 0));
  } else {
    grad.addColorStop(0, rgba(0xffffff, 1));
    grad.addColorStop(0.15, rgba(color, 0.9));
    grad.addColorStop(1, rgba(color, 0));
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SPRITE, SPRITE);
  return c;
}

/**
 * Iluminação feita em duas camadas de canvas HTML sobre o jogo, então funciona com
 * qualquer renderizador do Phaser (inclusive Canvas, sem WebGL):
 *  - lightmap (mix-blend-mode: multiply): escuridão ambiente com "buracos" coloridos de luz;
 *  - glowmap (mix-blend-mode: screen): halos e bloom que fazem as luzes saltarem da tela.
 *
 * Para ser barata, as camadas têm metade da resolução, usam gradientes pré-renderizados
 * e só são redesenhadas quando a câmera, uma luz ou o telhado mudam.
 */
export class LightLayer {
  private readonly lightmap: HTMLCanvasElement;
  private readonly glowmap: HTMLCanvasElement;
  private readonly lctx: CanvasRenderingContext2D;
  private readonly gctx: CanvasRenderingContext2D;
  private readonly sprites = new Map<string, HTMLCanvasElement>();
  private lastRect = '';
  private lastSignature = '';
  private lastDraw = -Infinity;

  constructor(
    private readonly container: HTMLElement,
    private readonly ambient: number,
    /** Força do "vazamento" de cor das luzes na camada de brilho (screen); baixo = menos névoa. */
    private readonly spill = 0.16,
  ) {
    this.lightmap = document.createElement('canvas');
    this.lightmap.className = 'lightmap';
    this.glowmap = document.createElement('canvas');
    this.glowmap.className = 'glowmap';
    container.append(this.lightmap, this.glowmap);
    this.lctx = this.lightmap.getContext('2d')!;
    this.gctx = this.glowmap.getContext('2d')!;
  }

  /** Esconde as camadas enquanto outra cena (a captura) ocupa a tela. */
  setVisible(visible: boolean): void {
    this.lightmap.hidden = this.glowmap.hidden = !visible;
  }

  /** Opacidade das duas camadas (0..1): acompanha o fade da câmera nas trocas de região. */
  setOpacity(alpha: number): void {
    this.lightmap.style.opacity = this.glowmap.style.opacity = String(Math.max(0, Math.min(1, alpha)));
  }

  destroy(): void {
    this.lightmap.remove();
    this.glowmap.remove();
  }

  private sprite(kind: SpriteKind, color: number): HTMLCanvasElement {
    const key = `${kind}${color}`;
    let s = this.sprites.get(key);
    if (!s) this.sprites.set(key, (s = makeSprite(kind, color)));
    return s;
  }

  /** Resumo do que influencia a imagem; se não mudou, o desenho anterior continua valendo. */
  private signature(cam: Phaser.Cameras.Scene2D.Camera, lights: SceneLight[], roofAlpha: number): string {
    const v = cam.worldView;
    let lightsSum = 0;
    for (const l of lights) lightsSum += l.x * 3 + l.y * 7 + l.intensity;
    return `${this.lastRect}|${cam.zoom}|${v.x.toFixed(2)}|${v.y.toFixed(2)}|${roofAlpha.toFixed(3)}|${lights.length}|${lightsSum.toFixed(2)}`;
  }

  render(
    cam: Phaser.Cameras.Scene2D.Camera,
    gameCanvas: HTMLCanvasElement,
    lights: SceneLight[],
    fills: RoomFill[],
    time: number,
    roofAlpha = 0,
  ): void {
    this.syncSize(gameCanvas);
    const sig = this.signature(cam, lights, roofAlpha);
    const animated = lights.some((l) => l.flicker);
    if (sig === this.lastSignature && (!animated || time - this.lastDraw < 1000 / ANIMATED_FPS)) return;
    this.lastSignature = sig;
    this.lastDraw = time;

    const W = this.lightmap.width;
    const H = this.lightmap.height;
    // Mundo -> pixels do canvas de luz (já na resolução reduzida).
    const z = cam.zoom * (W / gameCanvas.width);
    const ox = cam.worldView.x;
    const oy = cam.worldView.y;

    const l = this.lctx;
    l.globalAlpha = 1;
    l.globalCompositeOperation = 'source-over';
    l.fillStyle = rgba(this.ambient, 1);
    l.fillRect(0, 0, W, H);
    l.globalCompositeOperation = 'lighter';

    // Preenchimento dos cômodos: mais forte no centro, caindo um pouco nos cantos.
    const fillScale = 1 - roofAlpha;
    if (fillScale > 0.01) {
      for (const f of fills) {
        const fx = (f.x - ox) * z;
        const fy = (f.y - oy) * z;
        const fw = f.w * z;
        const fh = f.h * z;
        if (fx + fw < 0 || fy + fh < 0 || fx > W || fy > H) continue;
        const cx = fx + fw / 2;
        const cy = fy + fh / 2;
        const a = f.intensity * fillScale;
        const grad = l.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(fw, fh) / 2);
        grad.addColorStop(0, rgba(f.color, a));
        grad.addColorStop(1, rgba(f.color, a * 0.55));
        l.fillStyle = grad;
        l.fillRect(fx, fy, fw, fh);
      }
    }

    const g = this.gctx;
    g.globalAlpha = 1;
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';

    for (const light of lights) {
      const groupScale = light.group === 'interior' ? 1 - roofAlpha : light.group === 'roof' ? roofAlpha : 1;
      if (groupScale <= 0.01) continue;
      const anim = this.animate(light, time / 1000);
      const color = anim.color;
      const intensity = anim.intensity * groupScale;
      const sx = (light.x - ox) * z;
      const sy = (light.y - oy) * z;
      const r = light.radius * z;
      if (sx + r < 0 || sy + r < 0 || sx - r > W || sy - r > H) continue;

      const a = Math.min(1, intensity);
      const clip = light.clip;
      for (const [ctx, kind, size, alpha] of [
        [l, 'light', r, a],
        [g, 'spill', r * 0.7, this.spill * intensity],
      ] as const) {
        if (alpha < MIN_ALPHA) continue;
        ctx.save();
        if (clip) {
          ctx.beginPath();
          ctx.rect((clip.x - ox) * z, (clip.y - oy) * z, clip.w * z, clip.h * z);
          ctx.clip();
        }
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.drawImage(this.sprite(kind, color), sx - size, sy - size, size * 2, size * 2);
        ctx.restore();
      }

      if (light.glow && intensity * 0.5 >= MIN_ALPHA) {
        const gx = (light.glow.x - ox) * z;
        const gy = (light.glow.y - oy) * z;
        const gr = light.glow.radius * z;
        const glowColor = light.flicker === 'siren' ? color : light.glow.color;
        g.globalAlpha = Math.min(1, 0.55 * intensity);
        g.drawImage(this.sprite('halo', glowColor), gx - gr, gy - gr, gr * 2, gr * 2);
        g.globalAlpha = 1;
      }
    }
  }

  private animate(light: SceneLight, t: number): { color: number; intensity: number } {
    const s = t + light.seed;
    switch (light.flicker) {
      case 'siren': {
        const red = Math.floor(s * 2.6) % 2 === 0;
        return { color: red ? SIREN_RED : SIREN_BLUE, intensity: light.intensity * (0.7 + 0.3 * Math.abs(Math.sin(s * 8))) };
      }
      case 'fire':
      case 'candle': {
        const speed = light.flicker === 'fire' ? 9 : 5;
        const n = Math.sin(s * speed) * 0.5 + Math.sin(s * speed * 2.3 + 1.7) * 0.3 + Math.sin(s * speed * 5.1) * 0.2;
        return { color: light.color, intensity: light.intensity * (0.85 + 0.15 * n) };
      }
      default:
        return { color: light.color, intensity: light.intensity };
    }
  }

  /** Mantém as camadas exatamente sobre o canvas do jogo (que o Phaser centraliza e escala). */
  private syncSize(gameCanvas: HTMLCanvasElement): void {
    const rect = gameCanvas.getBoundingClientRect();
    const parent = this.container.getBoundingClientRect();
    const key = `${rect.left}|${rect.top}|${rect.width}|${rect.height}|${gameCanvas.width}`;
    if (key === this.lastRect) return;
    this.lastRect = key;
    for (const el of [this.lightmap, this.glowmap]) {
      el.width = Math.max(1, Math.round(gameCanvas.width * LIGHT_SCALE));
      el.height = Math.max(1, Math.round(gameCanvas.height * LIGHT_SCALE));
      Object.assign(el.style, {
        left: `${rect.left - parent.left}px`,
        top: `${rect.top - parent.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
    }
  }
}
