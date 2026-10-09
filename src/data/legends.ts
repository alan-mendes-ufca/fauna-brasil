import type { ItemId } from './items';

// GUARDIÕES LENDÁRIOS DO FOLCLORE: um por bioma. Capturar uma das espécies gatilho do bioma
// desperta o guardião, que enfrenta o jogador numa batalha em fases. Este módulo guarda só os dados;
// a mecânica de batalha fica em src/battle/.

/** Mecânica especial de uma fase da batalha do guardião. */
export type LegendMechanic =
  | 'furia'      // o guardião causa +50% de dano
  | 'escudo'     // o guardião recebe -50% de dano nesta fase
  | 'regenera'   // o guardião recupera 8% do vigor máximo a cada turno dele
  | 'confusao'   // os golpes do jogador têm 30% de chance de errar
  | 'investida'; // o guardião ataca duas vezes por turno

export interface LegendPhase {
  /** Fração do vigor (0 a 1) em que a fase começa. A primeira fase tem at = 1; as demais, valores decrescentes. */
  at: number;
  /** Fala do guardião ao entrar na fase (curta, até ~90 caracteres). */
  line: string;
  mechanic: LegendMechanic;
}

export interface Legend {
  id: string;            // ex.: 'curupira'
  name: string;          // ex.: 'Curupira'
  regionId: string;      // bioma onde desperta
  /** Ids de espécies do PRÓPRIO bioma cuja captura desperta o guardião (1 a 3, de peso cultural). */
  triggers: string[];
  /** Espécie do bioma usada como corpo/sprite do guardião na batalha (recebe o tint). */
  baseSpecies: string;
  /** Cor do tint/aura (0xRRGGBB). */
  tint: number;
  level: number;         // entre 12 e 22
  /** Multiplicador do vigor máximo (entre 2 e 3.5). */
  hpMultiplier: number;
  /** Lenda em 1-2 frases, mostrada no painel/caderno. */
  lore: string;
  /** Fala ao despertar (após a captura que o acorda). */
  intro: string;
  /** Fala ao ser vencido. */
  defeatLine: string;
  /** 2 ou 3 fases. */
  phases: LegendPhase[];
  reward: { coins: number; xp: number; title: string; item?: { id: ItemId; qty: number } };
}

export const LEGENDS: Legend[] = [
  {
    id: 'boiuna',
    name: 'Boiúna',
    regionId: 'amazonia',
    triggers: ['sucuri', 'boto'],
    baseSpecies: 'sucuri',
    tint: 0x2E7D5B,
    level: 16,
    hpMultiplier: 3,
    lore: 'Cobra-grande que vive nos fundos dos rios e vira navio ou remoinho para afundar quem desrespeita as águas.',
    intro: 'Você tirou o bicho do rio... agora a água inteira está me ouvindo. Respeite o Amazonas!',
    defeatLine: 'Pois vá. Mas o rio sempre lembra de quem o sujou.',
    phases: [
      { at: 1, line: 'Sinto o cheiro do seu barco. Vou virar o rio contra você!', mechanic: 'investida' },
      { at: 0.5, line: 'Minhas escamas são de lama e tempo. Não me acerta!', mechanic: 'escudo' },
      { at: 0.2, line: 'Chega de brincadeira! A correnteza vai te levar!', mechanic: 'furia' },
    ],
    reward: { coins: 300, xp: 280, title: 'Respeitador das Águas', item: { id: 'rede', qty: 2 } },
  },
  {
    id: 'curupira',
    name: 'Curupira',
    regionId: 'mata-atlantica',
    triggers: ['muriqui', 'jacutinga'],
    baseSpecies: 'micoleao',
    tint: 0xE0701E,
    level: 13,
    hpMultiplier: 2.2,
    lore: 'Protetor da mata, de pés virados para trás, que confunde caçadores e castiga quem deixa rastro de destruição.',
    intro: 'Quem é você, que pisa na minha mata com tanto barulho? Mostre que sabe andar em silêncio.',
    defeatLine: 'Seus passos agora seguem o caminho certo. Volte sempre, sem machado.',
    phases: [
      { at: 1, line: 'Meus pés estão virados. Você nunca sabe para onde eu vou!', mechanic: 'confusao' },
      { at: 0.4, line: 'A floresta cura o que você feriu. Eu também me curo!', mechanic: 'regenera' },
    ],
    reward: { coins: 220, xp: 170, title: 'Amigo da Mata', item: { id: 'erva', qty: 3 } },
  },
  {
    id: 'ira',
    name: 'Iara',
    regionId: 'pantanal',
    triggers: ['dourado', 'piranha'],
    baseSpecies: 'jacare',
    tint: 0x3FA7C9,
    level: 14,
    hpMultiplier: 2.5,
    lore: 'Mãe-d\'água que canta nas baías do Pantanal e atrai os desatentos para o fundo dos rios.',
    intro: 'Você pescou meus filhos das águas. Agora quero ouvir sua voz se afogar no canto.',
    defeatLine: 'Seu canto ainda é fraco, mas a baía lembrará de você.',
    phases: [
      { at: 1, line: 'Ouça meu canto... e esqueça onde estão seus pés.', mechanic: 'confusao' },
      { at: 0.5, line: 'Quando a água sobe, eu fico mais forte!', mechanic: 'furia' },
    ],
    reward: { coins: 240, xp: 200, title: 'Guardião das Baías' },
  },
  {
    id: 'lobisomem',
    name: 'Lobisomem',
    regionId: 'cerrado',
    triggers: ['loboguara', 'canide'],
    baseSpecies: 'loboguara',
    tint: 0xB0413E,
    level: 18,
    hpMultiplier: 3.2,
    lore: 'Homem amaldiçoado que se transforma em fera nas noites de lua cheia e uiva pelos campos do Cerrado.',
    intro: 'A lua subiu e eu já não sou mais gente. Venha ver o que o campo faz com quem o invade!',
    defeatLine: 'A lua vai minguar, e eu volto a dormir. Por enquanto.',
    phases: [
      { at: 1, line: 'Meu uivo chama os lobos do campo. Prepare-se!', mechanic: 'furia' },
      { at: 0.6, line: 'Corro duas vezes mais rápido sob a lua cheia!', mechanic: 'investida' },
      { at: 0.25, line: 'Minha pele é de couro duro. Você não passa!', mechanic: 'escudo' },
    ],
    reward: { coins: 360, xp: 360, title: 'Ouvinte da Lua', item: { id: 'isca', qty: 2 } },
  },
  {
    id: 'fulozinha',
    name: 'Comadre Fulozinha',
    regionId: 'caatinga',
    triggers: ['tatubola', 'veado'],
    baseSpecies: 'oncaparda',
    tint: 0x9C6B3E,
    level: 12,
    hpMultiplier: 2.4,
    lore: 'Protetora das matas do sertão, que assusta caçadores com assobios e cobra respeito aos bichos da caatinga.',
    intro: 'Você mexeu com os bichos da minha mata. Agora aguente o assobio da comadre!',
    defeatLine: 'Pode ir, mas deixe a caatinga em paz. Ela já sofre com a seca.',
    phases: [
      { at: 1, line: 'Com a seca, a mata sabe se reerguer. Eu também!', mechanic: 'regenera' },
      { at: 0.5, line: 'Corro pelo mato como vento de agosto!', mechanic: 'investida' },
    ],
    reward: { coins: 200, xp: 150, title: 'Protegido da Caatinga' },
  },
  {
    id: 'boitata',
    name: 'Boitatá',
    regionId: 'pampa',
    triggers: ['veadocampeiro', 'mulita'],
    baseSpecies: 'graxaim',
    tint: 0xFF7A1A,
    level: 20,
    hpMultiplier: 3.5,
    lore: 'Cobra de fogo que protege os campos e persegue quem ateia fogo na vegetação nativa do Pampa.',
    intro: 'Quem acende fogo no campo me acorda. Agora você vai ver de perto o que arde!',
    defeatLine: 'O fogo se apaga, mas as queimadas de hoje queimam amanhã. Cuide do campo.',
    phases: [
      { at: 1, line: 'Meu corpo é um rastro de brasas. Não chegue perto!', mechanic: 'investida' },
      { at: 0.5, line: 'Quanto mais você bate, mais fogo eu acumulo!', mechanic: 'furia' },
      { at: 0.2, line: 'Vou me enrolar no campo e me recompor das cinzas!', mechanic: 'regenera' },
    ],
    reward: { coins: 400, xp: 400, title: 'Guardião do Campo Nativo', item: { id: 'isca', qty: 1 } },
  },
];

/** Guardião de um bioma/região, se houver. */
export function legendForRegion(regionId: string): Legend | undefined {
  return LEGENDS.find((l) => l.regionId === regionId);
}

/** Guardião despertado ao capturar esta espécie nesta região (ou undefined). */
export function legendTriggeredBy(speciesId: string, regionId: string): Legend | undefined {
  return LEGENDS.find((l) => l.regionId === regionId && l.triggers.includes(speciesId));
}
