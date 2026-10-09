import type { BiomeMeta } from '../types';

export const META: BiomeMeta = {
  minimap: {
    '#': '#173f34',
    '.': '#2f6a4c',
    '"': '#3f8a5c',
    ',': '#a47652',
    '~': '#2b7a9c',
    _: '#ecdcae',
    l: '#6c5a3e',
    g: '#a8c46c',
    r: '#7c94a6',
    a: '#58966a',
    q: '#6cae7a',
    p: '#6a5240',
    c: '#a89464',
    s: '#7a9250',
  },
  legend: [
    { c: '#2f6a4c', t: 'Floresta de encosta' },
    { c: '#7c94a6', t: 'Rocha musgosa e cachoeira' },
    { c: '#6a5240', t: 'Mata de araucárias' },
    { c: '#a89464', t: 'Agreste' },
    { c: '#6c5a3e', t: 'Manguezal e restinga' },
  ],
  leafColors: [
    ['#b078d0', '#7a46a0'],
    ['#6cc072', '#2e7a56'],
    ['#e0a040', '#a8643a'],
    ['#f0b8f8', '#a24cc8'],
  ],
  dry: false,
  transitions: [
    { name: 'Agreste', x: 12, y: 1, w: 26, h: 9 },
    { name: 'Mata de Araucárias', x: 4, y: 35, w: 44, h: 8 },
  ],
  gallerySample: [
    '#####~~~~######',
    '##rrrr~~~"..###',
    '#.r,,r~~.""...#',
    '#..,,.....,,,__',
    '#"".,,,,,,,llg_',
    '#".aaqq,,ppaalg',
    '#caapppq,,aaqlg',
    '###############',
  ],
  galleryNote: 'floresta úmida, rocha musgosa, riacho, trilha, agreste, campo e pinhal, restinga e mangue',
};
