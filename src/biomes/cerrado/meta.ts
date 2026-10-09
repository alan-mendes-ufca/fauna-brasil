import type { BiomeMeta } from '../types';

export const META: BiomeMeta = {
  minimap: {
    '#': '#2e5a2a',
    '.': '#c9854f',
    '"': '#d2b158',
    m: '#8a6a3c',
    ',': '#e6a878',
    v: '#5da24a',
    '~': '#2f8f9c',
    _: '#e6d6a2',
    r: '#cf9478',
  },
  legend: [
    { c: '#d2b158', t: 'Campo e capim dourado' },
    { c: '#2e5a2a', t: 'Cerradão (árvores tortas)' },
    { c: '#5da24a', t: 'Vereda e buritizal' },
    { c: '#cf9478', t: 'Chapada de arenito' },
    { c: '#e6a878', t: 'Trilha de terra vermelha' },
  ],
  leafColors: [
    ['#d8c050', '#8a7a2a'],
    ['#b8d060', '#5a8a30'],
    ['#ffd23a', '#c08a18'],
  ],
  dry: true,
  transitions: [{ name: 'Transição Amazônica', x: 2, y: 2, w: 20, h: 16 }],
  gallerySample: [
    '#########~~~~##',
    '#mmm..".""vv~~#',
    '#mm#..",,,,v_~#',
    '#mmm..".""v_~~#',
    '#..rrr"..vvv__#',
    '#..rrr",,,,,,,,',
    '#....""..mm..##',
    '###############',
  ],
  galleryNote: 'campo, cerradão, vereda, buritis, chapada e trilha',
};
