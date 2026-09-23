---
name: sessao_2026-09-23_tour_interativo
description: Tour interativo (13 cenas, narração TTS pt-BR) do Código Secreto dentro do editor — não é vídeo real, decisão explícita do usuário diante da falta de ffmpeg/gravação de tela no ambiente
metadata:
  type: project
---

Em 2026-09-23 o usuário pediu uma "animação" explicando o jogo Código Secreto (roteiro de 13 cenas já escrito pela sessão principal). Sem ffmpeg/navegador com captura de tela disponíveis neste ambiente, a alternativa aceita pelo usuário foi um **tour interativo dentro do próprio app**: modal com slides que recriam fielmente fragmentos da UI real (mesmas classes Tailwind/CSS globais), com narração via `window.speechSynthesis` (`lang: 'pt-BR'`) e legenda sincronizada.

**Arquivos criados/editados:**
- `js/core/gameTour.js` (novo, v=1) — exporta `gameTourMethods`. Contém `TOUR_SCENES` (array de 13 `{caption, render}`) e helpers de HTML (`bankCardHtml`, `tourSlotHtml`, `historyRowHtml`, `solutionCardHtml`, `otherCorrectCardHtml`). Dados de exemplo vêm de `getDemoGames()[0]` (tema Mamíferos) em `js/games/codigo-secreto/model.js?v=3` (import não bumpou essa versão, só leu).
- `js/app.js` (v=5→v=6 em index.html) — importa `gameTourMethods` e adiciona ao spread de `window.app`.
- `js/core/state.js` — novos campos `gameTourStep: 0`, `gameTourMuted: false`.
- `partials/core/modals.html` — novo modal `#modal-game-tour` (padrão visual = `#modal-solution`: header/body/footer, `rounded-[40px]`, z-50). Não está na lista de fechamento por clique no backdrop em `app.js` (mesma convenção de `#modal-solution`/`#modal-library`, que também não fecham por clique fora).
- `partials/core/editor-shell.html` — botão "Entenda o Jogo Código Secreto" (`app.openGameTour()`) logo após `#model-choices`, dentro do wrapper do campo "Modelo".

**Decisão arquitetural importante (cuidado ao reusar UI real em contextos "demo"):** o tour NUNCA reutiliza as classes `.drop-slot`, `.code-size-btn`, `.secret-card-slot` ou `.solution-card-container` nos elementos clonados, porque essas 4 classes são alvo de `document.querySelectorAll(...)` **global** (sem escopo) em `js/games/codigo-secreto/player.js` (`setupDropZones`, `renderCurrentGuess`, `setCodeSize`, `applyCardDesigns`, `closeSolutionModal`). Um clone visível nesses seletores receberia listeners/writes de uma partida real em paralelo. Em vez disso, o tour replica o CSS dessas classes via `style` inline (valores copiados literalmente de `index.html`) ou via divs sem a classe-marcador. Já `.bank-card`, `.bank-card-inner`, `.history-row` (escopado ao container, não global), `.feedback-dot/.feedback-grid` são seguras e foram reaproveitadas diretamente — não são alvo de query global fora do seu contexto real.

Todos os elementos interativos clonados (botões de nível, tamanho do código, "Jogar" do card de dashboard) tiveram o `onclick` removido — são puramente visuais dentro do tour, não disparam métodos reais do app com ids de jogo/estado inexistentes.

Teste manual necessário (não pôde ser verificado neste ambiente — sem navegador): abrir o editor, Passo 1, clicar em "Entenda o Jogo Código Secreto"; conferir as 13 cenas, narração automática ao trocar de slide (com `speechSynthesis.cancel()` antes de cada nova fala), botões Play/Pause e Mudo, navegação Voltar/Próximo/dots, e degradação graciosa em navegador sem suporte a `speechSynthesis` (controles de voz somem, legenda continua).
