import { SPECIES as CERRADO } from '../biomes/cerrado/species';
import { SPECIES as MATA_ATLANTICA } from '../biomes/mata-atlantica/species';
import { SPECIES as PAMPA } from '../biomes/pampa/species';
import { SPECIES as PANTANAL } from '../biomes/pantanal/species';

// Fauna da fase 1 (Amazônia) e da Caatinga. Status IUCN conferidos em fontes secundárias em 2026-10-08;
// confirme em iucnredlist.org antes de publicar. A fauna dos outros biomas vem de src/biomes/<bioma>/species.ts.

export type Rarity = 'comum' | 'incomum' | 'rara' | 'lendaria';
export type Iucn = 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'NE';
export type Biome = 'amazonia' | 'caatinga' | 'cerrado' | 'pantanal' | 'mata-atlantica' | 'pampa';
/**
 * Onde o animal aparece no mapa (rótulos do caderno em src/data/biomes.ts).
 * Amazônia: dossel, sub-bosque, chao, agua, praia. Caatinga: mata-seca (arbustos e cactos),
 * lajedo (afloramentos de rocha), acude (açude, riacho temporário e suas margens).
 * Cerrado: campo (campo limpo e sujo), cerradao (mata de árvores tortas), vereda (buritizal e brejo).
 * Pantanal: alagado (campos que enchem), baia (baías e rios: água aberta), cordilheira (ilhas de mata).
 * Mata Atlântica: floresta-umida, araucaria (mata de araucárias, transição para o Pampa), mangue (manguezal e restinga).
 * Pampa: campo-nativo, banhado (áreas úmidas), butiazal (butiazais e capões de mato).
 */
export type Habitat =
  | 'dossel' | 'sub-bosque' | 'chao' | 'agua' | 'praia'
  | 'mata-seca' | 'lajedo' | 'acude'
  | 'campo' | 'cerradao' | 'vereda'
  | 'alagado' | 'baia' | 'cordilheira'
  | 'floresta-umida' | 'araucaria' | 'mangue'
  | 'campo-nativo' | 'banhado' | 'butiazal';

/** Habitats de água aberta: quem só vive neles nada (não anda em terra). */
export const OPEN_WATER: readonly Habitat[] = ['agua', 'baia'];
/** Habitats úmidos (a batalha dá o tipo aquático a quem vive neles). */
export const WET_HABITATS: readonly Habitat[] = ['agua', 'acude', 'baia', 'vereda', 'alagado', 'mangue', 'banhado'];
/** Porte: os grandes precisam ser atordoados numa batalha antes da captura. */
export type Size = 'pequeno' | 'medio' | 'grande';

/**
 * Comportamento na tela de captura (baseado no animal real):
 *  - calmo: quase não se mexe;
 *  - pula: salta de vez em quando, e a rede pode passar por baixo;
 *  - voa: desliza de um lado para o outro;
 *  - mergulha: só fica exposto quando sobe para respirar;
 *  - bote: dá botes que rebatem a rede;
 *  - choque: descarga elétrica periódica que destrói a rede que chegar nela;
 *  - casco: recolhe-se no casco, e a rede escorrega.
 */
export type Behavior = 'calmo' | 'pula' | 'voa' | 'mergulha' | 'bote' | 'choque' | 'casco';

export interface Species {
  id: string;
  name: string;
  scientific: string;
  biome: Biome;
  size: Size;
  habitat: Habitat[];
  rarity: Rarity;
  iucn: Iucn;
  behavior: Behavior;
  /** Cores de referência da aparência real (pixel art). */
  colors: string[];
  /** Texto do catálogo. */
  fact: string;
}

/**
 * Parâmetros de captura por raridade. A chance de um arremesso que acerta vai de `minP`
 * (anel grande) a `maxP` (anel mínimo): mesmo o arremesso perfeito pode falhar.
 * `flee` é a chance de o animal fugir depois de cada tentativa sem sucesso;
 * `ringPeriod` é a duração (ms) de um ciclo do anel.
 */
export const RARITY: Record<Rarity, { minP: number; maxP: number; flee: number; ringPeriod: number }> = {
  comum: { minP: 0.3, maxP: 0.95, flee: 0.05, ringPeriod: 1550 },
  incomum: { minP: 0.18, maxP: 0.9, flee: 0.1, ringPeriod: 1500 },
  rara: { minP: 0.1, maxP: 0.82, flee: 0.18, ringPeriod: 1250 },
  lendaria: { minP: 0.04, maxP: 0.7, flee: 0.3, ringPeriod: 1000 },
};

const BASE_SPECIES: Species[] = [
  {
    id: 'onca',
    name: 'Onça-pintada',
    scientific: 'Panthera onca',
    biome: 'amazonia',
    size: 'grande',
    habitat: ['chao', 'agua'],
    rarity: 'rara',
    iucn: 'NT',
    behavior: 'bote',
    colors: ['#C8962E', '#1E1A17', '#F2E6C9', '#6B4A22'],
    fact: 'Maior felino das Américas. Ao contrário da maioria dos gatos, nada bem e caça perto da água.',
  },
  {
    id: 'arara',
    name: 'Arara-vermelha',
    scientific: 'Ara chloropterus',
    biome: 'amazonia',
    size: 'medio',
    habitat: ['dossel'],
    rarity: 'comum',
    iucn: 'LC',
    behavior: 'voa',
    colors: ['#D8322B', '#2E8B57', '#2B5DA8', '#F2E8D5'],
    fact: 'Vive no dossel comendo frutos e sementes. Voa em pares ou bandos, e seus gritos se ouvem de longe.',
  },
  {
    id: 'boto',
    name: 'Boto-cor-de-rosa',
    scientific: 'Inia geoffrensis',
    biome: 'amazonia',
    size: 'grande',
    habitat: ['agua'],
    rarity: 'rara',
    iucn: 'EN',
    behavior: 'mergulha',
    colors: ['#E8A0A8', '#C96F7E', '#F4E4E0', '#7A8C99'],
    fact: 'Na lenda amazônica, o boto vira um homem elegante nas noites de festa. Os jovens são cinzentos.',
  },
  {
    id: 'preguica',
    name: 'Preguiça-de-três-dedos',
    scientific: 'Bradypus variegatus',
    biome: 'amazonia',
    size: 'medio',
    habitat: ['dossel'],
    rarity: 'comum',
    iucn: 'LC',
    behavior: 'calmo',
    colors: ['#B8A27A', '#6E5A3E', '#D9CBA8', '#3E3A2E'],
    fact: 'É tão lenta que algas crescem na pelagem e a deixam esverdeada, uma ótima camuflagem.',
  },
  {
    id: 'perereca',
    name: 'Perereca-das-folhas',
    scientific: 'Phyllomedusa bicolor',
    biome: 'amazonia',
    size: 'pequeno',
    habitat: ['sub-bosque'],
    rarity: 'incomum',
    iucn: 'LC',
    behavior: 'pula',
    colors: ['#6CA83A', '#2E5E2A', '#F3F0E6', '#1F1F1F'],
    fact: 'Passa o dia imóvel sobre as folhas. A secreção da pele é usada em rituais de povos amazônicos.',
  },
  {
    id: 'sucuri',
    name: 'Sucuri',
    scientific: 'Eunectes murinus',
    biome: 'amazonia',
    size: 'grande',
    habitat: ['agua', 'chao'],
    rarity: 'incomum',
    iucn: 'LC',
    behavior: 'bote',
    colors: ['#4F6B2E', '#C9B45A', '#2F3B1F', '#E0D6A8'],
    fact: 'Uma das maiores cobras do mundo. Espera submersa e mata por constrição.',
  },
  {
    id: 'uacari',
    name: 'Uacari-branco',
    scientific: 'Cacajao calvus',
    biome: 'amazonia',
    size: 'medio',
    habitat: ['dossel'],
    rarity: 'rara',
    iucn: 'VU',
    behavior: 'pula',
    colors: ['#F4F0EA', '#C8373A', '#E3A08C', '#8A6E55'],
    fact: 'Tem o rosto nu e vermelho vivo. Vive em grupos nas matas alagadas da várzea.',
  },
  {
    id: 'harpia',
    name: 'Harpia',
    scientific: 'Harpia harpyja',
    biome: 'amazonia',
    size: 'grande',
    habitat: ['dossel'],
    rarity: 'lendaria',
    iucn: 'VU',
    behavior: 'voa',
    colors: ['#2A2A2C', '#E9E9E4', '#8E9092', '#E0B73C'],
    fact: 'Uma das maiores águias do mundo. Caça preguiças e macacos entre as copas.',
  },
  {
    id: 'ariranha',
    name: 'Ariranha',
    scientific: 'Pteronura brasiliensis',
    biome: 'amazonia',
    size: 'medio',
    habitat: ['agua'],
    rarity: 'rara',
    iucn: 'EN',
    behavior: 'mergulha',
    colors: ['#5B3A24', '#F2E8D0', '#2B1D14', '#8C6A4A'],
    fact: 'A maior lontra do mundo. Vive em famílias que caçam juntas e se comunicam com chamados.',
  },
  {
    id: 'poraque',
    name: 'Poraquê',
    scientific: 'Electrophorus electricus',
    biome: 'amazonia',
    size: 'medio',
    habitat: ['agua'],
    rarity: 'incomum',
    iucn: 'LC',
    behavior: 'choque',
    colors: ['#2F3A2C', '#5D6B4A', '#E3B33E'],
    fact: 'Não é enguia, é peixe-elétrico. Dá descargas fortes para atordoar as presas e sobe para respirar ar.',
  },
  {
    id: 'morfo',
    name: 'Morfo-azul',
    scientific: 'Morpho menelaus',
    biome: 'amazonia',
    size: 'pequeno',
    habitat: ['sub-bosque'],
    rarity: 'comum',
    iucn: 'NE',
    behavior: 'voa',
    colors: ['#1F5FBF', '#0B2E6B', '#0F0F0F', '#E8E2D2'],
    fact: 'O azul vem de nanoestruturas nas escamas das asas, que refletem a luz. Não é pigmento.',
  },
  {
    id: 'tracaja',
    name: 'Tracajá',
    scientific: 'Podocnemis unifilis',
    biome: 'amazonia',
    size: 'medio',
    habitat: ['praia', 'agua'],
    rarity: 'incomum',
    iucn: 'VU',
    behavior: 'casco',
    colors: ['#5C6B3A', '#E3C84A', '#2D2D1F', '#CFC29A'],
    fact: 'Na seca, desova nas praias de areia dos rios. A coleta dos ovos é sua maior ameaça.',
  },
  // ---------------------------------------------------------------- Caatinga
  {
    id: 'tatubola',
    name: 'Tatu-bola',
    scientific: 'Tolypeutes tricinctus',
    biome: 'caatinga',
    size: 'medio',
    habitat: ['mata-seca'],
    rarity: 'rara',
    iucn: 'VU',
    behavior: 'casco',
    colors: ['#B89A6A', '#5E4A34', '#E8D6A8', '#8A6E4A'],
    fact: 'Um dos dois tatus que se fecham numa bola completa, e o único exclusivo do Brasil. Inspirou o Fuleco, mascote da Copa de 2014.',
  },
  {
    id: 'ararinha',
    name: 'Ararinha-azul',
    scientific: 'Cyanopsitta spixii',
    biome: 'caatinga',
    size: 'medio',
    habitat: ['mata-seca', 'acude'],
    rarity: 'lendaria',
    // Na IUCN está como Extinta na Natureza (EW, 2019); o tipo Iucn ainda não tem EW, então fica CR.
    iucn: 'CR',
    behavior: 'voa',
    colors: ['#3A78C8', '#1E3E7A', '#A8C8E0', '#5A6E8A'],
    fact: 'Sumiu da natureza em 2000. Aves criadas em cativeiro voltaram às caraibeiras de Curaçá, na Bahia, em 2022.',
  },
  {
    id: 'asabranca',
    name: 'Asa-branca',
    scientific: 'Patagioenas picazuro',
    biome: 'caatinga',
    size: 'pequeno',
    habitat: ['mata-seca', 'acude'],
    rarity: 'comum',
    iucn: 'LC',
    behavior: 'voa',
    colors: ['#9A8A94', '#6A5A6E', '#F2EEE8', '#8E5A6A'],
    fact: 'Pomba grande que some do sertão na seca e volta com as chuvas. Deu nome à canção de Luiz Gonzaga.',
  },
  {
    id: 'carcara',
    name: 'Carcará',
    scientific: 'Caracara plancus',
    biome: 'caatinga',
    size: 'medio',
    habitat: ['lajedo', 'mata-seca'],
    rarity: 'incomum',
    iucn: 'LC',
    behavior: 'voa',
    colors: ['#3A2E28', '#F2E8D4', '#E8742E', '#E8C840'],
    fact: 'Falcão oportunista que come de tudo, até carniça. "Pega, mata e come", canta a música de João do Vale.',
  },
  {
    id: 'soldadinho',
    name: 'Soldadinho-do-araripe',
    scientific: 'Antilophia bokermanni',
    biome: 'caatinga',
    size: 'pequeno',
    habitat: ['acude'],
    rarity: 'rara',
    iucn: 'CR',
    behavior: 'voa',
    colors: ['#F4F0E8', '#E0302A', '#1E1E24', '#7A9A4A'],
    fact: 'Descoberto em 1996, vive só nas matas úmidas das nascentes da Chapada do Araripe, no Ceará.',
  },
  {
    id: 'moco',
    name: 'Mocó',
    scientific: 'Kerodon rupestris',
    biome: 'caatinga',
    size: 'pequeno',
    habitat: ['lajedo'],
    rarity: 'comum',
    iucn: 'LC',
    behavior: 'pula',
    colors: ['#8E7E6A', '#5A4A3E', '#D8C8A8', '#C46A3A'],
    fact: 'Roedor dos lajedos, parente do preá. Tem almofadas nas patas que grudam na rocha e vive em colônias nas fendas.',
  },
  {
    id: 'oncaparda',
    name: 'Onça-parda',
    scientific: 'Puma concolor',
    biome: 'caatinga',
    size: 'grande',
    habitat: ['lajedo', 'mata-seca'],
    rarity: 'rara',
    iucn: 'LC',
    behavior: 'bote',
    colors: ['#C49A62', '#7A5A3A', '#F2E6D0', '#2A1E1A'],
    fact: 'Também chamada suçuarana. É o mamífero terrestre com a maior área de ocorrência das Américas.',
  },
  {
    id: 'veado',
    name: 'Veado-catingueiro',
    scientific: 'Subulo gouazoubira',
    biome: 'caatinga',
    size: 'grande',
    habitat: ['mata-seca'],
    rarity: 'incomum',
    iucn: 'LC',
    behavior: 'pula',
    colors: ['#A8784A', '#6A4A2E', '#F2E8D8', '#3A2A22'],
    fact: 'Veado pequeno e solitário. O macho tem chifres curtos e retos, que troca todo ano.',
  },
  {
    id: 'cascavel',
    name: 'Cascavel',
    scientific: 'Crotalus durissus',
    biome: 'caatinga',
    size: 'medio',
    habitat: ['lajedo', 'mata-seca'],
    rarity: 'incomum',
    iucn: 'LC',
    behavior: 'bote',
    colors: ['#B89A6A', '#4A3A2A', '#E8D8B0', '#7A6A4A'],
    fact: 'Sacode o chocalho da cauda como aviso. A cada troca de pele, ganha um novo anel no chocalho.',
  },
  {
    id: 'teiu',
    name: 'Teiú',
    scientific: 'Salvator merianae',
    biome: 'caatinga',
    size: 'medio',
    habitat: ['mata-seca', 'lajedo'],
    rarity: 'comum',
    iucn: 'LC',
    behavior: 'calmo',
    colors: ['#2A2A2E', '#F2EEE0', '#5A5A5E', '#E8D8A0'],
    fact: 'Lagarto onívoro de até 1,4 m. Na época de reprodução, consegue aquecer o próprio corpo acima do ambiente.',
  },
  {
    id: 'cururu',
    name: 'Sapo-cururu',
    scientific: 'Rhinella diptycha',
    biome: 'caatinga',
    size: 'pequeno',
    habitat: ['acude'],
    rarity: 'comum',
    iucn: 'LC',
    behavior: 'pula',
    colors: ['#A88A5A', '#5E4A30', '#E8D8B0', '#7A6A3A'],
    fact: 'As glândulas atrás dos olhos soltam um veneno leitoso. Na seca, fica enterrado esperando as chuvas.',
  },
  {
    id: 'jandaira',
    name: 'Jandaíra',
    scientific: 'Melipona subnitida',
    biome: 'caatinga',
    size: 'pequeno',
    habitat: ['mata-seca'],
    rarity: 'incomum',
    iucn: 'NE',
    behavior: 'voa',
    colors: ['#3A2A1E', '#E8B840', '#F2E8C8', '#A87A3A'],
    fact: 'Abelha sem ferrão típica da Caatinga. Poliniza plantas nativas e é criada no sertão pelo seu mel.',
  },
];

/** Todas as espécies, na ordem dos biomas (a numeração do caderno segue esta ordem). */
export const SPECIES: Species[] = [...BASE_SPECIES, ...CERRADO, ...PANTANAL, ...MATA_ATLANTICA, ...PAMPA];

export function getSpecies(id: string): Species {
  const s = SPECIES.find((sp) => sp.id === id);
  if (!s) throw new Error(`Espécie desconhecida: ${id}`);
  return s;
}
