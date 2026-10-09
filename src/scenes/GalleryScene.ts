import Phaser from 'phaser';
import { CHAR_H, CHAR_W, EXPLORER_KEY, explorerAnim, type Facing } from '../art/explorer';
import { PROPS, TILESETS, TILE_ANIM_FPS, propKey, type Tileset } from '../art/forest';
import { CAATINGA_PROPS } from '../art/caatingaProps';
import { ANIMAL_SIZE, animalKey } from '../art/animals';
import { OW_SIZE, owAnim, owKey } from '../art/wildlife';
import { ENV_MODULES } from '../biomes/env';
import { BIOMES as BIOME_INFO, biomeInfo } from '../data/biomes';
import { SPECIES } from '../data/species';

/** Desenvolvimento (?gallery): vitrine com toda a arte gerada. Role com a roda, setas ou arrastando. */

const FONT = 'Pixelify Sans';
const W = 960;

/** Mini-área de exemplo: igarapé com margens, trilha, ponte e sub-bosque, para ver o autotile funcionando. */
const SAMPLE_AMAZONIA = [
  '###########################',
  '#.....""".......,....~~~~~#',
  '#..,,,,,,,,,,,,,,,..~~~~~~#',
  '#..,....."""...,,..~~~~~~~#',
  '#.......""".....,,=~~~~~___',
  '#.__..........,,,,=~~~~~_.#',
  '#_~~__.........,..~~~~~~__#',
  '#_~~~~_......,,,,.=~~~~~_.#',
  '#.__~~__..""..,...=~~~~__.#',
  '#...__~~~_.""..,..~~~~~_..#',
  '#.....___~~~=====~~~~..___#',
  '#.........__.....__..._...#',
  '#.......,,,,,,,,,,,,,,....#',
  '###########################',
];

/** Mini-área da Caatinga: cocais e cerrado a oeste, trilha, riacho seco, lajedo e açude com margem de lama. */
const SAMPLE_CAATINGA = [
  '%%%%%%%%%######ss##########',
  '%%::::::%%#...."ss"..rrr..#',
  '%:::::::::.....""ss.rrrrr.#',
  '%::::"":::..,,,,,ss,,rrr..#',
  ',,,,,,,,,,,,,,..."ss...."".#',
  '%:::::::.,,.....""ss__~~~__',
  '%::%%::::,.."".....s_~~~~~_',
  '%::::::::,,......."._~~~~__#',
  '%%:::::....,,,.......___...#',
  '%%%%%%%%%######.....######.#',
  '%%%%%%%%%##################',
].map((r) => r.slice(0, 27).padEnd(27, '#'));

const BIOMES: { name: string; ts: Tileset; sample: string[]; note: string }[] = [
  { name: 'Amazônia', ts: TILESETS.amazonia, sample: SAMPLE_AMAZONIA, note: 'água, margens, trilha, ponte e sub-bosque' },
  { name: 'Caatinga', ts: TILESETS.caatinga, sample: SAMPLE_CAATINGA, note: 'cocais, cerrado, trilha, riacho seco, lajedo e açude' },
  ...ENV_MODULES.map((m) => ({ name: biomeInfo(m.biome).name, ts: m.tileset, sample: m.meta.gallerySample, note: m.meta.galleryNote })),
];

export class GalleryScene extends Phaser.Scene {
  private hover!: Phaser.GameObjects.Text;
  private worldH = 0;

  constructor() {
    super('Gallery');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#061614');
    let y = 12;

    y = this.title('Fauna Brasil: galeria da arte (role: roda, setas ou arraste)', y, 18, '#ffc23a');

    const animated: { img: Phaser.GameObjects.Image; frames: number[] }[] = [];
    for (const biome of BIOMES) {
      const { ts } = biome;
      // ------------------------------------------------------------ todos os quadros do chão
      y = this.title(`${biome.name}: quadros do chão (${ts.frameNames.length}); passe o mouse para ver o nome`, y + 6, 14, '#8fe0c4');
      const cols = 26;
      const cell = 34;
      this.add.rectangle(8, y - 4, cols * cell + 8, Math.ceil(ts.frameNames.length / cols) * cell + 6, 0x0a2220).setOrigin(0);
      ts.frameNames.forEach((name, i) => {
        const x = 12 + (i % cols) * cell;
        const yy = y + Math.floor(i / cols) * cell;
        const img = this.add.image(x, yy, ts.key, i).setOrigin(0).setScale(2).setInteractive();
        img.on('pointerover', () => this.hover.setText(`${biome.name}, quadro ${i}: ${name}`));
      });
      y += Math.ceil(ts.frameNames.length / cols) * cell + 18;

      // ------------------------------------------------------------ mini-área com autotile e água animada
      y = this.title(`${biome.name}: mini-área com vizinhos e franjas (${biome.note})`, y, 14, '#8fe0c4');
      const sample = biome.sample;
      sample.forEach((row, ty) => {
        [...row].forEach((_, tx) => {
          const frames = ts.frames(sample, tx, ty);
          const img = this.add.image(12 + tx * 32, y + ty * 32, ts.key, frames[0]).setOrigin(0).setScale(2);
          if (frames.length > 1) animated.push({ img, frames });
          else for (const o of ts.overlays(sample, tx, ty)) this.add.image(12 + tx * 32, y + ty * 32, ts.key, o).setOrigin(0).setScale(2);
        });
      });
      y += sample.length * 32 + 20;
    }
    let tick = 0;
    this.time.addEvent({
      delay: 1000 / TILE_ANIM_FPS,
      loop: true,
      callback: () => {
        tick++;
        for (const a of animated) a.img.setFrame(a.frames[tick % a.frames.length]);
      },
    });

    // ------------------------------------------------------------ objetos
    for (const [title, items, bg] of [
      ['Objetos da Amazônia, ampliados 3x (copas translúcidas quando o jogador passa atrás)', Object.entries(PROPS).filter(([t]) => !(t in CAATINGA_PROPS) && !ENV_MODULES.some((m) => t in m.props)), 0x12402e],
      ['Objetos da Caatinga, dos cocais e do cerrado, ampliados 3x', Object.entries(PROPS).filter(([t]) => t in CAATINGA_PROPS), 0x4a3a22],
      ...ENV_MODULES.map((m) => [`Objetos: ${biomeInfo(m.biome).name}, ampliados 3x`, Object.entries(m.props), 0x2a3a2a] as const),
    ] as const) {
      if (items.length) y = this.propRows(title, [...items], y, bg);
    }

    // ------------------------------------------------------------ fauna da exploração
    y = this.title('Fauna na exploração (ow_<id>, 32x32 ampliado 3x): parado e andando/voando; passe o mouse', y, 14, '#8fe0c4');
    const owScale = 3;
    const owCell = OW_SIZE * owScale + 6;
    const owCols = Math.floor((W - 24) / owCell);
    for (const { id: biome, color } of BIOME_INFO) {
      const list = SPECIES.filter((sp) => sp.biome === biome);
      if (!list.length) continue;
      y = this.title(`Fauna na exploração: ${biomeInfo(biome).name}`, y, 12, '#cfe8dc');
      const rows = Math.ceil(list.length / owCols) * 2;
      this.add.rectangle(8, y - 4, W - 16, rows * owCell + 8, Phaser.Display.Color.HexStringToColor(color).darken(55).color)
        .setOrigin(0)
        .setAlpha(0.8);
      list.forEach((sp, i) => {
        const col = i % owCols;
        const row = Math.floor(i / owCols) * 2;
        for (const [k, state] of (['idle', 'move'] as const).entries()) {
          const spr = this.add.sprite(12 + col * owCell, y + (row + k) * owCell, owKey(sp.id), 0).setOrigin(0).setScale(owScale).setInteractive();
          if (this.anims.exists(owAnim(sp.id, state))) spr.play(owAnim(sp.id, state));
          spr.on('pointerover', () => this.hover.setText(`${sp.name} (${sp.id}), ${state === 'idle' ? 'parado' : 'em movimento'}`));
        }
      });
      y += rows * owCell + 14;
    }

    // ------------------------------------------------------------ retratos (captura e batalha)
    y = this.title('Retratos (animal_<id>, 64x64 ampliado 2x): quadros 0-1 parado, 2-3 ação, 4 ataque, 5 dano; passe o mouse', y, 14, '#8fe0c4');
    const aScale = 2;
    const aCell = ANIMAL_SIZE * aScale + 4;
    const perRow = Math.max(1, Math.floor((W - 24) / (aCell * 6 + 16)));
    for (const { id: biome, color } of BIOME_INFO) {
      const list = SPECIES.filter((sp) => sp.biome === biome);
      if (!list.length) continue;
      y = this.title(`Retratos: ${biomeInfo(biome).name}`, y, 12, '#cfe8dc');
      const rows = Math.ceil(list.length / perRow);
      this.add.rectangle(8, y - 4, W - 16, rows * aCell + 8, Phaser.Display.Color.HexStringToColor(color).darken(55).color).setOrigin(0).setAlpha(0.8);
      list.forEach((sp, i) => {
        const ox = 12 + (i % perRow) * (aCell * 6 + 16);
        const oy = y + Math.floor(i / perRow) * aCell;
        for (let f = 0; f < 6; f++) {
          const img = this.add.image(ox + f * aCell, oy, animalKey(sp.id), f).setOrigin(0).setScale(aScale).setInteractive();
          img.on('pointerover', () => this.hover.setText(`${sp.name} (${sp.id}), quadro ${f}`));
        }
      });
      y += rows * aCell + 14;
    }

    // ------------------------------------------------------------ explorador
    y = this.title('Explorador: parado (respirando) e andando, 3 direções (lado desenhado para a direita; esquerda = flipX)', y, 14, '#8fe0c4');
    this.add.rectangle(8, y - 4, W - 16, CHAR_H * 4 + 52, 0x12402e).setOrigin(0).setAlpha(0.8);
    const facings: Facing[] = ['down', 'up', 'side'];
    let ex = 40;
    for (const state of ['idle', 'walk'] as const) {
      for (const f of facings) {
        const spr = this.add.sprite(ex, y + 6, EXPLORER_KEY).setOrigin(0).setScale(4);
        spr.play(explorerAnim(state, f));
        this.add.text(ex - 4, y + CHAR_H * 4 + 12, `${state}-${f}`, { fontFamily: FONT, fontSize: '12px', color: '#eefff6' });
        ex += CHAR_W * 4 + 36;
      }
    }
    // lado esquerdo (espelhado) para conferir
    const left = this.add.sprite(ex, y + 6, EXPLORER_KEY).setOrigin(0).setScale(4).setFlipX(true);
    left.play(explorerAnim('walk', 'side'));
    this.add.text(ex - 4, y + CHAR_H * 4 + 12, 'walk-side (flipX)', { fontFamily: FONT, fontSize: '12px', color: '#eefff6' });
    y += CHAR_H * 4 + 60;

    this.worldH = y + 20;
    this.setupCamera();

    // legenda fixa com o nome do quadro sob o mouse
    this.hover = this.add.text(8, 640 - 22, '', { fontFamily: FONT, fontSize: '13px', color: '#ffe08a', backgroundColor: '#04100e' }).setScrollFactor(0).setDepth(10);
  }

  private propRows(title: string, items: [string, (typeof PROPS)[string]][], y0: number, bg: number): number {
    const y = this.title(title, y0, 14, '#8fe0c4');
    const scale = 3;
    let x = 12;
    let rowTop = y;
    let rowH = 0;
    const rows: { type: string; x: number }[][] = [[]];
    // agrupa em linhas para não passar da largura da tela
    for (const [type, s] of items) {
      const w = Math.max(s.w * scale, 90) + 14;
      if (x + w > W - 8 && rows[rows.length - 1].length) {
        rows.push([]);
        x = 12;
      }
      rows[rows.length - 1].push({ type, x });
      x += w;
    }
    for (const row of rows) {
      rowH = Math.max(...row.map((r) => PROPS[r.type].h * scale)) + 34;
      this.add.rectangle(8, rowTop - 4, W - 16, rowH, bg).setOrigin(0).setAlpha(0.8);
      for (const { type, x: px } of row) {
        const s = PROPS[type];
        const bottom = rowTop + rowH - 28;
        this.add.image(px, bottom, propKey(type)).setOrigin(0, 1).setScale(scale);
        const tags = [`${s.w}x${s.h}`, `base ${s.fw}x${s.fh}`, s.walkable ? 'anda' : '', s.canopy ? 'copa' : '', s.light ? 'luz' : ''].filter(Boolean).join(' ');
        this.add.text(px, bottom + 4, type, { fontFamily: FONT, fontSize: '13px', color: '#eefff6' });
        this.add.text(px, bottom + 18, tags, { fontFamily: FONT, fontSize: '10px', color: '#8fc7b4' });
      }
      rowTop += rowH + 8;
    }
    return rowTop + 10;
  }

  /** Posição (y) de cada título, para `?gallery=<trecho do título>` abrir já rolado até ele. */
  private titles: { text: string; y: number }[] = [];

  private title(text: string, y: number, size: number, color: string): number {
    this.titles.push({ text: text.toLowerCase(), y });
    this.add.text(12, y, text, { fontFamily: FONT, fontSize: `${size}px`, color });
    return y + size + 12;
  }

  private setupCamera(): void {
    const cam = this.cameras.main;
    const clamp = (v: number) => Phaser.Math.Clamp(v, 0, Math.max(0, this.worldH - 640));
    // ?gallery=retratos cerrado: começa rolado até o primeiro título que contém o texto (útil para screenshots).
    const want = new URLSearchParams(location.search).get('gallery')?.toLowerCase().trim();
    const hit = want ? this.titles.find((t) => t.text.includes(want)) : undefined;
    if (hit) cam.scrollY = clamp(hit.y - 8);
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => (cam.scrollY = clamp(cam.scrollY + dy)));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown) cam.scrollY = clamp(cam.scrollY - (p.y - p.prevPosition.y));
    });
    const keys = this.input.keyboard?.createCursorKeys();
    this.events.on('update', () => {
      if (!keys) return;
      if (keys.down.isDown) cam.scrollY = clamp(cam.scrollY + 8);
      if (keys.up.isDown) cam.scrollY = clamp(cam.scrollY - 8);
    });
  }
}
