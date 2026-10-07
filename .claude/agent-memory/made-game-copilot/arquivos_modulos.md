---
name: arquivos_modulos
description: Mapa de onde cada módulo do MADE está implementado no repositório — ATUALIZADO 2026-08-19 após a refatoração modular ("nova versão da arquitetura")
metadata:
  type: project
---

ATENÇÃO: entre a sessão de 2026-07-01 e 2026-08-19 o projeto passou por uma refatoração
grande (commit "nova versão da arquitetura", antes do commit "adição do compartilhamento
do jogo"). `js/app.js` deixou de ser um arquivo monolítico de ~1850 linhas e virou um
bootstrap fino de ~100 linhas. Qualquer memória antiga que diga "tudo está em js/app.js"
está desatualizada — ver estrutura real abaixo, confirmada lendo os arquivos em 2026-08-19.

## Estrutura geral (ainda sem build step)
Tailwind via CDN, Font Awesome via CDN, Supabase JS via ESM CDN. Sem bundler/npm no app principal.
HTML é montado em runtime: `index.html` (~1750 linhas) tem containers vazios
(`#view-login`, `#view-dashboard`, `#creator-step-4`, `#view-player`, `#core-modals-mount`,
`#game-modals-mount`, etc.) que são preenchidos via `fetch()` de arquivos em `partials/`
(`injectPartial()` em `js/app.js`, chamado em duas fases dentro de `loadPartials()`).

## js/app.js (bootstrap, ~100 linhas)
- Importa e espalha em `window.app` os métodos de `js/core/*.js` (auth, dashboard,
  library, editorShell, modals, utils) e `js/database.js` (`dbService`).
- NÃO implementa mais a lógica do jogo "Código Secreto" diretamente. Em vez disso, mantém
  uma lista `GAME_METHODS` (nomes de método idênticos aos da sessão 2026-06-24/07-01:
  `renderPlayBank`, `validateGuess`, `createSecretCode`, `openSolutionModal`, etc.) e cria
  wrappers em `app[name]` que delegam para `getGame(resolveModelName())` — o módulo do
  jogo ativo registrado via `js/games/registry.js`. `resolveModelName()` lê
  `state.editingGame.model` ou `state.activeGame.model`, com fallback para "Código Secreto".
  Isso é o mecanismo pensado para suportar múltiplos modelos de jogo no futuro
  (consistente com a decisão já registrada em [[convencoes_decisoes]]).
- `loadPartials()` roda em duas fases: (1) shell genérico do MADE — login, dashboard,
  settings, library, editor-shell, modais core; (2) conteúdo específico do modelo de jogo
  ativo, lido de `activeGame.partials.{editorStep4,player,modals}`.

## js/core/*.js (lógica genérica do MADE, independente do modelo de jogo)
- `state.js` (20 linhas) — objeto `state` compartilhado (`editingGame`, `activeGame`, `games`, etc.).
- `utils.js` (88 linhas) — helpers genéricos (inclui `switchSymTab` da sessão 2026-07-01).
- `auth.js` (106 linhas) — login/registro/logout.
- `dashboard.js` (151 linhas) — grid de jogos, inclui `shareGame`/`copyShareUrl`/`closeShareModal`
  (feature de compartilhamento da sessão 2026-07-01).
- `library.js` (207 linhas) — biblioteca de imagens (gerenciador + modal de seleção no editor).
- `editorShell.js` — o editor (3 telas desde 2026-09-22, ver [[sessao_2026-09-22_editor_3_telas]]:
  Tela Geral → Tela dos Blocos [hub 2x2] → Tela da Revisão), navegação, campos genéricos
  (nome, disciplina, autores, regra/objetivo/enunciado, design de frente/verso). O bloco
  "Criação de Cartas" é meramente um container (`#creator-step-4`, id preservado) preenchido
  pelo módulo do jogo.
- `modals.js` (31 linhas) — modais genéricos (notificação, confirmação, etc.).

## js/games/registry.js (14 linhas)
`registerGame(name, moduleObj)` / `getGame(name)` — registro simples em um `Map`/objeto.
ATUALIZADO 2026-10-07: desde a implementação do modelo "Eliminação" (ver
[[sessao_2026-10-07_modelo_eliminacao]]), DOIS modelos registram de verdade —
"Código Secreto" e "Eliminação". Essa sessão descobriu que `loadPartials()`
(abaixo) era hardcoded pra carregar só os partials do Código Secreto em
`#creator-step-4`/`#view-player`, SEMPRE, independente do modelo do jogo —
inofensivo enquanto só havia um modelo, quebraria qualquer segundo modelo sem
o fix. Corrigido com `ensureGamePartialsLoaded(modelName)` (novo, em
`js/app.js`), chamado dinamicamente por `newGame`/`editGame`/`selectModel`
(editorShell.js) e por `startPlayFlow` (novo, dashboard.js, usado pelo botão
"Jogar"). IMPORTANTE: os modais de cada jogo (`#modal-card`/`#modal-difficulty`/
`#modal-solution` do Código Secreto; `#modal-elim-*` do Eliminação) NÃO são
injetados por partial — são hardcoded estaticamente em `index.html`, sempre
presentes no DOM. `ensureGamePartialsLoaded` só troca `#creator-step-4` e
`#view-player`. Um 3º modelo deve seguir o mesmo padrão (modais próprios
hardcoded em `index.html`), não tentar reaproveitar `partials/.../modals.html`
(código morto, nunca injetado, nem existe no disco para o Código Secreto).

## js/games/codigo-secreto/*.js (lógica específica do modelo "Código Secreto")
- `model.js` (87 linhas) — `difficultyRules` (1-4, ver [[formato_dados_jogo]]),
  `getDefaultData()` (defaults do editor), `getDemoGames()` (2 jogos demo).
- `editorCartas.js` (145 linhas) — grid de 12 cartas do passo 4, modal de carta.
- `review.js` (42 linhas) — `populateReviewStep()` do passo 5.
- `player.js` (670 linhas) — TODO o motor de jogo do player AUTENTICADO (dentro do
  `index.html`/`app.js`, usado tanto no "Testar Jogo" do editor quanto no jogo real via
  dashboard): `renderPlayBank`, `createSecretCode`, `validateGuess`, `openSolutionModal`,
  `replayGame`, `updateGameHeaderInfo`, etc. Ver [[funcoes_centrais]] para detalhes — os
  nomes de função da memória antiga continuam válidos, só o arquivo mudou.
- `index.js` (24 linhas) — junta tudo acima e chama `registerGame('Código Secreto', ...)`.

## js/games/eliminacao/*.js (lógica específica do modelo "Eliminação" / "Can Can", desde 2026-10-07)
- `model.js` — construção de baralho (`buildDeck`), regra de combinação
  (`cardMatchesTags`), pontuação (`calculateElimScore`), `getDefaultData()`.
- `editorCartas.js` — bloco "Criação de Cartas" (2 atributos, 2-9 valores
  cada, 2 "cartas mestre" por atributo). Exporta `validateCreatorCards`/
  `isCardsBlockComplete`, agora um contrato GENÉRICO entre modelos (Código
  Secreto também os implementa, extraídos de `editorShell.js` nesta sessão).
- `review.js` — `populateReviewStep()` (mostra os 2 atributos e seus valores).
- `player.js` — motor de partida hotseat completo (turnos, bot, baralho,
  cartas especiais) + modais de jogo (`#modal-elim-setup/wild/result`,
  estáticos em `index.html`). Arquitetura interna: métodos exportados são
  finos, lógica real em funções de módulo que recebem `app` explicitamente
  (não via `this`) — ver [[sessao_2026-10-07_modelo_eliminacao]] para o porquê.
- `index.js` — junta tudo e chama `registerGame('Eliminação', ...)`. NÃO
  declara partial de `modals` (ver nota acima sobre modais estáticos).
- Sem compartilhamento público: `play.html`/`js/play.js` continuam exclusivos
  do Código Secreto.

## Player público standalone (compartilhamento) — NÃO faz parte do app.js/index.html
- `play.html` (raiz, ~530 linhas) + `js/play.js` (raiz, ~790 linhas, ES module).
- Completamente independente: importa só `./supabase.js` e
  `./games/codigo-secreto/model.js` (para `difficultyRules`). NÃO usa `app.js`,
  `editorShellMethods`, `playerMethods` de `js/games/codigo-secreto/player.js`, nem
  `window.app`. Tem sua PRÓPRIA reimplementação paralela de todo o motor de jogo
  (render do banco de cartas, drop slots, validação, modal de solução, ranking) sob o
  namespace `window.playApp`.
- CONSEQUÊNCIA IMPORTANTE: bugs corrigidos em `js/games/codigo-secreto/player.js` (o
  player autenticado) NÃO se propagam automaticamente para `js/play.js` (o player
  público) e vice-versa — são duas implementações de mesmo domínio que divergiram.
  Ver [[sessao_2026-08-19]] para uma lista de divergências reais encontradas (ex.:
  `frontDesign`/`card.frontImage` não era aplicado em `play.js`, ao contrário de
  `player.js` que já fazia isso desde a sessão 2026-07-01).
- Acessado via `play.html?code=<share_code>`, sem autenticação. `share_code` é gerado
  pelo dashboard (`dashboardMethods.shareGame`) e salvo na tabela `jogos`.

## Fluxo de telas (reestruturado 2026-09-22, ver [[sessao_2026-09-22_editor_3_telas]])
`newGame()`/`editGame(id)` → editor (3 telas: Geral → Blocos [hub 2x2] → Revisão,
`editorShellMethods` + `editorCartasMethods`) → `testGameFromCreator()` →
`#modal-difficulty` → player em modo teste (`playerMethods`, dentro do
`index.html`) → `backFromPlayer()` volta à Tela da Revisão (`showPhase(3)`). Ou:
dashboard → `openDifficultySelect(gameId)` → player real → `backFromPlayer()` volta ao
dashboard. Separadamente: link público `play.html?code=...` roda o fluxo standalone
em `js/play.js`, sem nunca tocar `index.html`.
