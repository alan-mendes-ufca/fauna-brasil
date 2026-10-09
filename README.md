# Fauna Brasil

Jogo de exploração e captura da fauna dos seis biomas brasileiros, feito com Phaser 4, Vite e TypeScript.

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

Os testes ficam ao lado do código (`src/**/*.test.ts`) e cobrem só módulos puros, sem canvas. Importe `describe`, `it` e `expect` de `@jest/globals`. O CI roda em PRs e em pushes para `main`, em dois workflows: `Lint` (`.github/workflows/lint.yml`: ESLint e `tsc --noEmit`) e `Tests` (`.github/workflows/tests.yml`: Jest e build).

### Por que há um `tools/lint`?

O TypeScript 7 é o compilador nativo e não expõe a API JavaScript que o typescript-eslint exige (suporta até o 6.0). Por isso o ESLint vive em `tools/lint` com o seu próprio `package.json` e o TypeScript 5.9, sem afetar o `tsc` do build. O mesmo motivo faz o Jest usar Babel (`babel.config.cjs`) em vez do ts-jest. Quando o typescript-eslint suportar o TypeScript 7, basta mover as dependências para a raiz.
