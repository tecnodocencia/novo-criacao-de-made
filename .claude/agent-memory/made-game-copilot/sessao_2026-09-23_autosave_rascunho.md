---
name: sessao_2026-09-23_autosave_rascunho
description: Auto-save do editor (debounced) + badge "RASCUNHO" no dashboard — mecanismo, armadilhas de loop infinito e decisões de design
metadata:
  type: project
---

Implementado em 2026-09-23. Requer migration manual (`supabase-migrations-draft-status.sql`)
rodada pelo usuário no SQL Editor do Supabase antes de funcionar — sem ela, todo
auto-save falha com "column is_draft does not exist".

## Coluna nova
`jogos.is_draft` (boolean, not null, default true). SNAKE_CASE puro, sem case-folding
issue (ao contrário de frontdesign/backdesign/disciplineinfo) — não precisou de remap
em `remapJogo()` (`js/database.js`), o app lê/escreve `game.is_draft` diretamente,
sem equivalente camelCase.

## Onde a decisão "isto é rascunho ou não" é tomada
- `js/games/codigo-secreto/model.js` `getDefaultData()`: todo jogo novo nasce com
  `is_draft: true`.
- `js/core/editorShell.js` `saveGame()` (clique explícito em "Salvar Jogo"): É O ÚNICO
  lugar do app que seta `is_draft = false`, logo antes de `dbService.salvarJogo(...)`.
- Auto-save (`autoSaveNow()`) NUNCA decide isso — só persiste `editingGame.is_draft`
  como já estava em memória (true se ainda rascunho, false se era um jogo já publicado
  que o professor está só ajustando).
- `js/database.js` `salvarJogo()`: payload sempre envia `is_draft: jogo.is_draft !== false`
  (default true só protege objetos em memória antigos sem o campo).

## Armadilha central do auto-save: loop infinito
`persistEditorFields()` (chamado por `showBlock`/`creatorNextStep`/`creatorPrevStep`,
navegação) precisa disparar `scheduleAutoSave()`. Mas `autoSaveNow()` também precisa
sincronizar DOM→state antes de salvar. Se `autoSaveNow()` chamasse `persistEditorFields()`
diretamente, cada auto-save reagendaria A SI MESMO para sempre (save a cada ~1.8s
infinitamente, mesmo com o editor parado). Solução: extraída `_syncEditorFieldsFromDom()`
(sem efeito colateral de agendamento) — `persistEditorFields()` = sync + schedule;
`autoSaveNow()` chama só o sync. Ver comentário extenso no próprio arquivo.

## Armadilha secundária: edição perdida durante save em andamento
`scheduleAutoSave()` não reagenda um timer novo enquanto `state.autoSaving===true`
(evita chamada concorrente ao Supabase) — mas só ignorar a chamada perderia uma
edição feita bem na janela do round-trip de rede. Fix: nesse caso seta
`this._autoSavePending = true`; o `finally` de `autoSaveNow()` checa essa flag e
rearma `scheduleAutoSave()` depois que o save atual termina. Padrão reaplicável se
outro fluxo de auto-save for adicionado no futuro (ex.: outro modelo de jogo).

## Troca de id temporário → id real (evita duplicar linha)
`newGame()` cria `editingGame.id = "game-"+Date.now()`. `dbService.salvarJogo` decide
INSERT vs UPDATE checando `String(jogo.id).startsWith('game-')`. Por isso o PRIMEIRO
`autoSaveNow()` bem-sucedido de um jogo novo PRECISA sobrescrever
`this.state.editingGame.id = jogoSalvo.id` (uuid real) — sem isso, cada auto-save
subsequente faria INSERT de novo (linha duplicada a cada ~1.8s de digitação).
`saveGame()` já fazia isso implicitamente (sempre finalizava o editingGame), mas
auto-save PRECISA fazer isso explicitamente porque o editor continua aberto depois.

## Indicador visual (não-intrusivo)
`#autosave-indicator` (novo span no cabeçalho do editor, `partials/core/editor-shell.html`,
ao lado de "Passo X de 3") — texto "Salvando..."/"Salvo"/"Erro ao salvar automaticamente",
opacity fade via `updateAutoSaveIndicator(status)` em editorShell.js. Não é modal/toast,
nunca mostra "Jogo salvo com sucesso!" (essa notificação continua exclusiva de
`saveGame()`).

## Campos que disparam scheduleAutoSave() e por quê cada mecanismo foi escolhido
- Inputs simples (nome, conteúdo, disciplina/série "Outro"): `oninput`/`onchange` direto
  no HTML (`partials/core/editor-shell.html`).
- Os 3 contenteditables (regra/objetivo/enunciado) + textarea explicação: `oninput`
  direto no HTML cobre digitação real, MAS os botões de toolbar (negrito/itálico/
  sublinhado/vermelho, `js/core/utils.js`) manipulam a seleção via Range API
  (`extractContents`/`insertNode`), que NÃO dispara evento `input` de forma confiável
  em todos os navegadores — por isso `toggleInlineFormat`/`wrapSelectionInRed`/
  `removeRedFromSelection` chamam `this.scheduleAutoSave()` explicitamente no fim.
- Design de carta (toggleFrontDesign/toggleBackDesign, upload externo de frente/verso,
  handleCardImageUpload/removeCardImage do modal de carta), autores
  (confirmAuthor/removeAuthor): chamada direta dentro do método JS em
  `editorShell.js`, não no HTML (não são inputs de texto).
- `saveCardModal()` (`js/games/codigo-secreto/editorCartas.js`, popup #modal-card):
  chamada no fim, depois de `updateSecretCardCounter()`. O texto DENTRO do modal
  (`#modal-card-content`, digitação ou painel de símbolos especiais) não dispara
  auto-save sozinho — só quando o professor clica "Salvar" no modal, que é quando o
  conteúdo é de fato commitado em `editingGame.cards[idx]`.
- `handleCardImageUpload`/`removeCardImage` (frontImage/backImage por carta, dentro do
  modal) são exceção: mutam `editingGame` IMEDIATAMENTE (não esperam o botão Salvar do
  modal) — por isso ganharam scheduleAutoSave() próprio, mesmo não estando na lista
  explícita original de campos do pedido.

## Badge "RASCUNHO" no dashboard
`js/core/dashboard.js` `renderDashboard()`: pill âmbar (`bg-amber-100 text-amber-700`,
ícone `fa-pen`) no canto superior direito do card, ao lado do chip de ícone existente,
só quando `game.is_draft` é truthy. Reaproveita a semântica âmbar já estabelecida no
app para "pendência/destaque secundário" (ver `sessao_2026-09-22_paleta_colorida`).

## Cascata de cache-busting (?v=N) disparada por esta sessão
Editar `model.js` (compartilhado por `index.js`, `player.js` E `js/play.js`) obrigou a
bumpar a query string em TODOS os arquivos que o importam — e como bumpar a query
dentro de um arquivo É uma edição de conteúdo desse arquivo, o efeito cascateou para
cima na árvore de imports até `index.html`/`play.html`. Isso incluiu um bump
mecânico de uma linha em `js/play.js` (e o `<script>` de `play.html`) mesmo esse
módulo estando fora do escopo funcional do pedido — só a versão do import mudou,
nenhuma lógica do player público foi tocada. Ver estado final consistente confirmado
via `grep -rn "\.js?v=" index.html play.html js/`.
