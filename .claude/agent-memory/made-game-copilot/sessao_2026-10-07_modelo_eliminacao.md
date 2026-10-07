---
name: sessao_2026-10-07_modelo_eliminacao
description: Implementação do novo modelo de jogo "Eliminação" (apelido "Can Can", UNO educacional) — arquitetura multi-modelo, motor de partida hotseat, bot, e mudanças estruturais no core que agora suportam >1 modelo de verdade
metadata:
  type: project
---

Implementado em 2026-10-07, a pedido direto (não da sessão de chat, via prompt de
tarefa). NÃO foi commitado (instrução explícita) — mudanças ficaram no working
tree para revisão humana antes de commit/push.

## Descoberta arquitetural central desta sessão (relevante para QUALQUER 3º modelo futuro)
Antes desta sessão, "suporte a múltiplos modelos" era parcialmente ilusório:
`js/app.js` `loadPartials()` SEMPRE carregava os partials de
`getGame('Código Secreto')` em `#creator-step-4`/`#view-player`, não importa o
modelo do jogo sendo editado. Com um único modelo registrado isso nunca doía.
Corrigido com `ensureGamePartialsLoaded(modelName)` (novo, em `js/app.js`):
faz fetch (com cache em memória por modelo) e troca o innerHTML de
`#creator-step-4` e `#view-player` sob demanda. Chamado em 4 pontos:
`newGame()`/`editGame()`/`selectModel()` (editorShell.js) e
`startPlayFlow()` (novo método core em dashboard.js, ver abaixo).

IMPORTANTE para o próximo modelo: **os modais de cada jogo (ex. `#modal-card`,
`#modal-difficulty`, `#modal-solution` do Código Secreto; `#modal-elim-*` do
Eliminação) NÃO são injetados por partial** — `partials/core/modals.html` e
`partials/games/codigo-secreto/modals.html` (este nem existe no disco) são
código morto, os mounts `core-modals-mount`/`game-modals-mount` não existem em
`index.html`. Todo modal real do app é HARDCODED estaticamente em
`index.html`, com ids próprios por modelo, sempre presentes no DOM (raramente
visíveis). `ensureGamePartialsLoaded` só troca `#creator-step-4` e
`#view-player` — documentado explicitamente no comentário da função em
`js/app.js`. Um 3º modelo deve seguir o mesmo padrão: modais próprios
hardcoded em `index.html`, nunca um arquivo `modals.html` que nada injeta.

## Resolução do modelo ANTES de `state.activeGame` existir
`resolveModelName()` (js/app.js) decidia o modelo ativo olhando
`editingGame.model` → `activeGame.model` → fallback 'Código Secreto'. Isso
quebrava o clique em "Jogar" no dashboard: nesse momento nem `editingGame` nem
`activeGame` existem ainda (só são criados DENTRO do método per-model
`openDifficultySelect`/`elimOpenSetupModal`, que só é chamado DEPOIS do
dispatcher já ter escolhido o módulo errado). Fix: `resolveModelName()` ganhou
um 3º fallback, `state.selectedGameIdForPlay` (lookup em `state.games`). Para
isso funcionar, o botão "Jogar" do dashboard não chama mais
`app.openDifficultySelect(gameId)` direto — chama o novo método core
`dashboardMethods.startPlayFlow(gameId)`, que seta
`state.selectedGameIdForPlay = gameId` E aguarda
`ensureGamePartialsLoaded(game.model)` ANTES de delegar para
`app.openDifficultySelect(gameId)`. Isso é o padrão a seguir para qualquer
fluxo "entrar direto num jogo salvo sem passar pelo editor".

## Troca de modelo em `selectModel()` (seletor de modelo na Tela 1 do editor)
`editorShellMethods.selectModel(modelName, el)` (editorShell.js) virou
`async`. Ao trocar de modelo: `ensureGamePartialsLoaded(modelName)`, troca só
`editingGame.model` + `editingGame.cards` (reseta para
`getGame(modelName).getDefaultData().cards` — cada modelo tem uma forma de
`cards` totalmente diferente, não dá pra preservar). Os campos genéricos
(nome, disciplina, regra, objetivo, enunciado, explicação, design) são
preservados. Só pede confirmação (`showConfirm`) se o bloco de cartas do
modelo ANTERIOR já estava completo (`this.isCardsBlockComplete()`, dispatch
delegado) — evita popup irritante logo após criar um jogo novo (fluxo mais
comum: escolher o modelo é a primeira ação).

## Dois novos nomes de método GENÉRICOS entre modelos (GAME_METHODS)
Extraídos do que antes era lógica hardcoded de Código Secreto dentro de
`editorShell.js` (`creatorNextStep`/`renderBlocksHub`):
- `validateCreatorCards()` → `{valid: bool, message: string}` — valida o
  bloco "Criação de Cartas" ao avançar da Tela 2 pra Tela 3.
- `isCardsBlockComplete()` → bool — liga/desliga o badge de check do tile 4
  no hub 2x2.
Qualquer modelo futuro PRECISA implementar os dois (Código Secreto também
ganhou implementações extraídas, em `js/games/codigo-secreto/editorCartas.js`
— comportamento idêntico ao de antes, só reorganizado).

## Arquitetura interna de um módulo de jogo (padrão estabelecido por este modelo, reaplicável)
Métodos exportados (que viram entradas em `GAME_METHODS` em `js/app.js`) são
FINOS: só os chamados via `onclick="app.X(...)"` no HTML, ou chamados via
`this.X(...)` de DENTRO do mesmo módulo (porque `this` dentro de um método
dispatched é sempre `app`, então `this.algumNome()` SEMPRE passa pelo
dispatcher genérico de novo — um nome usado assim que não estiver em
`GAME_METHODS` simplesmente não existe em `app`). Toda a lógica interna do
motor de partida do Eliminação (`js/games/eliminacao/player.js`) vive em
FUNÇÕES DE MÓDULO comuns (não métodos do objeto exportado), recebendo `app`
como parâmetro explícito (`function renderAll(app) {...}`, chamadas como
`renderAll(this)` de dentro dos métodos finos). Isso evitou inflar
`GAME_METHODS` com ~15 nomes puramente internos (advanceTurn, drawOne,
resolvePlay, etc.) que nenhum HTML jamais chama. Padrão recomendado para
qualquer modelo futuro com lógica de motor não-trivial.

## O que é o modelo Eliminação (resumo funcional)
Generalização do UNO: professor define 2 atributos (nome + 2-9 valores cada,
texto/imagem/destaque vermelho, exatamente 2 "cartas mestre" por atributo).
Cartas-base = todas as combinações (valor attr0, valor attr1), 1 cópia cada
(sem duplicatas, confirmado pelos exemplos do pedido: 9×4=36). 6 cartas
especiais (skip/reverse/draw1/draw2/draw4choose/choose) com cópias =
`clamp(round(cartasBase/10), 2, 4)`; skip/reverse só entram com 3 jogadores.
Mão inicial = `clamp(round(cartasBase/(jogadores+2)), 3, 7)`. Partida hotseat
(todos no mesmo dispositivo), com tela de "handoff" entre turnos humanos
(`#elim-handoff-overlay`, "Passe o dispositivo para X" / "Mostrar minha
mão") para não vazar a mão do próximo jogador antes da hora — não pedido
explicitamente, acréscimo de UX justificado pelo próprio conceito de hotseat.

## Modelo de "match" (regra de combinação) — interpretação adotada (não 100% explícita no pedido)
Cada carta carrega "tags" `{attr, valueId}`: base tem 2 tags (uma por
atributo); skip/reverse/draw1/draw2 têm 1 tag fixa (sorteada na montagem do
baralho, ciclando atributo/valor pra distribuir as cópias); draw4choose/choose
nascem SEM tag (`wild:true`, sempre jogáveis) e GANHAM uma tag no instante em
que são jogadas (jogador escolhe 1 de 4 valores: as 2 cartas mestre de cada
atributo) — a partir daí se comportam como qualquer carta tagueada para fins
de combinação da PRÓXIMA jogada. Isso unifica toda a lógica de "o que pode ser
jogado por cima" em uma única função (`cardMatchesTags`, `model.js`). Efeitos
de draw1/draw2/draw4choose fazem o próximo jogador comprar E perder a vez
(convenção clássica do UNO, não detalhada no pedido — assumida). Sem stacking
de cartas de compra (não pedido). Mão vazia = vitória imediata, mesmo se a
última carta for um wild (não abre modal de escolha nesse caso).

## Bot (decisão 2 do pedido, implementado literal)
`botTakeTurn` em player.js: joga a 1ª carta BASE válida da mão; só cai pra
especial se não houver base válida; se não houver nada válido, compra 1 e
joga na hora se servir, senão passa. Cartas +4/Escolher jogadas pelo bot
escolhem o valor aleatoriamente entre as 4 opções "carta mestre"
(`pickRandomMasterTag`).

## Persistência — NENHUMA migration de banco necessária
`jogos.cards` já é jsonb genérico. Eliminação guarda
`{ attributes: [ {name, values:[{id,text,image,isMaster}]}, {...} ] }` na
MESMA coluna que o Código Secreto usa pra um array de 12 cartas —
`dbService.salvarJogo`/`listarJogos` (`js/database.js`) não precisaram de
nenhuma mudança, são agnósticos ao formato interno de `cards`. Confirma que
modelos futuros também podem reusar `cards` livremente, desde que o shape
seja JSON-serializável.

## Limitação conhecida, decidida nesta sessão (não pedida, mas necessária)
Compartilhamento público (`play.html`/`js/play.js`) e o ranking online
(`public_plays`) continuam exclusivos do Código Secreto — `js/play.js` tem
sua própria reimplementação completa do motor de Código Secreto (ver
[[arquivos_modulos]]) e não foi tocado. `dashboardMethods.shareGame`/
`manageRanking` (dashboard.js) agora checam `game.model === 'Eliminação'` e
mostram um aviso amigável em vez de gerar um link quebrado. Se o produto
pedir compartilhamento público do Eliminação no futuro, isso exige portar o
motor de partida para `js/play.js` (que roda sem autenticação, sem
`window.app`) — trabalho equivalente a uma nova implementação, não um ajuste
pequeno.

## Arquivos criados
- `js/games/eliminacao/{model,editorCartas,review,player,index}.js`
- `partials/games/eliminacao/{editor-step4,player}.html`
(Não existe `partials/games/eliminacao/modals.html` — decisão deliberada, ver
seção arquitetural acima.)

## Arquivos alterados
- `js/app.js` (GAME_METHODS ampliado, resolveModelName, ensureGamePartialsLoaded, import do novo módulo, window.onclick)
- `js/core/state.js` (campos `elim`/`elimSelectedAttr`/`elimSelectedValueIdx`/`elimTempValueImage`)
- `js/core/editorShell.js` (`newGame`/`editGame`/`selectModel` async + ensureGamePartialsLoaded; `creatorNextStep`/`renderBlocksHub` delegados; toggle do botão de vídeo)
- `js/core/dashboard.js` (`startPlayFlow` novo; guardas de `shareGame`/`manageRanking` para Eliminação)
- `js/core/library.js` (`selectImageFromLibrary` ganhou branch `'elim-value-image'`)
- `js/games/codigo-secreto/editorCartas.js` (extraídos `validateCreatorCards`/`isCardsBlockComplete`; `renderEditorGrid` agora chama `updateSecretCardCounter` internamente)
- `js/games/codigo-secreto/index.js` (bump de versão do import)
- `partials/core/editor-shell.html` (destravado tile "Eliminação", id novo `open-game-video-btn`, option novo em `#edit-game-model`)
- `index.html` (CSS `.elim-*`, 4 modais novos `#modal-elim-{value,setup,wild,result}`, bump `js/app.js?v=41`)

## Suposições extras tomadas (além das 9 decisões do pedido)
1. Humano sempre começa a partida (jogador 0 no roster de cada modo) — não especificado.
2. Draw1/draw2/draw4 fazem o próximo jogador perder a vez além de comprar (convenção UNO clássica, não detalhada no pedido).
3. Sem stacking de cartas de compra (jogar +2 sobre +2 não soma).
4. Carta inicial da mesa é sempre forçada a ser uma carta BASE (como no UNO real) — especiais sorteadas no topo são postas de volta no monte, não descartadas.
5. Cópias de skip/reverse/draw1/draw2 são distribuídas round-robin entre atributos/valores (não sorteio puro) para melhor distribuição do baralho.
6. Troca de modelo no seletor da Tela 1 reseta o bloco de cartas do jogo (com confirmação só se havia conteúdo completo) — não especificado como deveria se comportar.
7. Tela de "handoff" entre turnos humanos (passar o dispositivo) — acréscimo de UX não pedido explicitamente.

## O que falta para considerar 100% pronto
- Teste manual real num navegador (não foi possível nesta sessão — sem
  ferramenta de browser disponível; validação feita via leitura exaustiva de
  código, checagem estática de paths/ids/dispatch via scripts Node, e
  `node --check` de sintaxe em todos os arquivos JS tocados/criados).
- Nenhuma migration pendente (ao contrário da sessão do `is_draft`, aqui não há nada para o usuário rodar no Supabase).
