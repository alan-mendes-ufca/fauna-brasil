import Phaser from 'phaser';
import { ANIMAL_BASE, animalAnim, animalKey } from '../art/animals';
import { CAP_H, CAP_W, paintCaptureProps } from '../art/captureBg';
import { paintCaptureBackground } from '../art/captureBackgrounds';
import { paint } from '../art/canvas';
import {
  actsFirst,
  consumeDaze,
  effectiveness,
  fleeChance,
  makeCombatant,
  pickWildMove,
  useMove,
  xpReward,
  xpToNext,
  type Combatant,
  type Step,
} from '../battle/engine';
import {
  MECHANIC_INFO,
  attacksPerTurn,
  crossedPhases,
  damageDealtMult,
  damageTakenMult,
  healPerTurn,
  legendMaxHp,
  playerMisses,
  scaleDamage,
} from '../battle/legend';
import { STAT_NAMES, esc, fitStage, hpClass, spriteUrl, typeChip, typeChips } from '../battle/ui';
import { TYPE_INFO, type Move } from '../data/battle';
import type { Legend } from '../data/legends';
import { getSpecies, type Habitat, type Species } from '../data/species';
import { party, type Member } from '../state/party';

// Batalha por turnos contra um animal selvagem de grande porte. O vigor dele a zero não o
// mata: ele fica atordoado e a captura em primeira pessoa se abre (resultado 'stunned').
// Palco em Phaser (câmera 3x sobre 320x214, como a captura); plaquinhas, mensagens e menus em HTML
// (style.css, seção "Batalha").

export interface BattleInit {
  speciesId: string;
  habitat: Habitat;
  level: number;
  /** Modo ginásio: sequência de 1x1 contra o time do líder (sem fuga nem captura). */
  gym?: GymInit;
  /** Modo guardião lendário: um só adversário, em fases, sem fuga nem captura. */
  legend?: LegendInit;
}

export interface LegendInit {
  legend: Legend;
  /** Aplica a recompensa (moedas, item, título) e devolve a mensagem final. O XP é dado pela batalha. */
  onWin(): string;
}

export interface GymInit {
  leader: string;
  /** Próximo animal do líder (o primeiro vem em speciesId/level), ou null quando o time acabou. */
  next(): { speciesId: string; level: number } | null;
  /** Aplica a vitória (insígnia, moedas) e devolve a mensagem final. */
  onWin(): string;
}

type Choice = { kind: 'move'; index: number } | { kind: 'switch'; index: number } | { kind: 'flee' };
type Phase = 'busy' | 'menu' | 'team';

const ZOOM = 3;
const FONT = 'Pixelify Sans';
const WILD_POS = { x: 232, y: 98 };
const PLAYER_POS = { x: 88, y: 150 };
const PLAYER_SCALE = 1.5;
const DEPTH = { back: 0, waves: 1, shadow: 3, actor: 4, glow: 5, fx: 8, text: 12 };
const SPRITE_ORIGIN_Y = ANIMAL_BASE / 64;

interface Actor {
  spr: Phaser.GameObjects.Sprite;
  glow: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Image;
  x: number;
  y: number;
  scale: number;
  flip: boolean;
}

export class BattleScene extends Phaser.Scene {
  private species!: Species;
  private habitat: Habitat = 'sub-bosque';
  private wildLevel = 5;
  private wild!: Combatant;
  private team: Combatant[] = [];
  private members: Member[] = [];
  private active = 0;
  private participants = new Set<string>();
  private fleeFails = 0;
  private gym: GymInit | null = null;
  private legend: LegendInit | null = null;
  private legendPhase = 0;
  private finished = false;
  private phase: Phase = 'busy';
  private pending: ((c: Choice) => void) | null = null;
  private pendingSwitch: ((i: number | null) => void) | null = null;
  private forcedSwitch = false;
  private skip = false;

  private wildActor!: Actor;
  private myActor!: Actor;
  private stars: Phaser.GameObjects.Image[] = [];
  private starAngle = 0;

  private root!: HTMLElement;
  private stageEl!: HTMLElement;
  private msgEl!: HTMLElement;
  private offResize?: () => void;
  private onKey?: (e: KeyboardEvent) => void;

  constructor() {
    super('Battle');
  }

  init(data: BattleInit): void {
    this.species = getSpecies(data.speciesId);
    this.habitat = data.habitat;
    this.wildLevel = data.level;
    this.finished = false;
    this.phase = 'busy';
    this.pending = null;
    this.pendingSwitch = null;
    this.fleeFails = 0;
    this.gym = data.gym ?? null;
    this.legend = data.legend ?? null;
    this.legendPhase = 0;
    this.active = 0;
    this.participants = new Set();
    this.stars = [];
  }

  create(): void {
    party.ensureTeam();
    party.regen();
    this.members = party.teamMembers();
    if (!party.alive().length) party.healAll();
    this.team = this.members.map((m) => makeCombatant(m.speciesId, m.level, 'player', m.uid, m.hp));
    this.active = Math.max(0, this.team.findIndex((c) => c.hp > 0));
    this.wild = makeCombatant(this.species.id, this.wildLevel, 'wild', 'wild');
    if (this.legend) {
      this.wild.name = this.legend.legend.name;
      this.wild.maxHp = legendMaxHp(this.legend.legend, this.wild.maxHp);
      this.wild.hp = this.wild.maxHp;
    }

    const cam = this.cameras.main;
    cam.setZoom(ZOOM).centerOn(CAP_W / 2, CAP_H / 2).setBackgroundColor('#04302f').fadeIn(300, 4, 16, 15);
    paintCaptureProps(this);
    paint(this, 'bt_star', 7, 7, (p) =>
      p.template(['...y...', '...y...', '.yywyy.', 'yywwwyy', '.yywyy.', '...y...', '...y...'], { y: '#ffd23a', w: '#fff7c0' }),
    );
    this.buildStage();
    this.buildDom();

    const cleanup = () => {
      this.root?.remove();
      this.offResize?.();
      if (this.onKey) window.removeEventListener('keydown', this.onKey);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);

    void document.fonts.load(`400 12px "${FONT}"`);
    void this.run();
  }

  update(_t: number, delta: number): void {
    if (!this.stars.length) return;
    this.starAngle += delta * 0.004;
    const w = this.wildActor;
    this.stars.forEach((s, i) => {
      const a = this.starAngle + (i * Math.PI * 2) / this.stars.length;
      s.setPosition(w.x + Math.cos(a) * 20, w.y - 62 * w.scale + Math.sin(a) * 6).setDepth(a % (Math.PI * 2) > Math.PI ? DEPTH.actor - 1 : DEPTH.fx);
    });
  }

  // ------------------------------------------------------------------ palco

  private buildStage(): void {
    const { back, fx, fxKind, waves } = paintCaptureBackground(this, this.habitat);
    this.add.image(CAP_W / 2, CAP_H / 2, back).setDepth(DEPTH.back);
    if (waves) this.add.image(CAP_W / 2, CAP_H / 2, waves).setDepth(DEPTH.waves);
    for (let i = 0; i < (fxKind === 'glints' ? 2 : 1); i++) {
      this.add.image(CAP_W / 2 + i * 7, CAP_H / 2, fx).setDepth(DEPTH.fx - 1).setBlendMode(Phaser.BlendModes.ADD);
    }
    this.wildActor = this.makeActor(this.species.id, WILD_POS.x, WILD_POS.y, 1, false);
    this.wildActor.spr.play(animalAnim(this.species.id, 'idle'));
    if (this.legend) this.dressLegend(this.wildActor, this.legend.legend.tint);
    this.myActor = this.makeActor(this.team[this.active].speciesId, PLAYER_POS.x, PLAYER_POS.y, PLAYER_SCALE, true);
    this.myActor.spr.play(animalAnim(this.team[this.active].speciesId, 'idle'));
  }

  private makeActor(id: string, x: number, y: number, scale: number, flip: boolean): Actor {
    const shadow = this.add.image(x, y + 1, 'cap_shadow').setDepth(DEPTH.shadow).setScale(scale).setAlpha(0.9);
    const mk = (depth: number) =>
      this.add.sprite(x, y, animalKey(id), 0).setOrigin(0.5, SPRITE_ORIGIN_Y).setScale(scale).setFlipX(flip).setDepth(depth);
    const spr = mk(DEPTH.actor);
    // Clarão do golpe: cópia somada por cima (o renderizador Canvas não tem tint).
    const glow = mk(DEPTH.glow).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    return { spr, glow, shadow, x, y, scale, flip };
  }

  /** Guardião lendário: o corpo-base ganha o tint do guardião e uma aura pulsante no chão. */
  private dressLegend(a: Actor, tint: number): void {
    a.spr.setTint(tint);
    a.glow.setTint(tint);
    const aura = this.add.image(a.x, a.y + 1, 'cap_shadow').setDepth(DEPTH.shadow + 0.5).setScale(a.scale * 2.2, a.scale * 1.6).setTint(tint).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);
    this.tweens.add({ targets: aura, alpha: 0.12, scaleX: a.scale * 2.6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private setActorSpecies(a: Actor, id: string): void {
    for (const s of [a.spr, a.glow]) s.setTexture(animalKey(id), 0);
    a.spr.play(animalAnim(id, 'idle'));
  }

  private nudge(a: Actor, dx: number, dy: number): void {
    a.spr.setPosition(a.x + dx, a.y + dy);
    a.glow.setPosition(a.x + dx, a.y + dy);
    a.shadow.setPosition(a.x + dx * 0.5, a.y + 1);
  }

  private setActorAlpha(a: Actor, alpha: number): void {
    a.spr.setAlpha(alpha);
    a.shadow.setAlpha(0.9 * alpha);
  }

  /** Anima um valor de 0 a 1 em `ms` e chama `fn(t)` a cada quadro. */
  private anim(ms: number, fn: (t: number) => void, ease = 'Sine.easeInOut'): Promise<void> {
    const o = { t: 0 };
    fn(0);
    return new Promise((res) =>
      this.tweens.add({
        targets: o,
        t: 1,
        duration: ms,
        ease,
        onUpdate: () => fn(o.t),
        onComplete: () => {
          fn(1);
          res();
        },
      }),
    );
  }

  // ------------------------------------------------------------------ interface (HTML)

  private get me(): Combatant {
    return this.team[this.active];
  }

  private buildDom(): void {
    this.root = document.createElement('div');
    this.root.className = 'bt';
    this.root.dataset.phase = 'busy';
    const sp = this.species;
    this.root.innerHTML = `
      <div class="bt-stage">
        <div class="bt-plate bt-wild">
          <div class="bt-ptop"><b class="bt-pname"></b><span class="bt-lv"></span></div>
          <div class="bt-types"></div>
          <div class="bt-hprow"><span class="bt-hplabel">Vigor</span><div class="bt-bar"><i class="bt-fill ok"></i></div></div>
        </div>
        <div class="bt-note"><span class="bt-pin"></span>${
          this.gym
            ? `<b>Ginásio</b>
          <span>Derrote todo o time de ${esc(this.gym.leader)}. Não há captura nem fuga.</span>`
            : this.legend
            ? `<b>Guardião do folclore</b>
          <span>${esc(this.legend.legend.name)} muda de jeito ao perder vigor. Não há captura nem fuga.</span>`
            : `<b>Animal de grande porte</b>
          <span>Leve o vigor de ${esc(sp.name)} a zero para atordoá-lo. Só então dá para tentar a captura.</span>`
        }
        </div>
        <div class="bt-plate bt-mine">
          <div class="bt-ptop"><b class="bt-pname"></b><span class="bt-lv"></span></div>
          <div class="bt-types"></div>
          <div class="bt-hprow"><span class="bt-hplabel">Vigor</span><div class="bt-bar"><i class="bt-fill ok"></i></div></div>
          <div class="bt-hpnum"></div>
          <div class="bt-xprow"><span class="bt-hplabel">XP</span><div class="bt-xp"><i></i></div></div>
        </div>
        <div class="bt-console">
          <div class="bt-msg" title="Clique para acelerar"><p></p></div>
          <div class="bt-menu">
            <div class="bt-moves"></div>
            <div class="bt-side">
              <button type="button" class="bt-btn bt-swap" data-act="team">Trocar</button>
              ${this.gym || this.legend ? '' : '<button type="button" class="bt-btn bt-run" data-act="flee">Fugir</button>'}
            </div>
          </div>
          <div class="bt-team"></div>
        </div>
      </div>`;
    document.body.append(this.root);
    this.stageEl = this.root.querySelector('.bt-stage')!;
    this.msgEl = this.root.querySelector('.bt-msg p')!;
    this.offResize = fitStage(this.stageEl);
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.root.querySelector('.bt-msg')!.addEventListener('click', () => (this.skip = true));
    this.root.addEventListener('pointerover', (e) => this.onHover(e));
    this.root.addEventListener('pointerout', (e) => {
      if ((e.target as HTMLElement).closest('.bt-move')) this.showPrompt();
    });
    this.root.addEventListener('focusin', (e) => this.onHover(e));
    this.onKey = (e) => {
      if (this.phase === 'menu' && /^[1-4]$/.test(e.key)) this.choose({ kind: 'move', index: +e.key - 1 });
      else if (e.key === 'Escape' && this.phase === 'team' && !this.forcedSwitch) this.closeTeam(null);
    };
    window.addEventListener('keydown', this.onKey);
    this.renderPlate('wild');
    this.renderPlate('mine');
    this.renderMoves();
  }

  private q<T extends HTMLElement>(sel: string): T {
    return this.root.querySelector(sel) as T;
  }

  private setPhase(p: Phase): void {
    this.phase = p;
    this.root.dataset.phase = p;
  }

  /** Atualiza nome, nível, tipos e barras de uma plaquinha. */
  private renderPlate(which: 'wild' | 'mine'): void {
    const c = which === 'wild' ? this.wild : this.me;
    const el = this.q(which === 'wild' ? '.bt-wild' : '.bt-mine');
    el.querySelector('.bt-pname')!.textContent = c.name;
    el.querySelector('.bt-lv')!.innerHTML = `Nv <b>${c.level}</b>`;
    el.querySelector('.bt-types')!.innerHTML = typeChips(c.types);
    this.renderBar(which);
    if (which === 'mine') this.renderXp();
  }

  private renderBar(which: 'wild' | 'mine'): void {
    const c = which === 'wild' ? this.wild : this.me;
    const el = this.q(which === 'wild' ? '.bt-wild' : '.bt-mine');
    const f = c.hp / c.maxHp;
    const fill = el.querySelector<HTMLElement>('.bt-fill')!;
    fill.style.width = `${Math.round(f * 100)}%`;
    fill.className = `bt-fill ${hpClass(f)}`;
    if (which === 'mine') el.querySelector('.bt-hpnum')!.textContent = `${c.hp} / ${c.maxHp}`;
  }

  private renderXp(): void {
    const m = this.members[this.active];
    const bar = this.q<HTMLElement>('.bt-xp i');
    bar.style.width = `${Math.min(100, Math.round((m.xp / xpToNext(m.level)) * 100))}%`;
  }

  /** Cartões dos 4 golpes do animal em campo. */
  private renderMoves(): void {
    const c = this.me;
    this.q('.bt-moves').innerHTML = c.moves
      .map((m, i) => {
        const eff = m.power > 0 ? effectiveness(m, this.wild) : 1;
        const badge = eff > 1 ? `<em class="bt-eff up">x${eff}</em>` : eff < 1 ? `<em class="bt-eff down">x${eff === 0.5 ? '½' : eff === 0.25 ? '¼' : eff}</em>` : '';
        const meta = m.power > 0 ? `Poder ${m.power} · ${m.accuracy}%` : `Efeito · ${m.accuracy}%`;
        return `<button type="button" class="bt-move" data-act="move" data-i="${i}" style="--c:${TYPE_INFO[m.type].color};--d:${TYPE_INFO[m.type].dark}">
          <kbd>${i + 1}</kbd><b>${esc(m.name)}</b>${badge}<span>${TYPE_INFO[m.type].name} · ${meta}</span></button>`;
      })
      .join('');
  }

  private showPrompt(): void {
    this.skip = true;
    this.msgEl.textContent = `O que ${this.me.name} fará?`;
  }

  private onHover(e: Event): void {
    if (this.phase !== 'menu') return;
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.bt-move');
    if (!btn) return;
    const m = this.me.moves[+btn.dataset.i!];
    if (!m) return;
    const eff = m.power > 0 ? effectiveness(m, this.wild) : 1;
    const note = eff > 1 ? ' <u class="up">Super eficaz contra este alvo.</u>' : eff < 1 ? ' <u class="down">Pouco eficaz contra este alvo.</u>' : '';
    this.skip = true;
    this.msgEl.innerHTML = `<b>${esc(m.name)}</b> ${typeChip(m.type)}<br>${esc(m.blurb)}${note}`;
  }

  private onClick(e: MouseEvent): void {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!el) return;
    const i = Number(el.dataset.i);
    switch (el.dataset.act) {
      case 'move':
        if (this.phase === 'menu') this.choose({ kind: 'move', index: i });
        break;
      case 'flee':
        if (this.phase === 'menu' && !this.gym && !this.legend) this.choose({ kind: 'flee' });
        break;
      case 'team':
        if (this.phase === 'menu') {
          void this.openTeam(false).then((index) => index !== null && this.choose({ kind: 'switch', index }));
        }
        break;
      case 'back':
        if (!this.forcedSwitch) this.closeTeam(null);
        break;
      case 'pick':
        if (this.phase === 'team') this.closeTeam(i);
        break;
    }
  }

  private choose(c: Choice): void {
    const p = this.pending;
    if (!p) return;
    this.pending = null;
    this.setPhase('busy');
    p(c);
  }

  // ------------------------------------------------------------------ painel de troca

  private openTeam(forced: boolean): Promise<number | null> {
    this.forcedSwitch = forced;
    this.q('.bt-team').innerHTML = `
      <div class="bt-team-head"><b>${forced ? 'Quem entra no lugar?' : 'Trocar de animal'}</b>${
        forced ? '' : '<button type="button" class="bt-btn" data-act="back">Voltar</button>'
      }</div>
      <div class="bt-team-grid">${this.team
        .map((c, i) => {
          const f = c.hp / c.maxHp;
          const out = c.hp <= 0;
          const here = i === this.active && !forced;
          const url = spriteUrl(this.textures, c.speciesId);
          return `<button type="button" class="bt-mon ${out ? 'out' : ''} ${here ? 'here' : ''}" data-act="pick" data-i="${i}" ${out || here ? 'disabled' : ''}>
            <img class="px" src="${url}" alt="" draggable="false" />
            <b>${esc(c.name)}</b><span>Nv ${c.level}</span>
            <div class="bt-bar mini"><i class="bt-fill ${hpClass(f)}" style="width:${Math.round(f * 100)}%"></i></div>
            ${out ? '<u>exausto</u>' : here ? '<u>em campo</u>' : ''}
          </button>`;
        })
        .join('')}</div>`;
    this.setPhase('team');
    return new Promise((res) => (this.pendingSwitch = res));
  }

  private closeTeam(index: number | null): void {
    const p = this.pendingSwitch;
    if (!p) return;
    this.pendingSwitch = null;
    this.setPhase(index === null ? 'menu' : 'busy');
    if (index === null) this.showPrompt();
    p(index);
  }

  // ------------------------------------------------------------------ mensagens

  /** Escreve a mensagem como máquina de escrever; clique acelera. */
  private say(text: string, hold = 380): Promise<void> {
    this.skip = false;
    return new Promise((res) => {
      let i = 0;
      const tick = () => {
        if (this.finished && !this.root.isConnected) return res();
        i = this.skip ? text.length : i + 1;
        this.msgEl.textContent = text.slice(0, i);
        if (i < text.length) this.time.delayedCall(this.skip ? 0 : 14, tick);
        else this.time.delayedCall(this.skip ? 50 : hold, res);
      };
      tick();
    });
  }

  private ask(): Promise<Choice> {
    this.setPhase('menu');
    this.showPrompt();
    return new Promise((res) => (this.pending = res));
  }

  // ------------------------------------------------------------------ andamento

  private async run(): Promise<void> {
    const w = this.wildActor;
    const me = this.myActor;
    this.setActorAlpha(me, 0);
    me.glow.setAlpha(0);
    this.nudge(w, 120, 0);
    this.nudge(me, -80, 0);
    await this.say(
      this.gym
        ? `${this.gym.leader} desafia você com ${this.wild.name}!`
        : this.legend
          ? `${this.legend.legend.name} desperta!`
          : `${this.wild.name} selvagem bloqueia o caminho!`,
      500,
    );
    await this.anim(380, (t) => this.nudge(w, 120 * (1 - t), 0), 'Quad.easeOut');
    this.renderPlate('wild');
    await this.say(`Vai, ${this.me.name}!`, 220);
    this.participants.add(this.me.uid);
    this.setActorAlpha(me, 1);
    await this.anim(350, (t) => this.nudge(me, -80 * (1 - t), 0), 'Quad.easeOut');
    this.renderPlate('mine');
    this.renderMoves();
    if (this.legend) await this.announcePhase(0, this.legend.legend.intro);
    while (true) {
      const choice = await this.ask();
      if (await this.round(choice)) return;
    }
  }

  /** Devolve true quando a batalha acabou. */
  private async round(choice: Choice): Promise<boolean> {
    const rng = Math.random;
    const me = this.me;
    const wild = this.wild;

    if (choice.kind === 'flee') {
      if (rng() < fleeChance(me, wild, this.fleeFails)) {
        await this.say('Você se afasta com cuidado.', 500);
        this.finish('ran');
        return true;
      }
      this.fleeFails++;
      await this.say('Não deu para escapar!');
      return this.wildTurn();
    }

    if (choice.kind === 'switch') {
      await this.switchTo(choice.index);
      return this.wildTurn();
    }

    const move = me.moves[choice.index];
    const order: ('me' | 'wild')[] = actsFirst(me, wild, rng) ? ['me', 'wild'] : ['wild', 'me'];
    for (const who of order) {
      const done = who === 'me' ? await this.turnOf(me, wild, move) : await this.turnOf(wild, me, pickWildMove(wild, me, rng));
      if (done !== 'continue') return done === 'end';
    }
    return false;
  }

  private async wildTurn(): Promise<boolean> {
    const done = await this.turnOf(this.wild, this.me, pickWildMove(this.wild, this.me, Math.random));
    return done === 'end';
  }

  /** Uma ação do turno; o guardião lendário pode ainda atacar de novo e se regenerar (ver `legendExtras`). */
  private async turnOf(att: Combatant, def: Combatant, move: Move): Promise<'continue' | 'end' | 'swap'> {
    const r = await this.singleTurn(att, def, move);
    if (!this.legend || att.side !== 'wild' || r !== 'continue') return r;
    return this.legendExtras(att, def);
  }

  /** Uma ação: golpe (ou perda de vez) e o que vem depois (fim da batalha, exaustão, troca forçada). */
  private async singleTurn(att: Combatant, def: Combatant, move: Move): Promise<'continue' | 'end' | 'swap'> {
    if (consumeDaze(att)) {
      await this.say(`${att.name} está paralisado de susto e perde a vez!`);
      return 'continue';
    }
    await this.say(`${att.name} usou ${move.name}!`, 180);
    const steps = this.legend ? this.legendMove(att, def, move) : useMove(att, def, move, Math.random);
    await this.play(att, def, move, steps);
    this.syncMembers();
    if (this.wild.hp <= 0) {
      if (this.legend) {
        await this.onLegendDown();
        return 'end';
      }
      if (this.gym) return (await this.onGymFoeDown()) ? 'end' : 'swap';
      await this.onStunned();
      return 'end';
    }
    if (this.legend) await this.checkPhase();
    if (this.me.hp <= 0) {
      await this.onExhausted();
      return this.finished ? 'end' : 'swap';
    }
    return 'continue';
  }

  // ------------------------------------------------------------------ guardião lendário (regras em battle/legend.ts)

  private get mechanic() {
    return this.legend!.legend.phases[this.legendPhase].mechanic;
  }

  /** Golpe com os modificadores da fase: confusão faz o jogador errar, fúria e escudo reescalam o dano. */
  private legendMove(att: Combatant, def: Combatant, move: Move): Step[] {
    const mech = this.mechanic;
    if (att.side === 'player' && move.power > 0 && playerMisses(mech, Math.random)) return [{ kind: 'miss' }];
    const before = def.hp;
    const steps = useMove(att, def, move, Math.random);
    const mult = att.side === 'wild' ? damageDealtMult(mech) : damageTakenMult(mech);
    const hit = steps.find((s): s is Extract<Step, { kind: 'hit' }> => s.kind === 'hit');
    if (hit && mult !== 1) {
      const dmg = scaleDamage(hit.damage, mult, before);
      def.hp = before - dmg;
      hit.damage = dmg;
    }
    return steps;
  }

  /** Fim da ação do guardião: ataques extras da investida e regeneração por turno. */
  private async legendExtras(att: Combatant, def: Combatant): Promise<'continue' | 'end' | 'swap'> {
    for (let i = 1; i < attacksPerTurn(this.mechanic); i++) {
      await this.say(`${att.name} ataca de novo!`, 200);
      const r = await this.singleTurn(att, def, pickWildMove(att, def, Math.random));
      if (r !== 'continue') return r;
    }
    const heal = healPerTurn(this.mechanic, att.hp, att.maxHp);
    if (heal > 0) {
      att.hp += heal;
      this.renderBar('wild');
      this.floatText(this.wildActor.x, this.wildActor.y - 50, `+${heal}`, '#9dff7a');
      await this.say(`${att.name} se regenera!`);
    }
    return 'continue';
  }

  /** Mostra a fala da fase `idx` e o que ela muda na luta. */
  private async announcePhase(idx: number, prefix?: string): Promise<void> {
    const l = this.legend!.legend;
    this.legendPhase = idx;
    const ph = l.phases[idx];
    const info = MECHANIC_INFO[ph.mechanic];
    const note = this.root.querySelector('.bt-note > span:not(.bt-pin)');
    if (note) note.textContent = `${info.name}: ${info.text}. Não há captura nem fuga.`;
    if (prefix) await this.say(`${l.name}: "${prefix}"`, 900);
    await this.say(`${l.name}: "${ph.line}"`, 800);
    await this.say(`${info.name}: ${info.text}!`, 600);
  }

  /** O vigor do guardião cruzou um limiar: fala nova e mecânica nova. */
  private async checkPhase(): Promise<void> {
    if (this.wild.hp <= 0) return;
    const l = this.legend!.legend;
    for (const idx of crossedPhases(l, this.legendPhase, this.wild.hp / this.wild.maxHp)) {
      this.cameras.main.flash(180, 255, 240, 200);
      await this.announcePhase(idx);
    }
  }

  /** Guardião vencido: some, fala a última fala, dá XP ao time e entrega a recompensa. */
  private async onLegendDown(): Promise<void> {
    const { legend, onWin } = this.legend!;
    const w = this.wildActor;
    this.renderPlate('wild');
    await this.anim(600, (t) => {
      this.setActorAlpha(w, 1 - t);
      this.nudge(w, 0, 18 * t);
    });
    await this.say(`${legend.name}: "${legend.defeatLine}"`, 1000);
    await this.awardXp(legend.reward.xp);
    await this.say(onWin(), 1600);
    this.finish('won');
  }

  private actorOf(c: Combatant): Actor {
    return c.side === 'wild' ? this.wildActor : this.myActor;
  }

  private syncMembers(): void {
    this.team.forEach((c, i) => (this.members[i].hp = c.hp));
    party.save();
  }

  // ------------------------------------------------------------------ cenas de golpe

  private async play(att: Combatant, def: Combatant, move: Move, steps: Step[]): Promise<void> {
    const a = this.actorOf(att);
    const d = this.actorOf(def);
    const hit = steps.find((s): s is Extract<Step, { kind: 'hit' }> => s.kind === 'hit');
    if (steps[0]?.kind === 'miss') {
      await this.lunge(a, d, 0.5, att.speciesId);
      await this.dodge(d);
      await this.say(att.side === 'player' ? 'O golpe errou!' : `${def.name} desviou!`);
      return;
    }
    if (hit) await this.attackAnim(a, d, att, def, move, hit);
    else if (move.effect?.kind === 'raise' || move.effect?.kind === 'heal') await this.aura(a, TYPE_INFO[move.type].color);
    else await this.aura(a, TYPE_INFO[move.type].color, d);

    for (const s of steps) {
      if (s.kind === 'hit') {
        this.renderBar(def.side === 'wild' ? 'wild' : 'mine');
        if (s.crit) await this.say('Golpe crítico!', 320);
        if (s.eff > 1) await this.say(s.eff >= 4 ? 'É extremamente eficaz!' : 'É super eficaz!', 300);
        else if (s.eff < 1) await this.say('Não é muito eficaz…', 300);
      } else if (s.kind === 'stat') {
        const target = s.who === 'user' ? att : def;
        const up = s.delta > 0;
        const ta = this.actorOf(target);
        if (s.delta === 0) {
          await this.say(`${STAT_NAMES[s.stat]} de ${target.name} não pode mais ${s.who === 'user' ? 'subir' : 'descer'}!`);
          continue;
        }
        this.floatText(ta.x, ta.y - 50 * ta.scale, `${up ? '▲' : '▼'} ${STAT_NAMES[s.stat]}`, up ? '#9dff7a' : '#ff9a7a');
        const much = Math.abs(s.delta) >= 2 ? ' bastante' : '';
        await this.say(`${STAT_NAMES[s.stat]} de ${target.name} ${up ? 'aumentou' : 'diminuiu'}${much}!`);
      } else if (s.kind === 'heal') {
        this.renderBar(att.side === 'wild' ? 'wild' : 'mine');
        this.floatText(a.x, a.y - 50 * a.scale, `+${s.amount}`, '#9dff7a');
        await this.say(`${att.name} recuperou o fôlego!`);
      } else if (s.kind === 'daze') {
        await this.say(`${def.name} ficou paralisado de susto!`);
      }
    }
  }

  /** Mostra o quadro extra do animal (4 = ataque, 5 = dano) se a arte já o tiver; senão devolve `false` e a cena fica só nos tweens. */
  private pose(a: Actor, id: string, frame: 4 | 5): boolean {
    if (!this.textures.get(animalKey(id)).has(String(frame))) return false;
    a.spr.anims.stop();
    a.spr.setFrame(frame);
    a.glow.setFrame(frame);
    return true;
  }

  private idle(a: Actor, id: string): void {
    a.spr.play(animalAnim(id, 'idle'));
    a.glow.setFrame(0);
  }

  /** Investida: avança (com o quadro de ataque, ou esticando o corpo se não houver) e volta. `onContact` roda no ponto de impacto. */
  private async lunge(a: Actor, d: Actor, k = 1, id?: string, onContact?: () => void): Promise<void> {
    const dir = Math.sign(d.x - a.x) || 1;
    const posed = id ? this.pose(a, id, 4) : false;
    const stretch = id && !posed ? 0.14 : 0;
    const apply = (t: number) => {
      this.nudge(a, dir * 26 * k * t, -4 * k * t);
      if (stretch) a.spr.setScale(a.scale * (1 + stretch * t), a.scale * (1 - stretch * 0.6 * t));
    };
    await this.anim(110, apply, 'Quad.easeIn');
    onContact?.();
    await this.anim(130, (t) => apply(1 - t), 'Quad.easeOut');
    a.spr.setScale(a.scale);
    if (id) this.idle(a, id);
  }

  private async dodge(d: Actor): Promise<void> {
    await this.anim(160, (t) => this.nudge(d, 0, -7 * Math.sin(t * Math.PI)));
  }

  private async attackAnim(a: Actor, d: Actor, att: Combatant, def: Combatant, move: Move, hit: Extract<Step, { kind: 'hit' }>): Promise<void> {
    const ranged = move.type === 'eletrico' || move.type === 'aquatico' || move.type === 'anfibio';
    const tx = d.x;
    const ty = d.y - 30 * d.scale;
    let reaction: Promise<void> = Promise.resolve();
    // No ponto de impacto: efeito do golpe, número de dano e reação do alvo (em paralelo ao recuo do atacante).
    const contact = () => {
      this.moveFx(move, tx, ty);
      this.floatText(tx, ty - 10, `-${hit.damage}`, hit.crit ? '#ffc21a' : hit.eff > 1 ? '#ffd23a' : hit.eff < 1 ? '#c8d8d0' : '#ffffff', hit.crit ? 19 : 13);
      this.burst(tx, ty, hit.crit ? 0xffc21a : 0xff3a2a, hit.crit ? 16 : 6);
      if (hit.crit) {
        this.cameras.main.shake(260, 0.006);
        this.floatText(tx, ty - 28, 'CRÍTICO!', '#ffc21a', 12);
      }
      reaction = this.hurt(d, def.speciesId, hit.crit);
    };
    await this.lunge(a, d, ranged ? 0.4 : 1, att.speciesId, contact);
    await reaction;
  }

  /** Reação ao dano: quadro de dano (se existir), pisca em branco e treme; o crítico é mais forte. */
  private async hurt(d: Actor, id: string, crit: boolean): Promise<void> {
    this.pose(d, id, 5);
    const amp = crit ? 8 : 4;
    if (crit) this.cameras.main.flash(120, 255, 214, 90);
    const dur = crit ? 360 : 280;
    await this.anim(dur, (t) => {
      const blink = Math.floor(t * 6) % 2 === 0;
      d.glow.setAlpha(blink ? 0.9 * (1 - t) : 0);
      d.spr.setAlpha(blink ? 1 : 0.55);
      this.nudge(d, Math.sin(t * Math.PI * 8) * amp * (1 - t), 0);
    }, 'Linear');
    d.spr.setAlpha(1);
    d.glow.setAlpha(0);
    this.nudge(d, 0, 0);
    this.idle(d, id);
  }

  /** Brilho de golpe de efeito: pulsa em quem usa (e uma faísca no alvo, se for debuff). */
  private async aura(a: Actor, color: string, target?: Actor): Promise<void> {
    const c = Phaser.Display.Color.HexStringToColor(color).color;
    this.burst(a.x, a.y - 28 * a.scale, c, 10);
    if (target) this.burst(target.x, target.y - 28 * target.scale, c, 8);
    await this.anim(320, (t) => {
      a.spr.setScale(a.scale * (1 + 0.06 * Math.sin(t * Math.PI)));
      a.glow.setScale(a.scale * (1 + 0.06 * Math.sin(t * Math.PI))).setAlpha(0.35 * Math.sin(t * Math.PI));
    });
    a.spr.setScale(a.scale);
    a.glow.setScale(a.scale).setAlpha(0);
  }

  private moveFx(move: Move, x: number, y: number): void {
    const color = Phaser.Display.Color.HexStringToColor(TYPE_INFO[move.type].color).color;
    switch (move.type) {
      case 'eletrico':
        this.bolt(x, y);
        this.burst(x, y, 0x3affd8, 10);
        break;
      case 'aquatico':
      case 'anfibio':
        this.burst(x, y, color, 14);
        this.burst(x, y + 6, 0xc4fff0, 8);
        break;
      case 'aereo':
      case 'inseto':
        this.burst(x, y, 0xf4f0e0, 12);
        this.burst(x, y, color, 8);
        break;
      default:
        this.slash(x, y);
        this.burst(x, y, color, 8);
    }
  }

  private slash(x: number, y: number): void {
    const g = this.add.graphics().setDepth(DEPTH.fx);
    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * 7;
      g.lineStyle(3, 0x2a1000, 1).lineBetween(x + ox - 10, y - 16, x + ox + 8, y + 18);
      g.lineStyle(1, 0xfff3c0, 1).lineBetween(x + ox - 10, y - 16, x + ox + 8, y + 18);
    }
    this.tweens.add({ targets: g, alpha: 0, x: 4, duration: 320, delay: 80, onComplete: () => g.destroy() });
  }

  private bolt(x: number, y: number): void {
    const g = this.add.graphics().setDepth(DEPTH.fx);
    const draw = () => {
      g.clear();
      const pts: [number, number][] = [];
      for (let i = 0; i <= 6; i++) pts.push([x + (i === 6 ? 0 : (Math.random() - 0.5) * 22), y - 70 + i * (70 / 6)]);
      for (const [w, c] of [[4, 0x0a5a56], [2, 0x3affd8], [1, 0xffffff]] as const) {
        g.lineStyle(w, c, 1);
        g.beginPath().moveTo(pts[0][0], pts[0][1]);
        for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
        g.strokePath();
      }
    };
    draw();
    this.time.addEvent({ delay: 60, repeat: 4, callback: draw });
    this.tweens.add({ targets: g, alpha: 0, duration: 200, delay: 320, onComplete: () => g.destroy() });
  }

  private burst(x: number, y: number, color: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 20;
      const px = this.add.rectangle(Math.round(x), Math.round(y), 2, 2, color).setDepth(DEPTH.fx);
      this.tweens.add({
        targets: px,
        x: Math.round(x + Math.cos(ang) * r),
        y: Math.round(y + Math.sin(ang) * r * 0.8 + 5),
        alpha: 0,
        duration: 350 + Math.random() * 250,
        ease: 'Quad.easeOut',
        onComplete: () => px.destroy(),
      });
    }
  }

  private floatText(x: number, y: number, text: string, color: string, size = 11): void {
    const t = this.add
      .text(Phaser.Math.Clamp(x, 40, CAP_W - 40), y, text, { fontFamily: FONT, fontSize: `${size}px`, fontStyle: '600', color })
      .setOrigin(0.5)
      .setResolution(ZOOM)
      .setStroke('#2a1000', 2)
      .setDepth(DEPTH.text)
      .setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 150, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, y: y - 16, alpha: 0, delay: 650, duration: 450, onComplete: () => t.destroy() });
  }

  // ------------------------------------------------------------------ trocas, exaustão, atordoar

  private async switchTo(index: number): Promise<void> {
    const old = this.me;
    const a = this.myActor;
    if (old.hp > 0) {
      await this.say(`Volta, ${old.name}!`, 300);
      await this.anim(260, (t) => {
        this.setActorAlpha(a, 1 - t);
        this.nudge(a, -50 * t, 0);
      });
    }
    old.stages = { forca: 0, defesa: 0, agilidade: 0 };
    old.dazed = false;
    this.active = index;
    const next = this.me;
    this.participants.add(next.uid);
    this.setActorSpecies(a, next.speciesId);
    this.renderPlate('mine');
    this.renderMoves();
    await this.say(`Vai, ${next.name}!`, 300);
    await this.anim(320, (t) => {
      this.setActorAlpha(a, t);
      this.nudge(a, -50 * (1 - t), 0);
    });
  }

  private async onExhausted(): Promise<void> {
    const a = this.myActor;
    const c = this.me;
    await this.anim(450, (t) => {
      this.setActorAlpha(a, 1 - t);
      this.nudge(a, 0, 26 * t);
    });
    this.renderPlate('mine');
    await this.say(`${c.name} está exausto!`);
    const alive = this.team.findIndex((x) => x.hp > 0);
    if (alive < 0) {
      await this.say('Todo o seu time está exausto. Você volta ao acampamento para descansar.', 900);
      this.finish('lost');
      return;
    }
    const pick = await this.openTeam(true);
    await this.switchTo(pick ?? alive);
  }

  private async onStunned(): Promise<void> {
    const w = this.wildActor;
    this.renderPlate('wild');
    await this.anim(500, (t) => {
      w.spr.setAngle(10 * t);
      this.nudge(w, 0, 5 * t);
      this.setActorAlpha(w, 1 - 0.15 * t);
    });
    w.spr.anims.stop();
    for (let i = 0; i < 3; i++) this.stars.push(this.add.image(w.x, w.y, 'bt_star').setDepth(DEPTH.fx));
    await this.say(`${this.wild.name} ficou atordoado!`, 800);
    await this.awardXp();
    await this.say('Agora é a hora de tentar a captura!', 700);
    this.finish('stunned');
  }

  /** Animal do líder caiu: dá XP e chama o próximo; sem mais nenhum, a insígnia é do jogador. Devolve true se acabou. */
  private async onGymFoeDown(): Promise<boolean> {
    const gym = this.gym!;
    const w = this.wildActor;
    this.renderPlate('wild');
    await this.anim(450, (t) => {
      this.setActorAlpha(w, 1 - t);
      this.nudge(w, 0, 26 * t);
    });
    await this.say(`${this.wild.name} de ${gym.leader} está exausto!`);
    await this.awardXp();
    const foe = gym.next();
    if (!foe) {
      await this.say(gym.onWin(), 1400);
      this.finish('won');
      return true;
    }
    this.species = getSpecies(foe.speciesId);
    this.wildLevel = foe.level;
    this.wild = makeCombatant(foe.speciesId, foe.level, 'wild', 'wild');
    this.participants = new Set([this.me.uid]);
    this.setActorSpecies(w, foe.speciesId);
    this.nudge(w, 0, 0);
    this.renderPlate('wild');
    this.renderMoves();
    await this.say(`${gym.leader} envia ${this.wild.name}!`, 400);
    await this.anim(350, (t) => this.setActorAlpha(w, t));
    return false;
  }

  private async awardXp(amount?: number): Promise<void> {
    const reward = amount ?? xpReward(this.species.rarity, this.wildLevel);
    for (const m of this.members) {
      if (!this.participants.has(m.uid) || m.hp <= 0) continue;
      const idx = this.members.indexOf(m);
      const ups = party.grantXp(m, reward);
      await this.say(`${getSpecies(m.speciesId).name} ganhou ${reward} XP!`, 380);
      if (idx === this.active) this.renderXp();
      for (const up of ups) {
        // O animal sobe de nível: recalcula os stats mantendo o vigor atual.
        const fresh = makeCombatant(m.speciesId, m.level, 'player', m.uid, m.hp);
        this.team[idx] = fresh;
        if (idx === this.active) {
          this.renderPlate('mine');
          this.floatText(this.myActor.x, this.myActor.y - 56 * this.myActor.scale, `Nv ${up.to}!`, '#ffd23a', 14);
        }
        await this.say(`${getSpecies(m.speciesId).name} subiu para o nível ${up.to}!`, 650);
      }
    }
    party.save();
  }

  private finish(result: 'stunned' | 'lost' | 'ran' | 'won'): void {
    if (this.finished) return;
    this.finished = true;
    this.syncMembers();
    party.save();
    this.setPhase('busy');
    this.root.classList.add('leaving');
    this.cameras.main.fadeOut(380, 4, 16, 15);
    this.time.delayedCall(420, () => {
      this.tweens.killAll();
      this.scene.stop();
      this.game.events.emit('battle-done', { speciesId: this.species.id, result });
    });
  }
}
