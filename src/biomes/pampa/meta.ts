import type { BiomeMeta } from '../types';

export const META: BiomeMeta = {
  minimap: {
    '#': '#24503a',
    '.': '#7ea646',
    '"': '#a4b45a',
    ',': '#d0ba8a',
    c: '#5a9a76',
    b: '#3a7a48',
    j: '#4a8a62',
    '~': '#4a8cae',
    _: '#b4a888',
  },
  legend: [
    { c: '#7ea646', t: 'Campo nativo e coxilhas' },
    { c: '#5a9a76', t: 'Campos de altitude' },
    { c: '#4a8a62', t: 'Banhado e juncal' },
    { c: '#3a7a48', t: 'Butiazal e capões' },
    { c: '#d0ba8a', t: 'Trilha de terra batida' },
  ],
  leafColors: [
    ['#a8cc6a', '#5e8c3c'],
    ['#e86a40', '#a83a28'],
    ['#f2e8a0', '#b8a85c'],
  ],
  dry: true,
  transitions: [{ name: 'Campos de Cima da Serra', x: 15, y: 1, w: 26, h: 12 }],
  gallerySample: [
    '###########~~~##',
    '#.."".cc,cc.~~~#',
    '#.b""ccc,ccjj_~#',
    '#bbb..cc,.cjj__#',
    '#bb#..,,,,.."..#',
    '#.....,..j"...##',
    '#..""..,.jj_~~##',
    '################',
  ],
  galleryNote: 'campo nativo, campo de altitude, banhado, lagoa, butiazal e trilha',
};
