import { defineConfig, devices } from '@playwright/test';

const PORT = 5199;

// Testes de fumaça no navegador (só Chromium). O servidor é o `vite` em modo de desenvolvimento,
// porque os atalhos de teste (?region, ?battle, __village...) só existem com `import.meta.env.DEV`.
// PW_CHROMIUM_PATH aponta para um Chromium já instalado (opcional; no CI o Playwright baixa o dele).
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/resultados',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'e2e/relatorio' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 960, height: 640 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 960, height: 640 },
        launchOptions: {
          executablePath: process.env.PW_CHROMIUM_PATH || undefined,
          // Sem GPU: WebGL por software (SwiftShader) e canvas 2D em CPU. O canvas 2D acelerado via SwiftShader deixava a pintura
          // procedural dos sprites no boot ~15x mais lenta (70 s), e os prints saíam antes do jogo existir.
          args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio', '--disable-accelerated-2d-canvas'],
        },
      },
    },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
