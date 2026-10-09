# Fauna Brasil

Jogo de exploração e captura da fauna dos seis biomas brasileiros, feito com Phaser 4, Vite e TypeScript.

## O jogo

| | |
| --- | --- |
| ![Exploração do Pantanal](docs/capturas/exploracao-pantanal.png) | ![Exploração do Cerrado](docs/capturas/exploracao-cerrado.png) |
| Pantanal: baía com jacarés e a trilha da cordilheira. | Cerrado: chapada com cupinzeiros e árvores retorcidas. |
| ![Vila Ribeirinha do Tucumã](docs/capturas/vila.png) | ![Batalha contra a onça-pintada](docs/capturas/batalha.png) |
| Vila com moradores, loja e Centro de Conservação. | Batalha por turnos contra um animal de grande porte. |
| ![Captura](docs/capturas/captura.png) | ![Caderno de campo](docs/capturas/caderno.png) |
| Captura com a rede, sem ferir o bicho. | Caderno de campo (Faunadex) com as espécies catalogadas. |

Os prints são gerados pelos testes de fumaça (`npm run e2e`, em `e2e/prints/`) e os escolhidos ficam em `docs/capturas/`.

## Desenvolvimento

```bash
npm install     # instala o projeto e, pelo postinstall, o ESLint isolado em tools/lint
npm run dev     # servidor de desenvolvimento
```

## Qualidade

| Comando | O que faz |
| --- | --- |
| `npm run lint` | ESLint (typescript-eslint, regras recomendadas, sem regras que exigem o programa do TypeScript) |
| `npx tsc --noEmit` | Checagem de tipos |
| `npm test` | Testes unitários com Jest e relatório de cobertura (`coverage/`) |
| `npm run build` | Checagem de tipos e build de produção com Vite |
| `npm run e2e` | Testes de fumaça no navegador (Playwright, só Chromium); salvam um PNG por cenário em `e2e/prints/` |

Os testes ficam ao lado do código (`src/**/*.test.ts`) e cobrem só módulos puros, sem canvas. Importe `describe`, `it` e `expect` de `@jest/globals`. O CI roda em PRs e em pushes para `main`, em três workflows: `Lint` (`.github/workflows/lint.yml`: ESLint e `tsc --noEmit`), `Tests` (`.github/workflows/tests.yml`: Jest e build) e `E2E` (`.github/workflows/e2e.yml`: Playwright, com os prints como artefato `e2e-prints`).

### Testes no navegador (`e2e/`)

Um servidor `vite` em modo de desenvolvimento (porta 5199) sobe sozinho; o Playwright abre as 6 regiões, `?starter`, `?battle`, `?capture`, `?demo=caderno`, a loja e o Centro de Conservação da vila, o minimapa (`M`) e a mochila (`I`). Qualquer `pageerror` ou `console.error` reprova o cenário, e cada print precisa ter muitas cores (um canvas vazio falha). Não há comparação pixel a pixel.

- Sem GPU, o canvas 2D acelerado por SwiftShader tornava a pintura procedural do boot ~15x mais lenta (~70 s) e os prints saíam em branco; por isso o Chromium roda com `--disable-accelerated-2d-canvas` (WebGL continua por software).
- `PW_CHROMIUM_PATH` aponta para um Chromium já instalado, se o do Playwright não estiver disponível.
- O spawn do Cerrado fica na transição amazônica (parece floresta); os cenários usam `?at=<ponto>` para cair no bioma.

### Por que há um `tools/lint`?

O TypeScript 7 é o compilador nativo e não expõe a API JavaScript que o typescript-eslint exige (suporta até o 6.0). Por isso o ESLint vive em `tools/lint` com o seu próprio `package.json` e o TypeScript 5.9, sem afetar o `tsc` do build. O mesmo motivo faz o Jest usar Babel (`babel.config.cjs`) em vez do ts-jest. Quando o typescript-eslint suportar o TypeScript 7, basta mover as dependências para a raiz.
