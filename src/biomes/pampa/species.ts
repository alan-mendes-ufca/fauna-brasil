import type { Species } from '../../data/species';

// Fauna do Pampa. IUCN conferidos por busca em 2026-10-09 (BirdLife, AmphibiaWeb, Wikipedia citando a IUCN);
// os marcados "IUCN a confirmar" vêm de memória. Confirme tudo em iucnredlist.org antes de publicar.
// Habitats: campo-nativo (coxilhas de campo), banhado (juncal, margens e água), butiazal (butiazais e capões de mato).

export const SPECIES: Species[] = [
  {
    id: 'veadocampeiro',
    name: 'Veado-campeiro',
    scientific: 'Ozotoceros bezoarticus',
    biome: 'pampa',
    size: 'grande',
    habitat: ['campo-nativo'],
    rarity: 'rara',
    iucn: 'NT', // IUCN a confirmar
    behavior: 'pula',
    colors: ['#B8844E', '#6E4A2E', '#F2E6D2', '#3A2A22'],
    fact: 'O macho solta um cheiro forte de alho que se sente a centenas de metros. Sumiu de boa parte do Pampa com a perda do campo nativo.',
  },
  {
    id: 'graxaim',
    name: 'Graxaim-do-campo',
    scientific: 'Lycalopex gymnocercus',
    biome: 'pampa',
    size: 'medio',
    habitat: ['campo-nativo', 'butiazal'],
    rarity: 'comum',
    iucn: 'LC', // IUCN a confirmar
    behavior: 'pula',
    colors: ['#A8927A', '#4A3A30', '#EFE2C8', '#C8803E'],
    fact: 'Raposa dos campos do sul, come de tudo: roedores, insetos, frutos e até butiá. Caça pulando alto sobre a presa no capim.',
  },
  {
    id: 'zorrilho',
    name: 'Zorrilho',
    scientific: 'Conepatus chinga',
    biome: 'pampa',
    size: 'pequeno',
    habitat: ['campo-nativo', 'butiazal'],
    rarity: 'incomum',
    iucn: 'LC', // IUCN a confirmar
    behavior: 'bote',
    colors: ['#2A2428', '#F6F2EA', '#5A5058', '#D8D0C0'],
    fact: 'Primo gaúcho do gambá-fedorento. Sua faixa branca avisa que, se for provocado, esguicha um líquido de cheiro inesquecível.',
  },
  {
    id: 'tucotuco',
    name: 'Tuco-tuco',
    scientific: 'Ctenomys minutus',
    biome: 'pampa',
    size: 'pequeno',
    habitat: ['campo-nativo'],
    rarity: 'rara',
    iucn: 'NE', // IUCN: Dados Insuficientes (DD, 2008), que o tipo Iucn não tem; no Brasil é Vulnerável
    behavior: 'calmo',
    colors: ['#9A7650', '#5E442E', '#D8BE98', '#F0E2C4'],
    fact: 'Vive em túneis que ele mesmo cava nas dunas e campos arenosos. Seu nome imita o "tuc-tuc" do canto, ouvido debaixo da terra.',
  },
  {
    id: 'gatopalheiro',
    name: 'Gato-palheiro',
    scientific: 'Leopardus munoai',
    biome: 'pampa',
    size: 'medio',
    habitat: ['campo-nativo', 'butiazal'],
    rarity: 'rara',
    iucn: 'NE', // IUCN a confirmar: espécie recente, ainda sem categoria própria
    behavior: 'bote',
    colors: ['#C4A472', '#6E4E34', '#F0E4CC', '#3A2C26'],
    fact: 'Pequeno felino que se esconde no capim alto. Estudos recentes o separaram do gato-palheiro andino, e restam poucas centenas.',
  },
  {
    id: 'queroquero',
    name: 'Quero-quero',
    scientific: 'Vanellus chilensis',
    biome: 'pampa',
    size: 'medio',
    habitat: ['campo-nativo', 'banhado'],
    rarity: 'comum',
    iucn: 'LC', // IUCN a confirmar
    behavior: 'voa',
    colors: ['#B0A48E', '#2A2830', '#F6F2EA', '#C83A3A'],
    fact: 'Sentinela do campo: grita alto e ataca em voo quem chega perto do ninho. É símbolo do Rio Grande do Sul.',
  },
  {
    id: 'joaodebarro',
    name: 'João-de-barro',
    scientific: 'Furnarius rufus',
    biome: 'pampa',
    size: 'pequeno',
    habitat: ['campo-nativo', 'butiazal'],
    rarity: 'comum',
    iucn: 'LC', // IUCN a confirmar
    behavior: 'pula',
    colors: ['#B8703A', '#7A4426', '#EFD8B0', '#E8C8A0'],
    fact: 'Casal constrói em semanas uma casinha de barro em forma de forno, com porta e câmara interna. É a ave nacional da Argentina.',
  },
  {
    id: 'cisne',
    name: 'Cisne-de-pescoço-preto',
    scientific: 'Cygnus melancoryphus',
    biome: 'pampa',
    size: 'grande',
    habitat: ['banhado'],
    rarity: 'incomum',
    iucn: 'LC', // IUCN a confirmar
    behavior: 'voa',
    colors: ['#F6F4EE', '#26242C', '#D8342E', '#C8C6D2'],
    fact: 'Todo branco, com pescoço preto e carúncula vermelha no bico. Os filhotes viajam nas costas dos pais.',
  },
  {
    id: 'mulita',
    name: 'Tatu-mulita',
    scientific: 'Dasypus hybridus',
    biome: 'pampa',
    size: 'medio',
    habitat: ['campo-nativo'],
    rarity: 'incomum',
    iucn: 'NT', // IUCN: Quase Ameaçada (avaliação de 2014)
    behavior: 'casco',
    colors: ['#9A8A78', '#5A4C44', '#D8C8B0', '#C8A892'],
    fact: 'Tatu de orelhas compridas, de focinho fino. Sempre dá à luz quatro filhotes idênticos, todos do mesmo óvulo.',
  },
  {
    id: 'ratao',
    name: 'Ratão-do-banhado',
    scientific: 'Myocastor coypus',
    biome: 'pampa',
    size: 'medio',
    habitat: ['banhado'],
    rarity: 'comum',
    iucn: 'LC', // IUCN a confirmar
    behavior: 'mergulha',
    colors: ['#7A5A3E', '#3E2C22', '#C8A87E', '#E8DCC4'],
    fact: 'Roedor nadador de dentes laranja e pés com membranas. Come juncos e planta de banhado, e as fêmeas amamentam quase na água.',
  },
  {
    id: 'cardeal',
    name: 'Cardeal-amarelo',
    scientific: 'Gubernatrix cristata',
    biome: 'pampa',
    size: 'pequeno',
    habitat: ['butiazal', 'campo-nativo'],
    rarity: 'lendaria',
    iucn: 'EN', // BirdLife: Em Perigo (avaliação de 2018)
    behavior: 'voa',
    colors: ['#F2C81E', '#1E1C20', '#8A9068', '#FFF4A8'],
    fact: 'Cantor de crista preta e rosto amarelo vivo. Foi capturado tanto para gaiolas que hoje restam pouco mais de mil na natureza.',
  },
  {
    id: 'sapinho',
    name: 'Sapinho-de-barriga-vermelha',
    scientific: 'Melanophryniscus atroluteus',
    biome: 'pampa',
    size: 'pequeno',
    habitat: ['banhado', 'campo-nativo'],
    rarity: 'incomum',
    iucn: 'LC', // AmphibiaWeb: LC (2021)
    behavior: 'pula',
    colors: ['#2E2E2A', '#D8341E', '#E8C830', '#8A8A74'],
    fact: 'Do tamanho de uma moeda, vira de barriga para cima e mostra o vermelho-vivo como aviso: sua pele é tóxica.',
  },
];
