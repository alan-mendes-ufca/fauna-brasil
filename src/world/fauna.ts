import Phaser from 'phaser';
import { TILE, paint } from '../art/canvas';
import { OW_BASE, OW_SIZE, owAnim, owKey } from '../art/wildlife';
import { getSpecies, type Habitat, type Species } from '../data/species';
import type { Region } from '../data/types';
import { habitatBit, habitatMap, isSwimmer, pickForTile } from './encounters';
import type { Grid } from './grid';

// FAUNA VISÍVEL NO MAPA
// Os animais nascem fora da tela, no habitat de cada espécie, e vagam por ele com um jeito próprio:
// aves e borboletas pousam e voam curto, aquáticos nadam e mergulham, a preguiça quase não se mexe,
// sapos e macacos andam aos pulos. Alguns fogem se o jogador chega correndo (chegar devagar não assusta).
// Sprites: contrato de src/art/wildlife.ts (owKey/owAnim, 32×32, base em OW_BASE, olhando para a direita).

export type Mover = 'walk' | 'hop' | 'fly' | 'swim' | 'still';

export interface FaunaProfile {
  mover: Mover;
  /** Velocidade de deslocamento (px/s). */
  speed: number;
  /** Pausa entre deslocamentos (ms). */
  idle: [number, number];
  /** Raio (tiles) de cada passeio. */
  roam: number;
  /** Foge se o jogador chega rápido. */
  skittish: boolean;
  /** Altura do voo (px). */
  alt: number;
}

/** Comportamento no mapa a partir dos dados da espécie (habitat, comportamento, porte). */
export function profileOf(sp: Species): FaunaProfile {
  const rare = sp.rarity === 'rara' || sp.rarity === 'lendaria';
  if (isSwimmer(sp)) return { mover: 'swim', speed: 18, idle: [600, 2200], roam: 5, skittish: rare, alt: 0 };
  switch (sp.behavior) {
    case 'voa':
      return sp.size === 'pequeno'
        ? { mover: 'fly', speed: 26, idle: [1200, 3500], roam: 4, skittish: true, alt: 8 }
        : { mover: 'fly', speed: sp.size === 'grande' ? 62 : 72, idle: [2500, 7000], roam: 7, skittish: true, alt: 18 };
    case 'calmo':
      return { mover: 'still', speed: 4, idle: [6000, 14000], roam: 1, skittish: false, alt: 0 };
    case 'pula':
      return { mover: 'hop', speed: 40, idle: [700, 2600], roam: 4, skittish: true, alt: 0 };
    case 'casco':
      return { mover: 'walk', speed: 7, idle: [2500, 6500], roam: 3, skittish: false, alt: 0 };
    case 'bote':
      return { mover: 'walk', speed: sp.size === 'grande' ? 20 : 16, idle: [1500, 5000], roam: 6, skittish: rare, alt: 0 };
    default:
      return { mover: 'walk', speed: sp.size === 'pequeno' ? 22 : 26, idle: [1200, 4000], roam: 5, skittish: rare || sp.size === 'pequeno', alt: 0 };
  }
}

type State = 'idle' | 'move' | 'hidden' | 'engaged' | 'leaving';

interface Pt {
  x: number;
  y: number;
}

export interface Animal {
  readonly uid: number;
  readonly species: Species;
  readonly prof: FaunaProfile;
  /** Habitat em que nasceu (vai para o encontro: fundo da captura). */
  readonly habitat: Habitat;
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Image;
  readonly ripple?: Phaser.GameObjects.Image;
  /** Posição no chão (px) e altura (px) acima dele. */
  x: number;
  y: number;
  alt: number;
  state: State;
  path: Pt[];
  /** Próxima decisão (ms). */
  next: number;
  fleeing: boolean;
  /** Não foge de novo antes disto (ms). */
  calmUntil: number;
  /** Voo/pulo em andamento: de (sx, sy) a (tx, ty). */
  arc?: { sx: number; sy: number; tx: number; ty: number; t: number; dur: number; peak: number };
  /** Nadador: hora de mergulhar (visível) ou de voltar à tona (submerso). */
  diveAt: number;
  alpha: number;
}

const FLEE_RADIUS = 2.8 * TILE;
const FLEE_DIST = 7;
const FLEE_SPEED = 2.6;
/** Animais de porte tem área de clique maior. */
const HIT: Record<Species['size'], { w: number; h: number; shadow: number }> = {
  pequeno: { w: 14, h: 14, shadow: 0.6 },
  medio: { w: 20, h: 20, shadow: 0.9 },
  grande: { w: 28, h: 24, shadow: 1.25 },
};

const DIRS4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export interface FaunaOptions {
  /** Máximo de animais perto do jogador. */
  cap: number;
  /** Profundidade das sombras (acima do chão, abaixo dos objetos em pé). */
  shadowDepth: number;
  rippleDepth: number;
  /** Profundidade dos animais em voo alto (acima das copas). */
  skyDepth: number;
}

/** Fauna de uma região: nascimento, comportamento e remoção. A cena cuida do clique e do encontro. */
export class Fauna {
  readonly animals: Animal[] = [];
  private readonly habitats: Uint32Array;
  private readonly w: number;
  private readonly h: number;
  private nextSpawn = 0;
  private uid = 0;

  /** Raio (tiles) em que os animais nascem e somem (fora dele, longe da tela). */
  static readonly SPAWN_MIN = 6;
  static readonly SPAWN_MAX = 16;
  static readonly DESPAWN = 24;
  static readonly SPAWN_EVERY = 1400;
  static readonly RESPAWN_DELAY = 7000;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly region: Region,
    private readonly grid: Grid,
    private readonly opt: FaunaOptions,
  ) {
    this.habitats = habitatMap(region);
    this.w = grid.w;
    this.h = grid.h;
    paint(scene, 'fx_shadow', 16, 6, (p) => {
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 16; x++) {
          const d = Math.hypot((x + 0.5 - 8) / 8, (y + 0.5 - 3) / 3);
          if (d <= 1) p.px(x, y, d < 0.6 ? 'rgba(20,16,40,0.42)' : 'rgba(20,16,40,0.24)');
        }
      }
    });
    paint(scene, 'fx_ripple', 22, 8, (p) => {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 22; x++) {
          const d = Math.hypot((x + 0.5 - 11) / 11, (y + 0.5 - 4) / 4);
          if (d <= 1 && d > 0.72) p.px(x, y, (x + y) % 3 === 0 ? 'rgba(220,255,250,0.9)' : 'rgba(170,240,235,0.6)');
        }
      }
    });
  }

  // ------------------------------------------------------------------ tiles

  private idx = (x: number, y: number) => y * this.w + x;
  private inside = (x: number, y: number) => x >= 0 && y >= 0 && x < this.w && y < this.h;

  /** O animal pode ficar neste tile? Nadadores só na água; os outros em chão andável. */
  private allowed(a: { species: Species }, x: number, y: number, anyHabitat = false): boolean {
    if (!this.inside(x, y)) return false;
    const i = this.idx(x, y);
    if (isSwimmer(a.species)) return this.grid.water[i] === 1;
    if (this.grid.blocked[i]) return false;
    if (anyHabitat) return true;
    let mask = 0;
    for (const h of a.species.habitat) mask |= habitatBit(h);
    return (this.habitats[i] & mask) !== 0;
  }

  /** Busca em largura até `radius` tiles; devolve os tiles alcançados e o caminho até cada um. */
  private reach(a: Animal, radius: number, anyHabitat: boolean): { tiles: Pt[]; from: Map<number, number> } {
    const sx = Math.floor(a.x / TILE);
    const sy = Math.floor(a.y / TILE);
    const start = this.idx(sx, sy);
    const from = new Map<number, number>([[start, -1]]);
    const tiles: Pt[] = [];
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift()!;
      const cx = cur % this.w;
      const cy = (cur - cx) / this.w;
      if (cur !== start) tiles.push({ x: cx, y: cy });
      for (const [dx, dy] of DIRS4) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (Math.abs(nx - sx) > radius || Math.abs(ny - sy) > radius) continue;
        const ni = this.idx(nx, ny);
        if (from.has(ni) || !this.allowed(a, nx, ny, anyHabitat)) continue;
        from.set(ni, cur);
        queue.push(ni);
      }
    }
    return { tiles, from };
  }

  private pathTo(from: Map<number, number>, t: Pt): Pt[] {
    const out: Pt[] = [];
    for (let i = this.idx(t.x, t.y); i !== -1 && from.has(i); i = from.get(i)!) {
      const x = i % this.w;
      out.push({ x, y: (i - x) / this.w });
    }
    out.reverse().shift();
    // um pouco de folga dentro do tile para o passeio não parecer trilho
    return out.map((p, k) => ({
      x: (p.x + 0.5) * TILE + (k === out.length - 1 ? (Math.random() - 0.5) * 6 : 0),
      y: (p.y + 0.5) * TILE + (k === out.length - 1 ? (Math.random() - 0.5) * 4 : 0),
    }));
  }

  // ------------------------------------------------------------------ nascer e sumir

  /** Enche a população em volta do jogador; `initial` aceita animais já visíveis (início da cena). */
  populate(px: number, py: number, view: Phaser.Geom.Rectangle, now: number, initial = false): void {
    if (!initial && now < this.nextSpawn) return;
    this.nextSpawn = now + Fauna.SPAWN_EVERY;
    let tries = initial ? this.opt.cap * 3 : 1;
    while (tries-- > 0 && this.animals.length < this.opt.cap) this.trySpawn(px, py, view, initial);
  }

  /** Depois de uma captura (ou fuga), o próximo animal demora um pouco. */
  delaySpawn(now: number): void {
    this.nextSpawn = Math.max(this.nextSpawn, now + Fauna.RESPAWN_DELAY);
  }

  private trySpawn(px: number, py: number, view: Phaser.Geom.Rectangle, initial: boolean): void {
    const ptx = px / TILE;
    const pty = py / TILE;
    const min = initial ? 4 : Fauna.SPAWN_MIN;
    const counts = new Map<string, number>();
    for (const a of this.animals) counts.set(a.species.id, (counts.get(a.species.id) ?? 0) + 1);
    // Bicho grande é raro: no máximo um por perto.
    const bigNearby = this.animals.some((a) => a.species.size === 'grande' && a.state !== 'leaving');
    for (let k = 0; k < 24; k++) {
      const ang = Math.random() * Math.PI * 2;
      const d = min + Math.random() * (Fauna.SPAWN_MAX - min);
      const tx = Math.floor(ptx + Math.cos(ang) * d);
      const ty = Math.floor(pty + Math.sin(ang) * d);
      if (!this.inside(tx, ty)) continue;
      const i = this.idx(tx, ty);
      const water = this.grid.water[i] === 1;
      if (!water && this.grid.blocked[i]) continue;
      const cx = (tx + 0.5) * TILE;
      const cy = (ty + 0.5) * TILE;
      if (!initial && Phaser.Geom.Rectangle.Contains(view, cx, cy)) continue;
      if (this.animals.some((a) => Math.abs(a.x - cx) < TILE * 3 && Math.abs(a.y - cy) < TILE * 3)) continue;
      const pick = pickForTile(this.region.biome, this.habitats[i], water, Math.random, (id) => 1 + (counts.get(id) ?? 0) * 2);
      if (!pick || !this.scene.textures.exists(owKey(pick.species.id))) continue;
      if (bigNearby && pick.species.size === 'grande') continue;
      this.add(pick.species, pick.habitat, cx, cy);
      return;
    }
  }

  /** Desenvolvimento/teste: põe um animal da espécie no tile válido mais perto de (px, py), a 2–5 tiles. */
  spawnNear(speciesId: string, px: number, py: number): Animal | null {
    const sp = getSpecies(speciesId);
    const ptx = Math.floor(px / TILE);
    const pty = Math.floor(py / TILE);
    for (let r = 2; r <= 10; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = ptx + dx;
          const y = pty + dy;
          if (!this.allowed({ species: sp }, x, y)) continue;
          const mask = this.habitats[this.idx(x, y)];
          const habitat = sp.habitat.find((h) => mask & habitatBit(h)) ?? sp.habitat[0];
          return this.add(sp, habitat, (x + 0.5) * TILE, (y + 0.5) * TILE);
        }
      }
    }
    return null;
  }

  private add(sp: Species, habitat: Habitat, x: number, y: number): Animal {
    const prof = profileOf(sp);
    const sprite = this.scene.add.sprite(x, y, owKey(sp.id), 0).setOrigin(0.5, OW_BASE / OW_SIZE);
    const size = HIT[sp.size];
    const shadow = this.scene.add.image(x, y, 'fx_shadow').setDepth(this.opt.shadowDepth).setScale(size.shadow);
    const ripple = prof.mover === 'swim' ? this.scene.add.image(x, y, 'fx_ripple').setDepth(this.opt.rippleDepth) : undefined;
    if (ripple) shadow.setVisible(false);
    const a: Animal = {
      uid: ++this.uid,
      species: sp,
      prof,
      habitat,
      sprite,
      shadow,
      ripple,
      x,
      y,
      alt: 0,
      state: 'idle',
      path: [],
      next: 0,
      fleeing: false,
      calmUntil: 0,
      diveAt: 0,
      alpha: 0,
    };
    this.play(a, 'idle');
    this.animals.push(a);
    return a;
  }

  /** Some com um fade (capturado, fugiu do encontro ou ficou longe demais). */
  remove(a: Animal): void {
    if (a.state === 'leaving') return;
    a.state = 'leaving';
    this.scene.tweens.add({
      targets: [a.sprite, a.shadow, ...(a.ripple ? [a.ripple] : [])],
      alpha: 0,
      duration: 400,
      onComplete: () => {
        a.sprite.destroy();
        a.shadow.destroy();
        a.ripple?.destroy();
        const i = this.animals.indexOf(a);
        if (i >= 0) this.animals.splice(i, 1);
      },
    });
  }

  // ------------------------------------------------------------------ encontro

  /** Congela o animal virado para o jogador (o encontro vai começar). */
  engage(a: Animal, px: number): void {
    a.state = 'engaged';
    a.path = [];
    a.fleeing = false;
    if (a.arc && a.prof.mover === 'fly') {
      // pousa onde está
      a.x = a.arc.sx + (a.arc.tx - a.arc.sx) * a.arc.t;
      a.y = a.arc.sy + (a.arc.ty - a.arc.sy) * a.arc.t;
    }
    a.arc = undefined;
    a.alt = 0;
    a.sprite.setFlipX(px < a.x);
    this.play(a, 'idle');
  }

  /** O encontro terminou sem captura: o animal volta a vagar e, se for arisco, se afasta. */
  release(a: Animal, now: number, px: number, py: number): void {
    if (a.state !== 'engaged') return;
    a.state = 'idle';
    a.next = now + 600;
    a.calmUntil = now + 4000;
    if (a.prof.skittish) this.flee(a, now, px, py);
  }

  // ------------------------------------------------------------------ clique

  /** Retângulo de clique (mundo) do animal. */
  bounds(a: Animal): Phaser.Geom.Rectangle {
    const s = HIT[a.species.size];
    return new Phaser.Geom.Rectangle(a.x - s.w / 2, a.y - a.alt - s.h, s.w, s.h + 4);
  }

  clickable(a: Animal): boolean {
    return a.state !== 'hidden' && a.state !== 'leaving' && a.alpha > 0.5;
  }

  /** O animal sob o ponto (mundo), dando preferência ao que está na frente. */
  at(wx: number, wy: number): Animal | null {
    let best: Animal | null = null;
    for (const a of this.animals) {
      if (!this.clickable(a)) continue;
      const r = this.bounds(a);
      Phaser.Geom.Rectangle.Inflate(r, 3, 3);
      if (!Phaser.Geom.Rectangle.Contains(r, wx, wy)) continue;
      if (!best || a.y > best.y) best = a;
    }
    return best;
  }

  // ------------------------------------------------------------------ quadro a quadro

  /**
   * `playerSpeed` em px/s; `sneaking` quando o jogador se aproxima devagar (não assusta ninguém).
   * Devolve os animais removidos por distância (para a cena largar referências).
   */
  update(now: number, dt: number, px: number, py: number, playerSpeed: number, sneaking: boolean, view: Phaser.Geom.Rectangle): void {
    for (const a of [...this.animals]) {
      if (a.state === 'leaving') continue;
      // longe demais e fora da tela: some (outro nasce mais perto)
      const far = Math.hypot(a.x - px, a.y - py) > Fauna.DESPAWN * TILE;
      if (far && a.state !== 'engaged' && !Phaser.Geom.Rectangle.Contains(view, a.x, a.y)) {
        this.remove(a);
        continue;
      }
      if (a.state !== 'engaged') {
        this.maybeFlee(a, now, px, py, playerSpeed, sneaking);
        this.think(a, now);
        this.move(a, now, dt);
      }
      this.draw(a, now);
    }
  }

  private maybeFlee(a: Animal, now: number, px: number, py: number, speed: number, sneaking: boolean): void {
    if (!a.prof.skittish || a.fleeing || now < a.calmUntil || a.state === 'hidden') return;
    if (sneaking || speed < 20) return;
    if (Math.hypot(a.x - px, a.y - (py - 4)) > FLEE_RADIUS) return;
    this.flee(a, now, px, py);
  }

  /** Corre, voa ou mergulha para longe do jogador. */
  private flee(a: Animal, now: number, px: number, py: number): void {
    a.calmUntil = now + 5000;
    if (a.prof.mover === 'swim') {
      this.dive(a, now);
      return;
    }
    const anyHabitat = a.prof.mover !== 'fly';
    const { tiles, from } = this.reach(a, FLEE_DIST, anyHabitat);
    const away = (t: Pt) => Math.hypot((t.x + 0.5) * TILE - px, (t.y + 0.5) * TILE - py);
    let best: Pt | null = null;
    for (const t of tiles) if (!best || away(t) > away(best)) best = t;
    if (!best || away(best) < Math.hypot(a.x - px, a.y - py)) return;
    a.fleeing = true;
    if (a.prof.mover === 'fly') this.fly(a, (best.x + 0.5) * TILE, (best.y + 0.5) * TILE, FLEE_SPEED);
    else {
      a.path = this.pathTo(from, best);
      a.arc = undefined;
      a.state = 'move';
    }
  }

  /** Decide o próximo passeio quando a pausa acaba. */
  private think(a: Animal, now: number): void {
    if (a.state === 'hidden') {
      if (now >= a.diveAt) this.surface(a, now);
      return;
    }
    if (a.state !== 'idle' || now < a.next) return;
    if (a.prof.mover === 'swim' && now >= a.diveAt && a.diveAt > 0) {
      this.dive(a, now);
      return;
    }
    if (a.prof.mover === 'swim' && a.diveAt === 0) a.diveAt = now + 4000 + Math.random() * 5000;
    const { tiles, from } = this.reach(a, a.prof.roam, false);
    if (!tiles.length) {
      a.next = now + 2000;
      return;
    }
    const t = tiles[Math.floor(Math.random() * tiles.length)];
    if (a.prof.mover === 'fly') {
      this.fly(a, (t.x + 0.5) * TILE + (Math.random() - 0.5) * 6, (t.y + 0.5) * TILE + (Math.random() - 0.5) * 4, 1);
      return;
    }
    a.path = a.prof.mover === 'still' ? this.pathTo(from, t).slice(0, 1) : this.pathTo(from, t);
    a.state = a.path.length ? 'move' : 'idle';
    a.next = now + 1000;
  }

  private fly(a: Animal, tx: number, ty: number, speedMul: number): void {
    const d = Math.hypot(tx - a.x, ty - a.y);
    a.arc = { sx: a.x, sy: a.y, tx, ty, t: 0, dur: Math.max(0.4, d / (a.prof.speed * speedMul)), peak: a.prof.alt * (0.7 + Math.min(1, d / (6 * TILE)) * 0.5) };
    a.state = 'move';
    a.path = [];
  }

  private dive(a: Animal, now: number): void {
    a.state = 'hidden';
    a.path = [];
    a.diveAt = now + 1800 + Math.random() * 2600;
    // reaparece em outro ponto da água, mais longe se fugindo
    const { tiles } = this.reach(a, a.fleeing ? FLEE_DIST : a.prof.roam + 2, false);
    a.fleeing = false;
    if (tiles.length) {
      const t = tiles[Math.floor(Math.random() * tiles.length)];
      a.arc = { sx: a.x, sy: a.y, tx: (t.x + 0.5) * TILE, ty: (t.y + 0.5) * TILE, t: 0, dur: (a.diveAt - now) / 1000, peak: 0 };
    }
  }

  private surface(a: Animal, now: number): void {
    a.state = 'idle';
    a.arc = undefined;
    a.next = now + 800 + Math.random() * 1500;
    a.diveAt = now + 4000 + Math.random() * 6000;
  }

  private move(a: Animal, now: number, dt: number): void {
    if (a.arc) {
      const arc = a.arc;
      arc.t = Math.min(1, arc.t + dt / arc.dur);
      const e = a.state === 'hidden' ? arc.t : arc.t < 0.5 ? 2 * arc.t * arc.t : 1 - (-2 * arc.t + 2) ** 2 / 2;
      const nx = arc.sx + (arc.tx - arc.sx) * e;
      a.sprite.setFlipX(arc.tx < arc.sx);
      a.x = nx;
      a.y = arc.sy + (arc.ty - arc.sy) * e;
      // voo: arco suave; a borboleta ainda ondula
      const flutter = a.species.size === 'pequeno' && a.prof.mover === 'fly' ? Math.sin(now / 90) * 2 : 0;
      a.alt = Math.max(0, Math.sin(Math.PI * arc.t) * arc.peak + flutter * Math.sin(Math.PI * arc.t));
      if (arc.t >= 1) {
        a.arc = undefined;
        a.alt = 0;
        if (a.state !== 'hidden') this.arrive(a, now);
      }
      return;
    }
    if (a.state !== 'move') return;
    const target = a.path[0];
    if (!target) {
      this.arrive(a, now);
      return;
    }
    if (a.prof.mover === 'hop') {
      // um pulinho por tile, com pausa curta entre eles
      a.path.shift();
      a.arc = { sx: a.x, sy: a.y, tx: target.x, ty: target.y, t: 0, dur: Math.max(0.18, Math.hypot(target.x - a.x, target.y - a.y) / (a.prof.speed * (a.fleeing ? FLEE_SPEED : 1))), peak: 4 };
      return;
    }
    const speed = a.prof.speed * (a.fleeing ? FLEE_SPEED : 1);
    const dx = target.x - a.x;
    const dy = target.y - a.y;
    const d = Math.hypot(dx, dy);
    const step = speed * dt;
    if (Math.abs(dx) > 0.5) a.sprite.setFlipX(dx < 0);
    if (d <= step) {
      a.x = target.x;
      a.y = target.y;
      a.path.shift();
      if (!a.path.length) this.arrive(a, now);
    } else {
      a.x += (dx / d) * step;
      a.y += (dy / d) * step;
    }
  }

  private arrive(a: Animal, now: number): void {
    if (a.prof.mover === 'hop' && a.path.length) return;
    a.state = 'idle';
    a.fleeing = false;
    const [lo, hi] = a.prof.idle;
    a.next = now + lo + Math.random() * (hi - lo);
  }

  private play(a: Animal, state: 'idle' | 'move'): void {
    const key = owAnim(a.species.id, state);
    if (a.sprite.anims.currentAnim?.key === key || !this.scene.anims.exists(key)) return;
    a.sprite.anims.play({ key, startFrame: Math.floor(Math.random() * 2) }, true);
  }

  private draw(a: Animal, now: number): void {
    const moving = a.state === 'move' || (a.arc !== undefined && a.state !== 'hidden');
    this.play(a, moving ? 'move' : 'idle');
    a.sprite.anims.timeScale = a.fleeing ? 2 : 1;
    // aparece/desaparece suavemente (nascer, mergulhar, voltar à tona)
    const want = a.state === 'hidden' || a.state === 'leaving' ? 0 : 1;
    if (a.state !== 'leaving') {
      a.alpha += Math.sign(want - a.alpha) * Math.min(Math.abs(want - a.alpha), 0.06);
      a.sprite.setAlpha(a.alpha);
    }
    const x = Math.round(a.x);
    const y = Math.round(a.y);
    a.sprite.setPosition(x, Math.round(a.y - a.alt));
    a.sprite.setDepth(a.alt > 6 ? this.opt.skyDepth + a.y / 1000 : a.y);
    if (a.state !== 'leaving') {
      const s = HIT[a.species.size].shadow * (1 - Math.min(0.5, a.alt / 40));
      a.shadow.setPosition(x, y).setScale(s).setAlpha(a.alpha * (1 - Math.min(0.6, a.alt / 30)));
    }
    if (a.ripple && a.state !== 'leaving') {
      const pulse = 0.85 + 0.2 * Math.sin(now / 260 + a.uid);
      const submerged = a.state === 'hidden';
      a.ripple.setPosition(x, y + 1).setScale(pulse * (submerged ? 0.7 : 1), pulse).setAlpha(submerged ? 0.35 : 0.75 * a.alpha + 0.15);
    }
  }
}
