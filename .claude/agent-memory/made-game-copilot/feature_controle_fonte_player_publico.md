---
name: feature-controle-fonte-player-publico
description: Botões A-/A+ de tamanho de fonte no player público standalone (play.html/js/play.js), mecanismo de escala via CSS custom property
metadata:
  type: project
---

Pedido em 2026-08-19 (mesmo dia da sessão de 7 fixes, ver [[sessao_2026-08-19]]): usuário
achou o texto todo do player público muito pequeno num print e pediu um controle de
aumentar/diminuir fonte. Implementado SOMENTE em `play.html` + `js/play.js` (o player
autenticado `js/games/codigo-secreto/player.js` não foi tocado — fora de escopo, mesma
separação descrita em [[arquivos_modulos]]).

**Mecanismo de escala (por que essa abordagem e não `zoom`/`transform:scale`):**
`:root { --play-font-scale: 1 }` + `html { font-size: calc(16px * var(--play-font-scale)) }`.
Como o root font-size muda, TODAS as classes Tailwind baseadas em rem escalam sozinhas,
de graça: `text-xs/sm/base/lg/2xl`, paddings/gaps (`p-3`, `px-2`, `gap-3`...),
`rounded-*`, e até `w-60`/`w-72` (larguras das colunas laterais, que crescem um pouco
e sobra mais espaço pro texto — comportamento aceito, não é bug).
Cogitei `zoom`/`transform:scale` no elemento raiz do jogo, mas descartei: `#screen-game`
tem `height:100vh; overflow:hidden` por design (sem scroll na tela toda, só os painéis
internos scrollam) — zoom/transform ali têm comportamento inconsistente entre navegadores
com unidades de viewport e coordenadas de posicionamento, risco alto sem poder testar em
múltiplos browsers.

**O que NÃO escala, de propósito:** as dimensões fixas em px de `.bank-card` (120px
altura), `.drop-slot`/`.secret-card-slot` (110×150px), `.history-mini-card` (52×68px),
`.feedback-dot` (14px) — ver [[formato_dados_jogo]] pro contexto do motor de jogo. Só o
TEXTO cresce/encolhe dentro dessas caixas fixas, nunca as caixas — é isso que evita
quebrar o grid do banco de cartas, os slots numerados e o painel de histórico, exatamente
o cuidado pedido pelo usuário.

**Cobertura dos tamanhos em px "arbitrários" do Tailwind** (`text-[8px]`, `text-[9px]`,
`text-[10px]`, `text-[11px]` — usados tanto em `play.html` quanto nos templates HTML
gerados dentro de `js/play.js`, ex. conteúdo das cartas, labels do painel Nível/Cartas/
Repetição/Troca): não escalam com rem por padrão, então foram sobrescritos com 4 regras
CSS em `play.html` (`.text-\[Npx\] { font-size: calc(Npx * var(--play-font-scale))
!important; }`). O `!important` é necessário porque o Tailwind CDN injeta seu próprio
`<style>` via JS em runtime e a ordem final no `<head>` não é garantida ficar depois do
nosso — sem isso a régua Tailwind poderia vencer a nossa por ordem de cascata.
Os `font-size:Npx` que apareciam como **inline style literal** dentro de template strings
em `js/play.js` (não como classe) foram editados diretamente para
`font-size:calc(Npx * var(--play-font-scale))` — ícone de lupa, botão ✕ de remover carta
do slot, texto do card na `.history-mini-card`, número da tentativa no histórico, texto
da carta no modal de solução (flip), tag "(voce)" no ranking.

**Persistência e níveis:** `FONT_SCALES = [0.85, 0.925, 1, 1.1, 1.2]` (5 níveis, índice 2
= 100% default), guardado em `localStorage['made_play_font_scale_idx']`. Aplicado por
`loadFontScale()` chamada no TOPO do módulo (fora de `init()`/`DOMContentLoaded`) — como
`<script type="module">` já é deferred, o DOM existe nesse ponto, então a preferência
salva é aplicada antes de qualquer tela aparecer (evita flash no tamanho padrão).
`playApp.increaseFontSize()`/`decreaseFontSize()` (novos métodos em `window.playApp`)
incrementam/decrementam `fontScaleIndex` e chamam `applyFontScale()`, que também
habilita/desabilita os botões `#btn-font-decrease`/`#btn-font-increase` nos limites
(`disabled:opacity-30` do Tailwind) e atualiza o indicador `#font-scale-indicator`
("100%" etc.).

**UI:** grupo de botões "A-" / (indicador %) / "A+" no topbar de `#screen-game`, entre
`#play-header-autores` e o botão "Objetivo" — mesmo agrupamento visual pedido pelo
usuário no print (perto de Objetivo/Como Jogar).

**Why:** acessibilidade — o player público é usado por alunos sem conta, em telas e
condições variadas; texto pequeno demais prejudica leitura do enunciado e das cartas.
**How to apply:** se no futuro forem adicionados NOVOS elementos com `font-size` em px
literal (classe `text-[Npx]` do Tailwind ou `style="font-size:Npx"` inline) dentro de
`play.html`/`js/play.js`, eles não vão escalar automaticamente — ou usar uma classe Tailwind
padrão baseada em rem (`text-xs`, `text-sm`, etc., que já escalam sozinhas), ou envolver o
valor em `calc(Npx * var(--play-font-scale))` manualmente, seguindo o padrão já usado aqui.
