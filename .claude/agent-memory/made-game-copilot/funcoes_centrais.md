---
name: funcoes_centrais
description: Funções centrais do player AUTENTICADO por fase (editor, revisão, testar, player, histórico) e o que cada uma faz
metadata:
  type: project
---

AVISO (2026-08-19): desde a refatoração "nova versão da arquitetura", estas funções NÃO
vivem mais em `js/app.js` — foram movidas para `js/core/editorShell.js` (editor genérico)
e `js/games/codigo-secreto/{editorCartas,review,player}.js` (específico do modelo), com
os MESMOS nomes de método (delegados por `js/app.js` via `GAME_METHODS`, ver
[[arquivos_modulos]]). O conteúdo abaixo ainda descreve corretamente O QUE cada função
faz, só o "onde" mudou. Além disso, isto documenta o player AUTENTICADO (dentro do
`index.html`) — existe um SEGUNDO player, público/standalone, em `js/play.js` +
`play.html`, com sua própria reimplementação paralela (ver [[sessao_2026-08-19]]).

Confirmado em 2026-06-24 lendo `js/app.js` por completo (~1850 linhas após edições da sessão).

## Editor
- `newGame()` — cria `state.editingGame` com defaults (12 cards vazios, textos-modelo sobre "Mamíferos"), vai pra Tela Geral (`editingStep=1`, `editingBlock=null`).
- `editGame(id)` — clona (`JSON.parse(JSON.stringify)`) um jogo de `state.games` para `state.editingGame`.
- `syncEditorUI()` — popula todos os inputs do editor a partir de `editingGame`. Chama `if (!Array.isArray(eg.disciplineInfo.autores)) eg.disciplineInfo.autores = []` (defesa contra jogos antigos sem esse campo — adicionado 2026-06-24).
- `persistEditorFields()` — lê os inputs do DOM de volta para `state.editingGame` (chamado antes de avançar/voltar tela/bloco).
- **REESTRUTURADO 2026-09-22**: editor passou de 5 passos lineares para 3 telas — ver [[sessao_2026-09-22_editor_3_telas]] para o desenho completo (state, ids, validações).

## Revisão (Tela da Revisão, `editingStep===3`)
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
