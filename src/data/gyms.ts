import type { NpcDef } from './types';

// GINÁSIOS: um por bioma, dentro da vila (a chave é o id da região/bioma, como em villages.ts).
// O líder enfrenta o jogador numa sequência de batalhas 1x1; só animais do próprio bioma, em níveis
// crescentes. Vencer o time inteiro dá a insígnia (e as moedas, só na primeira vez).

export interface GymFoe {
  speciesId: string;
  level: number;
}

export interface Gym {
  regionId: string;
  /** Nome do ginásio, mostrado no painel. */
  name: string;
  leader: { id: string; name: string; look: NpcDef['look']; line: string };
  /** De 2 a 3 animais do bioma, em ordem de entrada na batalha. */
  team: GymFoe[];
  badge: string;
  coins: number;
}

export const GYMS: Record<string, Gym> = {
  amazonia: {
    regionId: 'amazonia',
    name: 'Ginásio da Vitória-Régia',
    leader: { id: 'am-lider', name: 'Jurema', look: 'agricultora', line: 'O rio ensina paciência. Mostre que você respeita quem vive nele!' },
    team: [
      { speciesId: 'ariranha', level: 6 },
      { speciesId: 'sucuri', level: 8 },
      { speciesId: 'onca', level: 10 },
    ],
    badge: 'Insígnia da Vitória-Régia',
    coins: 120,
  },
  caatinga: {
    regionId: 'caatinga',
    name: 'Ginásio do Mandacaru',
    leader: { id: 'ca-lider', name: 'Seu Quincas', look: 'pescador', line: 'No sertão, quem aguenta o sol aguenta qualquer luta. Vamos ver o seu time.' },
    team: [
      { speciesId: 'tatubola', level: 7 },
      { speciesId: 'cascavel', level: 9 },
      { speciesId: 'oncaparda', level: 11 },
    ],
    badge: 'Insígnia do Mandacaru',
    coins: 140,
  },
  cerrado: {
    regionId: 'cerrado',
    name: 'Ginásio do Pequi',
    leader: { id: 'ce-lider', name: 'Dona Cida', look: 'vendedora', line: 'O Cerrado é a savana mais rica do mundo. Quem luta aqui luta de coração aberto.' },
    team: [
      { speciesId: 'ema', level: 8 },
      { speciesId: 'tatucanastra', level: 10 },
      { speciesId: 'loboguara', level: 12 },
    ],
    badge: 'Insígnia do Pequi',
    coins: 160,
  },
  pantanal: {
    regionId: 'pantanal',
    name: 'Ginásio do Tuiuiú',
    leader: { id: 'pt-lider', name: 'Tião Pantaneiro', look: 'idoso', line: 'Cheia ou seca, o Pantanal não perdoa descuido. Venha, jovem!' },
    team: [
      { speciesId: 'capivara', level: 9 },
      { speciesId: 'jacare', level: 11 },
      { speciesId: 'jaguatirica', level: 13 },
    ],
    badge: 'Insígnia do Tuiuiú',
    coins: 180,
  },
  'mata-atlantica': {
    regionId: 'mata-atlantica',
    name: 'Ginásio da Araucária',
    leader: { id: 'ma-lider', name: 'Araci', look: 'guarda', line: 'Restou pouca mata, e cada árvore conta. Lute como quem protege o que resta.' },
    team: [
      { speciesId: 'ourico', level: 10 },
      { speciesId: 'jararaca', level: 12 },
      { speciesId: 'muriqui', level: 14 },
    ],
    badge: 'Insígnia da Araucária',
    coins: 200,
  },
  pampa: {
    regionId: 'pampa',
    name: 'Ginásio do Butiá',
    leader: { id: 'pa-lider', name: 'Tarso', look: 'menina', line: 'Aqui o vento não para e o campo é aberto. Não tem onde se esconder!' },
    team: [
      { speciesId: 'graxaim', level: 11 },
      { speciesId: 'queroquero', level: 13 },
      { speciesId: 'veadocampeiro', level: 15 },
    ],
    badge: 'Insígnia do Butiá',
    coins: 220,
  },
};

/** Ids dos ginásios, na ordem sugerida de dificuldade. */
export const GYM_IDS = Object.keys(GYMS);

/** O líder como morador da vila (a posição vem do gerador de vilas). */
export function gymNpc(gym: Gym): Omit<NpcDef, 'x' | 'y'> {
  const { id, name, look, line } = gym.leader;
  return { id, name, look, role: 'ginasio', lines: [line] };
}
