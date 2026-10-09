// Medição do gesto de arremesso e trajetória pseudo-3D. Unidades: pixels de arte (320x214) e ms.

/** Janela (ms) usada para medir a velocidade na soltura. */
export const VELOCITY_WINDOW_MS = 80;
/** Velocidade mínima para virar arremesso (px de arte por segundo). */
export const MIN_THROW_SPEED = 20;
/** Velocidade que leva a rede à profundidade do animal (D = 1). Mouse típico: 150-300 px de tela
 *  em 100-250 ms = ~600-3000 px/s de tela = ~200-1000 px/s de arte (tela é 3x a arte). */
export const SPEED_AT_ANIMAL = 150;
/** Faixa de D que sempre chega ao animal (a força é tolerante: a habilidade é o tempo do anel). */
export const MIN_HIT_DEPTH = 0.15;
export const MAX_HIT_DEPTH = 12;
/** Dentro da faixa, a queda é puxada para a profundidade do animal: fração do desvio que sobra. */
export const DEPTH_KEEP = 0.03;
/** Assistência lateral: puxa a mira para o animal até esta distância (px de arte)... */
export const AIM_ASSIST_RANGE = 60;
/** ...com esta força máxima (0 = nenhuma, 1 = crava no centro). */
export const AIM_ASSIST_STRENGTH = 0.5;
/** Limite de D: acima disso a rede só passa mais longe. */
export const MAX_DEPTH = 16;
/** Limite de |vx/vy|: evita mira absurda em gestos quase horizontais. */
export const MAX_AIM_RATIO = 1.3;
/** Duração do voo (ms). */
export const FLIGHT_MS = 500;
/** Altura do arco (px de arte). */
export const ARC_HEIGHT = 34;
/** Escala da rede ao chegar na profundidade do animal (D = 1). */
export const FAR_SCALE = 0.5;

export interface Sample {
  t: number;
  x: number;
  y: number;
}

/** Quanto tempo atrás (ms) vale procurar o pico de velocidade: a mão costuma frear antes de soltar. */
export const PEAK_LOOKBACK_MS = 160;
/** Janelas mais curtas que isto são ignoradas: eventos de mouse em rajada gerariam picos falsos. */
const MIN_WINDOW_MS = 30;

/** Guarda as últimas posições do ponteiro e calcula a velocidade do arremesso. */
export class VelocityTracker {
  private samples: Sample[] = [];

  reset(): void {
    this.samples.length = 0;
  }

  push(t: number, x: number, y: number): void {
    this.samples.push({ t, x, y });
    while (this.samples.length > 2 && t - this.samples[0].t > VELOCITY_WINDOW_MS + PEAK_LOOKBACK_MS + 40) this.samples.shift();
  }

  /** Velocidade (px/s) na janela de ~80 ms que termina na amostra `end`. */
  private windowVelocity(end: number): { vx: number; vy: number } | null {
    const last = this.samples[end];
    let first = last;
    for (let i = end; i >= 0; i--) {
      if (last.t - this.samples[i].t > VELOCITY_WINDOW_MS) break;
      first = this.samples[i];
    }
    const dt = (last.t - first.t) / 1000;
    if (dt < MIN_WINDOW_MS / 1000) return null;
    return { vx: (last.x - first.x) / dt, vy: (last.y - first.y) / dt };
  }

  /**
   * Velocidade de soltura: o maior pico para cima, em janelas de ~80 ms, nos últimos
   * PEAK_LOOKBACK_MS. Medir só o instante da soltura zeraria o arremesso de quem freia a mão.
   */
  velocity(now: number): { vx: number; vy: number } {
    let best: { vx: number; vy: number } | null = null;
    for (let i = this.samples.length - 1; i >= 0; i--) {
      if (now - this.samples[i].t > PEAK_LOOKBACK_MS) break;
      const v = this.windowVelocity(i);
      if (v && v.vy < 0 && (!best || Math.hypot(v.vx, v.vy) > Math.hypot(best.vx, best.vy))) best = v;
    }
    return best ?? { vx: 0, vy: 0 };
  }
}

export interface Launch {
  /** Profundidade: 1 = na altura do animal, <1 cai antes, >1 passa por cima. */
  depth: number;
  /** Ponto de impacto na tela. */
  landX: number;
  landY: number;
  /** Escala da rede ao pousar. */
  landScale: number;
  /** Velocidade medida na soltura (px/s de arte), só para depuração. */
  speed: number;
}

export interface LaunchGeometry {
  /** Centro do animal em repouso: referência da profundidade e da assistência de mira. */
  animalX: number;
  /** y da tela onde a rede pousa com D = 1 (altura do corpo do animal). */
  animalY: number;
  /** y da rede em repouso: a profundidade conta a partir daqui, não de onde a mão soltou. */
  restY: number;
  /** y mínimo (mais distante) permitido para o pouso. */
  farY: number;
}

/** Converte velocidade de soltura em ponto de pouso, ou null se o gesto foi fraco/para baixo. */
export function computeLaunch(
  vx: number,
  vy: number,
  fromX: number,
  fromY: number,
  geo: LaunchGeometry,
): Launch | null {
  const speed = Math.hypot(vx, vy);
  if (vy >= 0 || speed < MIN_THROW_SPEED || -vy < speed * 0.35) return null;
  const raw = Math.min(MAX_DEPTH, speed / SPEED_AT_ANIMAL);
  // Dentro da faixa de acerto a queda vai (quase) para a profundidade do animal.
  const inBand = raw >= MIN_HIT_DEPTH && raw <= MAX_HIT_DEPTH;
  const depth = inBand ? 1 + (raw - 1) * DEPTH_KEEP : raw;
  const reach = geo.restY - geo.animalY; // distância vertical do repouso até o animal
  // Nunca pousa abaixo do ponto de soltura: a rede sempre sobe.
  const landY = Math.max(geo.farY, Math.min(fromY - 4, geo.restY - depth * reach));
  // A direção horizontal define a mira: quanto mais longe, mais ela desvia.
  const ratio = Math.max(-MAX_AIM_RATIO, Math.min(MAX_AIM_RATIO, vx / -vy));
  let landX = fromX + ratio * (fromY - landY);
  if (inBand) {
    // Assistência suave: desvios pequenos de mira são corrigidos; os grandes continuam errando.
    const dx = landX - geo.animalX;
    const pull = AIM_ASSIST_STRENGTH * Math.max(0, 1 - Math.abs(dx) / AIM_ASSIST_RANGE);
    landX -= dx * pull;
  }
  const landScale = 1 - (1 - FAR_SCALE) * Math.min(depth, 1.3);
  return { depth, landX, landY, landScale, speed };
}

export interface FlightPoint {
  x: number;
  y: number;
  scale: number;
}

/** Posição da rede em u (0..1): linha reta na tela + arco parabólico, com escala decrescente. */
export function flightAt(u: number, fromX: number, fromY: number, launch: Launch): FlightPoint {
  const arc = ARC_HEIGHT * 4 * u * (1 - u);
  return {
    x: fromX + (launch.landX - fromX) * u,
    y: fromY + (launch.landY - fromY) * u - arc,
    scale: 1 + (launch.landScale - 1) * u,
  };
}
