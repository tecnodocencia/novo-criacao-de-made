---
name: sessao_2026-11-16_descarte_link_rede
description: Descarte a Carta ganhou link compartilhado próprio (play-descarte.html) com partidas entre alunos em computadores diferentes via Supabase Realtime; na plataforma o Jogar virou só 1 aluno x computador
metadata:
  type: project
---

Pedido (2026-11-16), SÓ para o Descarte a Carta:
- Plataforma (Jogar / Testar Jogo / Nova Partida): só 1 aluno x computador. O
  modal `#modal-descarte-setup` e os métodos `descarteOpenSetupModal`/
  `descarteCloseSetupModal` foram REMOVIDOS; `descarteStartMatch()` não recebe
  mais modo.
- Link compartilhado: `dashboard.shareGame` gera `play-descarte.html?code=X`
  (play.html redireciona códigos do Descarte para lá). A página oferece
  "1 aluno + computador", "2 alunos + computador" e "2 alunos, sem computador";
  as duas últimas são EM REDE (cada aluno no seu computador), não hotseat.

## Como funciona a rede (js/games/descarte/net.js) — sem tabela no banco
- Sala de espera: canal Realtime `descarte-lobby:<share_code>:<modo>` com
  presença; ordena por chegada, forma duplas (1º+2º, 3º+4º...), o 1º convida
  o 2º (broadcast invite/accept). Partida só começa com os dois na sala.
- Partida: canal `descarte-match:<uuid>`. O anfitrião (quem convidou, jogador
  0) roda o motor inteiro, inclusive o bot no modo trio; o convidado
  (jogador 1, `remote: true` no roster do anfitrião) recebe só
  `viewFor(app, 1)` — a própria mão + contagens — e manda ações
  (play/draw/pass/wild/restart). Nenhuma carta alheia chega ao convidado.
- Testado: Realtime funciona com a chave publishable SEM login.

## Motor (js/games/descarte/player.js)
- Estado ganhou `localIdx` (jogador deste computador) e `net` (ganchos
  `onRender`, `onPlayAnim`, `send`, `role`). Sem `net` = comportamento antigo.
- `descarteEngine` exportado (createMatch, startTurns, renderAll,
  applyRemoteAction, viewFor, applyGuestView, animateRemotePlay) — usado por
  js/play-descarte.js, que monta um `app` mínimo (utils + modals + playerMethods).
- CSS da mesa saiu de index.html para `css/descarte.css` (usado pelas 2 páginas).

## Limitações conhecidas
- Sem reconexão: se um aluno fecha/recarrega a aba, a partida termina para os
  dois (o outro é avisado e volta à escolha de modo).
- Sem ranking para o Descarte (manageRanking continua com o aviso).
