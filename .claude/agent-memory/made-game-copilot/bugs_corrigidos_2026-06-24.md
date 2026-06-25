---
name: bugs_corrigidos_2026-06-24
description: Bugs reais encontrados e corrigidos na sessão de 2026-06-24 (lista de 8 itens do usuário) — causa raiz de cada um
metadata:
  type: project
---

Sessão de 2026-06-24: usuário pediu para continuar um trabalho de ajustes no "Código Secreto" que outro agente de IA tinha começado fora desta sessão (sem registro de memória). Tive que reinspecionar tudo do zero. Lista de 8 itens pedidos e o que de fato estava quebrado vs já corrigido.

## Bug crítico real: `shuffleArray` corrompia o array (causa raiz do item "repetição/ausência de cartas no player")
**Where:** `js/app.js`, função `shuffleArray`.
**Bug:** `[arr[i], arr[arr[j]]] = [arr[j], arr[i]]` — usava `arr[arr[j]]` (o VALOR do array, um objeto carta, convertido para string de índice) em vez de `arr[j]` (o índice correto). Isso silenciosamente corrompia a estrutura do array a cada chamada, causando cartas duplicadas/ausentes no banco de cartas do player (`renderPlayBank`). Mais visível em níveis com menos cartas (ex. nível 4 com 3 cartas), exatamente como o usuário relatou.
**Fix:** trocado para `[arr[i], arr[j]] = [arr[j], arr[i]]` (Fisher-Yates correto).
**Por que isso não tinha sido pego antes:** o erro não lança exceção, só corrompe dados silenciosamente — sintoma visual (cartas erradas) sem stack trace.

## Bug real: "Novo Autor" não aceitava nome em jogos antigos/sem state correto
**Where:** `js/app.js`, `syncEditorUI()` (linha ~597) e `confirmAuthor()`/`removeAuthor()` (linha ~1568+).
**Bug:** quando `disciplineInfo` existe mas não tem a chave `autores` (jogos salvos antes desse campo existir, ou edge case de novo jogo malformado), `syncEditorUI` criava `disciplineInfo = {}` sem inicializar `autores: []`. Depois, `confirmAuthor()` chamava `.includes()` em `undefined` → `TypeError` silencioso no console, o clique "não fazia nada" da perspectiva do usuário.
**Fix:** `syncEditorUI` agora garante `if (!Array.isArray(eg.disciplineInfo.autores)) eg.disciplineInfo.autores = []`. `confirmAuthor`/`removeAuthor` também blindados defensivamente (segunda camada).
**Retrocompatibilidade:** não precisa de migração SQL — é só uma garantia no client de que o array sempre existe antes de usar.

## Visual: imagem do modelo "Código Secreto" parecia cortada no Passo 1
**Where:** `index.html`, bloco `#model-choices` (~linha 750).
**Causa:** a imagem `imagens/modelos/codigo_secreto.png` é 950×1228px (retrato, proporção ~0.77) renderizada num `<img class="h-24 object-contain">` sem largura mínima — `object-contain` já preservava proporção (não cortava de fato), mas a altura pequena (96px) fazia a imagem parecer "espremida"/pouco visível dentro do card.
**Fix:** envolvido em `<div class="w-full h-40 flex items-center justify-center">` com `<img class="max-w-full max-h-full w-auto h-auto object-contain">`, dando mais espaço vertical (160px) sem cortar.

## Texto: número "4" fixo no Enunciado/Explicação default
**Where:** `index.html` (textarea de Explicação no passo 3) e `js/app.js` (`loadDefaultGames` × 2 jogos demo, `newGame()`).
**Causa:** textos-modelo tinham "Escolha as 4 cartas..." / "todos os 4 espaços" hardcoded, desalinhado com o fato de o jogo agora suportar 3-6 cartas (ou aleatório) por partida.
**Fix:** removida a referência numérica fixa nesses textos-modelo. **Importante:** isso só afeta o texto SEED de jogos novos/demo — jogos já salvos no Supabase mantêm seu próprio texto (não migrados, e não deveriam ser, pois o professor pode ter escrito "4" intencionalmente para o jogo dele).

## Escape de HTML/texto de carta (item "remover código de programação indevido" na Revisão + extensão preventiva)
**Where:** `js/app.js`, 7 pontos onde `card.content` era interpolado direto em `innerHTML` sem sanitização: `renderPlayBank`, `previewCard`, `renderCurrentGuess`, `revealSecretCards`, `populateReviewStep` (o ponto que o usuário mencionou explicitamente), `renderEditorGrid`, `openSolutionModal`.
**Causa:** se o professor digitasse algo como `<b>` ou colasse texto com caracteres de markup no campo de texto da carta, isso seria interpretado como HTML real ao invés de aparecer como texto literal.
**Fix:** criada `escapeCardText(text)` (usa `div.textContent = text; return div.innerHTML`) e aplicada nos 7 pontos. Não afeta `card.contentImage` (continua via `<img src>`) nem os campos regra/objetivo/enunciado (esses são HTML intencional, com `<strong style="color:#b91c1c">` proposital do recurso "Marcar Vermelho").

## Item 7: Histórico não mostrava informações do nível ativo
**Where:** `index.html` (`#play-level-info`, novo bloco entre contador de tentativas e botões) + `js/app.js` (`updateLevelInfoPanel()`, nova função chamada em `playGame`, `replayGame`, e bloco de teste de `startGameWithDifficulty`). `addHistoryRow` também passou a mostrar "Tentativa N" por linha.
**Não era bug, era funcionalidade ausente.** Histórico antes só mostrava cartas da tentativa + pinos de feedback, sem contexto de nível/regras.

## Itens verificados como JÁ corretos (nenhuma mudança feita)
- Botão "Retirar a Cor Vermelha" já existia em regra/objetivo/enunciado (`removeRedFromSelection`).
- Carta com só imagem (sem texto) já era aceita em `saveCardModal` e na validação do passo 4→5.
- Painel de caracteres especiais (Matemática/Química: ² ³ √ π ± × ÷ ≠ ≈ ≤ ≥ → ⇌ Δ subscritos/sobrescritos/letras gregas) já existia no modal de carta via `insertSpecialChar`.
- Cartas com imagem já apareciam corretamente na Revisão (`populateReviewStep` já tratava `contentImage`).
- Modal de Dificuldade já tinha textos corretos por nível (10/8/6/5 tentativas, 0/1/2/3 trocas, todos sem repetição) E já tinha seletor de tamanho de código (3/4/5/6/aleatório) no MESMO modal, antes dos botões de nível — cobre o pedido de "etapa de escolha do número de cartas após a dificuldade" funcionalmente, mesmo sem ser uma tela separada sequencial.
- Header do player (`#play-header-title/disciplina/conteudo/serie/autores`) + botões "Objetivo" e "Como Jogar" já exibiam todos os metadados MADE pedidos no item 8.

## Inconsistência NÃO corrigida (fora do escopo pedido, só anotada)
`difficultyRules` em `app.js` tem `repeat: false` para TODOS os 4 níveis, mas o texto fixo no passo 4 do editor (`index.html`, bloco "SOBRE AS CARTAS") diz "Nos níveis 3 e 4, é possível que o código apresente cartas repetidas." Isso é inconsistente com o código real. Não foi alterado porque não estava nos 8 itens pedidos explicitamente — mas vale avisar o usuário antes de qualquer trabalho futuro nessa área, pois pode ser um 9º bug latente (texto promete comportamento que o código não entrega).
