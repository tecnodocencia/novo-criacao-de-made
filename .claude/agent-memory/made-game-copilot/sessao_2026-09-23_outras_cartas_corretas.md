---
name: sessao-2026-09-23-outras-cartas-corretas
description: Exibição das "outras cartas corretas fora da senha" no resultado + aviso nas regras, implementado em duplicata em player.js e play.js
metadata:
  type: project
---

Pedido do professor: no fim de jogo, além de revelar o Código Secreto, mostrar
também quais das 6 cartas `isCorrect:true` NÃO entraram na senha daquela
partida (para não parecer que só as reveladas são "corretas"), e deixar isso
explícito também durante a partida (não só no resultado).

**Onde foi implementado (ambos os players, propositalmente duplicado — ver
[[arquivos_modulos]] sobre player.js vs play.js não compartilharem código):**

- `js/games/codigo-secreto/player.js` — `openSolutionModal()` agora chama novo
  método `renderOtherCorrectCards(secret)` no final; popula
  `#solution-other-correct-cards` em `index.html` (seção
  `#solution-other-correct-section`, ficava oculta com `hidden` se não houver
  nenhuma carta sobrando). Aviso adicionado em `showGameRules()` (bloco azul
  logo após a legenda dos pinos).
- `js/play.js` — `openSolutionModal()` chama nova função solta
  `renderOtherCorrectCards(frontDesign)` (não é método de objeto, é função top
  level como o resto do arquivo); popula `#play-solution-other-cards` em
  `play.html` (`#play-solution-other-section`, `display:none` por padrão).
  Aviso adicionado dentro de `playApp.showGameRules()`, concatenado ao HTML de
  `gs.game.regra`.

**Decisão de design que não é óbvia:** o dedupe entre "cartas do código" e
"cartas corretas restantes" é feito por `card.content` (não por `id` nem
`instanceId`). Isso é a mesma convenção de identidade já usada em
`applyReplaySwap()` em `model.js` (comentário lá: cartas do secretCode ganham
`instanceId` novo a cada sorteio/troca, então `id`/`instanceId` não servem
para dedupe — só `content` identifica "qual carta é essa" de forma estável).
Mantive a mesma regra nos dois arquivos para não divergir do padrão já
estabelecido.

**Visual:** cartas "fora da senha" usam borda azul-céu (`border-sky-300` /
`#7dd3fc`) com badge "Fora da senha" — visualmente distinto do verde de
sucesso (não usado aqui) e do vermelho/branco de erro, para não confundir com
as cartas reveladas do código secreto nem com distratoras.

**Versões bumped:** `js/games/codigo-secreto/player.js` de `?v=5` para `?v=6`
(único ponto de import: `js/games/codigo-secreto/index.js:6`). `js/play.js` de
`?v=5` para `?v=6` (único ponto de import: `play.html` `<script src="js/play.js?v=6">`).
`model.js` não foi tocado nesta sessão (permaneceu `?v=3` em todos os 4 pontos
de import), pois a lógica reutiliza o que já existia lá (apenas leitura de
`card.content`/`card.isCorrect`).
