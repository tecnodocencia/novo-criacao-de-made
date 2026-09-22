---
name: sessao_2026-09-22_paleta_colorida
description: Desenho da paleta de 4 cores (verde/âmbar/azul/rosa) aplicada ao chrome administrativo do MADE (login, sidebar, dashboard, biblioteca, configurações, modais) — onde cada cor foi usada e por quê
metadata:
  type: project
---

Confirmado em 2026-09-22, pedido do product owner: "deixar o site mais colorido e
menos morto" reaproveitando as 4 cores já usadas nos blocos da Tela dos Blocos do
editor (ver [[sessao_2026-09-22_editor_3_telas]]). Liberdade criativa total dentro
de uma direção de arte definida pelo usuário. Mesa de jogo (`player.html`/`player.js`)
e `play.html`/`js/play.js` (player público) **não foram tocados** — só chrome
administrativo + leve polimento no editor.

## Decisão de tom de verde (importante para não duplicar/contradizer)
O app já usa `emerald-600`/`emerald-*` extensivamente em elementos PRÉ-EXISTENTES
não tocados nesta sessão (inputs `focus:border-emerald-500`, labels, textos, botões
do fluxo do editor como "Salvar Jogo", botões da mesa de jogo). Decisão tomada: os
elementos NOVOS/redesenhados nesta sessão (ver lista abaixo) usam `green-600`
(o mesmo tom já usado no tile "Aparência" do hub 2x2, `bg-green-600`,
`partials/core/editor-shell.html` linha ~148) como "verde primário de marca", em vez
de `emerald-600`. Os dois tons de verde (`emerald-600` #059669 e `green-600`
#16a34a) agora coexistem intencionalmente no app — não é inconsistência acidental,
é resultado de: (a) escopo limitado desta sessão (não fazer find-replace global de
emerald→green, risco/diff desproporcional), (b) reaproveitar literalmente a cor já
usada no bloco "Aparência" para o novo "verde de marca". Uma sessão futura que
queira unificar 100% os verdes deve fazer isso como refactor deliberado, avisando o
usuário — não assumir que é obrigatório.

## Onde cada cor foi aplicada (arquivos tocados nesta sessão)

**Verde (`green-600`/`green-50`/`green-100`) = ação primária / estado ativo:**
- `index.html`: chip de ícone da sidebar "Meus Materiais" (`bg-green-100 text-green-600`
  no ícone, sempre, independente de estar ativo); estado ATIVO do nav-btn (qualquer
  item, via `dashboardMethods.switchView` em `js/core/dashboard.js`) usa
  `bg-green-50 text-green-800 ring-1 ring-green-200 font-semibold` — ou seja, verde é
  o indicador universal de "seção atual", não fixo a um item.
- `index.html`: blob decorativo verde no `#main-layout`; botão "OK" do
  `#modal-notification`; botão "Adicionar" + badge do `#modal-author`
  (`fa-user-plus`); badge numerado do Nível 1 em `#modal-difficulty` (borda/hover
  `border-green-500`/`bg-green-50` também nível 1).
- `js/core/dashboard.js`: botão "Jogar" dos cards do dashboard (`bg-green-600`,
  era `emerald-600`); accent do 1º card no rotation de 4 cores (`index % 4`);
  gradiente `from-green-600` no botão CTA do estado vazio.
- `partials/core/auth.html`: metade do gradiente do headline, toggle Login ativo
  (`from-green-600 to-sky-500`), botão "Entrar na Plataforma" (era `bg-slate-900`).
- `partials/core/editor-shell.html`: metade do gradiente da barra de progresso e do
  botão "Próximo" do rodapé (era `bg-emerald-600`/`bg-slate-900`).
- `js/core/auth.js` (`setAuthMode`): reescreve `className` inteiro de
  `#auth-login-btn`/`#auth-register-btn` (ver seção "bug pré-existente corrigido"
  abaixo) usando esses tokens verdes para o modo login ativo.

**Âmbar (`amber-500`/`amber-100`) = destaque secundário / upload:**
- `index.html`: chip "Novo Jogo" na sidebar; botão "Enviar Imagem" do
  `#modal-library` (era `emerald-600`); badge numerado + hover do Nível 3 em
  `#modal-difficulty`; badge do `#modal-ranking` (`fa-trophy`, era `emerald-700`
  no texto do nome do jogo).
- `js/core/dashboard.js`: accent do 2º card no rotation; botão "Ranking" dos cards
  (já era âmbar, mantido).
- `partials/core/auth.html`: metade do gradiente do botão "Criar minha conta"
  (`from-amber-500 to-pink-500`, era `bg-emerald-600`); toggle Cadastro ativo.
- `partials/core/library.html` + `partials/core/modals.html` (dead code, mirror):
  botão "Enviar Imagem" do gerenciador de biblioteca (era `emerald-600`).
- `partials/core/settings.html`: metade do gradiente do avatar do usuário.

**Azul/Sky (`sky-500`/`sky-100`) = informação / ação secundária:**
- `index.html`: chip "Biblioteca" na sidebar; blob decorativo azul; badge numerado +
  hover do Nível 2 em `#modal-difficulty`; badge do `#modal-share`
  (`fa-share-nodes`); caixa de info "Link público gerado" (era `blue-50`/`blue-800`);
  botão "Copiar" (era `bg-blue-500`).
- `js/core/dashboard.js`: botão "Compartilhar" dos cards (era `bg-blue-500`, agora
  `bg-sky-500`); accent do 3º card no rotation.
- `partials/core/auth.html`: metade do gradiente do headline e do botão de login.
- `partials/core/settings.html`: borda esquerda do card "Versão"
  (`border-l-sky-400`).

**Rosa (`pink-500`/`pink-100`) = acento lúdico, usado com moderação:**
- `index.html`: chip "Configurações" na sidebar; blob decorativo rosa; badge
  numerado + hover do Nível 4 em `#modal-difficulty`; badge do `#modal-library`
  (`fa-images`, era sem badge).
- `js/core/dashboard.js`: accent do 4º card no rotation (`index % 4`).
- `partials/core/auth.html`: metade do gradiente do botão "Criar minha conta" e do
  headline.
- `partials/core/library.html`: badge de ícone ao lado do título "Minha Biblioteca".
- `partials/core/settings.html`: metade do gradiente do avatar; borda esquerda do
  card "Ambiente" (`border-l-pink-400`).

**Vermelho semântico mantido intocado**: `#modal-confirm` continua vermelho
(destrutivo), só ganhou um badge `fa-triangle-exclamation` em `bg-red-100
text-red-600` acima do título — cor não mudou, só ganhou ícone.

**Não tocado de propósito**: `#modal-solution` (mesa/resultado do jogo) — ícone
`#solution-icon` é reescrito dinamicamente por `js/games/codigo-secreto/player.js`
linha ~598-601 (`fa-trophy text-amber-500` no win) — já usa a paleta corretamente
via JS, não precisou de mudança estática. `#modal-card` (editor de carta) não foi
tocado — fora da lista explícita do pedido. `.code-size-btn` dentro de
`#modal-difficulty` não foi recolorido — `js/games/codigo-secreto/player.js`
`setCodeSize()` (linha ~295-307) faz `classList.add/remove('bg-emerald-600',
'text-white', 'border-emerald-600')`/`('bg-white','text-slate-700')` diretamente;
mudar a cor exigiria editar esse JS também, decidido como fora de escopo (risco
desnecessário num componente que já funciona). `.difficulty-btn` (os 4 botões de
nível) NÃO tem esse problema — confirmado via grep que nenhum JS manipula
`classList` neles (só `onclick` inline), por isso foram recoloridos livremente.

## Rotação de cores em listas (padrão usado, reaplicável)
Dois lugares usam `index % 4` sobre um array de 4 configs de accent (verde/âmbar/
azul/rosa, nessa ordem) para dar variedade sem "decorar tudo":
- `js/core/dashboard.js` `renderDashboard()`: `CARD_ACCENTS` (barra superior +
  chip do card de cada jogo).
- `js/core/library.js`: `FOLDER_ACCENTS` + helper `folderAccent(folder)` (usa
  `imageBankFolders.findIndex()` para achar o índice da pasta) — usado tanto em
  `bankFolderTileEl()` (tiles do banco de imagens) quanto em
  `folderBackHeaderEl()` (cabeçalho "voltar" dentro de uma pasta). Essa função é
  compartilhada entre o gerenciador de biblioteca (`#manager-library-grid`) e o
  modal de seleção de imagem do editor (`#modal-library` → `#library-grid`), então
  a cor de cada pasta do banco é consistente nos dois lugares.

## Estado vazio do dashboard (novo, não existia antes)
`js/core/dashboard.js` `renderDashboard()` agora checa
`if (!this.state.games || this.state.games.length === 0)` no início e renderiza um
bloco `col-span-full` com ícone `fa-shapes` em gradiente (verde→sky→rosa via
`bg-clip-text`), texto explicativo e botão `onclick="app.newGame()"` com gradiente
verde→sky. Antes disso o grid simplesmente ficava vazio/em branco.

## Bug pré-existente corrigido como efeito colateral (não pedido, mas necessário)
`js/core/auth.js` `setAuthMode()` fazia `classList.toggle('bg-[#f5e7d6]', ...)` e
`classList.toggle('text-[#bb3e44]', ...)` nos botões de toggle Login/Cadastro — um
esquema de cor bege/vermelho que **não correspondia** às classes default do HTML
(`bg-white text-emerald-700` no login, hardcoded, nunca removidas pelo toggle).
Resultado: ao trocar de aba, ambos os efeitos se acumulavam de forma inconsistente
(bug antigo, não documentado antes). Reescrito para `setAuthMode` atribuir o
`className` completo de cada botão (ativo = gradiente sólido, inativo = texto
slate), eliminando a inconsistência. Isso era necessário para implementar "dê à
aba ativa uma cor viva" do pedido — não foi uma escolha de escopo extra.

## Blobs decorativos (`.decor-blob`, `<style>` em index.html)
Nova classe CSS `.decor-blob` (`border-radius:9999px; filter:blur(60px);
pointer-events:none; animation: blob-float 20s ease-in-out infinite;`) +
`@keyframes blob-float`. Usada em `#main-layout` (4 blobs, um por cor, com
`-z-10` e `#main-layout` precisou ganhar `relative isolate overflow-hidden` para
os blobs ficarem atrás do conteúdo sem escapar do stacking context — `isolate`
é essencial aqui, sem ele o `-z-10` escaparia para o stacking context raiz) e em
`partials/core/auth.html` (4 blobs no painel esquerdo, complementando os 2 que já
existiam em emerald/amber — agora com `.decor-blob` para o movimento sutil).
Posicionamento vem de utilities Tailwind (`absolute`, `-top-24` etc.), não do CSS
custom, para não competir com a ordem de carregamento do Tailwind Play CDN.

## Armadilha confirmada (não é bug novo, só documentando de novo)
`partials/core/modals.html` continua sendo código morto (nunca injetado — ver
[[arquivos_modulos]] e a task description desta sessão). Foi atualizado por
consistência (mesmos badges/cores que os modais reais em `index.html`), mas
**não afeta o app rodando**. Os modais reais editados foram todos dentro de
`index.html` (a partir de ~linha 1327 na versão pós-edição).
