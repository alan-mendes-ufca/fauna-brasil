import { expect, test, type Page } from '@playwright/test';
import { abrir, assentar, esperarCena, imprimir, vigiarErros } from './helpers';

// Testes de fumaça: cada cenário abre o jogo de verdade, salva um print em e2e/prints/ e
// falha se a página lançar `pageerror` ou `console.error`.

// Ponto de entrada (`?at=`) de cada região; o spawn do Cerrado fica na transição amazônica e engana no print.
const REGIOES = [
  { id: 'amazonia', nome: 'Amazônia', at: 'sumauma' },
  { id: 'caatinga', nome: 'Caatinga', at: 'lajedo' },
  { id: 'cerrado', nome: 'Cerrado', at: 'chapada' },
  { id: 'pantanal', nome: 'Pantanal', at: 'baia' },
  { id: 'mata-atlantica', nome: 'Mata Atlântica', at: 'cachoeira' },
  { id: 'pampa', nome: 'Pampa', at: 'coxilha' },
];

let erros: string[] = [];
test.beforeEach(({ page }) => {
  erros = vigiarErros(page);
});
test.afterEach(() => {
  expect(erros, 'erros de página').toEqual([]);
});

for (const r of REGIOES) {
  test(`região ${r.id} abre e o HUD mostra ${r.nome}`, async ({ page }) => {
    await abrir(page, `region=${r.id}&nostarter&at=${r.at}`);
    await esperarCena(page, 'Overworld');
    await expect(page.locator('.plaque-title')).toHaveText(r.nome);
    await assentar(page);
    await imprimir(page, `regiao-${r.id}`);
  });
}

test('?starter abre a escolha do inicial', async ({ page }) => {
  await abrir(page, 'starter');
  await esperarCena(page, 'Starter');
  await assentar(page);
  await imprimir(page, 'inicial');
});

test('?battle abre a batalha', async ({ page }) => {
  await abrir(page, 'battle=onca&habitat=agua&lv=6');
  await esperarCena(page, 'Battle');
  // A entrada dos dois animais é uma animação; no renderizador por software ela leva alguns segundos.
  await page.waitForFunction(
    () => {
      const a = (window as unknown as { __game: { scene: { getScene(k: string): { myActor?: { spr: { alpha: number } } } } } }).__game.scene.getScene('Battle').myActor;
      return a?.spr.alpha === 1;
    },
    null,
    { timeout: 30_000 },
  );
  await assentar(page, 1500);
  await imprimir(page, 'batalha');
});

/** Espera a entrada dos animais da batalha (animação lenta no renderizador por software). */
async function esperarBatalhaPronta(page: Page): Promise<void> {
  await esperarCena(page, 'Battle');
  await page.waitForFunction(
    () => {
      const a = (window as unknown as { __game: { scene: { getScene(k: string): { myActor?: { spr: { alpha: number } } } } } }).__game.scene.getScene('Battle').myActor;
      return a?.spr.alpha === 1;
    },
    null,
    { timeout: 45_000 },
  );
}

test('?gym=amazonia abre a batalha de ginásio', async ({ page }) => {
  await abrir(page, 'gym=amazonia');
  await esperarBatalhaPronta(page);
  await expect(page.locator('.bt-note')).toContainText('Ginásio');
  await expect(page.locator('.bt-run')).toHaveCount(0);
  await assentar(page, 1500);
  await imprimir(page, 'batalha-ginasio');
});

test('?legend=boiuna abre a batalha do guardião', async ({ page }) => {
  await abrir(page, 'legend=boiuna');
  await esperarBatalhaPronta(page);
  await expect(page.locator('.bt-note')).toContainText('Guardião do folclore');
  await expect(page.locator('.bt-wild .bt-pname')).toHaveText('Boiúna');
  await expect(page.locator('.bt-run')).toHaveCount(0);
  await assentar(page, 1500);
  await imprimir(page, 'batalha-guardiao');
});

test('?capture abre a captura', async ({ page }) => {
  await abrir(page, 'capture=onca&habitat=agua');
  await esperarCena(page, 'Capture');
  await assentar(page, 2000);
  await imprimir(page, 'captura');
});

test('?demo=caderno abre o caderno de campo', async ({ page }) => {
  await abrir(page, 'demo=caderno');
  await expect(page.locator('.nb-layer')).toBeVisible();
  await assentar(page);
  await imprimir(page, 'caderno');
});

/** Fala com um morador sem andar até ele: o jogo emite `npc-talk` exatamente como ao clicar no morador. */
async function falarCom(page: Page, role: 'loja' | 'centro', regionId: string): Promise<void> {
  await page.evaluate(
    ({ role, regionId }) => {
      const npc = { id: `e2e-${role}`, name: role === 'loja' ? 'Dona Teste' : 'Dra. Teste', look: 'vendedora', role, lines: ['Bem-vindo!'], x: 0, y: 0 };
      (window as unknown as { __game: { events: { emit(e: string, p: unknown): void } } }).__game.events.emit('npc-talk', { npc, regionId });
    },
    { role, regionId },
  );
}

test('na vila, a loja e o Centro de Conservação abrem e fecham com Esc', async ({ page }) => {
  await abrir(page, 'region=amazonia&nostarter&at=vila');
  await esperarCena(page, 'Overworld');
  await assentar(page);
  await imprimir(page, 'vila');

  await falarCom(page, 'loja', 'amazonia');
  await expect(page.locator('.vl-dialog')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.vl-shop')).toBeVisible();
  await assentar(page, 300);
  await imprimir(page, 'loja');
  await page.keyboard.press('Escape');
  await expect(page.locator('.vl-shop')).toBeHidden();

  await falarCom(page, 'centro', 'amazonia');
  await expect(page.locator('.vl-dialog')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.cv-panel')).toBeVisible();
  await assentar(page, 300);
  await imprimir(page, 'centro-conservacao');
  await page.keyboard.press('Escape');
  await expect(page.locator('.cv-panel')).toBeHidden();
});

test('o minimapa (M) e a mochila (I) abrem e fecham', async ({ page }) => {
  await abrir(page, 'region=amazonia&nostarter&at=ponte');
  await esperarCena(page, 'Overworld');
  await assentar(page, 500);

  await page.keyboard.press('m');
  await expect(page.locator('.mm-layer')).toBeVisible();
  await assentar(page, 300);
  await imprimir(page, 'minimapa');
  await page.keyboard.press('Escape');
  await expect(page.locator('.mm-layer')).toBeHidden();

  await page.keyboard.press('i');
  await expect(page.locator('.vl-bag-panel')).toBeVisible();
  await assentar(page, 300);
  await imprimir(page, 'mochila');
  await page.keyboard.press('i');
  await expect(page.locator('.vl-bag-panel')).toBeHidden();
});
