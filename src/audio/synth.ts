// Instrumentos da trilha, todos sintetizados na hora com Web Audio (sem arquivos de áudio).
// Timbre chiptune suave: ondas de pulso com poucos harmônicos, filtros passa-baixa e envelopes curtos.
// Cada nota cria seus próprios nós e os descarta ao terminar (o navegador recolhe sozinho).

export type Wave = 'tri' | 'sine' | 'p12' | 'p25' | 'p50';

const DUTY: Record<string, number> = { p12: 0.125, p25: 0.25, p50: 0.5 };
/** Harmônicos das ondas de pulso: poucos o bastante para soar macio, não estridente. */
const HARMONICS = 24;

const pulseCache = new WeakMap<BaseAudioContext, Map<string, PeriodicWave>>();
const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();

function pulseWave(ctx: BaseAudioContext, wave: string): PeriodicWave {
  let byCtx = pulseCache.get(ctx);
  if (!byCtx) pulseCache.set(ctx, (byCtx = new Map()));
  let pw = byCtx.get(wave);
  if (!pw) {
    const d = DUTY[wave];
    const real = new Float32Array(HARMONICS + 1);
    const imag = new Float32Array(HARMONICS + 1);
    for (let n = 1; n <= HARMONICS; n++) {
      // Série de Fourier de um pulso com ciclo d, com leve atenuação dos harmônicos altos.
      const soften = 1 / (1 + n * 0.06);
      real[n] = (Math.sin(2 * Math.PI * n * d) / (n * Math.PI)) * soften;
      imag[n] = ((1 - Math.cos(2 * Math.PI * n * d)) / (n * Math.PI)) * soften;
    }
    pw = ctx.createPeriodicWave(real, imag);
    byCtx.set(wave, pw);
  }
  return pw;
}

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buf = noiseCache.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      data[i] = (seed / 0x7fffffff) * 2 - 1;
    }
    noiseCache.set(ctx, buf);
  }
  return buf;
}

export const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export interface ToneOpts {
  wave?: Wave;
  vol?: number;
  attack?: number;
  /** Nível relativo depois do ataque (0..1); 1 = órgão, baixo = dedilhado. */
  sustain?: number;
  /** Tempo até cair ao nível de sustentação. */
  decay?: number;
  release?: number;
  cutoff?: number;
  /** Profundidade do vibrato em cents (entra depois de ~0,15 s). */
  vibrato?: number;
  /** Desafinação extra em cents (para dobrar vozes, como numa sanfona). */
  detune?: number;
  /** Quanto da nota vai para o eco. */
  send?: number;
}

/**
 * Banda: conjunto de instrumentos ligados a uma saída seca e a um envio de eco.
 * Os tempos são do relógio do AudioContext (segundos).
 */
export class Band {
  constructor(
    readonly ctx: BaseAudioContext,
    private readonly out: AudioNode,
    private readonly fx: AudioNode | null,
  ) {}

  private osc(wave: Wave, hz: number, t: number): OscillatorNode {
    const o = this.ctx.createOscillator();
    if (wave === 'tri') o.type = 'triangle';
    else if (wave === 'sine') o.type = 'sine';
    else o.setPeriodicWave(pulseWave(this.ctx, wave));
    o.frequency.setValueAtTime(hz, t);
    return o;
  }

  private route(node: AudioNode, send = 0): void {
    node.connect(this.out);
    if (send > 0 && this.fx) {
      const s = this.ctx.createGain();
      s.gain.value = send;
      node.connect(s).connect(this.fx);
    }
  }

  /** Nota tonal genérica com envelope ADSR e filtro passa-baixa. */
  tone(t: number, midi: number, dur: number, o: ToneOpts = {}): void {
    const { wave = 'p50', vol = 0.1, attack = 0.008, sustain = 0.6, decay = 0.12, release = 0.08, cutoff = 3000 } = o;
    const ctx = this.ctx;
    const osc = this.osc(wave, midiHz(midi), t);
    if (o.detune) osc.detune.setValueAtTime(o.detune, t);
    if (o.vibrato && dur > 0.18) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 5.2;
      depth.gain.setValueAtTime(0, t);
      depth.gain.linearRampToValueAtTime(o.vibrato, t + Math.min(0.25, dur));
      lfo.connect(depth).connect(osc.detune);
      lfo.start(t);
      lfo.stop(t + dur + release + 0.05);
    }
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, t);
    filter.Q.value = 0.7;
    const env = ctx.createGain();
    const peak = Math.max(vol, 0.0001);
    const end = t + Math.max(dur, attack + 0.01);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + attack);
    env.gain.setTargetAtTime(peak * sustain, t + attack, decay / 3);
    env.gain.setValueAtTime(peak * sustain, end);
    env.gain.cancelAndHoldAtTime?.(end);
    env.gain.linearRampToValueAtTime(0, end + release);
    osc.connect(filter).connect(env);
    this.route(env, o.send);
    osc.start(t);
    osc.stop(end + release + 0.02);
  }

  /** Sanfona de brinquedo: duas vozes de pulso levemente desafinadas, com "fole" no ataque. */
  sanfona(t: number, midi: number, dur: number, vol: number, wave: Wave = 'p25', send = 0.2): void {
    const base = { wave, vol: vol * 0.6, attack: 0.03, sustain: 0.85, decay: 0.2, release: 0.09, cutoff: 2400, vibrato: 6, send };
    this.tone(t, midi, dur, { ...base, detune: -7 });
    this.tone(t, midi, dur, { ...base, detune: 7 });
  }

  /** Dedilhado curto (cavaquinho / viola). */
  pluck(t: number, midi: number, vol: number, wave: Wave = 'p25', send = 0.1): void {
    this.tone(t, midi, 0.09, { wave, vol, attack: 0.003, sustain: 0.25, decay: 0.08, release: 0.12, cutoff: 2600, send });
  }

  /** Baixo arredondado. */
  bass(t: number, midi: number, dur: number, vol = 0.2, wave: Wave = 'tri'): void {
    this.tone(t, midi, dur, { wave, vol, attack: 0.005, sustain: 0.7, decay: 0.15, release: 0.06, cutoff: 900 });
  }

  /** Zabumba / bumbo: seno com queda rápida de afinação. */
  kick(t: number, vol = 0.35, from = 150, to = 48): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + 0.13);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    o.connect(g);
    this.route(g);
    o.start(t);
    o.stop(t + 0.3);
  }

  /** Tambor grave e mais longo (alfaia de maracatu / surdo). */
  tom(t: number, vol = 0.25, hz = 110): void {
    this.kick(t, vol, hz * 1.8, hz * 0.8);
  }

  /** Ruído filtrado com envelope curto: base de ganzá, chimbal, caixa e baqueta. */
  noise(t: number, dur: number, vol: number, type: BiquadFilterType, hz: number, q = 1, send = 0): void {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = hz;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g);
    this.route(g, send);
    // Começa num ponto diferente do buffer a cada batida para não soar idêntico.
    src.start(t, (t * 7.31) % 0.8, dur + 0.02);
  }

  shaker(t: number, vol = 0.04): void {
    this.noise(t, 0.05, vol, 'bandpass', 6500, 1.2);
  }

  hat(t: number, vol = 0.035): void {
    this.noise(t, 0.035, vol, 'highpass', 8000, 0.7);
  }

  snare(t: number, vol = 0.12): void {
    this.noise(t, 0.14, vol, 'bandpass', 1900, 0.8, 0.1);
    this.tone(t, 50, 0.04, { wave: 'tri', vol: vol * 0.8, attack: 0.002, sustain: 0.1, decay: 0.05, release: 0.04, cutoff: 1200 });
  }

  /** "Bacalhau" da zabumba: estalo seco agudo. */
  click(t: number, vol = 0.05): void {
    this.noise(t, 0.025, vol, 'bandpass', 3200, 2);
  }

  /** Triângulo de forró: parciais inarmônicas agudas; aberto soa longo, fechado é abafado. */
  triangle(t: number, open: boolean, vol = 0.03): void {
    const ctx = this.ctx;
    const len = open ? 0.38 : 0.05;
    for (const [hz, rel] of [
      [4100, 1],
      [5870, 0.6],
      [8020, 0.35],
    ]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = hz;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * rel, t);
      g.gain.exponentialRampToValueAtTime(0.0005, t + len);
      o.connect(g);
      this.route(g, open ? 0.15 : 0);
      o.start(t);
      o.stop(t + len + 0.02);
    }
  }
}

/** Eco simples (delay com realimentação filtrada) para dar espaço às faixas calmas. */
export function makeEcho(ctx: BaseAudioContext, dest: AudioNode, time: number, feedback: number, wet: number): AudioNode {
  const input = ctx.createGain();
  const delay = ctx.createDelay(2);
  delay.delayTime.value = time;
  const fb = ctx.createGain();
  fb.gain.value = feedback;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2200;
  const out = ctx.createGain();
  out.gain.value = wet;
  input.connect(delay).connect(tone).connect(fb).connect(delay);
  tone.connect(out).connect(dest);
  return input;
}
