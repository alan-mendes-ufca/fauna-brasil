import { expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

export const PRINTS = 'e2e/prints';

/** Erros de página (`pageerror`) e de `console.error` coletados desde a criação. */
export function vigiarErros(page: Page): string[] {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') erros.push(`console.error: ${m.text()}`);
  });
  return erros;
}

/** Abre o jogo (servidor de desenvolvimento) e espera o Phaser expor `__game`. */
export async function abrir(page: Page, consulta: string): Promise<void> {
  await page.goto(`/?${consulta}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean((window as unknown as { __game?: unknown }).__game), null, { timeout: 45_000 });
}

/** Espera uma cena do Phaser ficar ativa. */
export async function esperarCena(page: Page, chave: string): Promise<void> {
  await page.waitForFunction((k) => (window as unknown as { __game: { scene: { isActive(k: string): boolean } } }).__game.scene.isActive(k), chave, { timeout: 45_000 });
}

/** Deixa a animação rodar um pouco (frames de verdade, não só o carregamento). */
export async function assentar(page: Page, ms = 1200): Promise<void> {
  await page.evaluate(() => new Promise<void>((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok()))));
  await page.waitForTimeout(ms);
}

/** Salva o print e confirma que o jogo foi desenhado: a imagem tem muitas cores distintas (um canvas vazio teria 1 ou 2). */
export async function imprimir(page: Page, nome: string): Promise<void> {
  mkdirSync(PRINTS, { recursive: true });
  const png = await page.screenshot({ path: `${PRINTS}/${nome}.png` });
  const cores = await page.evaluate(async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const img = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const c = new OffscreenCanvas(img.width, img.height);
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const set = new Set<number>();
    for (let i = 0; i < d.length; i += 4 * 7) set.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    return set.size;
  }, png.toString('base64'));
  expect(cores, `print "${nome}" parece vazio (${cores} cores)`).toBeGreaterThan(200);
}
