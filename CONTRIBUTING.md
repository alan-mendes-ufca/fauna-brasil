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

Use Node 24, a mesma versão dos workflows do CI. Depois de baixar o código do repositório:

```bash
npm install     # também instala o ESLint em tools/lint (postinstall)
npm run dev     # abra o endereço que o Vite mostrar
```

Para o build de produção: `npm run build`; para ver o resultado: `npm run preview`.

Os atalhos de URL para testar sem jogar do início (`?battle=`, `?gym=`, `?legend=`, `?starter` etc.) estão na tabela de [README.md](README.md#parâmetros-de-url-para-desenvolvimento). Os marcados com `*` só existem em `npm run dev`.

## Qualidade

Rode antes de abrir o PR. O CI roda os mesmos comandos nos workflows `Lint` (`.github/workflows/lint.yml`), `Tests` (`.github/workflows/tests.yml`) e `E2E` (`.github/workflows/e2e.yml`, veja abaixo):

| Comando | O que faz |
| --- | --- |
| `npm run lint` | ESLint (typescript-eslint, regras recomendadas, sem regras que exigem o programa do TypeScript) |
| `npx tsc --noEmit` | Checagem de tipos |
| `npm test` | Testes unitários com Jest e relatório de cobertura (`coverage/`) |
| `npm run build` | Checagem de tipos e build de produção com Vite |
| `npm run e2e` | Testes de fumaça no navegador (Playwright, só Chromium) |

### Testes

- Ficam ao lado do código: `src/**/*.test.ts`.
- Cobrem só módulos puros, sem canvas nem Phaser. Se algo importar `phaser`, o Jest usa o stub em `tests/stubs/phaser.ts`.
- Importe `describe`, `it` e `expect` de `@jest/globals`.
- A cobertura é medida só nos módulos listados em `collectCoverageFrom` (`jest.config.js`). Ao criar um módulo puro novo, acrescente-o à lista.

### Testes no navegador (`e2e/`)

`npm run e2e` abre o jogo de verdade no Chromium, com o Playwright (`playwright.config.ts`). O comando sobe um servidor `vite` em modo de desenvolvimento na porta 5199, a menos que já exista um rodando (fora do CI).

- Os cenários estão em `e2e/fumaca.spec.ts`: as 6 regiões abrem com o HUD certo; `?starter`, `?battle`, `?gym=amazonia` (ginásio, sem botão de fuga), `?legend=boiuna` (guardião, sem fuga), `?capture`, `?demo=caderno`; na vila, a loja e o Centro de Conservação abrem e fecham com `Esc`; o minimapa (`M`) e a mochila (`I`) abrem e fecham.
- Um cenário reprova se a página lançar `pageerror` ou `console.error` (`e2e/helpers.ts`), ou se o print sair vazio (menos de 200 cores distintas). Não há comparação pixel a pixel.
- Cada cenário salva um PNG em `e2e/prints/` (ignorado pelo controle de versão). No CI, esses prints viram o artefato `e2e-prints`, guardado por 14 dias. Se um teste falhar, o relatório do Playwright vai para o artefato `e2e-relatorio`.
- Localmente, se o Chromium do Playwright não estiver instalado, aponte `PW_CHROMIUM_PATH` para um Chromium que você já tenha. Para baixar o do Playwright: `npx playwright install chromium`.
- O Chromium roda com `--disable-accelerated-2d-canvas` e WebGL por software, porque sem GPU a pintura procedural do boot ficava lenta demais e os prints saíam em branco. Não remova essas opções sem testar.
- Nos cenários que dependem de um bioma, use `?at=<ponto>`: o spawn do Cerrado fica na transição amazônica.

### Por que há um `tools/lint`?

O TypeScript 7 é o compilador nativo e não expõe a API JavaScript que o typescript-eslint exige (suporta até o 6.0). Por isso o ESLint vive em `tools/lint` com o seu próprio `package.json` e o TypeScript 5.9, sem afetar o `tsc` do build. O mesmo motivo faz o Jest usar Babel (`babel.config.cjs`) em vez do ts-jest. Quando o typescript-eslint suportar o TypeScript 7, basta mover as dependências para a raiz.

## Conteúdo do jogo

Para adicionar espécies, biomas ou vilas, siga [docs/conteudo.md](docs/conteudo.md). Para entender a estrutura, veja [docs/arquitetura.md](docs/arquitetura.md).
