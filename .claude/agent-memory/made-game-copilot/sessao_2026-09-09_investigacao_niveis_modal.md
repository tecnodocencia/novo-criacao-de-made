---
name: sessao-2026-09-09-investigacao-niveis-modal
description: Investigação (sem código) sobre modal de vitória, estado de nível/tentativa, mecânica de troca por nível, e config de repetição — confirma que troca já é consistente nos 4 níveis
metadata:
  type: project
---

Pedido do dono do projeto: relatório de investigação (zero edição) para preparar mudanças
futuras no modal de vitória / mecânica de níveis do "Código Secreto". Achados confirmados
lendo o código em 2026-09-09 (complementa [[funcoes_centrais]], [[arquivos_modulos]] e
[[sessao_2026-08-24]]).

## Achado novo 1 — `#modal-solution` (vitória) NÃO vem de partial, é estático em index.html
`js/games/codigo-secreto/index.js` declara `partials.modals: 'partials/games/codigo-secreto/modals.html'`,
mas esse arquivo **não existe** e `index.html` **não tem** `#game-modals-mount`. Logo
`injectPartial('game-modals-mount', ...)` em `js/app.js` (linha ~86) é um no-op silencioso
(`if (!el) return`). `#modal-solution` (index.html:1593-1664) e `#modal-difficulty`
(index.html:1537-1590) são HTML estático direto em `index.html` e são o que roda de fato.
Qualquer edição ao modal de vitória deve ser feita direto em `index.html`, não criando um
`modals.html` esperando que seja carregado — a menos que se decida terminar essa migração
(criar o arquivo E o mount), o que não foi pedido/feito.

Ordem do modal de vitória (confirmada = à descrição do usuário): header (ícone+título+
subtítulo, `openSolutionModal()` em `js/games/codigo-secreto/player.js:571-624`) → cartas
do código (`#solution-cards-container`, 6 slots fixos) → Enunciado (`#solution-explanation`,
de `activeGame.enunciado`) → botões "Sair para o Início"/"Jogar Novamente".

## Achado novo 2 — HTML morto em index.html dentro de `<section id="view-player">`
`index.html:1065-1216` tem uma cópia estática antiga do player, incluindo um bloco
`#level-info-repeticao` (linha ~1187) que foi deliberadamente REMOVIDO em
[[sessao_2026-08-24]] do partial real (`partials/games/codigo-secreto/player.html`,
que hoje só tem 3 células: Nível/Cartas/Troca). Essa seção É sobrescrita em runtime por
`injectPartial('view-player', activeGame.partials.player)` (mount existe, arquivo existe,
diferente do caso dos modais acima) — então é inofensiva em produção, mas é HTML morto e
enganoso no arquivo fonte. Se reintroduzir UI de repetição no futuro, não reaproveitar
esse id como se estivesse ativo — recriar do zero (mesma orientação já dada em
[[sessao_2026-08-24]]).

## Achado novo 3 — suspeita do usuário sobre nível 4 fazer "swap posicional" é INFUNDADA hoje
Confirmado lendo `applyReplaySwap()` (`model.js:18-54`) e seus dois call sites
(`player.js` `replayGame():385-418`, `play.js` `replayGame():196-207`): os 4 níveis usam
exatamente o mesmo mecanismo — substituição literal por ÍNDICE/posição no array
`secretCode` (mesma posição, carta de conteúdo diferente), nunca reordenação das cartas
existentes entre si. A única variável por nível é `rules.swap` (0/1/2/3, de
`difficultyRules` em `model.js:2-7`). A divergência que o usuário pode estar lembrando
era entre os dois PLAYERS (autenticado vs. público), não entre níveis — já corrigida em
[[sessao_2026-08-24]] (Item 3). Reembaralhamento existe, mas é só do BANCO de cartas
visual (`renderPlayBank()`, sempre, todo nível, não é o código secreto).

## Achado novo 4 — texto "sem repetição" duplicado em 3 lugares com fiação divergente
`difficultyRules[level].repeat` é sempre `false` (única fonte de verdade). O texto
"Sem repetição de cartas e troca de N carta(s)" aparece hardcoded e duplicado em:
`index.html:1560-1580` (modal-difficulty), `player.js` `levelDescriptions` (linhas
326-331 E 374-379, literalmente duplicado 2x no mesmo arquivo). O player público
(`play.html:320-335`) tem texto DIFERENTE, sem menção a "repetição" (só tentativas +
troca) — `play.js` não gera esse texto dinamicamente. Nenhum desses textos lê
`rules.repeat` de fato — são strings fixas que só por coincidência refletem o valor atual.

**Why:** o usuário está preparando uma leva de mudanças no modal de vitória e na exibição
de nível/tentativas; queria confirmar hipóteses antes de pedir edição de código.
**How to apply:** ao implementar essas mudanças, editar `index.html` diretamente para o
modal (não um partial inexistente); usar `attemptsUsed`/`maxAttempts` já disponíveis em
`openSolutionModal()` de `player.js` se for exibir "venceu na tentativa X de Y" (dado já
existe, só não é exibido no modal autenticado — o público já exibe algo parecido); não
"consertar" a mecânica de troca achando que há bug de nível 4 — ela já é uniforme.
