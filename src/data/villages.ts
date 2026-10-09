import type { VillageSpec } from '../world/village';

// VILAS DE CADA BIOMA (gerador em src/world/village.ts)
// `door` é a linha do mapa original onde a trilha entra; o primeiro morador é sempre quem cuida da loja.
// As falas dão dicas do jogo e contam um pouco da fauna e de quem vive com ela.

export const VILLAGES: Record<string, VillageSpec> = {
  amazonia: {
    name: 'Vila Ribeirinha do Tucumã',
    side: 'west',
    door: 22,
    ground: '.',
    brush: '"',
    path: ',',
    seed: 101,
    npcs: [
      {
        id: 'am-loja', name: 'Dona Raimunda', look: 'vendedora', role: 'loja',
        lines: ['Bem-vindo à mercearia! Aqui tem de tudo pra quem anda na mata, menos bicho. Bicho é da floresta.'],
      },
      {
        id: 'am-pescador', name: 'Seu Bené', look: 'pescador', role: 'morador',
        lines: [
          'O boto aparece no fim da tarde, quando a água acalma. Chegue de mansinho pela margem.',
          'Rede de malha dupla segura bicho grande. Se ele escapar, pelo menos não some na hora.',
        ],
      },
      {
        id: 'am-menina', name: 'Iara', look: 'menina', role: 'morador',
        lines: [
          'Minha avó diz que a harpia é a dona do céu. Ela é tão rara que eu nunca vi nenhuma!',
          'Se espalhar isca de frutos na trilha, os bichos raros vêm comer. Mas dura pouco.',
        ],
      },
      {
        id: 'am-idoso', name: 'Seu Joaquim', look: 'idoso', role: 'morador',
        lines: [
          'Quando eu era moço, ninguém pensava em proteger a floresta. Hoje a gente sabe que sem ela o rio seca.',
          'Quem vende bicho do mato tira ele de casa pra morrer longe. Aqui ninguém faz isso.',
        ],
      },
    ],
  },
  caatinga: {
    name: 'Vila do Lajedo',
    side: 'east',
    door: 20,
    ground: '.',
    brush: '"',
    path: ',',
    seed: 202,
    npcs: [
      {
        id: 'ca-loja', name: 'Dona Socorro', look: 'vendedora', role: 'loja',
        lines: ['Chegue, chegue! Tem cesta de frutas fresquinha, que no sol do sertão ninguém aguenta sem comer.'],
      },
      {
        id: 'ca-agricultora', name: 'Francisca', look: 'agricultora', role: 'morador',
        lines: [
          'A ararinha-azul sumiu da natureza por causa do tráfico. Voltou porque foi criada com cuidado e solta aqui.',
          'Na seca a caatinga parece morta, mas é só esperar a primeira chuva: fica verde em três dias.',
        ],
      },
      {
        id: 'ca-idoso', name: 'Seu Zé do Lajedo', look: 'idoso', role: 'morador',
        lines: [
          'O tatu-bola se fecha que nem uma bola. Rede nenhuma pega ele assim; espere ele abrir.',
          'Erva medicinal levanta qualquer bicho cansado. Minha mãe fazia chá de boldo pra tudo.',
        ],
      },
      {
        id: 'ca-menina', name: 'Lia', look: 'menina', role: 'morador',
        lines: ['Você já viu o mocó? Ele mora nas pedras do lajedo e assobia quando tem perigo!'],
      },
    ],
  },
  cerrado: {
    name: 'Vila Buriti',
    side: 'west',
    door: 18,
    ground: '.',
    brush: '"',
    path: ',',
    seed: 303,
    npcs: [
      {
        id: 'ce-loja', name: 'Dona Cida', look: 'vendedora', role: 'loja',
        lines: ['Olá! Tenho rede reforçada de tucum, trançada aqui mesmo na vila. Vai querer?'],
      },
      {
        id: 'ce-guarda', name: 'Guarda Ribeiro', look: 'guarda', role: 'morador',
        lines: [
          'O lobo-guará come muita lobeira, aquela fruta do cerrado. Espalha as sementes por todo canto.',
          'Queimada fora de época mata muito bicho que não consegue fugir. Fogo no cerrado só com manejo.',
        ],
      },
      {
        id: 'ce-agricultora', name: 'Rosa', look: 'agricultora', role: 'morador',
        lines: ['O buriti dá comida, palha e remédio. Onde tem buritizal, tem água o ano inteiro.'],
      },
      {
        id: 'ce-idoso', name: 'Seu Antônio', look: 'idoso', role: 'morador',
        lines: ['Bicho grande tem que cansar numa luta antes de entrar na rede. Leve seu time descansado.'],
      },
    ],
  },
  'mata-atlantica': {
    name: 'Vila Jequitibá',
    side: 'west',
    door: 20,
    ground: '.',
    brush: '"',
    path: ',',
    seed: 404,
    npcs: [
      {
        id: 'ma-loja', name: 'Dona Lourdes', look: 'vendedora', role: 'loja',
        lines: ['Seja bem-vindo à Vila Jequitibá! A mercearia está aberta, pode olhar à vontade.'],
      },
      {
        id: 'ma-pescador', name: 'Seu Tião', look: 'pescador', role: 'morador',
        lines: [
          'Sobrou pouco da Mata Atlântica, um pedaço de cada vez. Mas é onde mora o mico-leão-dourado.',
          'O muriqui é o maior macaco das Américas e um dos mais ameaçados. Vê-lo é sorte grande.',
        ],
      },
      {
        id: 'ma-menina', name: 'Bia', look: 'menina', role: 'morador',
        lines: ['Eu planto mudas de palmito-juçara com a escola. Os tucanos comem o fruto e espalham a semente.'],
      },
      {
        id: 'ma-guarda', name: 'Guarda Helena', look: 'guarda', role: 'morador',
        lines: ['Corredores de mata ligam um fragmento ao outro. Sem eles, os bichos ficam presos em ilhas.'],
      },
    ],
  },
  pampa: {
    name: 'Vila da Coxilha',
    side: 'east',
    door: 18,
    ground: '.',
    brush: '"',
    path: ',',
    seed: 505,
    npcs: [
      {
        id: 'pa-loja', name: 'Dona Eva', look: 'vendedora', role: 'loja',
        lines: ['Buenas! Entra, que o vento minuano está brabo hoje. A loja tem o que tu precisar.'],
      },
      {
        id: 'pa-idoso', name: 'Seu Aparício', look: 'idoso', role: 'morador',
        lines: [
          'O pampa é campo nativo. Plantar árvore em tudo acaba com a casa da ema e do veado-campeiro.',
          'O cardeal-amarelo é caçado pra virar ave de gaiola. Restam poucos soltos por aí.',
        ],
      },
      {
        id: 'pa-agricultora', name: 'Mariana', look: 'agricultora', role: 'morador',
        lines: ['O butiá dá licor, doce e sombra. E os bichos adoram o fruto maduro que cai no chão.'],
      },
      {
        id: 'pa-menina', name: 'Nina', look: 'menina', role: 'morador',
        lines: ['Nos banhados tem bicho que só aparece de manhãzinha. Tem que ter paciência!'],
      },
    ],
  },
  pantanal: {
    name: 'Porto Aguapé',
    side: 'east',
    door: 20,
    ground: ':',
    brush: '"',
    path: ',',
    seed: 606,
    npcs: [
      {
        id: 'pt-loja', name: 'Dona Benedita', look: 'vendedora', role: 'loja',
        lines: ['Bom dia! Aqui no porto chega de tudo de barco. Dê uma olhada nas prateleiras.'],
      },
      {
        id: 'pt-pescador', name: 'Seu Nhô', look: 'pescador', role: 'morador',
        lines: [
          'Na cheia, a água cobre o campo e o peixe entra no meio do capim. Na seca, os bichos se juntam nas baías.',
          'A arara-azul quase sumiu. Hoje tem ninho artificial nos pés de manduvi pra ajudar.',
        ],
      },
      {
        id: 'pt-guarda', name: 'Guarda Sílvio', look: 'guarda', role: 'morador',
        lines: ['A onça do Pantanal é a maior do Brasil. Quem vem ver onça traz mais dinheiro pra cá do que quem caça.'],
      },
      {
        id: 'pt-idoso', name: 'Seu Matias', look: 'idoso', role: 'morador',
        lines: ['O tuiuiú é o símbolo do Pantanal. Faz um ninhão de galhos no alto das árvores e volta pra ele todo ano.'],
      },
    ],
  },
};
