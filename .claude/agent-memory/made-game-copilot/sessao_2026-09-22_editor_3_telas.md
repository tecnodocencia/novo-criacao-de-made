---
name: sessao_2026-09-22_editor_3_telas
description: Editor do Código Secreto reestruturado de 5 passos lineares para 3 telas (Geral / Blocos 2x2 / Revisão) — state, ids e validações novas
metadata:
  type: project
---

Confirmado em 2026-09-22 implementando a reestruturação pedida pelo product owner.

## Motivação
Reduzir o editor de 5 passos lineares para 3 telas de topo, com a etapa do meio
virando um hub 2x2 de blocos coloridos (estilo seletor de slides) em vez de mais
dois passos sequenciais.

## Novo state (`js/core/state.js`)
- `editingStep` (1-3): 1 = Tela Geral, 2 = Tela dos Blocos, 3 = Tela da Revisão.
- `editingBlock` (novo campo, `null` | 1-4): sub-navegação dentro da fase 2.
  `null` = hub 2x2 visível; 1-4 = qual bloco está aberto. Resetado para `null`
  em `newGame()`/`editGame()` e sempre que `showPhase()` muda de fase.

## Mapeamento dos 4 blocos (Tela dos Blocos)
1. **Regras** (tile laranja, `bg-amber-500`, ícone `fa-scroll`) — campos Regra +
   Objetivo (top-left).
2. **Aparência** (tile verde, `bg-green-600`, ícone `fa-palette`) — Design das
   Cartas (frente/verso) + Envio Externo (top-right).
3. **Enunciado e Feedbacks** (tile azul, `bg-sky-500`, ícone `fa-comment-dots`) —
   Enunciado + Explicação, conteúdo idêntico ao antigo passo 3 (bottom-left).
4. **Criação de Cartas** (tile rosa, `bg-pink-500`, ícone `fa-layer-group`) —
   grid de 12 cartas, conteúdo idêntico ao antigo passo 4 (bottom-right).
Essa ordem/posição foi uma decisão de implementação (spec só definia cores por
posição, não qual conteúdo vai em qual quadrante) — não reabrir sem necessidade.

## IDs e funções novas/renomeadas em `js/core/editorShell.js`
- `showStep(step)` → renomeado para **`showPhase(phase)`** (controla `#creator-phase-1/2/3`,
  progress fill `(phase/3)*100%`, label "Passo X de 3"). Ao entrar na fase 2 sempre
  delega para `showBlock(null)` (reabre no hub).
- **`showBlock(blockNum)`** (nova) — mostra `#creator-blocks-hub` (blockNum null) ou
  `#creator-block-{1..4}` (blockNum 1-4); chama `persistEditorFields()` no início
  (sincroniza DOM→state antes de trocar de bloco); chama `renderEditorGrid()` ao
  entrar no bloco 4. Footer Voltar/Próximo só aparecem no hub (`blockNum===null`);
  dentro de um bloco a única navegação é o link inline "Voltar aos blocos"
  (`onclick="app.showBlock(null)"`) no topo de cada `#creator-block-N`.
- **`updateEditorHeader()`** (nova) — escreve o título do cabeçalho (`#creator-step-title`):
  `PHASE_TITLES` para fases 1/3, `BLOCK_TITLES` quando fase 2 + bloco aberto.
- **`renderBlocksHub()`** (nova) — liga/desliga o badge de check (`#block-badge-{1..4}`)
  de cada tile. Critério de "completo": bloco 1 = regra E objetivo com texto (via
  `stripHtml()`, novo helper local não-exportado que faz `div.innerHTML=html;
  return div.textContent.trim()` — necessário pois regra/objetivo/enunciado são
  HTML de contenteditable, não texto puro); bloco 2 = sempre completo na prática
  (frontDesign/backDesign sempre têm default truthy); bloco 3 = enunciado com
  texto E explicacao não-vazia; bloco 4 = reaproveita a MESMA regra de
  12 preenchidas + 6 corretas que já existia (não duplicada, só extraída).
- `creator-step-5-actions` → renomeado **`creator-review-actions`** (Testar Jogo /
  Salvar Jogo, só visível na fase 3).
- `creator-step-1/2/3/5` (ids) → renomeados **`creator-phase-1/2/3`**. `creator-step-4`
  **NÃO foi renomeado** — continua com esse id exato porque `js/app.js:84`
  (`injectPartial('creator-step-4', activeGame.partials.editorStep4)`) injeta o
  conteúdo do módulo de jogo ativo diretamente nele; ele agora vive DENTRO de
  `#creator-block-4` como filho único.
- Classe CSS `.creator-step` → duas classes novas: `.creator-phase` (nas 3 telas
  de topo) e `.creator-block` (nos 4 blocos dentro da fase 2). Não havia regra
  `.creator-step` em `<style>` (só `hidden` do Tailwind), então não precisou
  migrar CSS, só os seletores em JS.
- `creatorNextStep()`: fase 1 valida nome+conteúdo (igual antes) e avança para
  `showPhase(2)` (cai no hub). Fase 2 (só alcançável a partir do hub, já que o
  botão Próximo fica oculto dentro de um bloco) valida 12 cartas preenchidas +
  6 corretas — MESMA validação do antigo passo 4, só que agora reaproveitada
  aqui; se falhar, chama `showBlock(4)` ANTES de `showValidationError()` (ordem
  importa: `showBlock()` limpa a mensagem de validação no final, então precisa
  rodar primeiro) e mantém o usuário no bloco Criação de Cartas em vez de
  avançar. Se passar, `showPhase(3)`.
- `creatorPrevStep()`: fase 3 → `showPhase(2)` (volta pro hub, não pro último
  bloco visitado — decisão simples, hub é sempre o "home" da fase 2). Fase 2 →
  `showPhase(1)`. Só é alcançável quando o botão Voltar está visível, ou seja,
  nunca dentro de um bloco (lá a volta é só via "Voltar aos blocos").

## Outros arquivos tocados
- `partials/core/editor-shell.html` — reescrito com a nova estrutura (fase 1 e
  fase 3 são cópia literal do markup antigo dos passos 1 e 5, só com ids
  renomeados; fase 2 tem o hub 2x2 + 4 blocos, blocos 1/2 são a divisão literal
  do antigo passo 2, bloco 3 é cópia literal do antigo passo 3).
- `js/core/dashboard.js` — `backFromPlayer()`: `this.showStep(5)` → `this.showPhase(3)`.
- `js/core/state.js` — adicionado `editingBlock: null`.

## Armadilha encontrada: markup morto em `index.html`
`index.html` (linhas ~824-1145) tem uma cópia INTEIRA e DESATUALIZADA do editor
antigo de 5 passos (sem tooltips, sem toolbar de richtext, "de 5" no lugar de
"de 3") dentro de `<section id="view-creator">`. **Isso é código morto**: `js/app.js`
(`loadPartials()`) roda `injectPartial('view-creator', 'partials/core/editor-shell.html')`
no boot, que faz `el.innerHTML = <conteúdo do partial>` e substitui esse markup
por completo antes de qualquer interação do usuário. Confirmado lendo
`injectPartial()`/`loadPartials()` em `js/app.js`. Não precisou ser tocado para
esta mudança funcionar, mas fica registrado para não confundir uma sessão futura
que grepe por `creator-step` e ache esses ids "vivos" em `index.html` — eles não
são renderizados. Se algum dia isso for limpo, é um refactor separado (não pedido
nesta sessão).
