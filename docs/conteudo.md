# Como adicionar conteúdo

Os exemplos usam o Pampa (`src/biomes/pampa/`) como referência. O contrato dos biomas está no comentário de `src/biomes/types.ts`. Depois de qualquer mudança, rode `npm run lint`, `npx tsc --noEmit`, `npm test` e `npm run build`, e confira no jogo (veja os [parâmetros de URL](../README.md#parâmetros-de-url-para-desenvolvimento)).

## Adicionar uma espécie

Para um bioma que segue o contrato (Cerrado, Pantanal, Mata Atlântica, Pampa), trabalhe em `src/biomes/<bioma>/`. Amazônia e Caatinga usam arquivos centrais (indicados abaixo).

1. **Dados.** Acrescente um objeto a `SPECIES` em `species.ts` do bioma (Amazônia e Caatinga: `BASE_SPECIES` em `src/data/species.ts`). Campos: `id` (único, minúsculo, sem acento), `name`, `scientific`, `biome`, `size` (`pequeno`, `medio`, `grande`), `habitat` (lista; veja `Habitat` em `src/data/species.ts`), `rarity`, `iucn`, `behavior` (comportamento na captura), `colors` (cores reais do animal, em pixel art) e `fact` (texto do caderno). Animais `grande` passam por batalha antes da captura.
2. **Retrato de captura e combate.** Desenhe o animal em `animals*.ts` do bioma e registre em `DRAWERS` (quadros 0 a 3) e `COMBAT` (quadro de ataque e de dano) em `animals.ts`. Amazônia e Caatinga: `src/art/animals/`.
3. **Sprite da exploração.** Desenhe em `wildlife.ts` do bioma e registre em `OW_DRAWERS`. Amazônia e Caatinga: `src/art/wildlife/`.
4. **Batalha.** Acrescente uma entrada em `PROFILES` (`battle.ts` do bioma): tipos (1 ou 2), stats base e 4 golpes de `MOVES` (`src/data/battle.ts`). Sem entrada, `profileFor()` deriva um perfil do porte, da raridade, do comportamento e do habitat.
5. **Fundo da captura.** Se a espécie usa um habitat novo, o bioma precisa de um fundo para ele em `CAPTURE_BG` (`captureBg.ts`).
6. **Habitat.** Se criou um habitat novo, inclua-o no tipo `Habitat` (`src/data/species.ts`), em `HABITAT_LABEL` (`src/data/biomes.ts`), em `HABITATS` e `markHabitats` (`habitats.ts` do bioma) e nos comentários do tipo.
7. Confira a espécie com `?gallery`, `?capture=<id>`, `?battle=<id>` e `?fauna=<id>` (só em desenvolvimento).

Os testes de `src/world/encounters.test.ts` conferem o sorteio por habitat. Rode `npm test` depois de mudar habitats.

## Adicionar uma região ou um bioma

Uma região é um objeto `Region` (`src/data/types.ts`). Um bioma novo cria uma pasta em `src/biomes/<bioma>/` com os arquivos de nomes fixos do contrato:

| Arquivo | Exporta |
| --- | --- |
| `tiles.ts` | `TILESET` (tiles e legenda dos caracteres do mapa) |
| `props.ts` | `PROPS` (medidas e se é andável) e `PAINTERS` (desenho) |
| `habitats.ts` | `HABITATS`, `DEFAULT_HABITAT`, `markHabitats(ctx)` |
| `captureBg.ts` | `CAPTURE_BG` por habitat |
| `region.ts` | `REGION` |
| `meta.ts` | `META` (cores do minimapa, clima, faixas de transição, amostra da galeria) |
| `species.ts`, `animals.ts`, `wildlife.ts`, `battle.ts` | fauna (veja acima) |

Registros a atualizar fora da pasta:

- `Biome` em `src/data/species.ts` e `BIOMES` em `src/data/biomes.ts`.
- `src/biomes/env.ts` (lista `ENV_MODULES`) e `src/biomes/fauna.ts` (`MODULE_DRAWERS`, `MODULE_COMBAT`, `MODULE_OW_DRAWERS`).
- `SPECIES` em `src/data/species.ts` e `PROFILES` em `src/data/battle.ts`.
- `Mood` e o estilo musical em `src/audio/music.ts`; posição no `ATLAS` de `src/ui/minimap.ts`.
- Saídas (`exits`) nas regiões vizinhas e nesta.

### Campos de uma região

- `map`: lista de linhas de texto, todas do mesmo tamanho; cada caractere precisa existir em `TILESET.ground`.
- `props`: objetos posicionados pelo tile da base esquerda. O tipo precisa existir em `PROPS`.
- `lights`, `ambient`, `spill`: iluminação.
- `spawn` e `places`: pontos nomeados (`?at=nome`). Precisam estar em tiles andáveis.
- `exits`: retângulo `x, y, w, h` (tiles andáveis), `to` (id da região de destino), `at` (ponto nomeado ou tile de chegada) e `label`. A chegada não pode cair numa saída.

`validateRegion` (`src/data/regions/index.ts`) roda ao carregar o jogo e lança um erro descritivo se algo não bate (mapa irregular, caractere inválido, objeto fora do mapa ou de tipo desconhecido, ponto fora do mapa ou não andável). O mesmo arquivo confere se cada saída tem destino e chegada válidos. `src/world/village.test.ts` roda essas checagens no Jest.

As regiões de `ENV_MODULES` entram em `REGIONS` automaticamente (veja o fim de `src/data/regions/index.ts`).

## Adicionar uma vila com loja

1. Acrescente uma entrada em `VILLAGES` (`src/data/villages.ts`), com a chave igual ao id da região: `name`, `side` (`east` ou `west`), `door` (linha do mapa original onde a trilha entra), caracteres do bioma (`ground`, `brush`, `path`), `seed` e `npcs`.
2. **Moradores** (`NpcDef`, sem `x` e `y`): `id`, `name`, `look` (`vendedora`, `pescador`, `agricultora`, `idoso`, `menina`, `guarda`, `biologa`), `role` e `lines`. O primeiro morador é sempre quem cuida da loja (`role: 'loja'`). A bióloga do Centro de Conservação usa `role: 'centro'` e `look: 'biologa'`; ela abre o painel do Centro, que é o mesmo em todas as vilas. Os demais usam `role: 'morador'`. O máximo de moradores (contando loja e bióloga) é o número de `NPC_SLOTS` em `src/world/village.ts`.
3. `withVillage` (`src/world/village.ts`) acrescenta uma faixa de 30 colunas ao mapa (`STRIP_W`), com a clareira, casas, loja, poço e moradores. Tudo o que já existia no lado oeste anda 30 colunas para a direita. Por isso a vila deve ser planejada junto com as `exits` e `places` da região, que são deslocados automaticamente.
4. A loja vende os itens de `ITEMS` (`src/data/items.ts`). Para um item novo, acrescente a entrada em `ITEMS`, o efeito em `src/state/bag.ts` e, se for usado na captura, em `CaptureScene`.
5. **Regra:** a loja nunca vende nem compra animais. Mantenha falas de moradores que reforcem a mensagem contra o tráfico de fauna.
6. Rode `npm test`: `src/world/village.test.ts` valida as regiões com vila (`validateRegion`) e o comportamento de `withVillage`.

## Dados de espécies e status IUCN

Os status IUCN (`iucn`: `LC`, `NT`, `VU`, `EN`, `CR`, `NE`) não foram tirados direto da lista oficial: parte vem de fontes secundárias, parte de memória, conforme os comentários dos arquivos. Antes de publicar o jogo, confira cada espécie em <https://www.iucnredlist.org>.

Onde está o aviso no código:

| Arquivo | Situação |
| --- | --- |
| `src/data/species.ts` (comentário no topo) | Amazônia e Caatinga: status conferidos em fontes secundárias em 2026-10-08; confirmar em iucnredlist.org |
| `src/biomes/cerrado/species.ts` (comentário no topo) | Status de memória (listas de 2024/2025); confirmar |
| `src/biomes/mata-atlantica/species.ts` | Parte conferida; as demais vêm de memória e têm o comentário `// IUCN a confirmar` em cada linha |
| `src/biomes/pampa/species.ts` | As marcadas `// IUCN a confirmar` vêm de memória; confirmar tudo |
| `src/biomes/pantanal/species.ts` (comentário no topo) | Status de memória e fontes secundárias; confirmar |

Ao confirmar uma espécie, corrija o valor, remova o comentário "a confirmar" daquela linha e anote a fonte e a data no comentário do arquivo. Espécies descritas recentemente podem não ter categoria própria (`NE`).
