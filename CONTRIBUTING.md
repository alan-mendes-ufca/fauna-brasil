# Como contribuir

## Fluxo de trabalho (GitHub Flow)

- A branch `main` sempre funciona.
- Uma branch e um PR por funcionalidade ou correção. Nomes como `feat/economia-vilas`, `infra/pipeline-testes`, `docs/documentacao`.
- Abra o PR contra `main` e descreva o que mudou e como testar. Cite a issue (`Closes #N`).
- O CI precisa passar. O mantenedor revisa e faz o merge; não faça merge do próprio PR.
- Depois do merge, apague a branch.

## Mensagens de commit

Em português, direto e descritivo, sem prefixo obrigatório. Exemplos do histórico:

- `Pipeline de qualidade: ESLint, Jest e CI no GitHub Actions`
- `Economia, mochila e vilas com lojas nos seis biomas`
- `Jogo base: Fauna Brasil com 6 biomas, captura, batalha, caderno e trilha`

Use a primeira linha como resumo e, se precisar, explique o porquê no corpo. Veja `git log` para o estilo.

## Rodar o projeto

```bash
npm install     # também instala o ESLint em tools/lint (postinstall)
npm run dev
```

## Qualidade

Rode antes de abrir o PR (o CI roda os mesmos comandos nos workflows `Lint`, em `.github/workflows/lint.yml`, e `Tests`, em `.github/workflows/tests.yml`):

| Comando | O que faz |
| --- | --- |
| `npm run lint` | ESLint (typescript-eslint, regras recomendadas, sem regras que exigem o programa do TypeScript) |
| `npx tsc --noEmit` | Checagem de tipos |
| `npm test` | Testes unitários com Jest e relatório de cobertura (`coverage/`) |
| `npm run build` | Checagem de tipos e build de produção com Vite |

### Testes

- Ficam ao lado do código: `src/**/*.test.ts`.
- Cobrem só módulos puros, sem canvas nem Phaser. Se algo importar `phaser`, o Jest usa o stub em `tests/stubs/phaser.ts`.
- Importe `describe`, `it` e `expect` de `@jest/globals`.
- A cobertura é medida só nos módulos listados em `collectCoverageFrom` (`jest.config.js`). Ao criar um módulo puro novo, acrescente-o à lista.

### Por que há um `tools/lint`?

O TypeScript 7 é o compilador nativo e não expõe a API JavaScript que o typescript-eslint exige (suporta até o 6.0). Por isso o ESLint vive em `tools/lint` com o seu próprio `package.json` e o TypeScript 5.9, sem afetar o `tsc` do build. O mesmo motivo faz o Jest usar Babel (`babel.config.cjs`) em vez do ts-jest. Quando o typescript-eslint suportar o TypeScript 7, basta mover as dependências para a raiz.

## Conteúdo do jogo

Para adicionar espécies, biomas ou vilas, siga [docs/conteudo.md](docs/conteudo.md). Para entender a estrutura, veja [docs/arquitetura.md](docs/arquitetura.md).
