import { PROFILES as CERRADO } from '../biomes/cerrado/battle';
import { PROFILES as MATA_ATLANTICA } from '../biomes/mata-atlantica/battle';
import { PROFILES as PAMPA } from '../biomes/pampa/battle';
import { PROFILES as PANTANAL } from '../biomes/pantanal/battle';
import { WET_HABITATS, type Behavior, type Rarity, type Size, type Species } from './species';

// DADOS DA BATALHA POR TURNOS
//
// Como dar valores a uma espécie nova (ex.: Caatinga): acrescente uma entrada em `PROFILES`
// (chave = id da espécie) com os tipos (1 ou 2), os stats base e 4 golpes de `MOVES`.
// Sem entrada, `profileFor()` deriva um perfil razoável do porte (size), da raridade, do
// comportamento e do habitat da espécie, então nada quebra enquanto os valores não chegam.
//
// Escala dos stats base: ~20 (fraquíssimo) a ~110 (topo). A soma dos quatro fica entre 230
// (pequeno) e ~360 (grande); o resto depende do nível (ver `src/battle/engine.ts`).

export type BType = 'predador' | 'aquatico' | 'aereo' | 'reptil' | 'anfibio' | 'inseto' | 'eletrico' | 'arboricola';
/** Golpes também podem ser 'neutro' (generalistas: sem vantagem nem desvantagem). */
export type MoveType = BType | 'neutro';
export type StatKey = 'forca' | 'defesa' | 'agilidade';

export const BTYPES: BType[] = ['predador', 'aquatico', 'aereo', 'reptil', 'anfibio', 'inseto', 'eletrico', 'arboricola'];

export const TYPE_INFO: Record<MoveType, { name: string; color: string; dark: string }> = {
  predador: { name: 'Predador', color: '#c8322b', dark: '#6e1612' },
  aquatico: { name: 'Aquático', color: '#2f86d6', dark: '#123f78' },
  aereo: { name: 'Aéreo', color: '#8fc6ea', dark: '#3b6f94' },
  reptil: { name: 'Réptil', color: '#6f9a2e', dark: '#33501a' },
  anfibio: { name: 'Anfíbio', color: '#35b58a', dark: '#14604a' },
  inseto: { name: 'Inseto', color: '#d6a824', dark: '#7a5a0e' },
  eletrico: { name: 'Elétrico', color: '#ffd23a', dark: '#8a5e10' },
  arboricola: { name: 'Arbóreo', color: '#9a6a3a', dark: '#4a2e14' },
  neutro: { name: 'Comum', color: '#c9b890', dark: '#6b5a3a' },
};

/**
 * Tabela de eficácia (golpe -> tipo do alvo). Ausente = 1x. Em alvos de dois tipos os
 * multiplicadores se somam por produto. Cada linha tem um motivo ecológico:
 *  - predador: caça arbóreos, anfíbios e répteis; aves (fogem pelo ar) e aquáticos (fogem nadando) escapam.
 *  - aquático: arrasta predadores da terra para a água e caça insetos; couraça de réptil e outros aquáticos resistem.
 *  - aéreo: aves caçam répteis, anfíbios e insetos vistos de cima; peixes e tartarugas somem sob a água.
 *  - réptil: serpentes engolem anfíbios e arbóreos; predadores de topo e outros répteis (de couro igual) resistem.
 *  - anfíbio: pele tóxica repele predadores; anfíbios comem insetos; aves e répteis toleram ou ignoram a toxina.
 *  - inseto: enxames e pragas castigam a copa (arbóreos); quase tudo o resto os ignora.
 *  - elétrico: a descarga é pior na água e no que tem pele úmida ou fica no alto; madeira seca e escamas aterram.
 *  - arbóreo: macacos e preguiças comem insetos e rãs; predadores é que se dão bem com eles (arbóreo resiste pouco).
 */
const CHART: Partial<Record<BType, Partial<Record<BType, number>>>> = {
  predador: { arboricola: 2, anfibio: 2, reptil: 2, aquatico: 0.5, aereo: 0.5 },
  aquatico: { predador: 2, inseto: 2, aquatico: 0.5, reptil: 0.5 },
  aereo: { reptil: 2, anfibio: 2, inseto: 2, aquatico: 0.5 },
  reptil: { anfibio: 2, arboricola: 2, predador: 0.5, reptil: 0.5 },
  anfibio: { predador: 2, inseto: 2, reptil: 0.5, anfibio: 0.5, aereo: 0.5 },
  inseto: { arboricola: 2, predador: 0.5, aereo: 0.5, reptil: 0.5, inseto: 0.5 },
  eletrico: { aquatico: 2, aereo: 2, anfibio: 2, eletrico: 0.5, arboricola: 0.5, reptil: 0.5 },
  arboricola: { inseto: 2, anfibio: 2, predador: 0.5, arboricola: 0.5 },
};

/** Multiplicador de um golpe contra um animal de 1 ou 2 tipos (0.25 a 4). */
export function typeMultiplier(moveType: MoveType, defender: readonly BType[]): number {
  if (moveType === 'neutro') return 1;
  let m = 1;
  for (const t of defender) m *= CHART[moveType]?.[t] ?? 1;
  return m;
}

// ---------------------------------------------------------------- golpes

/**
 * Efeitos simples. `chance` (0 a 1) vale para o efeito secundário de golpes que causam dano;
 * em golpes só de efeito (power 0) ele sempre ocorre se o golpe acertar.
 *  - drop: baixa um stat do alvo; raise: sobe um stat de quem usou (estágios de -3 a +3).
 *  - daze: o alvo perde a próxima ação, de susto/choque (não confundir com "atordoado", que é o fim da batalha).
 *  - heal: recupera uma fração do vigor máximo.
 */
export type MoveEffect =
  | { kind: 'drop'; stat: StatKey; stages: number; chance?: number }
  | { kind: 'raise'; stat: StatKey; stages: number; chance?: number }
  | { kind: 'daze'; chance?: number }
  | { kind: 'heal'; fraction: number };

export interface Move {
  id: string;
  name: string;
  type: MoveType;
  /** 0 = golpe só de efeito. */
  power: number;
  /** 1 a 100. */
  accuracy: number;
  effect?: MoveEffect;
  /** Golpe com alta chance de crítico (1 em 6 em vez de 1 em 12). */
  highCrit?: boolean;
  /** Frase do caderno: o comportamento real que inspira o golpe. */
  blurb: string;
}

const M = (m: Move): [string, Move] => [m.id, m];

export const MOVES: Record<string, Move> = Object.fromEntries([
  // comuns
  M({ id: 'investida', name: 'Investida', type: 'neutro', power: 40, accuracy: 100, blurb: 'Joga o corpo contra o adversário.' }),
  M({ id: 'dentada', name: 'Dentada', type: 'neutro', power: 50, accuracy: 100, blurb: 'Uma mordida rápida, sem muito preparo.' }),
  M({ id: 'bicada', name: 'Bicada', type: 'neutro', power: 55, accuracy: 95, blurb: 'O bico que racha sementes duras também machuca.' }),
  M({ id: 'olhar', name: 'Olhar fixo', type: 'neutro', power: 0, accuracy: 100, effect: { kind: 'drop', stat: 'defesa', stages: 1 }, blurb: 'Encara sem piscar até o outro baixar a guarda.' }),
  M({ id: 'camuflagem', name: 'Camuflagem', type: 'neutro', power: 0, accuracy: 100, effect: { kind: 'raise', stat: 'defesa', stages: 1 }, blurb: 'Some na paisagem e fica mais difícil de acertar.' }),
  // predador
  M({ id: 'bote', name: 'Bote', type: 'predador', power: 65, accuracy: 90, blurb: 'Espera em silêncio e salta sobre a presa.' }),
  M({ id: 'mordida', name: 'Mordida na nuca', type: 'predador', power: 85, accuracy: 80, highCrit: true, blurb: 'A mordida da onça perfura o crânio da presa.' }),
  M({ id: 'garrada', name: 'Garrada', type: 'predador', power: 50, accuracy: 100, highCrit: true, blurb: 'Garras largas e afiadas, rápidas de golpear.' }),
  M({ id: 'rugido', name: 'Rugido', type: 'predador', power: 0, accuracy: 100, effect: { kind: 'drop', stat: 'forca', stages: 1 }, blurb: 'Um rugido grave que faz o adversário hesitar.' }),
  M({ id: 'garras_harpia', name: 'Garras de harpia', type: 'predador', power: 90, accuracy: 80, highCrit: true, blurb: 'Garras enormes que arrancam preguiças da copa.' }),
  // aquático
  M({ id: 'mergulho', name: 'Mergulho', type: 'aquatico', power: 60, accuracy: 100, blurb: 'Surge da água a toda velocidade.' }),
  M({ id: 'batida', name: 'Batida de cauda', type: 'aquatico', power: 70, accuracy: 90, blurb: 'A cauda larga bate como um remo.' }),
  M({ id: 'ecoloc', name: 'Ecolocalização', type: 'aquatico', power: 0, accuracy: 100, effect: { kind: 'drop', stat: 'defesa', stages: 1 }, blurb: 'Pelo eco dos estalidos o boto descobre os pontos fracos.' }),
  M({ id: 'cacada', name: 'Caça em família', type: 'aquatico', power: 0, accuracy: 100, effect: { kind: 'raise', stat: 'forca', stages: 1 }, blurb: 'Ariranhas caçam juntas e chamam o bando com gritos.' }),
  M({ id: 'arrastar', name: 'Arrastar para o fundo', type: 'aquatico', power: 75, accuracy: 85, blurb: 'Puxa a vítima para onde só ela fica sem ar.' }),
  M({ id: 'correnteza', name: 'Correnteza', type: 'aquatico', power: 45, accuracy: 100, effect: { kind: 'drop', stat: 'agilidade', stages: 1, chance: 0.3 }, blurb: 'Uma onda que atrapalha quem tenta se mover.' }),
  M({ id: 'respirar', name: 'Sobe para respirar', type: 'aquatico', power: 0, accuracy: 100, effect: { kind: 'heal', fraction: 0.3 }, blurb: 'Poraquês e botos sobem à tona para tomar ar.' }),
  // aéreo
  M({ id: 'rasante', name: 'Rasante', type: 'aereo', power: 70, accuracy: 95, blurb: 'Mergulha do alto com as garras prontas.' }),
  M({ id: 'rajada', name: 'Rajada de asas', type: 'aereo', power: 45, accuracy: 100, effect: { kind: 'drop', stat: 'agilidade', stages: 1, chance: 0.3 }, blurb: 'O bater das asas levanta poeira e atrapalha o adversário.' }),
  M({ id: 'grito', name: 'Grito do bando', type: 'aereo', power: 0, accuracy: 100, effect: { kind: 'raise', stat: 'forca', stages: 1 }, blurb: 'Araras gritam em bando; o grupo todo se agita junto.' }),
  // réptil
  M({ id: 'constricao', name: 'Constrição', type: 'reptil', power: 80, accuracy: 85, effect: { kind: 'daze', chance: 0.25 }, highCrit: true, blurb: 'A sucuri aperta a presa até ela parar de respirar.' }),
  M({ id: 'bote_rept', name: 'Bote relâmpago', type: 'reptil', power: 60, accuracy: 95, blurb: 'Um bote seco, mais rápido que o piscar.' }),
  M({ id: 'cabecada', name: 'Cabeçada', type: 'reptil', power: 55, accuracy: 100, blurb: 'Empurra com a cabeça dura.' }),
  M({ id: 'casco', name: 'Casco blindado', type: 'reptil', power: 0, accuracy: 100, effect: { kind: 'raise', stat: 'defesa', stages: 2 }, blurb: 'Recolhe cabeça e patas dentro do casco.' }),
  M({ id: 'espera', name: 'Espera submersa', type: 'reptil', power: 0, accuracy: 100, effect: { kind: 'raise', stat: 'forca', stages: 1 }, blurb: 'Fica imóvel, quase sem respirar, até a hora do bote.' }),
  M({ id: 'sol', name: 'Banho de sol', type: 'reptil', power: 0, accuracy: 100, effect: { kind: 'heal', fraction: 0.3 }, blurb: 'Répteis recuperam energia tomando sol na areia.' }),
  // anfíbio
  M({ id: 'salto', name: 'Salto acrobático', type: 'anfibio', power: 50, accuracy: 100, blurb: 'Pula de folha em folha e cai com tudo.' }),
  M({ id: 'secrecao', name: 'Secreção tóxica', type: 'anfibio', power: 55, accuracy: 95, effect: { kind: 'drop', stat: 'forca', stages: 1, chance: 0.3 }, blurb: 'A pele solta uma substância que enfraquece quem a toca.' }),
  M({ id: 'lingua', name: 'Língua pegajosa', type: 'anfibio', power: 45, accuracy: 100, effect: { kind: 'drop', stat: 'agilidade', stages: 1, chance: 0.5 }, blurb: 'Língua de laço que gruda e atrasa o alvo.' }),
  // inseto
  M({ id: 'po', name: 'Pó das asas', type: 'inseto', power: 40, accuracy: 100, effect: { kind: 'drop', stat: 'agilidade', stages: 1, chance: 0.4 }, blurb: 'Escamas finas que embaçam a visão.' }),
  M({ id: 'brilho', name: 'Brilho ofuscante', type: 'inseto', power: 0, accuracy: 85, effect: { kind: 'daze' }, blurb: 'O azul das asas reflete a luz e ofusca o atacante.' }),
  M({ id: 'voo', name: 'Voo errático', type: 'inseto', power: 0, accuracy: 100, effect: { kind: 'raise', stat: 'agilidade', stages: 2 }, blurb: 'Zigue-zague que ninguém consegue acompanhar.' }),
  // elétrico
  M({ id: 'choque', name: 'Choque', type: 'eletrico', power: 45, accuracy: 100, effect: { kind: 'daze', chance: 0.1 }, blurb: 'Uma descarga curta, de aviso.' }),
  M({ id: 'descarga', name: 'Descarga', type: 'eletrico', power: 85, accuracy: 85, effect: { kind: 'daze', chance: 0.3 }, blurb: 'O poraquê chega a 600 volts, o bastante para atordoar presas grandes.' }),
  // arbóreo
  M({ id: 'garras_lentas', name: 'Garras lentas', type: 'arboricola', power: 55, accuracy: 90, blurb: 'Lentas, mas as garras seguram firme.' }),
  M({ id: 'salto_galhos', name: 'Salto entre galhos', type: 'arboricola', power: 55, accuracy: 100, blurb: 'Pula de galho em galho e cai de cima.' }),
  M({ id: 'chuva', name: 'Chuva de frutos', type: 'arboricola', power: 50, accuracy: 100, effect: { kind: 'drop', stat: 'defesa', stages: 1, chance: 0.2 }, blurb: 'Derruba frutos da copa sobre quem está embaixo.' }),
  M({ id: 'agarrar', name: 'Agarrar o galho', type: 'arboricola', power: 0, accuracy: 100, effect: { kind: 'raise', stat: 'defesa', stages: 1 }, blurb: 'Preguiças se prendem tão forte que nem caem dormindo.' }),
  M({ id: 'soneca', name: 'Soneca', type: 'arboricola', power: 0, accuracy: 100, effect: { kind: 'heal', fraction: 0.4 }, blurb: 'Dorme mais de dez horas por dia para poupar energia.' }),
  M({ id: 'rosto', name: 'Rosto vermelho', type: 'arboricola', power: 0, accuracy: 100, effect: { kind: 'drop', stat: 'forca', stages: 1 }, blurb: 'O rosto vivo do uacari avisa: aqui tem grupo.' }),
  // Caatinga
  M({ id: 'chocalho', name: 'Chocalho', type: 'reptil', power: 0, accuracy: 90, effect: { kind: 'daze' }, blurb: 'O guizo da cascavel avisa: um passo a mais e o bote vem.' }),
  M({ id: 'bote_veneno', name: 'Bote peçonhento', type: 'reptil', power: 75, accuracy: 90, effect: { kind: 'drop', stat: 'defesa', stages: 1, chance: 0.3 }, blurb: 'Presas que injetam veneno e enfraquecem a presa.' }),
  M({ id: 'chifrada', name: 'Chifrada', type: 'neutro', power: 60, accuracy: 95, blurb: 'Cabeça baixa e galhada em frente.' }),
  M({ id: 'zigzague', name: 'Fuga em zigue-zague', type: 'neutro', power: 0, accuracy: 100, effect: { kind: 'raise', stat: 'agilidade', stages: 2 }, blurb: 'Dá saltos de lado até o predador perder o rumo.' }),
  M({ id: 'enrolar', name: 'Enrolar-se em bola', type: 'reptil', power: 0, accuracy: 100, effect: { kind: 'raise', stat: 'defesa', stages: 2 }, blurb: 'O tatu-bola fecha a carapaça e vira uma esfera blindada.' }),
  M({ id: 'cavar', name: 'Cavar a toca', type: 'neutro', power: 45, accuracy: 100, blurb: 'Garras fortes que revolvem o chão seco.' }),
  M({ id: 'carnica', name: 'Bicada de carcará', type: 'aereo', power: 70, accuracy: 95, blurb: 'Oportunista, ataca desde cobras até filhotes distraídos.' }),
  M({ id: 'canto', name: 'Canto do sertão', type: 'aereo', power: 0, accuracy: 100, effect: { kind: 'raise', stat: 'agilidade', stages: 1 }, blurb: 'O canto anuncia a chuva e anima o bando.' }),
  M({ id: 'danca', name: 'Dança de corte', type: 'aereo', power: 0, accuracy: 100, effect: { kind: 'raise', stat: 'forca', stages: 1 }, blurb: 'O soldadinho exibe a crista e salta diante dos rivais.' }),
  M({ id: 'bicada_azul', name: 'Bicada certeira', type: 'aereo', power: 60, accuracy: 100, highCrit: true, blurb: 'Quebra o coco do licuri com precisão.' }),
  M({ id: 'enxame', name: 'Enxame sem ferrão', type: 'inseto', power: 50, accuracy: 100, effect: { kind: 'drop', stat: 'defesa', stages: 1, chance: 0.4 }, blurb: 'As abelhas jandaíra cobrem o invasor sem usar ferrão.' }),
  M({ id: 'cera', name: 'Cera de própolis', type: 'inseto', power: 0, accuracy: 100, effect: { kind: 'raise', stat: 'defesa', stages: 1 }, blurb: 'Fecha a entrada do ninho com cera.' }),
  M({ id: 'mel', name: 'Mel restaurador', type: 'inseto', power: 0, accuracy: 100, effect: { kind: 'heal', fraction: 0.35 }, blurb: 'O mel guardado na colmeia devolve as forças.' }),
  M({ id: 'inchar', name: 'Inchar o corpo', type: 'anfibio', power: 0, accuracy: 100, effect: { kind: 'raise', stat: 'defesa', stages: 1 }, blurb: 'O cururu infla o corpo para parecer maior.' }),
  M({ id: 'glandula', name: 'Veneno da glândula', type: 'anfibio', power: 65, accuracy: 90, effect: { kind: 'drop', stat: 'forca', stages: 1, chance: 0.3 }, blurb: 'As glândulas atrás dos olhos soltam toxina forte.' }),
  M({ id: 'rabada', name: 'Rabada', type: 'reptil', power: 55, accuracy: 100, blurb: 'Chicoteia com a cauda comprida do teiú.' }),
]);

export function getMove(id: string): Move {
  const m = MOVES[id];
  if (!m) throw new Error(`Golpe desconhecido: ${id}`);
  return m;
}

// ---------------------------------------------------------------- espécies

export interface Stats {
  vigor: number;
  forca: number;
  defesa: number;
  agilidade: number;
}

export interface BattleProfile {
  /** Um ou dois tipos; golpes de um deles ganham o bônus STAB (x1,5). */
  types: [BType] | [BType, BType];
  /** Stats base (nível 1 a 50 escalam a partir deles). */
  stats: Stats;
  /** Ids de `MOVES` (até 4). */
  moves: string[];
}

const S = (vigor: number, forca: number, defesa: number, agilidade: number): Stats => ({ vigor, forca, defesa, agilidade });

/** Valores das espécies da Amazônia. Caatinga logo abaixo; novas espécies: acrescentar aqui (ou deixar para o fallback). */
export const PROFILES: Record<string, BattleProfile> = {
  onca: { types: ['predador'], stats: S(90, 100, 70, 85), moves: ['bote', 'mordida', 'garrada', 'rugido'] },
  arara: { types: ['aereo'], stats: S(60, 65, 62, 80), moves: ['rasante', 'bicada', 'rajada', 'grito'] },
  boto: { types: ['aquatico'], stats: S(68, 72, 50, 65), moves: ['batida', 'mergulho', 'ecoloc', 'investida'] },
  preguica: { types: ['arboricola'], stats: S(80, 45, 90, 15), moves: ['garras_lentas', 'agarrar', 'soneca', 'camuflagem'] },
  perereca: { types: ['anfibio'], stats: S(60, 62, 55, 85), moves: ['salto', 'secrecao', 'lingua', 'camuflagem'] },
  sucuri: { types: ['reptil', 'aquatico'], stats: S(80, 85, 58, 40), moves: ['constricao', 'arrastar', 'bote_rept', 'espera'] },
  uacari: { types: ['arboricola'], stats: S(65, 65, 55, 75), moves: ['salto_galhos', 'chuva', 'rosto', 'dentada'] },
  harpia: { types: ['aereo', 'predador'], stats: S(80, 92, 60, 85), moves: ['rasante', 'garras_harpia', 'rajada', 'olhar'] },
  ariranha: { types: ['aquatico', 'predador'], stats: S(75, 75, 60, 85), moves: ['mergulho', 'garrada', 'cacada', 'dentada'] },
  poraque: { types: ['eletrico', 'aquatico'], stats: S(70, 95, 50, 60), moves: ['choque', 'descarga', 'respirar', 'correnteza'] },
  morfo: { types: ['inseto', 'aereo'], stats: S(30, 35, 30, 95), moves: ['po', 'rajada', 'brilho', 'voo'] },
  tracaja: { types: ['reptil', 'aquatico'], stats: S(70, 50, 100, 25), moves: ['cabecada', 'casco', 'correnteza', 'sol'] },
  // Caatinga
  tatubola: { types: ['reptil'], stats: S(60, 45, 105, 30), moves: ['enrolar', 'cavar', 'cabecada', 'sol'] },
  ararinha: { types: ['aereo'], stats: S(55, 70, 55, 100), moves: ['bicada_azul', 'rasante', 'canto', 'rajada'] },
  asabranca: { types: ['aereo'], stats: S(45, 45, 40, 90), moves: ['bicada', 'rajada', 'canto', 'investida'] },
  carcara: { types: ['aereo', 'predador'], stats: S(70, 85, 60, 85), moves: ['carnica', 'rasante', 'garrada', 'olhar'] },
  soldadinho: { types: ['aereo'], stats: S(45, 55, 35, 95), moves: ['bicada', 'danca', 'rajada', 'canto'] },
  moco: { types: ['predador'], stats: S(55, 50, 55, 80), moves: ['cavar', 'dentada', 'zigzague', 'investida'] },
  oncaparda: { types: ['predador'], stats: S(88, 98, 68, 92), moves: ['bote', 'mordida', 'garrada', 'rugido'] },
  veado: { types: ['arboricola'], stats: S(85, 70, 60, 100), moves: ['chifrada', 'salto_galhos', 'zigzague', 'camuflagem'] },
  cascavel: { types: ['reptil'], stats: S(60, 90, 50, 65), moves: ['bote_veneno', 'bote_rept', 'chocalho', 'espera'] },
  teiu: { types: ['reptil'], stats: S(80, 70, 80, 55), moves: ['rabada', 'dentada', 'cavar', 'sol'] },
  cururu: { types: ['anfibio'], stats: S(70, 50, 75, 35), moves: ['glandula', 'inchar', 'lingua', 'salto'] },
  jandaira: { types: ['inseto'], stats: S(40, 40, 70, 80), moves: ['enxame', 'cera', 'mel', 'po'] },
};

// ---------------------------------------------------------------- fallback

const TOTAL_BY_SIZE: Record<Size, number> = { pequeno: 230, medio: 300, grande: 360 };
const BONUS_BY_RARITY: Record<Rarity, number> = { comum: 0, incomum: 10, rara: 25, lendaria: 45 };
/** Pesos (vigor, força, defesa, agilidade) por comportamento: o jeito de agir define o jeito de lutar. */
const WEIGHTS: Record<Behavior, [number, number, number, number]> = {
  calmo: [1.2, 0.7, 1.4, 0.5],
  pula: [0.8, 1, 0.8, 1.5],
  voa: [0.8, 1, 0.8, 1.5],
  mergulha: [1.3, 1, 1, 0.9],
  bote: [1, 1.4, 0.9, 1],
  choque: [0.9, 1.5, 0.8, 0.9],
  casco: [1, 0.7, 1.6, 0.5],
};
const TYPE_STATUS: Record<BType, string> = {
  predador: 'rugido',
  aquatico: 'ecoloc',
  aereo: 'grito',
  reptil: 'casco',
  anfibio: 'camuflagem',
  inseto: 'voo',
  eletrico: 'respirar',
  arboricola: 'agarrar',
};

function primaryType(sp: Species): BType {
  switch (sp.behavior) {
    case 'bote':
      return sp.size === 'pequeno' ? 'reptil' : 'predador';
    case 'voa':
      return sp.size === 'pequeno' ? 'inseto' : 'aereo';
    case 'mergulha':
      return 'aquatico';
    case 'choque':
      return 'eletrico';
    case 'casco':
      return 'reptil';
    case 'pula':
      return sp.size === 'pequeno' ? 'anfibio' : 'arboricola';
    case 'calmo':
      return sp.habitat.includes('dossel') ? 'arboricola' : 'reptil';
  }
}

function strongest(type: MoveType, n: number): string[] {
  return Object.values(MOVES)
    .filter((m) => m.type === type && m.power > 0)
    .sort((a, b) => b.power - a.power)
    .slice(0, n)
    .map((m) => m.id);
}

/** Perfil derivado de porte, raridade, comportamento e habitat: usado quando a espécie não está em PROFILES. */
export function deriveProfile(sp: Species): BattleProfile {
  const first = primaryType(sp);
  const wet = sp.habitat.some((h) => WET_HABITATS.includes(h));
  const types: BattleProfile['types'] = wet && first !== 'aquatico' ? [first, 'aquatico'] : [first];
  const w = WEIGHTS[sp.behavior];
  const total = TOTAL_BY_SIZE[sp.size] + BONUS_BY_RARITY[sp.rarity];
  const k = total / w.reduce((a, b) => a + b, 0);
  const [vigor, forca, defesa, agilidade] = w.map((x) => Math.round(x * k));
  const ids = [...strongest(first, 2), ...(types[1] ? strongest(types[1], 1) : []), 'investida', TYPE_STATUS[first]];
  const moves = [...new Set(ids)].slice(0, 4);
  return { types, stats: { vigor, forca, defesa, agilidade }, moves };
}

/** Perfis dos biomas de src/biomes/<bioma>/battle.ts. */
const MODULE_PROFILES: Record<string, BattleProfile> = { ...CERRADO, ...PANTANAL, ...MATA_ATLANTICA, ...PAMPA };

export function profileFor(sp: Species): BattleProfile {
  return PROFILES[sp.id] ?? MODULE_PROFILES[sp.id] ?? deriveProfile(sp);
}
