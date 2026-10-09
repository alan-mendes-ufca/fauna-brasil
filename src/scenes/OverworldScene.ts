import Phaser from 'phaser';
import { ENV_MODULES } from '../biomes/env';
import { paint, rng, TILE } from '../art/canvas';
import { npcIdleAnim, npcKey } from '../art/npc';
import { CHAR_H, CHAR_W, EXPLORER_KEY, explorerAnim, type Facing } from '../art/explorer';
import { PROPS, propKey, tilesetFor, TILE_ANIM_FPS } from '../art/forest';
import { arrivalOf, exitAt, exitTiles, getRegion } from '../data/regions';
import type { NpcDef, PropPlacement, Region, RegionExit, TilePos } from '../data/types';
import { buildGrid, inBounds, isBlocked, nearestWalkable, type Grid } from '../world/grid';
import { findPath, smoothPath, type Pt } from '../world/pathfind';
import { LightLayer, type SceneLight } from './LightLayer';
import type { Habitat } from '../data/species';
import { beginEncounter, type EncounterEnd } from '../battle/flow';
import { Fauna, type Animal } from '../world/fauna';

// --- câmera e movimento
const ZOOM = 3;
const FOLLOW_LERP = 0.1;
/** Velocidade do jogador em pixels de arte por segundo. */
const WALK_SPEED = 60;
/** Limite do passo de tempo (s), para um engasgo não teletransportar o jogador. */
const MAX_DT = 0.05;
/** Histerese ao escolher a direção: evita trocar lado/frente-costas nas diagonais. */
const SIDE_ENTER = 1.4;
const SIDE_KEEP = 0.7;

// --- copas translúcidas
const CANOPY_ALPHA = 0.45;
const CANOPY_FADE_PER_S = 5;

// --- fauna visível e encontros (clique num animal: o explorador vai até ele)
/** Máximo de animais vagando perto do jogador. */
const FAUNA_CAP = 7;
/** Distância (px) do animal para o encontro começar; nadadores são abordados da margem. */
const REACH = 1.5 * TILE;
const SWIM_REACH = 3.5 * TILE;
/** Perto do alvo o explorador anda devagar (de mansinho) e não assusta os ariscos. */
const SNEAK_RADIUS = 4 * TILE;
const SNEAK_SPEED = 30;
/** Recalcula o caminho até o animal (que se move) neste intervalo. */
const REPATH_MS = 350;
/** "!" sobre o explorador antes do encontro abrir. */
const ENCOUNTER_LOCK_MS = 650;
/** Depois do encontro, cliques ignorados por um instante (o clique que fechou a captura não vira passo). */
const AFTER_ENCOUNTER_MS = 350;
/** Intervalo entre um morador virar e outro (ms). */
const NPC_TURN_MIN_MS = 3000;
const NPC_TURN_MAX_MS = 7000;
const ALERT_RISE = 3;

// --- saídas entre regiões
const FADE_MS = 450;
const FADE_RGB = [4, 16, 14] as const;
const EXIT_COLOR = 0xffd27a;

// --- profundidades (objetos em pé usam a base em y)
const DEPTH_GROUND = 0;
const DEPTH_WATER = 0.5;
const DEPTH_FLAT = 1;
const DEPTH_HOVER = 2;
const DEPTH_MARKER = 3;
const DEPTH_SHADOW = 1.5;
const DEPTH_RIPPLE = 0.6;
/** Aves em voo alto passam por cima das copas. */
const DEPTH_SKY = 50000;
const DEPTH_FX = 100000;
const DEPTH_LABEL = DEPTH_FX + 2;
/** Objetos rasos no chão (sobre a água): ficam sempre abaixo do jogador. */
const FLAT_PROPS: ReadonlySet<string> = new Set(['vitoria_regia']);

// --- clima
/** Cores de luz de sol: ganham poeira dourada. */
const SUN_COLORS: ReadonlySet<number> = new Set([0xffc860, 0xffa040]);
const LEAF_COUNT = 22;
const LEAF_FALL = { min: 10, max: 22 };
const LEAF_MARGIN = 24;
const MOTES_PER_SHAFT = 3;
const MOTE_ALPHA = 0.85;
const WATER_FIREFLIES = 14;

// --- god rays: faixas diagonais de luz caindo das clareiras
const RAY_TEX = { w: 24, h: 128 };
const RAY_ALPHA = { min: 0.12, max: 0.25 };
/** Inclinação das faixas (rad): a luz vem do alto à esquerda. */
const RAY_LEAN = -0.32;
const RAY_COLOR = '255,224,150';

// --- luz do jogador (discreta, para não sumir na mata escura)
const PLAYER_LIGHT: SceneLight = { x: 0, y: 0, radius: 44, color: 0xffe9b0, intensity: 0.3, seed: 0 };
/** Luz suave sobre o animal sob o cursor (ou o que o explorador segue): destaca o bicho no escuro da mata. */
const FOCUS_LIGHT: SceneLight = { x: 0, y: 0, radius: 30, color: 0xfff0c0, intensity: 0, seed: 0 };
const FOCUS_INTENSITY = 0.55;

// --- marcador e destaque
const MARKER_COLOR = 0xffe27a;
const HOVER_OK = 0xeafff2;
const HOVER_BAD = 0xff5a4a;

/** Folhas que caem: verdes e secas na mata; só secas (ocre, ferrugem, palha) na Caatinga. */
const LEAF_COLORS: Record<string, string[][]> = {
  amazonia: [
    ['#2f6a2a', '#4f9a3a'],
    ['#8a7a2a', '#c0a838'],
    ['#6a3a1c', '#a2622c'],
  ],
  caatinga: [
    ['#8a5a24', '#c08a3a'],
    ['#7a3a1c', '#b2622c'],
    ['#8a7a4a', '#c8b878'],
  ],
};
const LEAF_COUNT_DRY = 10;
/** Folhas e clima dos biomas de src/biomes/ (meta.ts). */
for (const m of ENV_MODULES) LEAF_COLORS[m.biome] = m.meta.leafColors;
const DRY_BIOMES = new Set<string>(['caatinga', ...ENV_MODULES.filter((m) => m.meta.dry).map((m) => m.biome)]);
const ALERT_ROWS = ['.ooo.', 'oywyo', 'oywyo', 'oyyyo', 'oyyyo', 'oyyyo', '.oyo.', '.ooo.', '.....', '.ooo.', 'oyyyo', '.ooo.'];
const ALERT_PALETTE = { o: '#10241c', y: '#ffd84a', w: '#fff6c8' };

/** Morador da vila na cena. */
interface NpcActor {
  def: NpcDef;
  sprite: Phaser.GameObjects.Sprite;
  facing: Facing;
  nextTurn: number;
}

interface Canopy {
  img: Phaser.GameObjects.Image;
  x0: number;
  x1: number;
  y0: number;
  /** Base do objeto (sua profundidade). */
  base: number;
}

interface AnimTile {
  img: Phaser.GameObjects.Image;
  frames: number[];
  phase: number;
}

interface Floater {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vy: number;
  sway: number;
  phase: number;
}

interface Ray {
  img: Phaser.GameObjects.Image;
  ax: number;
  ay: number;
  length: number;
  sway: number;
  speed: number;
  phase: number;
}

interface Mote {
  img: Phaser.GameObjects.Image;
  ax: number;
  ay: number;
  r: number;
  speed: number;
  phase: number;
  alpha: number;
}

/** Borda esquerda (px) da textura de um objeto, centrada na largura da base. */
const propLeft = (p: PropPlacement) => p.x * TILE + (PROPS[p.type].fw * TILE - PROPS[p.type].w) / 2;

/** Exploração da região com movimento por clique (A* + suavização), clima, fauna visível e saídas. */
export class OverworldScene extends Phaser.Scene {
  /** `?at=` da URL vale só na primeira entrada (depois as saídas decidem onde o jogador chega). */
  private static urlAtUsed = false;
  private regionId = 'amazonia';
  private lastMoveKey = '';
  private arrival?: TilePos;
  private region!: Region;
  private grid!: Grid;
  private player!: Phaser.GameObjects.Sprite;
  private lightLayer?: LightLayer;
  private sceneLights: SceneLight[] = [];
  private now = 0;

  private path: Pt[] = [];
  private facing: Facing = 'down';
  private animKey = '';
  private lastTile: TilePos = { x: -1, y: -1 };
  private lastCommand = { x: -1, y: -1 };

  private marker!: Phaser.GameObjects.Graphics;
  private markerTile: TilePos | null = null;
  private markerStart = 0;
  private hover!: Phaser.GameObjects.Graphics;
  private hoverKey = '';
  private pointerSeen = false;
  private readonly world = new Phaser.Math.Vector2();

  private canopies: Canopy[] = [];
  private canopyAlpha: number[] = [];
  private animTiles: AnimTile[] = [];
  private animIndex = -1;
  private leaves: Floater[] = [];
  private motes: Mote[] = [];
  private rays: Ray[] = [];

  private alert!: Phaser.GameObjects.Image;
  private lockUntil = 0;
  private alertUntil = 0;

  private fauna?: Fauna;
  private faunaStarted = false;
  /** Animal clicado: o explorador está indo até ele. */
  private target: Animal | null = null;
  private npcs: NpcActor[] = [];
  private npcTarget: NpcActor | null = null;
  private hoveredNpc: NpcActor | null = null;
  private repathAt = 0;
  /** Animal do encontro em andamento. */
  private engaged: Animal | null = null;
  /** O clique começou num animal: arrastar não vira movimento. */
  private pressOnAnimal = false;
  private playerSpeed = 0;
  private sneaking = false;
  private focus!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;
  private cursor = '';

  private exitMarks: { img: Phaser.GameObjects.Image; x: number; y: number; dir: number; phase: number }[] = [];
  private leaving = false;
  private lightAlpha = 1;
  private lightClock = 0;

  constructor() {
    super('Overworld');
  }

  init(data: { region?: string; at?: TilePos }): void {
    this.regionId = data.region ?? 'amazonia';
    this.arrival = data.at;
  }

  create(): void {
    try {
      this.region = getRegion(this.regionId);
    } catch (e) {
      console.error(e);
      this.add.text(16, 16, String((e as Error).message), { fontFamily: 'Pixelify Sans', color: '#ff9a8a', wordWrap: { width: 900 } });
      return;
    }
    const region = this.region;
    this.grid = buildGrid(region);
    const width = this.grid.w * TILE;
    const height = this.grid.h * TILE;

    this.path = [];
    this.animTiles = [];
    this.canopies = [];
    this.animIndex = -1;
    this.markerTile = null;
    this.hoverKey = '';
    this.lockUntil = 0;
    this.alertUntil = 0;
    this.lastCommand = { x: -1, y: -1 };
    this.target = null;
    this.npcs = [];
    this.npcTarget = null;
    this.hoveredNpc = null;
    this.engaged = null;
    this.pressOnAnimal = false;
    this.faunaStarted = false;
    this.leaving = false;
    this.cursor = '';

    this.makeFxTextures();
    this.buildGround(region);
    this.buildProps(region);
    this.buildPlayer(region);
    this.buildNpcs(region);

    this.hover = this.add.graphics().setDepth(DEPTH_HOVER);
    this.marker = this.add.graphics().setDepth(DEPTH_MARKER);
    this.alert = this.add.image(0, 0, 'fx_alert').setOrigin(0.5, 1).setDepth(DEPTH_FX).setVisible(false);
    this.focus = this.add.graphics().setDepth(DEPTH_FX + 1);
    // Texto 3x maior reduzido a 1/3: com o zoom 3 da câmera fica nítido, pixel a pixel.
    this.label = this.add
      .text(0, 0, '', { fontFamily: 'Pixelify Sans', fontSize: '24px', color: '#fff4d0', stroke: '#10241c', strokeThickness: 6 })
      .setOrigin(0.5, 1)
      .setScale(1 / ZOOM)
      .setDepth(DEPTH_LABEL)
      .setVisible(false);
    this.fauna = new Fauna(this, region, this.grid, { cap: FAUNA_CAP, shadowDepth: DEPTH_SHADOW, rippleDepth: DEPTH_RIPPLE, skyDepth: DEPTH_SKY });
    this.buildExits(region);

    const cam = this.cameras.main;
    cam.setZoom(ZOOM).setBounds(0, 0, width, height).setBackgroundColor('#04100e');
    cam.startFollow(this.player, true, FOLLOW_LERP, FOLLOW_LERP);
    cam.centerOn(this.player.x, this.player.y);
    cam.fadeIn(FADE_MS, ...FADE_RGB);

    this.buildLights(region);
    this.buildWeather();
    this.lightLayer = new LightLayer(document.getElementById('game')!, region.ambient, region.spill);
    this.lightAlpha = 0;
    this.lightClock = 0;
    this.lightLayer.setOpacity(0);
    // A luz é desenhada depois da câmera atualizar o scroll, para não ficar um quadro atrás.
    this.events.on(Phaser.Scenes.Events.RENDER, this.renderLight, this);

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      this.pointerSeen = true;
      this.onPointerDown(p);
    });
    this.input.on(Phaser.Input.Events.POINTER_UP, () => (this.pressOnAnimal = false));
    this.input.on(Phaser.Input.Events.POINTER_MOVE, () => (this.pointerSeen = true));
    this.input.on(Phaser.Input.Events.GAME_OUT, () => (this.pointerSeen = false));

    // A interface (placa com o nome da região) pode ouvir isto.
    this.game.events.emit('region-enter', { id: region.id, name: region.name });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.RENDER, this.renderLight, this);
      this.lightLayer?.destroy();
      this.lightLayer = undefined;
      this.setCursor('');
      this.fauna = undefined;
      this.textures.remove(this.groundKey());
    });
  }

  // ------------------------------------------------------------------ construção

  private groundKey = () => `ground_${this.region.id}`;

  private leafColors = () => LEAF_COLORS[this.region.biome] ?? LEAF_COLORS.amazonia;

  /** Texturas pequenas do clima, do "!" de encontro e da seta das saídas. */
  private makeFxTextures(): void {
    this.leafColors().forEach(([dark, light], i) =>
      paint(this, `fx_leaf_${this.region.biome}${i}`, 4, 3, (p) => p.hline(1, 0, 2, light).hline(0, 1, 4, light).px(2, 2, dark).px(1, 1, dark)),
    );
    // Seta dupla (») apontando para a direita; as outras direções giram a imagem.
    paint(this, 'fx_exit', 11, 9, (p) =>
      p.template(
        ['oo...oo....', 'oyo..oyo...', '.oyo..oyo..', '..oyo..oyo.', '...oww..oww', '..oyo..oyo.', '.oyo..oyo..', 'oyo..oyo...', 'oo...oo....'],
        { o: '#3a2208', y: '#ffd860', w: '#fffbe0' },
      ),
    );
    paint(this, 'fx_mote', 2, 2, (p) => p.rect(0, 0, 2, 2, '#ffe9a0'));
    paint(this, 'fx_firefly', 2, 2, (p) => p.rect(0, 0, 2, 2, '#b8ffd0'));
    paint(this, 'fx_ray', RAY_TEX.w, RAY_TEX.h, (p) => {
      for (let y = 0; y < RAY_TEX.h; y++) {
        for (let x = 0; x < RAY_TEX.w; x++) {
          // Bordas laterais suaves e esmaecimento em cima e embaixo.
          const side = Math.sin(((x + 0.5) / RAY_TEX.w) * Math.PI) ** 1.5;
          const along = Math.sin(((y + 0.5) / RAY_TEX.h) * Math.PI) ** 0.7;
          p.px(x, y, `rgba(${RAY_COLOR},${(side * along).toFixed(3)})`);
        }
      }
    });
    paint(this, 'fx_alert', 5, 12, (p) => p.template(ALERT_ROWS, ALERT_PALETTE));
  }

  /** Chão estático numa única textura canvas; água (vários quadros) vira imagem animada por cima. */
  private buildGround(region: Region): void {
    const { w, h } = this.grid;
    const key = this.groundKey();
    if (this.textures.exists(key)) this.textures.remove(key);
    const canvas = this.textures.createCanvas(key, w * TILE, h * TILE);
    if (!canvas) throw new Error(`Não foi possível criar a textura ${key}`);
    const ctx = canvas.getContext();
    const ts = tilesetFor(region.biome);
    const sheet = this.textures.get(ts.key);
    const source = sheet.getSourceImage() as CanvasImageSource;
    const draw = (frame: number, x: number, y: number) => {
      const f = sheet.get(frame);
      ctx.drawImage(source, f.cutX, f.cutY, f.cutWidth, f.cutHeight, x * TILE, y * TILE, TILE, TILE);
    };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const frames = ts.frames(region.map, x, y);
        draw(frames[0], x, y);
        if (frames.length > 1) {
          const img = this.add.image(x * TILE, y * TILE, ts.key, frames[0]).setOrigin(0).setDepth(DEPTH_WATER);
          this.animTiles.push({ img, frames, phase: (x * 7 + y * 13) % frames.length });
        } else {
          // Franjas e bordas (mato fechado avançando sobre a trilha etc.).
          for (const o of ts.overlays(region.map, x, y)) draw(o, x, y);
        }
      }
    }
    canvas.refresh();
    this.add.image(0, 0, key).setOrigin(0).setDepth(DEPTH_GROUND);
  }

  /** Objetos com profundidade na base; copas guardadas para a translucidez. */
  private buildProps(region: Region): void {
    for (const p of region.props) {
      const spec = PROPS[p.type];
      const base = (p.y + 1) * TILE;
      // A arte centra cada objeto na sua base (o tronco da sumaúma fica no meio dos 2 tiles).
      const left = propLeft(p);
      const img = this.add.image(left, base, propKey(p.type)).setOrigin(0, 1).setDepth(FLAT_PROPS.has(p.type) ? DEPTH_FLAT : base);
      if (spec.canopy) this.canopies.push({ img, x0: left, x1: left + spec.w, y0: base - spec.h, base });
    }
    this.canopyAlpha = this.canopies.map(() => 1);
  }

  private buildPlayer(region: Region): void {
    const start = this.startTile(region);
    this.player = this.add.sprite((start.x + 0.5) * TILE, (start.y + 0.5) * TILE, EXPLORER_KEY).setOrigin(0.5, 1);
    this.playAnim('idle');
    this.lastTile = start;
  }

  /** Moradores da vila: parados, olhando para onde o mapa mandou (viram de vez em quando). */
  private buildNpcs(region: Region): void {
    for (const def of region.npcs ?? []) {
      const facing = def.facing ?? 'down';
      const sprite = this.add.sprite((def.x + 0.5) * TILE, (def.y + 0.5) * TILE, npcKey(def.look)).setOrigin(0.5, 1);
      sprite.setDepth(sprite.y);
      const npc: NpcActor = { def, sprite, facing, nextTurn: 0 };
      this.setNpcFacing(npc, facing);
      npc.nextTurn = this.now + Phaser.Math.Between(NPC_TURN_MIN_MS, NPC_TURN_MAX_MS);
      this.npcs.push(npc);
    }
  }

  private setNpcFacing(npc: NpcActor, facing: Facing, flip = false): void {
    npc.facing = facing;
    npc.sprite.setFlipX(facing === 'side' && flip);
    npc.sprite.anims.play(npcIdleAnim(npc.def.look, facing), true);
  }

  /** O morador vira para um lado qualquer de vez em quando, enquanto ninguém conversa com ele. */
  private updateNpcs(): void {
    if (this.npcTarget) return;
    for (const npc of this.npcs) {
      if (this.now < npc.nextTurn) continue;
      npc.nextTurn = this.now + Phaser.Math.Between(NPC_TURN_MIN_MS, NPC_TURN_MAX_MS);
      const dir = Phaser.Math.Between(0, 3);
      this.setNpcFacing(npc, dir === 0 ? 'down' : dir === 1 ? 'up' : 'side', dir === 3);
    }
  }

  private npcAt(wx: number, wy: number): NpcActor | null {
    for (const npc of this.npcs) if (npc.sprite.getBounds().contains(wx, wy)) return npc;
    return null;
  }

  private nextToNpc(npc: NpcActor): boolean {
    const me = this.playerTile();
    return Math.abs(me.x - npc.def.x) + Math.abs(me.y - npc.def.y) === 1;
  }

  /** Clique num morador: anda até um tile vizinho (o mais perto do jogador) e conversa. */
  private commandTalk(npc: NpcActor): void {
    this.target = null;
    this.path = [];
    this.markerTile = null;
    this.marker.clear();
    if (this.nextToNpc(npc)) {
      this.talk(npc);
      return;
    }
    const me = this.playerTile();
    let best: Pt[] | null = null;
    let bestLen = Infinity;
    for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) {
      const n = { x: npc.def.x + dx, y: npc.def.y + dy };
      if (!inBounds(this.grid, n.x, n.y) || !this.reachable(n)) continue;
      const tiles = findPath(this.grid, me.x, me.y, n.x, n.y);
      if (!tiles) continue;
      const path = smoothPath(this.grid, { x: this.player.x, y: this.player.y }, tiles);
      if (path.length && tiles.length < bestLen) {
        best = path;
        bestLen = tiles.length;
      }
    }
    if (!best) return;
    this.npcTarget = npc;
    this.path = best;
  }

  /** Acompanha o caminho até o morador; ao chegar, conversa. */
  private updateNpcTarget(): void {
    const npc = this.npcTarget;
    if (!npc || this.path.length) return;
    this.npcTarget = null;
    if (this.nextToNpc(npc)) this.talk(npc);
  }

  private talk(npc: NpcActor): void {
    this.npcTarget = null;
    this.stop();
    const dx = npc.sprite.x - this.player.x;
    const dy = npc.sprite.y - this.player.y;
    this.face(dx, dy);
    this.playAnim('idle');
    // Vizinho em 4 direções: o eixo de maior distância diz para onde o morador olha de volta.
    if (Math.abs(dx) > Math.abs(dy)) this.setNpcFacing(npc, 'side', dx > 0);
    else this.setNpcFacing(npc, dy > 0 ? 'up' : 'down');
    npc.nextTurn = this.now + NPC_TURN_MAX_MS;
    this.lockUntil = this.now + AFTER_ENCOUNTER_MS;
    this.game.events.emit('npc-talk', { npc: npc.def, regionId: this.region.id });
  }

  /** Chegada por uma saída, ou o spawn da região, ou `?at=x,y` / `?at=nome` (só na 1ª entrada), num tile andável. */
  private startTile(region: Region): TilePos {
    let t: TilePos = this.arrival ?? region.spawn;
    const at = this.arrival || OverworldScene.urlAtUsed ? null : new URLSearchParams(location.search).get('at');
    OverworldScene.urlAtUsed = true;
    if (at) {
      const m = /^(\d+),(\d+)$/.exec(at);
      if (m) t = { x: Number(m[1]), y: Number(m[2]) };
      else if (region.places?.[at]) t = region.places[at];
    }
    if (isBlocked(this.grid, t.x, t.y)) {
      const near = nearestWalkable(this.grid, t.x, t.y, this.grid.area[region.spawn.y * this.grid.w + region.spawn.x]);
      if (near) t = near;
    }
    return t;
  }

  private buildLights(region: Region): void {
    this.sceneLights = region.lights.map((l, i) => {
      const x = (l.x + 0.5) * TILE;
      const y = (l.y + 0.5) * TILE;
      return {
        x,
        y,
        radius: l.radius * TILE,
        color: l.color,
        intensity: l.intensity,
        glow: l.glow ? { x, y, radius: l.glow * TILE, color: l.color } : undefined,
        seed: i * 1.7,
      };
    });
    region.props.forEach((p, i) => {
      const lt = PROPS[p.type].light;
      if (!lt) return;
      const x = propLeft(p) + lt.dx;
      const y = (p.y + 1) * TILE + lt.dy;
      this.sceneLights.push({
        x,
        y,
        radius: lt.radius,
        color: lt.color,
        intensity: lt.intensity,
        // Brilho ciano dos cogumelos contra o escuro.
        glow: { x, y, radius: lt.radius * 0.5, color: lt.color },
        flicker: lt.flicker,
        seed: i * 0.9,
      });
    });
    // Um brilho dourado nas saídas chama o olho para a trilha.
    for (const e of region.exits ?? []) {
      const c = this.exitCenter(e);
      this.sceneLights.push({ x: c.x, y: c.y, radius: 2.6 * TILE, color: 0xffc860, intensity: 0.55, seed: 3 });
    }
    this.sceneLights.push(PLAYER_LIGHT, FOCUS_LIGHT);
  }

  private exitCenter(e: RegionExit): Pt {
    return { x: (e.x + (e.w ?? 1) / 2) * TILE, y: (e.y + (e.h ?? 1) / 2) * TILE };
  }

  /** Direção para fora do mapa: 0 direita, 1 baixo, 2 esquerda, 3 cima (em quartos de volta). */
  private exitDir(e: RegionExit): number {
    if (e.x + (e.w ?? 1) >= this.grid.w) return 0;
    if (e.x <= 0) return 2;
    if (e.y <= 0) return 3;
    return 1;
  }

  /** Setas pulsando nos tiles de saída (a placa da trilha fica no mapa como objeto). */
  private buildExits(region: Region): void {
    this.exitMarks = [];
    for (const e of region.exits ?? []) {
      const dir = this.exitDir(e);
      exitTiles(e).forEach((t, i) => {
        const x = (t.x + 0.5) * TILE;
        const y = (t.y + 0.5) * TILE;
        const img = this.add
          .image(x, y, 'fx_exit')
          .setRotation((dir * Math.PI) / 2)
          // Acima das copas: a saída fica visível mesmo com árvore na frente.
          .setDepth(DEPTH_FX - 2);
        this.exitMarks.push({ img, x, y, dir, phase: i * 0.25 });
      });
    }
  }

  /** Folhas caindo (em volta da câmera) e poeira dourada nos fachos; vaga-lumes junto das luzes próprias. */
  private buildWeather(): void {
    const rand = rng(77);
    const v = this.cameras.main.worldView;
    this.leaves = [];
    const dry = DRY_BIOMES.has(this.region.biome);
    const colors = this.leafColors().length;
    for (let i = 0; i < (dry ? LEAF_COUNT_DRY : LEAF_COUNT); i++) {
      const img = this.add.image(0, 0, `fx_leaf_${this.region.biome}${i % colors}`).setDepth(DEPTH_FX);
      this.leaves.push({
        img,
        x: v.x + rand() * v.width,
        y: v.y + rand() * v.height,
        vy: LEAF_FALL.min + rand() * (LEAF_FALL.max - LEAF_FALL.min),
        sway: 6 + rand() * 8,
        phase: rand() * Math.PI * 2,
      });
    }
    this.motes = [];
    const addMote = (key: string, ax: number, ay: number, r: number) => {
      const img = this.add.image(ax, ay, key).setDepth(DEPTH_FX).setBlendMode(Phaser.BlendModes.ADD);
      this.motes.push({ img, ax, ay, r, speed: 0.4 + rand() * 0.8, phase: rand() * Math.PI * 2, alpha: MOTE_ALPHA });
    };
    for (const l of this.sceneLights) {
      if (SUN_COLORS.has(l.color)) {
        for (let i = 0; i < MOTES_PER_SHAFT; i++) {
          const a = rand() * Math.PI * 2;
          const d = Math.sqrt(rand()) * l.radius * 0.6;
          addMote('fx_mote', l.x + Math.cos(a) * d, l.y + Math.sin(a) * d, 5 + rand() * 6);
        }
      } else if (l.flicker === undefined && l !== PLAYER_LIGHT && l !== FOCUS_LIGHT && !dry) {
        addMote('fx_firefly', l.x, l.y - 6, 10);
      }
    }
    // Vaga-lumes junto à água: margens de areia coladas ao igarapé.
    const shore: TilePos[] = [];
    this.region.map.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === '_' && (row[x - 1] === '~' || row[x + 1] === '~')) shore.push({ x, y });
      }
    });
    for (let i = 0; i < (dry ? 0 : WATER_FIREFLIES) && shore.length; i++) {
      const t = shore[Math.floor(rand() * shore.length)];
      addMote('fx_firefly', (t.x + 0.5) * TILE, t.y * TILE, 12);
    }
    this.buildRays(rand);
  }

  /** God rays: algumas faixas diagonais translúcidas (blend ADD) caindo de cada luz com `rays`. */
  private buildRays(rand: () => number): void {
    this.rays = [];
    this.region.lights.forEach((def, i) => {
      const l = this.sceneLights[i];
      for (let k = 0; k < (def.rays ?? 0); k++) {
        const length = l.radius * (1.5 + rand() * 0.8);
        const width = 8 + rand() * 14;
        const img = this.add
          .image(0, 0, 'fx_ray')
          .setOrigin(0.5, 0)
          .setDepth(DEPTH_FX - 1)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setRotation(RAY_LEAN)
          .setScale(width / RAY_TEX.w, length / RAY_TEX.h);
        this.rays.push({
          img,
          ax: l.x + (rand() - 0.5) * l.radius * 1.3,
          ay: l.y - l.radius * 0.95,
          length,
          sway: 2 + rand() * 4,
          speed: 0.25 + rand() * 0.35,
          phase: rand() * Math.PI * 2,
        });
      }
    });
  }

  /** As camadas de luz (HTML) acompanham o fade da câmera: somem na saída e voltam na chegada. */
  private updateLightFade(): void {
    const want = this.leaving ? 0 : 1;
    // Relógio real (o delta do Phaser é suavizado e limitado quando os quadros atrasam).
    const t = performance.now();
    const dt = this.lightClock ? t - this.lightClock : 0;
    this.lightClock = t;
    if (this.lightAlpha === want) return;
    const step = dt / FADE_MS;
    this.lightAlpha = want > this.lightAlpha ? Math.min(want, this.lightAlpha + step) : Math.max(want, this.lightAlpha - step);
    this.lightLayer?.setOpacity(this.lightAlpha);
  }

  private renderLight(): void {
    this.lightLayer?.render(this.cameras.main, this.game.canvas, this.sceneLights, [], this.now, 0);
  }

  // ------------------------------------------------------------------ entrada e movimento

  private pointerTile(p: Phaser.Input.Pointer): TilePos {
    this.cameras.main.getWorldPoint(p.x, p.y, this.world);
    return { x: Math.floor(this.world.x / TILE), y: Math.floor(this.world.y / TILE) };
  }

  private playerTile(): TilePos {
    return { x: Math.floor(this.player.x / TILE), y: Math.floor(this.player.y / TILE) };
  }

  /** Alcançável: andável e na mesma área conectada do jogador. */
  private reachable(t: TilePos): boolean {
    if (isBlocked(this.grid, t.x, t.y)) return false;
    const me = this.playerTile();
    return this.grid.area[t.y * this.grid.w + t.x] === this.grid.area[me.y * this.grid.w + me.x];
  }

  private locked(): boolean {
    return this.now < this.lockUntil || this.leaving || this.engaged !== null;
  }

  /** Clique num animal: vai até ele. Em qualquer outro lugar: anda até lá. */
  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (this.locked()) return;
    this.cameras.main.getWorldPoint(p.x, p.y, this.world);
    const a = this.fauna?.at(this.world.x, this.world.y);
    if (a) {
      this.pressOnAnimal = true;
      this.target = a;
      this.npcTarget = null;
      this.repathAt = 0;
      this.markerTile = null;
      this.marker.clear();
      return;
    }
    const npc = this.npcAt(this.world.x, this.world.y);
    if (npc) {
      this.pressOnAnimal = true;
      this.commandTalk(npc);
      return;
    }
    this.pressOnAnimal = false;
    this.commandMove(p, true);
  }

  /** Novo destino (clique ou arrasto). Tile sólido ou isolado vira o andável mais próximo. */
  private commandMove(p: Phaser.Input.Pointer, fresh: boolean): void {
    if (this.locked()) return;
    const raw = this.pointerTile(p);
    if (!fresh && raw.x === this.lastCommand.x && raw.y === this.lastCommand.y) return;
    this.lastCommand = raw;
    this.target = null;
    this.npcTarget = null;

    const me = this.playerTile();
    const myArea = this.grid.area[me.y * this.grid.w + me.x];
    const clampX = Phaser.Math.Clamp(raw.x, 0, this.grid.w - 1);
    const clampY = Phaser.Math.Clamp(raw.y, 0, this.grid.h - 1);
    let goal: TilePos | null = { x: clampX, y: clampY };
    if (this.grid.area[clampY * this.grid.w + clampX] !== myArea) goal = nearestWalkable(this.grid, clampX, clampY, myArea);
    if (!goal) return;
    const tiles = findPath(this.grid, me.x, me.y, goal.x, goal.y);
    if (!tiles) return;
    this.path = smoothPath(this.grid, { x: this.player.x, y: this.player.y }, tiles);
    this.markerTile = goal;
    this.markerStart = this.now;
  }

  private stop(): void {
    this.path = [];
    this.markerTile = null;
    this.marker.clear();
    this.playAnim('idle');
  }

  private playAnim(state: 'idle' | 'walk'): void {
    const key = explorerAnim(state, this.facing);
    if (key === this.animKey) return;
    this.animKey = key;
    this.player.anims.play(key, true);
  }

  private face(dx: number, dy: number): void {
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    const side = this.facing === 'side' ? ax >= ay * SIDE_KEEP : ax > ay * SIDE_ENTER;
    this.facing = side ? 'side' : dy < 0 ? 'up' : 'down';
    this.player.setFlipX(side && dx < 0);
  }

  /** Anda `dt` segundos pelos pontos do caminho, a velocidade constante (devagar perto do animal-alvo). */
  private walk(dt: number): void {
    let left = (this.sneaking ? SNEAK_SPEED : WALK_SPEED) * dt;
    this.player.anims.timeScale = this.sneaking ? 0.6 : 1;
    let moved = false;
    while (left > 0 && this.path.length) {
      const t = this.path[0];
      const dx = t.x - this.player.x;
      const dy = t.y - this.player.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.001) this.face(dx, dy);
      if (d <= left) {
        this.player.setPosition(t.x, t.y);
        left -= d;
        this.path.shift();
      } else {
        this.player.setPosition(this.player.x + (dx / d) * left, this.player.y + (dy / d) * left);
        left = 0;
      }
      moved = true;
    }
    if (!moved) return;
    if (this.path.length) this.playAnim('walk');
    else this.stop();
    this.checkStep();
  }

  /** Entrou num tile novo? Se for uma saída, troca de região. */
  private checkStep(): void {
    const t = this.playerTile();
    if (t.x === this.lastTile.x && t.y === this.lastTile.y) return;
    this.lastTile = t;
    const exit = exitAt(this.region, t.x, t.y);
    if (exit) this.leaveTo(exit);
  }

  /** Fade e reinício da cena na região de destino, no ponto de chegada da saída. */
  private leaveTo(e: RegionExit): void {
    if (this.leaving) return;
    this.leaving = true;
    this.target = null;
    this.npcTarget = null;
    this.stop();
    this.setCursor('');
    const cam = this.cameras.main;
    cam.fadeOut(FADE_MS, ...FADE_RGB);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.restart({ region: e.to, at: arrivalOf(e) }));
  }

  // ------------------------------------------------------------------ fauna e encontros

  /** Segue o animal-alvo (ele se move) e abre o encontro quando chega perto. */
  private updateTarget(time: number): void {
    const a = this.target;
    this.sneaking = false;
    if (!a || !this.fauna) return;
    if (!this.fauna.animals.includes(a) || a.state === 'leaving') {
      this.target = null;
      this.stop();
      return;
    }
    const d = Math.hypot(a.x - this.player.x, a.y - this.player.y);
    const swimmer = a.prof.mover === 'swim';
    this.sneaking = d < SNEAK_RADIUS;
    if (d <= (swimmer ? SWIM_REACH : REACH) && this.fauna.clickable(a)) {
      this.engage(a);
      return;
    }
    if (time < this.repathAt && this.path.length) return;
    this.repathAt = time + REPATH_MS;
    const me = this.playerTile();
    const myArea = this.grid.area[me.y * this.grid.w + me.x];
    const ax = Phaser.Math.Clamp(Math.floor(a.x / TILE), 0, this.grid.w - 1);
    const ay = Phaser.Math.Clamp(Math.floor(a.y / TILE), 0, this.grid.h - 1);
    const goal = this.grid.area[ay * this.grid.w + ax] === myArea ? { x: ax, y: ay } : nearestWalkable(this.grid, ax, ay, myArea);
    const tiles = goal ? findPath(this.grid, me.x, me.y, goal.x, goal.y) : null;
    const atGoal = goal && goal.x === me.x && goal.y === me.y;
    if (!tiles || (atGoal && !this.path.length)) {
      // Não dá para chegar mais perto: nadadores podem voltar para perto da margem; os outros, desiste.
      if (!swimmer) this.target = null;
      if (this.path.length) this.stop();
      return;
    }
    this.path = smoothPath(this.grid, { x: this.player.x, y: this.player.y }, tiles);
    if (!this.path.length) this.stop();
  }

  /** Chegou ao animal: ele para, o "!" aparece e o encontro abre. */
  private engage(a: Animal): void {
    this.target = null;
    this.engaged = a;
    this.sneaking = false;
    this.stop();
    this.face(a.x - this.player.x, a.y - this.player.y);
    this.playAnim('idle');
    this.fauna?.engage(a, this.player.x);
    this.alertUntil = this.now + ENCOUNTER_LOCK_MS;
    this.alert.setVisible(true);
    this.events.emit('encounter', { tile: this.playerTile(), habitat: a.habitat, speciesId: a.species.id });
    this.time.delayedCall(ENCOUNTER_LOCK_MS, () => this.startCapture(a.species.id, a.habitat, a));
  }

  /** Começa o encontro (batalha e/ou captura por cima) e congela a exploração até ele terminar. */
  private startCapture(speciesId: string, habitat: Habitat, animal?: Animal): void {
    this.lightLayer?.setVisible(false);
    this.setCursor('');
    this.scene.pause();
    this.game.events.once('encounter-end', (end: EncounterEnd) => {
      this.lightLayer?.setVisible(true);
      this.scene.resume();
      const now = this.game.loop.time;
      this.engaged = null;
      this.lockUntil = now + AFTER_ENCOUNTER_MS;
      if (!animal || !this.fauna) return;
      // Capturado ou fugiu durante a captura: some do mapa. Se o jogador correu, o animal segue ali.
      if (end.result === 'captured' || end.result === 'fled') {
        this.fauna.remove(animal);
        this.fauna.delaySpawn(now);
      } else this.fauna.release(animal, now, this.player.x, this.player.y);
    });
    beginEncounter(this.game, { speciesId, habitat });
  }

  // ------------------------------------------------------------------ quadro a quadro

  update(time: number, delta: number): void {
    if (!this.player) return;
    this.now = time;
    const dt = Math.min(delta / 1000, MAX_DT);
    const locked = this.locked();

    const pointer = this.input.activePointer;
    const x0 = this.player.x;
    const y0 = this.player.y;
    if (!locked && pointer.isDown && !this.pressOnAnimal) this.commandMove(pointer, false);
    if (!locked) {
      this.updateTarget(time);
      this.walk(dt);
      this.updateNpcTarget();
    }
    this.playerSpeed = dt > 0 ? Math.hypot(this.player.x - x0, this.player.y - y0) / dt : 0;
    this.updateFauna(time, dt);
    this.updateLightFade();
    const tx = Math.floor(this.player.x / TILE);
    const ty = Math.floor(this.player.y / TILE);
    const moveKey = `${this.regionId}:${tx},${ty}`;
    if (moveKey !== this.lastMoveKey) {
      this.lastMoveKey = moveKey;
      this.game.events.emit('player-move', { region: this.regionId, x: tx, y: ty });
    }

    this.player.setDepth(this.player.y);
    this.updateAlert();
    if (!locked) this.updateNpcs();
    this.updateHover(pointer);
    this.updateFocus();
    this.updateExits(time);
    this.updateMarker(time);
    this.updateCanopies(dt);
    this.updateWater(time);
    this.updateWeather(time, dt);
    PLAYER_LIGHT.x = this.player.x;
    PLAYER_LIGHT.y = this.player.y - CHAR_H / 2;
  }

  /** Fauna: nasce em volta do jogador (a primeira leva já à vista), vaga, foge, some longe. */
  private updateFauna(time: number, dt: number): void {
    const f = this.fauna;
    if (!f) return;
    const view = this.cameras.main.worldView;
    if (!this.faunaStarted) {
      // worldView só é válido depois do primeiro quadro desenhado.
      if (view.width === 0) return;
      this.faunaStarted = true;
      // Teste: ?fauna=onca põe um animal dessa espécie perto do jogador.
      const forced = import.meta.env.DEV ? new URLSearchParams(location.search).get('fauna') : null;
      if (forced) {
        try {
          f.spawnNear(forced, this.player.x, this.player.y);
        } catch (e) {
          console.warn(e);
        }
      }
      f.populate(this.player.x, this.player.y, view, time, true);
    } else f.populate(this.player.x, this.player.y, view, time);
    f.update(time, dt, this.player.x, this.player.y, this.playerSpeed, this.sneaking, view);
  }

  private updateAlert(): void {
    if (!this.alert.visible) return;
    if (this.now >= this.alertUntil) {
      this.alert.setVisible(false);
      return;
    }
    const bounce = Math.abs(Math.sin(this.now / 90)) * ALERT_RISE;
    this.alert.setPosition(Math.round(this.player.x), Math.round(this.player.y - CHAR_H - 2 - bounce));
  }

  private setCursor(c: string): void {
    if (c === this.cursor) return;
    this.cursor = c;
    this.game.canvas.style.cursor = c;
  }

  private hovered: Animal | null = null;

  /**
   * Sob o cursor: um animal (cursor de mão, cantos dourados e o nome), uma saída (nome do destino)
   * ou um tile (claro se dá para ir, vermelho se for inalcançável).
   */
  private updateHover(pointer: Phaser.Input.Pointer): void {
    this.hovered = null;
    this.hoveredNpc = null;
    const clear = () => {
      if (this.hoverKey) this.hover.clear();
      this.hoverKey = '';
    };
    if (!this.pointerSeen || this.locked()) {
      clear();
      this.setCursor('');
      return;
    }
    this.cameras.main.getWorldPoint(pointer.x, pointer.y, this.world);
    const a = this.fauna?.at(this.world.x, this.world.y) ?? null;
    if (a) {
      this.hovered = a;
      clear();
      this.setCursor('pointer');
      return;
    }
    const npc = this.npcAt(this.world.x, this.world.y);
    if (npc) {
      this.hoveredNpc = npc;
      clear();
      this.setCursor('pointer');
      return;
    }
    const t = this.pointerTile(pointer);
    if (!inBounds(this.grid, t.x, t.y)) {
      clear();
      this.setCursor('');
      return;
    }
    const exit = exitAt(this.region, t.x, t.y);
    this.setCursor(exit && this.reachable(t) ? 'pointer' : '');
    const ok = this.reachable(t);
    const key = `${t.x},${t.y},${ok},${exit ? 1 : 0}`;
    if (key === this.hoverKey) return;
    this.hoverKey = key;
    const color = exit && ok ? EXIT_COLOR : ok ? HOVER_OK : HOVER_BAD;
    this.hover.clear().fillStyle(color, 0.14).fillRect(t.x * TILE, t.y * TILE, TILE, TILE).lineStyle(1, color, 0.6).strokeRect(t.x * TILE + 0.5, t.y * TILE + 0.5, TILE - 1, TILE - 1);
  }

  /** Cantos dourados e o nome sobre o animal sob o cursor (ou o que o explorador está seguindo). */
  private updateFocus(): void {
    const g = this.focus.clear();
    FOCUS_LIGHT.intensity = 0;
    const a = this.hovered ?? this.target ?? null;
    const exit = !a && this.hoverKey ? this.hoverExit() : undefined;
    if (!a || !this.fauna) {
      const npc = a ? null : this.hoveredNpc;
      if (npc) {
        const nome = npc.def.role === 'loja' ? `${npc.def.name} · Loja` : npc.def.name;
        this.label.setText(nome).setPosition(Math.round(npc.sprite.x), Math.round(npc.sprite.y - CHAR_H - 2)).setVisible(true);
      } else if (exit) {
        const c = this.exitCenter(exit);
        const arrow = ['›', 'v', '‹', '^'][this.exitDir(exit)];
        const text = this.exitDir(exit) === 2 ? `${arrow} ${exit.label ?? exit.to}` : `${exit.label ?? exit.to} ${arrow}`;
        const lx = Phaser.Math.Clamp(c.x, this.cameras.main.worldView.x + 30, this.cameras.main.worldView.right - 30);
        this.label.setText(text).setPosition(Math.round(lx), Math.round(c.y - TILE * 1.6)).setVisible(true);
      } else this.label.setVisible(false);
      return;
    }
    FOCUS_LIGHT.x = a.x;
    FOCUS_LIGHT.y = a.y - a.alt - 6;
    FOCUS_LIGHT.intensity = FOCUS_INTENSITY;
    const r = this.fauna.bounds(a);
    const beat = Math.floor(this.now / 220) % 2;
    const x0 = Math.round(r.x) - 2 - beat;
    const y0 = Math.round(r.y) - 2 - beat;
    const x1 = Math.round(r.right) + 1 + beat;
    const y1 = Math.round(r.bottom) + 1 + beat;
    const len = 3;
    g.fillStyle(MARKER_COLOR, 0.95);
    for (const [cx, cy, sx, sy] of [
      [x0, y0, 1, 1],
      [x1, y0, -1, 1],
      [x0, y1, 1, -1],
      [x1, y1, -1, -1],
    ] as const) {
      g.fillRect(sx > 0 ? cx : cx - len + 1, cy, len, 1);
      g.fillRect(cx, sy > 0 ? cy : cy - len + 1, 1, len);
    }
    this.label.setText(a.species.name).setPosition(Math.round(a.x), y0 - 2).setVisible(true);
  }

  /** A saída sob o cursor, se houver. */
  private hoverExit(): RegionExit | undefined {
    const [x, y] = this.hoverKey.split(',').map(Number);
    return exitAt(this.region, x, y);
  }

  /** Setas das saídas: deslizam para fora e piscam devagar. */
  private updateExits(time: number): void {
    const t = time / 1000;
    for (const m of this.exitMarks) {
      const k = (t * 1.2 + m.phase) % 1;
      const off = Math.round(k * 4) - 3;
      m.img.setPosition(m.x + [off, 0, -off, 0][m.dir], m.y + [0, off, 0, -off][m.dir]).setAlpha(0.55 + 0.45 * Math.sin(Math.PI * k));
    }
  }

  /** Marcador do destino: quatro cantos que pulsam e um ponto central piscando. */
  private updateMarker(time: number): void {
    const m = this.markerTile;
    if (!m) return;
    const beat = Math.floor((time - this.markerStart) / 160) % 2;
    const x = m.x * TILE;
    const y = m.y * TILE;
    const a = 2 + beat;
    const b = TILE - 3 - beat;
    const len = 3;
    const g = this.marker.clear().fillStyle(MARKER_COLOR, 0.95);
    for (const [cx, cy, sx, sy] of [
      [x + a, y + a, 1, 1],
      [x + b, y + a, -1, 1],
      [x + a, y + b, 1, -1],
      [x + b, y + b, -1, -1],
    ] as const) {
      g.fillRect(sx > 0 ? cx : cx - len + 1, cy, len, 1);
      g.fillRect(cx, sy > 0 ? cy : cy - len + 1, 1, len);
    }
    if (beat === 0) g.fillRect(x + TILE / 2 - 1, y + TILE / 2 - 1, 2, 2);
  }

  /** Copas ficam ~45% translúcidas quando o jogador está atrás delas (e voltam suavemente). */
  private updateCanopies(dt: number): void {
    // Caixas que não podem sumir atrás de uma copa: o jogador e os animais no chão.
    const boxes: number[][] = [[this.player.x - CHAR_W / 2 + 3, this.player.x + CHAR_W / 2 - 3, this.player.y - CHAR_H + 4, this.player.y]];
    for (const a of this.fauna?.animals ?? []) {
      if (a.alt > 6 || a.alpha < 0.3 || a.state === 'leaving') continue;
      boxes.push([a.x - 5, a.x + 5, a.y - 10, a.y]);
    }
    const step = CANOPY_FADE_PER_S * dt;
    for (let i = 0; i < this.canopies.length; i++) {
      const c = this.canopies[i];
      const behind = boxes.some(([px0, px1, py0, py1]) => py1 < c.base && px1 > c.x0 && px0 < c.x1 && py1 > c.y0 && py0 < c.base);
      const target = behind ? CANOPY_ALPHA : 1;
      const cur = this.canopyAlpha[i];
      if (cur === target) continue;
      const next = cur < target ? Math.min(target, cur + step) : Math.max(target, cur - step);
      this.canopyAlpha[i] = next;
      c.img.setAlpha(next);
    }
  }

  /** Água: um único contador de quadros troca a imagem de todos os tiles animados. */
  private updateWater(time: number): void {
    const idx = Math.floor((time / 1000) * TILE_ANIM_FPS);
    if (idx === this.animIndex) return;
    this.animIndex = idx;
    for (const t of this.animTiles) t.img.setFrame(t.frames[(idx + t.phase) % t.frames.length]);
  }

  private updateWeather(time: number, dt: number): void {
    const v = this.cameras.main.worldView;
    const t = time / 1000;
    const w = v.width + LEAF_MARGIN * 2;
    const h = v.height + LEAF_MARGIN * 2;
    for (const f of this.leaves) {
      f.y += f.vy * dt;
      // Reaparece do lado oposto da área vista (a câmera anda, a densidade fica constante).
      if (f.y > v.bottom + LEAF_MARGIN) f.y -= h;
      else if (f.y < v.y - LEAF_MARGIN) f.y += h;
      if (f.x > v.right + LEAF_MARGIN) f.x -= w;
      else if (f.x < v.x - LEAF_MARGIN) f.x += w;
      f.img.setPosition(Math.round(f.x + Math.sin(t * 1.6 + f.phase) * f.sway), Math.round(f.y));
      f.img.setRotation(Math.sin(t * 2.2 + f.phase) * 0.8);
    }
    for (const r of this.rays) {
      const x = r.ax + Math.sin(t * r.speed + r.phase) * r.sway;
      const onScreen = x > v.x - r.length && x < v.right + r.length && r.ay > v.y - r.length && r.ay < v.bottom + 16;
      if (r.img.visible !== onScreen) r.img.setVisible(onScreen);
      if (!onScreen) continue;
      const pulse = 0.5 + 0.5 * Math.sin(t * r.speed * 1.7 + r.phase * 2);
      r.img.setPosition(x, r.ay).setAlpha(RAY_ALPHA.min + (RAY_ALPHA.max - RAY_ALPHA.min) * pulse);
    }
    for (const m of this.motes) {
      const x = m.ax + Math.sin(t * m.speed + m.phase) * m.r;
      const y = m.ay + Math.cos(t * m.speed * 0.8 + m.phase * 1.3) * m.r * 0.7;
      const onScreen = x > v.x - 8 && x < v.right + 8 && y > v.y - 8 && y < v.bottom + 8;
      if (m.img.visible !== onScreen) m.img.setVisible(onScreen);
      if (!onScreen) continue;
      m.img.setPosition(Math.round(x), Math.round(y));
      m.img.setAlpha(m.alpha * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * m.speed * 2.4 + m.phase))));
    }
  }
}
