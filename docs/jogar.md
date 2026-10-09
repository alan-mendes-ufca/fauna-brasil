# Guia do jogador

## Começo

Na primeira vez você escolhe um companheiro de expedição: ariranha, arara-vermelha ou perereca-das-folhas. Ele luta ao seu lado quando um animal grande bloqueia o caminho. O progresso é salvo no navegador (veja [arquitetura](arquitetura.md#estado-salvo)).

## Explorar

- Clique no chão para andar. Clique num animal para ir até ele e iniciar o encontro.
- O jogo tem seis regiões, uma por bioma: Amazônia, Caatinga, Cerrado, Pantanal, Mata Atlântica e Pampa. O nome da região aparece no painel do caderno.
- Cada animal vive em certos habitats (água, campo, mata seca etc.). Procure-o onde ele costuma aparecer; o caderno mostra o habitat de cada espécie.
- `M` abre o minimapa.

### Saídas entre regiões

Cada saída fica na borda do mapa e mostra o nome do destino ao passar o mouse. Basta andar até ela.

| Região | Saídas para |
| --- | --- |
| Amazônia | Caatinga, Cerrado |
| Caatinga | Amazônia, Cerrado, Mata Atlântica |
| Cerrado | Amazônia, Caatinga, Pantanal, Mata Atlântica |
| Pantanal | Cerrado |
| Mata Atlântica | Caatinga, Cerrado, Pampa |
| Pampa | Mata Atlântica |

## Encontros

- **Animal pequeno ou médio:** vai direto para a captura.
- **Animal grande:** primeiro há uma batalha por turnos. Se você zerar o vigor dele, ele fica atordoado e a captura começa.

## Captura

1. Arraste a rede para cima e solte (um gesto rápido para cima lança a rede; soltá-la parada, depois de subi-la, também vale como arremesso).
2. Um anel colorido encolhe sobre o animal. A cor indica a raridade.
3. Quanto menor o anel no momento em que a rede acerta, melhor a qualidade ("Boa!", "Ótimo!", "Excelente!"). Se a rede cai fora do anel, a qualidade é zero.
4. Com boa qualidade a chance de captura aumenta. A rede balança três vezes antes de fechar.
5. Animal atordoado na batalha tem qualidade mínima garantida.
6. `Esc` abandona a captura.

Animais mais raros são mais difíceis. A rede reforçada (item da loja) aumenta a chance e evita que o bicho fuja se escapar.

## Batalha

- Escolha um golpe com o mouse ou com as teclas `1` a `4`.
- Os tipos (Predador, Aquático, Aéreo, Réptil, Anfíbio, Inseto, Elétrico, Arbóreo e Comum) têm vantagens e desvantagens entre si. Cada golpe mostra o tipo e o poder.
- **Trocar** muda o animal em campo. **Fugir** encerra o encontro.
- Se todo o time ficar exausto, você volta ao acampamento e todos recuperam o vigor.

## Time e vigor

- O time tem até 6 animais; os capturados entram na coleção.
- O vigor volta com o tempo: 5% do máximo a cada 10 segundos.
- Ao fim de um encontro, quem ficou exausto volta com 25%.
- Vitórias e capturas dão experiência; animais sobem de nível.
- A cesta de frutas e a erva medicinal recuperam vigor (veja abaixo).

## Moedas, mochila e lojas

Cada captura rende moedas (mais para espécies raras; animais grandes rendem 50% a mais). Você começa com 50 moedas.

Cada bioma tem uma vila com moradores e uma loja. Clique no morador da loja para conversar e abrir a vitrine. `I` abre a mochila.

| Item | Preço | Efeito |
| --- | --- | --- |
| Cesta de frutas | 30 | Devolve metade do vigor a todo o time |
| Erva medicinal | 20 | Reanima quem está exausto, com metade do vigor |
| Rede reforçada | 25 | Usada sozinha a cada arremesso que acerta: mais chance de captura e o bicho não foge se escapar |
| Isca de frutos | 15 | Por 3 minutos, espécies raras aparecem mais |

As lojas vendem só itens. Animais nunca são comprados nem vendidos: o tráfico de fauna silvestre é um dos maiores problemas de conservação no Brasil, e os moradores comentam isso nas conversas.

## Caderno de espécies

`C` ou `Tab` abre o caderno, com uma ficha por espécie organizada por bioma. Espécies vistas e capturadas são marcadas. Cada ficha traz nome científico, raridade e status IUCN. Use as setas para navegar e `Esc` para fechar.

## Som

A trilha muda por região, captura e batalha. `N` liga e desliga o som (a escolha fica salva).
