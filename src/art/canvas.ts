import type Phaser from 'phaser';

/** Tamanho do tile em pixels de arte. A câmera amplia (zoom) na hora de desenhar. */
export const TILE = 16;

/** Desenho pixel a pixel sobre um canvas 2D, com coordenadas inteiras. */
export class Painter {
  constructor(
    readonly ctx: CanvasRenderingContext2D,
    readonly w: number,
    readonly h: number,
  ) {}

  rect(x: number, y: number, w: number, h: number, color: string): this {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
    return this;
  }

  px(x: number, y: number, color: string): this {
    return this.rect(x, y, 1, 1, color);
  }

  hline(x: number, y: number, w: number, color: string): this {
    return this.rect(x, y, w, 1, color);
  }

  vline(x: number, y: number, h: number, color: string): this {
    return this.rect(x, y, 1, h, color);
  }

  /** Contorno de 1px por dentro do retângulo. */
  frame(x: number, y: number, w: number, h: number, color: string): this {
    return this.hline(x, y, w, color).hline(x, y + h - 1, w, color).vline(x, y, h, color).vline(x + w - 1, y, h, color);
  }

  /** Bloco com borda escura, topo claro e base sombreada (o "volume" padrão dos móveis). */
  block(x: number, y: number, w: number, h: number, base: string, light: string, dark: string, outline: string): this {
    this.rect(x, y, w, h, base);
    this.hline(x + 1, y + 1, w - 2, light);
    this.hline(x + 1, y + h - 2, w - 2, dark);
    return this.frame(x, y, w, h, outline);
  }

  /** Pixels de ruído para dar textura (madeira, pedra, grama). */
  speckle(x: number, y: number, w: number, h: number, colors: string[], density: number, rand: () => number): this {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        if (rand() < density) this.px(xx, yy, colors[Math.floor(rand() * colors.length)]);
      }
    }
    return this;
  }

  /** Desenha um modelo em texto: cada caractere é uma cor da paleta, '.' é transparente. */
  template(rows: string[], palette: Record<string, string>, ox = 0, oy = 0, flip = false): this {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = flip ? row[row.length - 1 - x] : row[x];
        if (ch === '.' || ch === ' ') continue;
        const color = palette[ch];
        if (!color) throw new Error(`Cor "${ch}" ausente na paleta`);
        this.px(ox + x, oy + y, color);
      }
    });
    return this;
  }
}

/** Cria (ou recria) uma textura desenhada por código. */
export function paint(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (p: Painter) => void,
): string {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) throw new Error(`Não foi possível criar a textura ${key}`);
  draw(new Painter(tex.getContext(), w, h));
  tex.refresh();
  return key;
}

/** Spritesheet horizontal: um quadro de `fw`×`fh` por item de `frames`. */
export function paintSheet(
  scene: Phaser.Scene,
  key: string,
  fw: number,
  fh: number,
  frames: ((p: Painter) => void)[],
): string {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, fw * frames.length, fh);
  if (!tex) throw new Error(`Não foi possível criar a textura ${key}`);
  const ctx = tex.getContext();
  frames.forEach((draw, i) => {
    ctx.save();
    ctx.translate(i * fw, 0);
    draw(new Painter(ctx, fw, fh));
    ctx.restore();
    tex.add(i, 0, i * fw, 0, fw, fh);
  });
  tex.refresh();
  return key;
}

/** Gerador pseudoaleatório determinístico (mulberry32), para a arte não mudar entre execuções. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Confere se todas as linhas de um modelo têm a mesma largura (erro de digitação comum). */
export function checkTemplate(name: string, rows: string[], width: number): void {
  rows.forEach((r, i) => {
    if (r.length !== width) throw new Error(`Modelo "${name}" linha ${i}: ${r.length} colunas, esperado ${width}`);
  });
}
