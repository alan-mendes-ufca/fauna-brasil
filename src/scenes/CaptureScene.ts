import Phaser from 'phaser';
import { ANIMAL_BASE, ANIMAL_SIZE, animalAnim, animalKey } from '../art/animals';
import {
  ANIMAL_GROUND_Y,
  CAP_H,
  CAP_W,
  NET_HOOP_Y,
  NET_H,
  paintCaptureProps,
  type CaptureBgLayers,
} from '../art/captureBg';
import { paintCaptureBackground } from '../art/captureBackgrounds';
import { behaviorFrame, netInsideBox, type BehaviorFrame, type NetFate } from '../capture/behavior';
import {
  RING_COLORS,
  effectiveQuality,
  SHAKES,
  catchProbability,
  qualityLabel,
  ringFraction,
  rollFlee,
  rollShakes,
  throwQuality,
} from '../capture/rules';
import { FLIGHT_MS, SPEED_AT_ANIMAL, VelocityTracker, computeLaunch, flightAt, type Launch } from '../capture/throw';
import { NET_BONUS } from '../data/items';
import { bag } from '../state/bag';
import { RARITY, getSpecies, type Habitat, type Iucn, type Rarity, type Species } from '../data/species';

export interface CaptureInit {
  speciesId: string;
  habitat: Habitat;
  /**
   * Animal atordoado (vindo da batalha por turnos): fica tonto com estrelinhas, não usa o
   * comportamento ativo, não foge depois de escapar da rede e tem qualidade mínima
   * de STUN_MIN_QUALITY (0,5) em todo arremesso que acerta.
   */
  stunned?: boolean;
}

export type CaptureResult = 'captured' | 'fled' | 'ran';

// ---------- constantes de layout (pixels de arte; a câmera amplia 3x) ----------
const ZOOM = 3;
const FONT = 'Pixelify Sans';
const CENTER_X = CAP_W / 2;
/** Centro do corpo do animal (e do alvo). */
const ANIMAL_CENTER_Y = ANIMAL_GROUND_Y - 28;
const TARGET_RADIUS = 32;
const NET_REST = { x: CENTER_X, y: 188 };
const NET_GRAB_RADIUS = 28;
/** Quanto a rede precisa ter subido (px de arte) para um soltar sem velocidade virar arremesso. */
const HOLD_THROW_RISE = 24;
const NET_BOUNDS = { minX: 18, maxX: CAP_W - 18, minY: 150, maxY: 204 };
const LAUNCH_GEO = { animalX: CENTER_X, animalY: ANIMAL_CENTER_Y, restY: NET_REST.y, farY: 40 };
const RESULT_CLICK_DELAY_MS = 500;
const SHAKE_PAUSE_MS = 380;

const DEPTH = { back: 0, waves: 1, shadow: 3, animal: 4, ring: 5, water: 6, front: 7, fx: 8, net: 10, hud: 20, result: 30 };

const RARITY_NAMES: Record<Rarity, string> = { comum: 'Comum', incomum: 'Incomum', rara: 'Rara', lendaria: 'Lendária' };
const IUCN_NAMES: Record<Iucn, string> = {
  LC: 'Pouco preocupante',
  NT: 'Quase ameaçada',
  VU: 'Vulnerável',
  EN: 'Em perigo',
  CR: 'Criticamente em perigo',
  NE: 'Não avaliada',
};
const IUCN_COLORS: Record<Iucn, number> = { LC: 0x4fd163, NT: 0xc4e03a, VU: 0xffe03a, EN: 0xff8a3a, CR: 0xe0301e, NE: 0xcfeee4 };
const FATE_TEXT: Record<Exclude<NetFate, 'catch'>, string> = {
  splash: 'Splash!',
  deflect: 'Rebatida!',
  burn: 'Queimou!',
  slide: 'Escorregou!',
};

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

type Fadable = Phaser.GameObjects.GameObject & { setAlpha(v: number): unknown };

type Stage = 'ready' | 'drag' | 'flight' | 'busy' | 'result';

interface Flight {
  startedAt: number;
  fromX: number;
  fromY: number;
  launch: Launch;
}

export class CaptureScene extends Phaser.Scene {
  private species!: Species;
  private habitat: Habitat = 'sub-bosque';
  private stunned = false;
  private stunG!: Phaser.GameObjects.Graphics;
  private bg!: CaptureBgLayers;

  private stage: Stage = 'busy';
  /** Relógio da cena (ms): alimenta o anel e o comportamento, só avança com a cena ativa. */
  private clock = 0;
  private phaseOffset = 0;

  private backImg!: Phaser.GameObjects.Image;
  private frontImg!: Phaser.GameObjects.Image;
  private fxImgs: Phaser.GameObjects.Image[] = [];
  private wavesImg?: Phaser.GameObjects.Image;
  private shadow!: Phaser.GameObjects.Image;
  private animal!: Phaser.GameObjects.Sprite;
  private warn!: Phaser.GameObjects.Image;
  private sparks: Phaser.GameObjects.Image[] = [];
  private motes: { img: Phaser.GameObjects.Image; vx: number; vy: number }[] = [];
  private ringG!: Phaser.GameObjects.Graphics;
  private targetG!: Phaser.GameObjects.Graphics;
  private waterG!: Phaser.GameObjects.Graphics;
  private pipsG!: Phaser.GameObjects.Graphics;
  private net!: Phaser.GameObjects.Image;
  private closedNet!: Phaser.GameObjects.Image;
  private hint!: Phaser.GameObjects.Text;
  private texts: Phaser.GameObjects.Text[] = [];

  private tracker = new VelocityTracker();
  private grab = { dx: 0, dy: 0 };
  private flight: Flight | null = null;
  private frame!: BehaviorFrame;
  private animalAnimState: 'idle' | 'action' | '' = '';
  private ringFrozen: number | null = null;
  private hiddenAnimal = false;
  private thrown = false;
  private finished = false;
  private resultShownAt = 0;
  private resultKind: CaptureResult | null = null;
  /** O último arremesso que acertou usou rede reforçada (o bicho não foge se escapar). */
  private reinforced = false;
  private netLabel?: Phaser.GameObjects.Text;

  constructor() {
    super('Capture');
  }

  init(data: CaptureInit): void {
    this.species = getSpecies(data.speciesId);
    this.habitat = data.habitat;
    this.stunned = data.stunned ?? false;
    this.stage = 'busy';
    this.clock = 0;
    this.phaseOffset = Math.random() * 1200;
    this.fxImgs = [];
    this.wavesImg = undefined;
    this.sparks = [];
    this.motes = [];
    this.texts = [];
    this.flight = null;
    this.animalAnimState = '';
    this.ringFrozen = null;
    this.hiddenAnimal = false;
    this.thrown = false;
    this.finished = false;
    this.resultKind = null;
    this.reinforced = false;
  }

  create(): void {
    const cam = this.cameras.main;
    cam.setZoom(ZOOM).centerOn(CAP_W / 2, CAP_H / 2).setBackgroundColor('#04302f').fadeIn(250, 4, 16, 15);
    paintCaptureProps(this);
    this.bg = paintCaptureBackground(this, this.habitat);
    this.buildWorld();
    this.buildHud();
    this.bindInput();
    this.frame = this.computeFrame(0);
    this.resetNet(true);
    // A fonte do jogo pode carregar depois do primeiro desenho: redesenha os textos quando chegar.
    void Promise.all([document.fonts.load(`400 12px "${FONT}"`), document.fonts.load(`600 12px "${FONT}"`)]).then(() => {
      if (this.sys.isActive()) this.texts.forEach((t) => t.updateText());
    });
  }

  // ---------- construção ----------

  private buildWorld(): void {
    const { back, front, fx, fxKind, waves } = this.bg;
    this.backImg = this.add.image(CAP_W / 2, CAP_H / 2, back).setDepth(DEPTH.back);
    if (waves) this.wavesImg = this.add.image(CAP_W / 2, CAP_H / 2, waves).setDepth(DEPTH.waves);
    this.shadow = this.add.image(CENTER_X, ANIMAL_GROUND_Y + 1, 'cap_shadow').setDepth(DEPTH.shadow);
    this.animal = this.add
      .sprite(CENTER_X, ANIMAL_GROUND_Y, animalKey(this.species.id), 0)
      .setOrigin(0.5, ANIMAL_BASE / ANIMAL_SIZE)
      .setDepth(DEPTH.animal);
    this.warn = this.add.image(CENTER_X, ANIMAL_CENTER_Y - 40, 'cap_warn').setDepth(DEPTH.ring).setVisible(false);
    for (let i = 0; i < 6; i++) this.sparks.push(this.add.image(0, 0, 'cap_spark').setDepth(DEPTH.water).setVisible(false));
    this.ringG = this.add.graphics().setDepth(DEPTH.ring);
    this.stunG = this.add.graphics().setDepth(DEPTH.water);
    this.waterG = this.add.graphics().setDepth(DEPTH.water);
    this.frontImg = this.add.image(CAP_W / 2, CAP_H / 2, front).setDepth(DEPTH.front);

    // Fachos de sol (mata) ou reflexos (água): duas cópias em fase oposta para cintilar.
    for (let i = 0; i < (fxKind === 'glints' ? 2 : 1); i++) {
      this.fxImgs.push(this.add.image(CAP_W / 2 + i * 7, CAP_H / 2, fx).setDepth(DEPTH.fx).setBlendMode(Phaser.BlendModes.ADD));
    }
    if (fxKind === 'beams') {
      for (let i = 0; i < 16; i++) {
        const img = this.add.image(Math.random() * CAP_W, Math.random() * CAP_H, 'cap_mote').setDepth(DEPTH.fx);
        this.motes.push({ img, vx: (Math.random() - 0.5) * 5, vy: -1 - Math.random() * 3 });
      }
    }

    this.closedNet = this.add.image(0, 0, 'cap_net_closed').setDepth(DEPTH.net).setVisible(false);
    this.net = this.add.image(NET_REST.x, NET_REST.y, 'cap_net').setOrigin(0.5, NET_HOOP_Y / NET_H).setDepth(DEPTH.net);
    this.pipsG = this.add.graphics().setDepth(DEPTH.net);

    // Alvo (círculo tracejado) sob o anel; os dois acompanham o animal.
    this.targetG = this.add.graphics().setDepth(DEPTH.ring - 0.5);
  }

  private buildHud(): void {
    const sp = this.species;
    const g = this.add.graphics().setDepth(DEPTH.hud);
    pixelPanel(g, 5, 5, 116, 30, 0x062a2c, 0x0f5a58, 0x031a1c, 0x010d0e);
    this.label(31, 9, sp.name, 10, '#eefff6', { bold: true });
    const rarityColor = hex(RING_COLORS[sp.rarity]);
    this.label(31, 22, RARITY_NAMES[sp.rarity], 8, rarityColor, { bold: true });
    this.iucnSeal(17, 20, sp.iucn, DEPTH.hud);

    // Botão Fugir.
    const bx = CAP_W - 51;
    const btnG = this.add.graphics().setDepth(DEPTH.hud);
    const drawBtn = (hover: boolean) => {
      btnG.clear();
      pixelPanel(btnG, bx, 5, 46, 17, hover ? 0x7a2a1e : 0x4a1a14, hover ? 0xb8503a : 0x7a2e22, 0x240a08, 0x0e0302);
    };
    drawBtn(false);
    this.label(bx + 23, 8, 'Fugir', 9, '#ffe9d8', { bold: true, ox: 0.5 });
    this.add
      .zone(bx + 23, 13, 46, 17)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => drawBtn(true))
      .on('pointerout', () => drawBtn(false))
      .on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation();
        if (this.stage !== 'result') this.finish('ran');
      });

    this.hint = this.label(CAP_W / 2, 158, 'Arraste a rede para cima e solte', 8, '#d8fff0', { ox: 0.5 }).setDepth(DEPTH.hud);
    this.tweens.add({ targets: this.hint, alpha: 0.45, duration: 700, yoyo: true, repeat: -1 });
    this.netLabel = this.label(6, 6, '', 7, '#ffe9a8').setDepth(DEPTH.hud);
    this.updateNetLabel();
  }

  /** Quantas redes reforçadas restam (só aparece se houver e estiverem ativadas na mochila). */
  private updateNetLabel(): void {
    const n = bag.count('rede');
    this.netLabel?.setText(bag.useNet && n ? `Rede reforçada ×${n}` : '');
  }

  /** Texto de interface: fonte pixel desenhada em resolução cheia (nítida com a câmera 3x). */
  private label(
    x: number,
    y: number,
    text: string,
    size: number,
    color: string,
    o: { bold?: boolean; ox?: number; oy?: number; wrap?: number; stroke?: string; align?: 'left' | 'center' } = {},
  ): Phaser.GameObjects.Text {
    const t = this.add
      .text(x, y, text, {
        fontFamily: FONT,
        fontSize: `${size}px`,
        fontStyle: o.bold ? '600' : '400',
        color,
        align: o.align ?? 'left',
        wordWrap: o.wrap ? { width: o.wrap } : undefined,
        lineSpacing: 2,
      })
      .setOrigin(o.ox ?? 0, o.oy ?? 0)
      .setResolution(ZOOM)
      .setStroke(o.stroke ?? '#031a1c', 1)
      .setDepth(DEPTH.hud);
    this.texts.push(t);
    t.once('destroy', () => (this.texts = this.texts.filter((x) => x !== t)));
    return t;
  }

  /** Selo IUCN: disco colorido com a sigla. */
  private iucnSeal(x: number, y: number, iucn: Iucn, depth: number): Fadable[] {
    const g = this.add.graphics().setDepth(depth);
    pixelDisc(g, x, y, 9, 0x010d0e);
    pixelDisc(g, x, y, 8, IUCN_COLORS[iucn]);
    pixelDisc(g, x - 2, y - 3, 3, 0xffffff, 0.35);
    const t = this.label(x, y - 5, iucn, 8, '#10201c', { bold: true, ox: 0.5, stroke: hex(IUCN_COLORS[iucn]) }).setDepth(depth);
    return [g, t];
  }

  private bindInput(): void {
    const cam = this.cameras.main;
    const world = (p: Phaser.Input.Pointer) => cam.getWorldPoint(p.x, p.y);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const w = world(p);
      if (this.stage === 'result') {
        if (this.time.now - this.resultShownAt > RESULT_CLICK_DELAY_MS && this.resultKind) this.finish(this.resultKind);
        return;
      }
      if (this.stage !== 'ready') return;
      if (Phaser.Math.Distance.Between(w.x, w.y, this.net.x, this.net.y + 8) > NET_GRAB_RADIUS) return;
      this.stage = 'drag';
      this.grab = { dx: this.net.x - w.x, dy: this.net.y - w.y };
      this.tracker.reset();
      this.tracker.push(eventTime(p), w.x, w.y);
      this.hint.setVisible(false);
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.stage !== 'drag') return;
      const w = world(p);
      this.tracker.push(eventTime(p), w.x, w.y);
      this.moveNetTo(w.x, w.y);
    });

    const release = (p: Phaser.Input.Pointer) => {
      if (this.stage !== 'drag') return;
      const w = world(p);
      const now = eventTime(p);
      this.tracker.push(now, w.x, w.y);
      this.moveNetTo(w.x, w.y);
      let { vx, vy } = this.tracker.velocity(now);
      // Arrastou a rede para cima e soltou parado (ou devagar): vale como arremesso ao animal.
      if (Math.hypot(vx, vy) < SPEED_AT_ANIMAL * 0.5 && this.net.y < NET_REST.y - HOLD_THROW_RISE) {
        vx = 0;
        vy = -SPEED_AT_ANIMAL;
      }
      const launch = computeLaunch(vx, vy, this.net.x, this.net.y, LAUNCH_GEO);
      if (import.meta.env.DEV) console.debug('[capture] soltou', JSON.stringify({ vx: Math.round(vx), vy: Math.round(vy), launch: !!launch }));
      if (!launch) {
        // Gesto fraco ou para baixo: a rede volta à mão.
        this.stage = 'busy';
        this.hint.setVisible(!this.thrown);
        this.tweens.add({
          targets: this.net,
          x: NET_REST.x,
          y: NET_REST.y,
          duration: 220,
          ease: 'Sine.easeOut',
          onComplete: () => (this.stage = 'ready'),
        });
        return;
      }
      this.thrown = true;
      this.stage = 'flight';
      this.flight = { startedAt: this.clock, fromX: this.net.x, fromY: this.net.y, launch };
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
    this.input.keyboard?.on('keydown-ESC', () => this.stage !== 'result' && this.finish('ran'));
  }

  private moveNetTo(px: number, py: number): void {
    this.net.x = Phaser.Math.Clamp(px + this.grab.dx, NET_BOUNDS.minX, NET_BOUNDS.maxX);
    this.net.y = Phaser.Math.Clamp(py + this.grab.dy, NET_BOUNDS.minY, NET_BOUNDS.maxY);
  }

  // ---------- laço principal ----------

  update(_time: number, delta: number): void {
    const dt = Math.min(delta, 50);
    this.clock += dt;
    this.updateBackground(dt);
    this.updateAnimal();
    this.updateRing();
    this.updateNet();
  }

  private updateBackground(dt: number): void {
    const t = this.clock;
    // Parallax: o fundo e a folhagem da frente deslizam em sentidos opostos.
    this.backImg.setPosition(CAP_W / 2 + Math.sin(t / 3100) * 3, CAP_H / 2 + Math.cos(t / 4300) * 1.5);
    this.frontImg.setPosition(CAP_W / 2 - Math.sin(t / 2300 + 1) * 6, CAP_H / 2 + Math.sin(t / 1900) * 1.5);
    this.frontImg.setRotation(Math.sin(t / 2700) * 0.012);
    if (this.bg.fxKind === 'beams') {
      this.fxImgs[0].setPosition(CAP_W / 2 + Math.sin(t / 4000) * 8, CAP_H / 2).setAlpha(0.7 + Math.sin(t / 1700) * 0.3);
      for (const m of this.motes) {
        m.img.x += (m.vx * dt) / 1000;
        m.img.y += (m.vy * dt) / 1000;
        if (m.img.y < -4) m.img.y = CAP_H + 4;
        if (m.img.x < -4) m.img.x = CAP_W + 4;
        if (m.img.x > CAP_W + 4) m.img.x = -4;
        m.img.setAlpha(0.5 + Math.sin(t / 400 + m.img.x) * 0.5);
      }
    } else {
      this.fxImgs.forEach((img, i) => {
        img.setPosition(CAP_W / 2 + i * 5 + Math.sin(t / 1800 + i * 2) * 4, CAP_H / 2);
        img.setAlpha(0.5 + 0.5 * Math.sin(t / 260 + i * Math.PI));
      });
    }
    if (this.wavesImg) {
      const shore = this.habitat === 'praia';
      this.wavesImg.setPosition(CAP_W / 2 + Math.sin(t / (shore ? 1300 : 2100)) * (shore ? 5 : 8), CAP_H / 2 + (shore ? Math.sin(t / 1300) * 2 : 0));
    }
  }

  /** Atordoado = fica parado (calmo), sem avisos nem ações. */
  private computeFrame(t: number): BehaviorFrame {
    return behaviorFrame(this.stunned ? 'calmo' : this.species.behavior, t, this.phaseOffset);
  }

  /** Cabeça tonta e estrelinhas girando sobre ela. */
  private updateStun(f: BehaviorFrame): void {
    const g = this.stunG;
    g.clear();
    if (!this.stunned || this.hiddenAnimal) return;
    const cx = CENTER_X + f.dx;
    const cy = ANIMAL_GROUND_Y + f.dy - 50;
    for (let i = 0; i < 3; i++) {
      const a = this.clock / 380 + (i * Math.PI * 2) / 3;
      const x = Math.round(cx + Math.cos(a) * 15);
      const y = Math.round(cy + Math.sin(a) * 4);
      const behind = Math.sin(a) < 0;
      g.fillStyle(0x3a1a00, 1).fillRect(x - 2, y - 1, 5, 3).fillRect(x - 1, y - 2, 3, 5);
      g.fillStyle(behind ? 0xc89a2a : 0xffe03a, 1).fillRect(x - 1, y, 3, 1).fillRect(x, y - 1, 1, 3);
      g.fillStyle(0xfff7c0, 1).fillRect(x, y, 1, 1);
    }
  }

  private updateAnimal(): void {
    const sp = this.species;
    const f = this.computeFrame(this.clock);
    this.frame = f;
    if (this.hiddenAnimal) return;

    const state = f.action ? 'action' : 'idle';
    if (state !== this.animalAnimState) {
      this.animalAnimState = state;
      this.animal.play(animalAnim(sp.id, state), true);
    }

    const sx = f.scale;
    let sy = f.scale;
    let ox = 0;
    let alpha = f.alpha;
    if (f.phase === 'telegraph') {
      // Aviso: pisca e, conforme o animal, agacha ou treme.
      const blink = Math.floor(this.clock / 110) % 2 === 0;
      if (sp.behavior === 'pula' || sp.behavior === 'bote') sy = 0.9;
      else if (sp.behavior === 'casco' || sp.behavior === 'choque') ox = blink ? 1 : -1;
      else alpha = blink ? 0.55 : 1;
      this.warn.setVisible(true).setPosition(CENTER_X, ANIMAL_CENTER_Y - 40 + Math.round(Math.sin(this.clock / 90) * 1.5));
    } else {
      this.warn.setVisible(false);
    }
    if (this.stunned) ox += Math.round(Math.sin(this.clock / 330) * 2);
    this.animal.setPosition(CENTER_X + f.dx + ox, ANIMAL_GROUND_Y + f.dy).setScale(sx, sy).setAlpha(alpha).setAngle(this.stunned ? Math.sin(this.clock / 330) * 5 : 0);

    // Sombra fica no chão e encolhe quando o animal sobe.
    const lift = Math.max(0, -f.dy) / 36;
    const submerged = sp.behavior === 'mergulha' && f.phase === 'active';
    this.shadow.setPosition(CENTER_X + f.dx, ANIMAL_GROUND_Y + 1).setScale(f.scale * (1 - lift * 0.4)).setAlpha(submerged ? 0.3 : 1 - lift * 0.5);

    this.updateAnimalFx(f);
    this.updateStun(f);
  }

  /** Efeitos por comportamento: ondulação (mergulha) e faíscas (choque). */
  private updateAnimalFx(f: BehaviorFrame): void {
    const t = this.clock;
    const g = this.waterG;
    g.clear();
    const bx = CENTER_X + f.dx;
    if (this.species.behavior === 'mergulha') {
      const strong = f.phase !== 'idle';
      const rings = strong ? 3 : 1;
      for (let i = 0; i < rings; i++) {
        const k = ((t / (strong ? 900 : 1600) + i / rings) % 1);
        const rx = 8 + k * 30;
        pixelEllipse(g, bx, ANIMAL_GROUND_Y + 2, rx, rx * 0.28, 0xc4fff0, (1 - k) * (strong ? 0.9 : 0.5));
      }
      if (f.phase === 'active') {
        for (let i = 0; i < 4; i++) {
          const k = (t / 700 + i * 0.27) % 1;
          g.fillStyle(0xe8fffa, 1 - k);
          g.fillRect(Math.round(bx - 12 + i * 8 + Math.sin(t / 200 + i) * 2), Math.round(ANIMAL_GROUND_Y - 6 - k * 22), 2, 2);
        }
      }
    }
    const shock = this.species.behavior === 'choque';
    const n = f.phase === 'active' ? this.sparks.length : f.phase === 'telegraph' && shock ? 2 : 0;
    const step = Math.floor(t / 70);
    this.sparks.forEach((s, i) => {
      s.setVisible(shock && i < n);
      if (!shock || i >= n) return;
      const a = (step * 2.399 + i * 1.7) % (Math.PI * 2);
      const r = 18 + ((step * 7 + i * 13) % 14);
      s.setPosition(Math.round(bx + Math.cos(a) * r), Math.round(ANIMAL_CENTER_Y + Math.sin(a) * r * 0.8));
      s.setFlipX(i % 2 === 0);
    });
    if (shock && f.phase === 'active') {
      // Arcos de descarga ao redor do corpo.
      for (let i = 0; i < 3; i++) {
        const a0 = (step * 1.3 + i * 2.1) % (Math.PI * 2);
        g.lineStyle(1, i === 0 ? 0xffffff : 0x3affd8, 1);
        g.beginPath();
        let px = bx + Math.cos(a0) * 14;
        let py = ANIMAL_CENTER_Y + Math.sin(a0) * 14;
        g.moveTo(Math.round(px), Math.round(py));
        for (let k = 1; k <= 4; k++) {
          px = bx + Math.cos(a0 + (k % 2 ? 0.1 : -0.1)) * (14 + k * 6) + ((step + k * 3) % 5) - 2;
          py = ANIMAL_CENTER_Y + Math.sin(a0) * (14 + k * 6) + ((step * 3 + k) % 5) - 2;
          g.lineTo(Math.round(px), Math.round(py));
        }
        g.strokePath();
      }
    }
  }

  private updateRing(): void {
    const g = this.ringG;
    g.clear();
    this.targetG.clear();
    if (this.hiddenAnimal || this.stage === 'result') return;
    const cx = Math.round(CENTER_X + this.frame.dx);
    const cy = Math.round(ANIMAL_CENTER_Y + this.frame.dy);
    pixelCircle(this.targetG, cx, cy, TARGET_RADIUS + 1, 0x031f24, 0.45, 5);
    pixelCircle(this.targetG, cx, cy, TARGET_RADIUS, 0xffffff, 0.8, 5);
    const frac = this.ringFrozen ?? ringFraction(this.clock, RARITY[this.species.rarity].ringPeriod);
    const color = RING_COLORS[this.species.rarity];
    const r = Math.max(2, Math.round(frac * TARGET_RADIUS));
    pixelCircle(g, cx, cy, r + 1, 0x031a1c, 1);
    pixelCircle(g, cx, cy, r - 2, 0x031a1c, 1);
    pixelCircle(g, cx, cy, r, color, 1);
    pixelCircle(g, cx, cy, r - 1, color, 1);
    g.fillStyle(0xffffff, 0.9).fillRect(cx - 1, cy - 1, 2, 2);
  }

  private updateNet(): void {
    if (this.stage === 'ready' || this.stage === 'drag') {
      // A rede dá um balanço suave enquanto espera.
      this.net.setRotation(this.stage === 'ready' ? Math.sin(this.clock / 700) * 0.03 : 0);
    }
    const fl = this.flight;
    if (this.stage !== 'flight' || !fl) return;
    const u = Math.min(1, (this.clock - fl.startedAt) / FLIGHT_MS);
    const pt = flightAt(u, fl.fromX, fl.fromY, fl.launch);
    this.net.setPosition(pt.x, pt.y).setScale(pt.scale).setRotation((fl.launch.landX - fl.fromX) * 0.004 + u * 0.4);
    if (u >= 1) {
      this.flight = null;
      this.onImpact(fl.launch);
    }
  }

  // ---------- impacto ----------

  private onImpact(launch: Launch): void {
    this.stage = 'busy';
    const f = this.frame;
    const frac = ringFraction(this.clock, RARITY[this.species.rarity].ringPeriod);
    this.ringFrozen = frac;
    const { landX: x, landY: y } = launch;
    const hit = netInsideBox(x, y, CENTER_X, ANIMAL_CENTER_Y, f);
    if (import.meta.env.DEV) console.debug('[capture] impacto', JSON.stringify({ hit, fate: f.fate, phase: f.phase, depth: +launch.depth.toFixed(2), speed: Math.round(launch.speed), x: Math.round(x), y: Math.round(y), ax: Math.round(CENTER_X + f.dx), ay: Math.round(ANIMAL_CENTER_Y + f.dy), ring: +frac.toFixed(2) }));

    if (!hit) {
      this.missThrow(launch, f);
      return;
    }
    if (f.fate !== 'catch') {
      this.netFate(f.fate, x, y);
      return;
    }

    // Acerto: o raio do anel no impacto define a qualidade.
    const dist = Math.hypot(x - (CENTER_X + f.dx), y - (ANIMAL_CENTER_Y + f.dy));
    const q = effectiveQuality(throwQuality(frac, dist, TARGET_RADIUS), this.stunned);
    const label = qualityLabel(q);
    const tier = label === 'Excelente!' ? '#ff9a1f' : label === 'Ótimo!' ? '#ffe03a' : '#b8ff6a';
    if (label) this.floatText(x, y - 34, label, label === 'Boa!' ? 12 : label === 'Ótimo!' ? 15 : 18, tier);
    else if (q === 0 && !this.stunned) this.floatText(x, y - 30, 'Fora do anel', 8, '#d8fff0');

    // Rede reforçada (mochila): gasta uma por arremesso que acerta.
    this.reinforced = bag.consumeNet();
    let p = catchProbability(this.species.rarity, q);
    if (this.reinforced) {
      p = Math.min(0.97, p + NET_BONUS);
      this.floatText(x, y - 46, 'Rede reforçada!', 8, '#ffe9a8');
      this.updateNetLabel();
    }
    this.closeNet(f, p);
  }

  /** Arremesso que não acertou: sem teste de fuga. */
  private missThrow(launch: Launch, f: BehaviorFrame): void {
    this.reinforced = false;
    const { landX: x, landY: y } = launch;
    const bx = CENTER_X + f.dx;
    const by = ANIMAL_CENTER_Y + f.dy;
    let msg = 'Errou!';
    if (Math.abs(x - bx) <= 22) {
      if (y > by) msg = this.species.behavior === 'pula' && f.dy < -10 ? 'Passou por baixo!' : 'Curto demais!';
      else msg = 'Longe demais!';
    }
    this.floatText(x, y - 16, msg, 9, '#ffe9d8');
    const over = y < by;
    this.burst(x, y + 4, 0xffe39a, 6);
    this.tweens.add({
      targets: this.net,
      y: over ? y - 10 : y + 5,
      scale: this.net.scale * (over ? 0.4 : 1),
      alpha: 0,
      duration: 380,
      ease: 'Sine.easeIn',
      onComplete: () => this.time.delayedCall(250, () => this.resetNet()),
    });
  }

  /** A rede acertou o animal, mas ele estava em ação: rebate, queima, escorrega ou espirra. */
  private netFate(fate: Exclude<NetFate, 'catch'>, x: number, y: number): void {
    this.floatText(x, y - 28, FATE_TEXT[fate], 11, '#ffe9d8');
    const back = (props: Phaser.Types.Tweens.TweenBuilderConfig, wait = 250) =>
      this.tweens.add({ ...props, onComplete: () => this.time.delayedCall(wait, () => this.resetNet()) });
    switch (fate) {
      case 'splash':
        this.burst(x, y + 6, 0xc4fff0, 14);
        this.burst(x, y + 6, 0x56dccb, 8);
        back({ targets: this.net, y: y + 10, alpha: 0, duration: 450 });
        break;
      case 'deflect':
        this.burst(x, y, 0xfff7c0, 8);
        back({ targets: this.net, x: x + (x < CENTER_X ? -50 : 50), y: NET_REST.y + 10, scale: 1.1, angle: 540, alpha: 0.2, duration: 520, ease: 'Quad.easeIn' });
        break;
      case 'burn':
        this.net.setTexture('cap_net_burnt');
        this.burst(x, y, 0x3affd8, 12);
        this.burst(x, y, 0xffffff, 5);
        this.tweens.add({ targets: this.net, x: x + 2, duration: 40, yoyo: true, repeat: 6 });
        back({ targets: this.net, alpha: 0, y: y + 12, delay: 380, duration: 400 }, 150);
        break;
      case 'slide':
        this.burst(x, y, 0xe3c84a, 5);
        back({ targets: this.net, x: x + (x < CENTER_X ? -30 : 30), y: y + 22, angle: x < CENTER_X ? -60 : 60, alpha: 0, duration: 500, ease: 'Quad.easeIn' });
        break;
    }
  }

  // ---------- rede fechada, sacudidas e fuga ----------

  private closeNet(f: BehaviorFrame, p: number): void {
    const x = CENTER_X + f.dx;
    const y = ANIMAL_CENTER_Y + f.dy;
    this.hiddenAnimal = true;
    this.animal.setVisible(false);
    this.warn.setVisible(false);
    this.waterG.clear();
    this.sparks.forEach((s) => s.setVisible(false));
    this.ringG.clear();
    this.net.setVisible(false);
    this.closedNet.setVisible(true).setPosition(x, y).setAngle(0).setScale(1.3).setAlpha(1);
    this.tweens.add({ targets: this.closedNet, scale: 1, duration: 140, ease: 'Back.easeOut' });
    this.burst(x, y, 0xfff7c0, 8);

    const plan = rollShakes(p);
    if (import.meta.env.DEV) console.debug('[capture] rede', JSON.stringify({ p: +p.toFixed(2), passed: plan.passed, escaped: plan.escaped }));
    this.drawPips(x, y - 26, 0);
    this.time.delayedCall(450, () => this.shakeStep(0, plan, x, y));
  }

  private shakeStep(i: number, plan: { passed: number; escaped: boolean }, x: number, y: number): void {
    const fails = plan.escaped && i === plan.passed;
    this.tweens.add({
      targets: this.closedNet,
      angle: { from: -16, to: 16 },
      duration: 105,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.closedNet.setAngle(0);
        if (fails) return this.escape(x, y);
        this.drawPips(x, y - 26, i + 1);
        if (i + 1 >= SHAKES) return this.time.delayedCall(450, () => this.captured(x, y));
        this.time.delayedCall(SHAKE_PAUSE_MS, () => this.shakeStep(i + 1, plan, x, y));
      },
    });
  }

  private drawPips(x: number, y: number, filled: number): void {
    const g = this.pipsG;
    g.clear();
    for (let i = 0; i < SHAKES; i++) {
      const px = x + (i - 1) * 9;
      pixelDisc(g, px, y, 3, 0x010d0e);
      pixelDisc(g, px, y, 2, i < filled ? 0xffe03a : 0x3a4a46);
    }
  }

  private captured(x: number, y: number): void {
    this.pipsG.clear();
    this.burst(x, y, 0xffe03a, 16);
    this.burst(x, y, 0xffffff, 8);
    this.tweens.add({ targets: this.closedNet, scale: 1.15, duration: 160, yoyo: true });
    this.time.delayedCall(550, () => this.showResult('captured'));
  }

  /** O animal escapa da rede; depois rola a fuga da raridade. */
  private escape(x: number, y: number): void {
    this.pipsG.clear();
    this.stage = 'busy';
    this.burst(x, y, 0xfff7c0, 12);
    this.closedNet.setVisible(false);
    this.net.setTexture('cap_net').setVisible(true).setPosition(x, y + 14).setScale(1).setAngle(20).setAlpha(1);
    this.tweens.add({ targets: this.net, alpha: 0, y: y + 22, duration: 600, delay: 200 });
    this.hiddenAnimal = false;
    this.animal.setVisible(true);
    this.animalAnimState = '';
    this.floatText(x, y - 34, 'Escapou!', 12, '#ffe9d8');

    const flees = !this.stunned && !this.reinforced && rollFlee(this.species.rarity);
    this.time.delayedCall(900, () => {
      if (!flees) {
        this.ringFrozen = null;
        this.resetNet();
        return;
      }
      this.hiddenAnimal = true; // o laço deixa de reposicionar o animal durante a corrida
      this.animal.play(animalAnim(this.species.id, 'action'), true);
      this.animal.setFlipX(x < CENTER_X);
      this.tweens.add({
        targets: this.animal,
        x: this.animal.x + (x < CENTER_X ? -190 : 190),
        alpha: 0,
        duration: 650,
        ease: 'Quad.easeIn',
        onComplete: () => this.showResult('fled'),
      });
      this.tweens.add({ targets: this.shadow, alpha: 0, duration: 400 });
    });
  }

  /** Volta ao estado de mira, com a rede nova na mão. */
  private resetNet(first = false): void {
    this.ringFrozen = null;
    this.closedNet.setVisible(false);
    this.net.setTexture('cap_net').setVisible(true).setPosition(NET_REST.x, NET_REST.y).setScale(1).setAngle(0);
    this.tweens.killTweensOf(this.net);
    this.net.setAlpha(0);
    this.tweens.add({
      targets: this.net,
      alpha: 1,
      duration: first ? 400 : 220,
      onComplete: () => {
        this.stage = 'ready';
      },
    });
    this.hint.setVisible(!this.thrown);
  }

  // ---------- resultado ----------

  private showResult(kind: CaptureResult): void {
    if (import.meta.env.DEV) console.debug('[capture] resultado', kind);
    this.stage = 'result';
    this.resultKind = kind;
    this.resultShownAt = this.time.now;
    this.hint.setVisible(false);
    const sp = this.species;
    const objs: Fadable[] = [];
    const d = DEPTH.result;

    const dim = this.add.rectangle(0, 0, CAP_W, CAP_H, 0x010d0e, 1).setOrigin(0).setDepth(d).setAlpha(0);
    this.tweens.add({ targets: dim, alpha: 0.72, duration: 260 });
    const g = this.add.graphics().setDepth(d + 1);
    objs.push(g);

    if (kind === 'captured') {
      pixelPanel(g, 36, 14, 248, 186, 0x072e30, 0x14706a, 0x031c1e, 0x010d0e);
      const title = this.label(CAP_W / 2, 20, 'Capturado!', 22, '#ffd23a', { bold: true, ox: 0.5, stroke: '#5a2a00' }).setDepth(d + 2);
      this.tweens.add({ targets: title, scale: 1.08, duration: 500, yoyo: true, repeat: -1 });
      // Retrato do animal em moldura (1x).
      pixelPanel(g, 50, 52, 74, 74, 0x0a5a56, 0x1c9a86, 0x04302f, 0x010d0e);
      const portrait = this.add.sprite(87, 56 + 58, animalKey(sp.id), 0).setOrigin(0.5, ANIMAL_BASE / ANIMAL_SIZE).setDepth(d + 2);
      portrait.play(animalAnim(sp.id, 'idle'));
      objs.push(portrait);
      objs.push(this.label(134, 54, sp.name, sp.name.length > 16 ? 10 : 12, '#eefff6', { bold: true, wrap: 146 }).setDepth(d + 2));
      objs.push(this.label(134, 70, sp.scientific, 8, '#8fe0c4', { wrap: 140 }).setDepth(d + 2));
      objs.push(this.label(134, 88, RARITY_NAMES[sp.rarity], 9, hex(RING_COLORS[sp.rarity]), { bold: true }).setDepth(d + 2));
      objs.push(...this.iucnSeal(141, 112, sp.iucn, d + 2));
      objs.push(this.label(153, 107, IUCN_NAMES[sp.iucn], 8, '#d8fff0', { wrap: 120 }).setDepth(d + 2));
      objs.push(this.label(50, 134, sp.fact, 8, '#fff2c0', { wrap: 220 }).setDepth(d + 2));
      const prompt = this.label(CAP_W / 2, 184, 'Clique para continuar', 8, '#8fe0c4', { ox: 0.5 }).setDepth(d + 2);
      this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
      objs.push(title, prompt);
    } else {
      pixelPanel(g, 60, 66, 200, 82, 0x2c1210, 0x6a2e22, 0x180806, 0x0e0302);
      objs.push(this.label(CAP_W / 2, 74, 'Fugiu…', 20, '#ff8a6a', { bold: true, ox: 0.5, stroke: '#3a0e08' }).setDepth(d + 2));
      objs.push(this.label(CAP_W / 2, 104, `${sp.name} sumiu entre as folhas.`, 8, '#ffe9d8', { ox: 0.5 }).setDepth(d + 2));
      const prompt = this.label(CAP_W / 2, 128, 'Clique para continuar', 8, '#ffb8a0', { ox: 0.5 }).setDepth(d + 2);
      this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
      objs.push(prompt);
    }
    objs.forEach((o) => o.setAlpha(0));
    this.tweens.add({ targets: objs, alpha: 1, duration: 260 });
  }

  private finish(result: CaptureResult): void {
    if (this.finished) return;
    this.finished = true;
    this.tweens.killAll();
    this.game.events.emit('capture-done', { speciesId: this.species.id, result });
    this.scene.stop();
  }

  // ---------- efeitos ----------

  /** Texto flutuante (pontuação, avisos) que sobe e some. */
  private floatText(x: number, y: number, text: string, size: number, color: string): void {
    const t = this.label(Phaser.Math.Clamp(x, 56, CAP_W - 56), y, text, size, color, { bold: true, ox: 0.5, oy: 0.5, stroke: '#2a1000' }).setDepth(DEPTH.hud + 2);
    t.setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, y: y - 16, alpha: 0, delay: 650, duration: 450, onComplete: () => t.destroy() });
  }

  /** Estouro de quadradinhos (poeira, água, faíscas). */
  private burst(x: number, y: number, color: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 18;
      const px = this.add.rectangle(Math.round(x), Math.round(y), 2, 2, color).setDepth(DEPTH.net + 1);
      this.tweens.add({
        targets: px,
        x: Math.round(x + Math.cos(a) * r),
        y: Math.round(y + Math.sin(a) * r * 0.8 + 6),
        alpha: 0,
        duration: 350 + Math.random() * 250,
        ease: 'Quad.easeOut',
        onComplete: () => px.destroy(),
      });
    }
  }
}

/** Instante do evento do navegador (mais fiel que a hora em que o Phaser o processou). */
function eventTime(p: Phaser.Input.Pointer): number {
  return p.event?.timeStamp ?? performance.now();
}

// ---------- desenho em pixels (Graphics) ----------

/** Painel de interface com cantos cortados, brilho no alto e sombra embaixo. */
function pixelPanel(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number, light: number, dark: number, outline: number): void {
  g.fillStyle(outline, 1).fillRect(x + 2, y, w - 4, h).fillRect(x, y + 2, w, h - 4).fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle(fill, 1).fillRect(x + 2, y + 1, w - 4, h - 2).fillRect(x + 1, y + 2, w - 2, h - 4);
  g.fillStyle(light, 1).fillRect(x + 2, y + 1, w - 4, 1).fillRect(x + 1, y + 2, 1, h - 4);
  g.fillStyle(dark, 1).fillRect(x + 2, y + h - 2, w - 4, 1).fillRect(x + w - 2, y + 2, 1, h - 4);
}

/** Circunferência de 1px por pixels inteiros (algoritmo do ponto médio). `dash` > 0 tracejado. */
function pixelCircle(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, color: number, alpha = 1, dash = 0): void {
  g.fillStyle(color, alpha);
  let x = r;
  let y = 0;
  let err = 1 - r;
  let n = 0;
  const plot = (px: number, py: number) => {
    if (dash && Math.floor(n / dash) % 2) return;
    g.fillRect(cx + px, cy + py, 1, 1);
  };
  while (x >= y) {
    n++;
    plot(x, y);
    plot(y, x);
    plot(-y, x);
    plot(-x, y);
    plot(-x, -y);
    plot(-y, -x);
    plot(y, -x);
    plot(x, -y);
    y++;
    if (err < 0) err += 2 * y + 1;
    else {
      x--;
      err += 2 * (y - x) + 1;
    }
  }
}

/** Elipse de contorno em pixels. */
function pixelEllipse(g: Phaser.GameObjects.Graphics, cx: number, cy: number, rx: number, ry: number, color: number, alpha: number): void {
  g.fillStyle(color, alpha);
  const steps = Math.max(24, Math.round(rx * 5));
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    g.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1);
  }
}

function pixelDisc(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
    g.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
  }
}
