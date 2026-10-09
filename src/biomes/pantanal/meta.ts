import type { BiomeMeta } from '../types';

export const META: BiomeMeta = {
  minimap: {
    '#': '#14402a',
    '.': '#3a6a34',
    ':': '#7aa646',
    '"': '#4e8e34',
    s: '#c8b45a',
    ',': '#d8bc84',
    _: '#7a6446',
    w: '#6cc0b0',
    '~': '#2282a0',
    '=': '#a07a4a',
  },
  legend: [
    { c: '#2282a0', t: 'baía e rio' },
    { c: '#6cc0b0', t: 'campo alagado' },
    { c: '#3a6a34', t: 'cordilheira' },
    { c: '#c8b45a', t: 'campo seco' },
    { c: '#d8bc84', t: 'aterro' },
  ],
  // pétalas de paratudo e ipê-rosa, folhas verdes e sementes de capim
  leafColors: [
    ['#ffe048', '#c48a10'],
    ['#ff9cc4', '#b03070'],
    ['#9ad060', '#3a7a34'],
    ['#f0ecc8', '#a8a478'],
  ],
  // úmido e verde: tem vaga-lume à beira d'água
  dry: false,
  transitions: [{ name: 'Transição Cerrado–Pantanal', x: 22, y: 2, w: 25, h: 12 }],
  gallerySample: [
    '#..:::ss,,::"""ww#',
    '#...::ss,,:"""www#',
    '##.::::s,,::""ww:#',
    '#:::___~~~~___,,:#',
    '#::_~~~~~~~~_::,,#',
    '#,,,==========,,,#',
    '#::_~~~~~~~~_::,,#',
    '##################',
  ],
  galleryNote: 'campo, água rasa, baía, cordilheira e aterro',
};
