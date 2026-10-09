import type { Iucn, Rarity } from '../data/species';

// Formatação compartilhada pela interface (avisos de captura, caderno/dex).

export const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export const RARITY_INFO: Record<Rarity, { label: string; gems: number }> = {
  comum: { label: 'Comum', gems: 1 },
  incomum: { label: 'Incomum', gems: 2 },
  rara: { label: 'Rara', gems: 3 },
  lendaria: { label: 'Lendária', gems: 4 },
};

export const IUCN_LABEL: Record<Iucn, string> = {
  LC: 'Pouco preocupante',
  NT: 'Quase ameaçada',
  VU: 'Vulnerável',
  EN: 'Em perigo',
  CR: 'Criticamente em perigo',
  NE: 'Não avaliada',
};

export const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
export const pad = (n: number) => String(n).padStart(2, '0');

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${pad(d || 1)} ${MONTHS[(m || 1) - 1] ?? '???'} ${y || ''}`.trim();
}

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function iucnBadge(code: Iucn, withLabel = true): string {
  return `<span class="iucn ${code}"><b class="iucn-code">${code}</b>${
    withLabel ? `<span class="iucn-label">${IUCN_LABEL[code]}</span>` : ''
  }</span>`;
}

export function gems(r: Rarity): string {
  const n = RARITY_INFO[r].gems;
  return `<span class="gems ${r}" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
}
