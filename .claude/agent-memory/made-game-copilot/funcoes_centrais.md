---
name: funcoes_centrais
description: Funções centrais de js/app.js por fase (editor, revisão, testar, player, histórico) e o que cada uma faz
metadata:
  type: project
---

Confirmado em 2026-06-24 lendo `js/app.js` por completo (~1850 linhas após edições da sessão).

## Editor
- `newGame()` — cria `state.editingGame` com defaults (12 cards vazios, textos-modelo sobre "Mamíferos"), vai pro passo 1.
- `editGame(id)` — clona (`JSON.parse(JSON.stringify)`) um jogo de `state.games` para `state.editingGame`.
- `syncEditorUI()` — popula todos os inputs do editor a partir de `editingGame`. Chama `if (!Array.isArray(eg.disciplineInfo.autores)) eg.disciplineInfo.autores = []` (defesa contra jogos antigos sem esse campo — adicionado 2026-06-24).
- `persistEditorFields()` — lê os inputs do DOM de volta para `state.editingGame` (chamado antes de avançar/voltar passo).
- `showStep(step)` / `creatorNextStep()` / `creatorPrevStep()` — navegação entre os 5 passos, com validação em `current===1` (nome+conteúdo) e `current===4` (12 cartas preenchidas, 6 marcadas corretas).
- `openCardModal(idx)` / `saveCardModal()` / `closeCardModal()` — CRUD de uma carta individual. `saveCardModal` já aceita carta só-com-imagem (sem texto) — não exigir texto obrigatório, isso é regra de produto confirmada no código.
- `toggleCardCorrect(idx)` — alterna `isCorrect`, bloqueia se já houver 6 marcadas.
- `wrapSelectionInRed(elementId)` / `removeRedFromSelection(elementId)` — aplicam/removem `<strong style="color:#b91c1c">` na seleção de texto dentro de um `contenteditable`. Usado em regra/objetivo/enunciado.
- `insertSpecialChar(char)` — insere caractere especial (²³√π±× etc.) no textarea `#modal-card-content` na posição do cursor. Painel de símbolos vive só no modal de carta (não no enunciado/regra/objetivo).

## Revisão (passo 5)
- `populateReviewStep()` — preenche `#review-*` a partir de `editingGame`. Trata `card.contentImage` corretamente (mostra `<img>` + legenda opcional). Usa `this.escapeCardText()` para texto de carta desde 2026-06-24 (evita HTML/código indevido aparecer cru).

## Testar / Iniciar partida
- `testGameFromCreator()` — seta `isTestingFromCreator=true`, abre `#modal-difficulty`.
- `openDifficultySelect(gameId)` — fluxo real (fora do editor), seta `selectedGameIdForPlay`.
- `setCodeSize(size)` — `size` é `3|4|5|6|'random'`, guarda em `state.codeSizeOption`, atualiza estilo dos botões `.code-size-btn`.
- `startGameWithDifficulty(level)` — resolve `currentCodeSize` (se `'random'`, sorteia 3-6), decide se vai para teste (`activeGame` = clone de `editingGame`) ou jogo real (`playGame`/`replayGame`).
- `playGame(id)` / `replayGame()` — inicializam/recriam `secretCode`, `currentGuess`, renderizam slots e banco de cartas, resetam histórico visual. `replayGame` aplica troca parcial de cartas conforme `difficultyRules[level].swap` (não recria do zero, troca N cartas do código atual).
- `createSecretCode(game)` — sorteia `currentCodeSize` cartas dentre as `isCorrect:true`, sem repetição se `rules.repeat===false` (hoje SEMPRE false nos 4 níveis — repetição de cartas nunca é permitida, apesar do texto do passo 4 do editor mencionar "Nos níveis 3 e 4, é possível que o código apresente cartas repetidas", que está desatualizado/inconsistente com `difficultyRules`. Não alterado nesta sessão por não ter sido pedido explicitamente — ver bugs_corrigidos para nota).
- `renderPlayBank()` — embaralha (`shuffleArray`) e renderiza o banco de cartas clicáveis/arrastáveis da esquerda. Chamada em toda (re)inicialização de partida.
- `shuffleArray(arr)` — Fisher-Yates. **Tinha bug crítico até 2026-06-24** (ver bugs_corrigidos).
- `validateGuess()` — calcula `black`/`white` (peg-style Mastermind), empilha em `state.attempts`, decide vitória/derrota.
- `updateAttemptCounter()` / `updateGameHeaderInfo()` / `updateLevelInfoPanel()` (novo 2026-06-24) — atualizam HUD do player.

## Histórico
- `addHistoryRow(guess, black, white)` — monta uma linha do histórico com mini-cartas + pinos de feedback (verde/amarelo/branco) e prepend no `#play-history-list`. Desde 2026-06-24 também mostra "Tentativa N" por linha. Não remove dados antigos, só decora visualmente.
- `askRestart()` — modal de confirmação antes de `replayGame()`, com mensagem dinâmica conforme `swap` do nível atual.

## Persistência
- `saveGame()` — chama `dbService.salvarJogo(editingGame)`, atualiza `state.games`, volta pro dashboard.
- `dbService.salvarJogo` decide INSERT vs UPDATE checando se `jogo.id` começa com `"game-"` (id temporário de `newGame()`).
