import type { Rarity } from './species';

// CATÁLOGO DE ITENS DAS VILAS
// As lojas vendem só itens: animais nunca são comprados nem vendidos (o tráfico de fauna silvestre é
// um dos maiores problemas de conservação no Brasil). Os efeitos ficam em src/state/bag.ts e na captura.

export type ItemId = 'frutas' | 'erva' | 'rede' | 'isca';

/** Onde o item é usado: na mochila (fora de encontros) ou sozinho na captura. */
export type ItemUse = 'mochila' | 'captura';

export interface Item {
  id: ItemId;
  name: string;
  price: number;
  use: ItemUse;
  /** Texto curto da loja e da mochila. */
  desc: string;
  /** Ícone 12×12 em texto (cada letra é uma cor de `palette`; '.' é transparente). */
  icon: string[];
  palette: Record<string, string>;
}

export const ITEMS: Record<ItemId, Item> = {
  frutas: {
    id: 'frutas',
    name: 'Cesta de frutas',
    price: 30,
    use: 'mochila',
    desc: 'Açaí, cupuaçu e caju da roça da vila. Devolve metade do vigor a todo o time.',
    icon: [
      '............',
      '....o..g....',
      '...o.gg.....',
      '..rrppgyy...',
      '.rRRpPPyYy..',
      '.rRRpPPyYy..',
      'kbbbbbbbbbbk',
      'kBbBbBbBbBbk',
      '.kbBbBbBbBk.',
      '.kBbBbBbBbk.',
      '..kkkkkkkk..',
      '............',
    ],
    palette: { o: '#6a4a24', g: '#4f9a3a', r: '#a2223a', R: '#d8445a', p: '#4a2a5a', P: '#7a4a8a', y: '#d8a020', Y: '#f2d050', k: '#3a2410', b: '#a2703a', B: '#c8944e' },
  },
  erva: {
    id: 'erva',
    name: 'Erva medicinal',
    price: 20,
    use: 'mochila',
    desc: 'Chá de erva-cidreira e boldo. Reanima quem está exausto com metade do vigor.',
    icon: [
      '............',
      '.....gg.....',
      '....gGGg....',
      '..gg.gg.gg..',
      '.gGGg..gGGg.',
      '..gg.gg.gg..',
      '....gGGg....',
      '.....ss.....',
      '...wwwwww...',
      '...wWWWWw...',
      '....wwww....',
      '............',
    ],
    palette: { g: '#3a7a2a', G: '#7ac24a', s: '#5a4a24', w: '#8a5a3a', W: '#c88a5a' },
  },
  rede: {
    id: 'rede',
    name: 'Rede reforçada',
    price: 25,
    use: 'captura',
    desc: 'Malha dupla de fibra de tucum. Usada sozinha a cada arremesso que acerta: mais chance de captura e o bicho não foge se escapar.',
    icon: [
      '............',
      '..kkkkkkkk..',
      '.kwhwhwhwhk.',
      '.khwhwhwhwk.',
      '.kwhwhwhwhk.',
      '.khwhwhwhwk.',
      '.kwhwhwhwhk.',
      '..kkkkkkkk..',
      '.....ss.....',
      '.....ss.....',
      '.....ss.....',
      '............',
    ],
    palette: { k: '#5a3a1a', w: '#e8d8a8', h: '#a88a4a', s: '#7a5a2a' },
  },
  isca: {
    id: 'isca',
    name: 'Isca de frutos',
    price: 15,
    use: 'mochila',
    desc: 'Frutos maduros espalhados na trilha. Por 3 minutos, espécies raras aparecem mais.',
    icon: [
      '............',
      '............',
      '...o....o...',
      '..oOo..oOo..',
      '..oOo..oOo..',
      '...o.oo.o...',
      '....oOOo....',
      '....oOOo....',
      '.....oo.....',
      '..ddddddd...',
      '.ddDDDDDdd..',
      '............',
    ],
    palette: { o: '#a2402a', O: '#e8704a', d: '#5a4020', D: '#8a6a3a' },
  },
};

export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

/** Bônus da rede reforçada na chance de captura de um arremesso que acertou. */
export const NET_BONUS = 0.15;
/** Duração da isca e quanto ela multiplica o peso das espécies raras e lendárias no sorteio. */
export const LURE_MS = 3 * 60_000;
export const LURE_FACTOR = 2.5;

/** Moedas por captura (por raridade); vencer a batalha antes da captura rende mais metade. */
export const CAPTURE_COINS: Record<Rarity, number> = { comum: 10, incomum: 18, rara: 30, lendaria: 60 };
export const BATTLE_COIN_FACTOR = 0.5;
export const STARTING_COINS = 50;
