import { Band, makeEcho, type Wave } from './synth';

// Trilha procedural: cada região, a captura e a batalha têm um "estilo" (andamento, escala, progressão,
// timbres e ritmo). O sequenciador agenda compassos de 16 passos à frente do relógio do AudioContext e
// gera o baixo, o arpejo e a melodia com um sorteio de semente fixa, então cada faixa soa igual a cada volta.

export type Mood = 'amazonia' | 'caatinga' | 'cerrado' | 'pantanal' | 'mata-atlantica' | 'pampa' | 'capture' | 'battle';

const MODES = {
  maj: [0, 2, 4, 5, 7, 9, 11],
  min: [0, 2, 3, 5, 7, 8, 10],
  dor: [0, 2, 3, 5, 7, 9, 10],
  mix: [0, 2, 4, 5, 7, 9, 10],
} as const;

/** Padrões de percussão em 16 passos: x = batida, o = batida fraca, . = silêncio. */
interface Drums {
  kick?: string;
  snare?: string;
  hat?: string;
  shaker?: string;
  click?: string;
  tri?: string;
}

interface Style {
  bpm: number;
  /** Tônica (nota MIDI). */
  root: number;
  mode: keyof typeof MODES;
  /** Graus da escala que servem de raiz do acorde, um por compasso. */
  prog: number[];
  lead: 'sanfona' | 'tone';
  leadWave: Wave;
  /** Chance (0..1) de cada passo do lead soar. */
  density: number;
  /** Arpejo de acompanhamento: passos em que o dedilhado toca. */
  arp: number[];
  arpWave: Wave;
  /** Passos do baixo. */
  bass: number[];
  drums: Drums;
  echo: number;
  vol: number;
  seed: number;
}

const STYLES: Record<Mood, Style> = {
  amazonia: {
    bpm: 78, root: 62, mode: 'dor', prog: [0, 5, 3, 4], lead: 'tone', leadWave: 'sine', density: 0.3,
    arp: [0, 3, 6, 8, 11, 14], arpWave: 'tri', bass: [0, 8], drums: { shaker: 'o...o...o...o..o' }, echo: 0.55, vol: 1, seed: 11,
  },
  caatinga: {
    bpm: 104, root: 55, mode: 'mix', prog: [0, 0, 3, 4], lead: 'sanfona', leadWave: 'p25', density: 0.62,
    arp: [2, 6, 10, 14], arpWave: 'p12', bass: [0, 3, 8, 11], drums: { kick: 'x..x..x.x..x..x.', click: '....x.......x...', tri: 'o.x.o.x.o.x.o.x.' }, echo: 0.22, vol: 1, seed: 23,
  },
  cerrado: {
    bpm: 94, root: 57, mode: 'mix', prog: [0, 3, 4, 0], lead: 'tone', leadWave: 'p25', density: 0.5,
    arp: [0, 2, 4, 6, 8, 10, 12, 14], arpWave: 'p12', bass: [0, 6, 8, 14], drums: { kick: 'x.......x.......', shaker: 'o.o.o.o.o.o.o.o.' }, echo: 0.3, vol: 1, seed: 37,
  },
  pantanal: {
    bpm: 86, root: 52, mode: 'mix', prog: [0, 4, 5, 3], lead: 'tone', leadWave: 'p12', density: 0.4,
    arp: [0, 4, 8, 12], arpWave: 'p25', bass: [0, 10], drums: { kick: 'x.......x.......', hat: '..o...o...o...o.', shaker: 'o...o...o...o...' }, echo: 0.45, vol: 1, seed: 41,
  },
  'mata-atlantica': {
    bpm: 112, root: 60, mode: 'maj', prog: [0, 5, 1, 4], lead: 'tone', leadWave: 'p25', density: 0.58,
    arp: [0, 2, 3, 6, 8, 10, 11, 14], arpWave: 'p12', bass: [0, 3, 6, 8, 11, 14], drums: { kick: 'x..x..x.x..x..x.', hat: 'o.o.o.o.o.o.o.o.', shaker: '.o.o.o.o.o.o.o.o', snare: '....x.......x...' }, echo: 0.25, vol: 1, seed: 53,
  },
  pampa: {
    bpm: 90, root: 57, mode: 'min', prog: [0, 3, 4, 0], lead: 'sanfona', leadWave: 'p50', density: 0.45,
    arp: [0, 3, 6, 8, 11, 14], arpWave: 'p25', bass: [0, 3, 6, 8, 11, 14], drums: { kick: 'x..x..x.x..x..x.', click: '....o.......o...', hat: 'o...o...o...o...' }, echo: 0.35, vol: 1, seed: 67,
  },
  capture: {
    bpm: 124, root: 57, mode: 'min', prog: [0, 0, 5, 4], lead: 'tone', leadWave: 'p12', density: 0.28,
    arp: [0, 2, 4, 6, 8, 10, 12, 14], arpWave: 'p12', bass: [0, 4, 8, 12], drums: { hat: 'x.x.x.x.x.x.x.x.', kick: 'x.......x.......' }, echo: 0.2, vol: 0.9, seed: 79,
  },
  battle: {
    bpm: 148, root: 55, mode: 'min', prog: [0, 5, 3, 4], lead: 'tone', leadWave: 'p25', density: 0.7,
    arp: [0, 3, 6, 8, 11, 14], arpWave: 'p12', bass: [0, 2, 4, 6, 8, 10, 12, 14], drums: { kick: 'x...x...x..xx...', snare: '....x.......x...', hat: 'o.o.o.o.o.o.o.o.' }, echo: 0.15, vol: 0.95, seed: 97,
  },
};

const mulberry32 = (a: number) => () => {
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Nota MIDI do grau `deg` (pode passar de 7 ou ser negativo) da escala do estilo. */
function degree(s: Style, deg: number): number {
  const scale = MODES[s.mode];
  const oct = Math.floor(deg / 7);
  return s.root + oct * 12 + scale[((deg % 7) + 7) % 7];
}

const LOOKAHEAD = 0.35;
const MASTER = 0.55;
const MUTE_KEY = 'fauna-brasil:mudo';

/** Um tema em execução: sua banda, seu volume próprio e o ponto do sequenciador. */
interface Voice {
  mood: Mood;
  style: Style;
  band: Band;
  gain: GainNode;
  bar: number;
  next: number;
}

export class Music {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private voice: Voice | null = null;
  private want: Mood | null = null;
  private timer = 0;
  private muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      /* sem armazenamento: começa com som */
    }
    // Navegadores só liberam o áudio depois de um gesto do jogador.
    const unlock = () => {
      this.ensure();
      this.ctx?.resume();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    } catch {
      /* ignora */
    }
    if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : MASTER, this.ctx.currentTime, 0.08);
    return this.muted;
  }

  /** Pede o tema; a troca acontece com um fade curto. Chamar com o mesmo tema não faz nada. */
  play(mood: Mood): void {
    this.want = mood;
    if (this.ctx && this.voice?.mood !== mood) this.switchTo(mood);
  }

  private ensure(): void {
    if (this.ctx) return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : MASTER;
    this.master.connect(this.ctx.destination);
    this.timer = window.setInterval(() => this.tick(), 90);
    if (this.want) this.switchTo(this.want);
  }

  private switchTo(mood: Mood): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const old = this.voice;
    if (old) {
      old.gain.gain.cancelScheduledValues(now);
      old.gain.gain.setValueAtTime(old.gain.gain.value, now);
      old.gain.gain.linearRampToValueAtTime(0, now + 0.5);
      window.setTimeout(() => old.gain.disconnect(), 900);
    }
    const style = STYLES[mood];
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now + (old ? 0.35 : 0));
    gain.gain.linearRampToValueAtTime(style.vol, now + (old ? 0.35 : 0) + 0.6);
    gain.connect(this.master);
    const beat = 60 / style.bpm;
    const fx = makeEcho(ctx, gain, beat * 0.75, 0.38, style.echo);
    this.voice = { mood, style, band: new Band(ctx, gain, fx), gain, bar: 0, next: now + (old ? 0.35 : 0.1) };
  }

  private tick(): void {
    const ctx = this.ctx;
    const v = this.voice;
    if (!ctx || !v || ctx.state !== 'running') return;
    // Aba em segundo plano ou pausa longa: reposiciona em vez de atropelar os compassos atrasados.
    if (v.next < ctx.currentTime - 0.5) v.next = ctx.currentTime + 0.05;
    const barLen = (60 / v.style.bpm) * 4;
    while (v.next < ctx.currentTime + LOOKAHEAD) {
      this.scheduleBar(v, v.next, barLen);
      v.next += barLen;
      v.bar++;
    }
  }

  private scheduleBar(v: Voice, t0: number, barLen: number): void {
    const s = v.style;
    const b = v.band;
    const step = barLen / 16;
    const chord = s.prog[v.bar % s.prog.length];
    // Duas frases alternadas (A, B): a melodia varia sem virar aleatória.
    const phrase = Math.floor(v.bar / s.prog.length) % 2;
    const rnd = mulberry32(s.seed * 1000 + phrase * 100 + (v.bar % s.prog.length));
    const at = (i: number) => t0 + i * step;

    for (const i of s.bass) b.bass(at(i), degree(s, chord) - 12, step * (i % 8 === 0 ? 3 : 1.6), 0.2 * (i % 8 === 0 ? 1 : 0.75));

    s.arp.forEach((i, n) => {
      const tones = [0, 2, 4, 7];
      b.pluck(at(i), degree(s, chord + tones[n % tones.length]), 0.045, s.arpWave, 0.12);
    });

    // Melodia: caminha por graus vizinhos e pousa em notas do acorde nos tempos fortes.
    let pos = chord + 4;
    for (let i = 0; i < 16; i++) {
      const strong = i % 4 === 0;
      if (!strong && rnd() > s.density) continue;
      pos = strong ? chord + [0, 2, 4, 7][Math.floor(rnd() * 4)] : pos + Math.round((rnd() - 0.5) * 4);
      pos = Math.max(chord + 0, Math.min(chord + 9, pos));
      const len = step * (strong ? 3 : 1.7);
      const midi = degree(s, pos) + 12;
      if (s.lead === 'sanfona') b.sanfona(at(i), midi, len, 0.1, s.leadWave);
      else b.tone(at(i), midi, len, { wave: s.leadWave, vol: 0.075, sustain: 0.6, decay: 0.15, cutoff: 2800, vibrato: 8, send: 0.35 });
    }

    const d = s.drums;
    const hit = (pat: string | undefined, fn: (t: number, soft: boolean) => void) => {
      if (!pat) return;
      for (let i = 0; i < 16; i++) if (pat[i] !== '.') fn(at(i), pat[i] === 'o');
    };
    hit(d.kick, (t, soft) => b.kick(t, soft ? 0.2 : 0.32));
    hit(d.snare, (t, soft) => b.snare(t, soft ? 0.07 : 0.12));
    hit(d.hat, (t, soft) => b.hat(t, soft ? 0.02 : 0.035));
    hit(d.shaker, (t, soft) => b.shaker(t, soft ? 0.025 : 0.04));
    hit(d.click, (t, soft) => b.click(t, soft ? 0.03 : 0.05));
    hit(d.tri, (t, soft) => b.triangle(t, !soft));
  }

  dispose(): void {
    window.clearInterval(this.timer);
    this.ctx?.close();
    this.ctx = null;
  }
}
