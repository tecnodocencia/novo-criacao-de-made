---
name: convencoes_decisoes
description: Convenções de nomenclatura e decisões de design já tomadas no MADE — não contradizer sem necessidade
metadata:
  type: project
---

Confirmado em 2026-06-24.

## Nomenclatura
- Colunas Supabase: `snake_case` mas com peculiaridade — `frontdesign`, `backdesign`, `disciplineinfo` são **lowercase sem underscore** (não `front_design`), provavelmente porque Postgres dobra identificadores não-quotados para lowercase e o nome original era camelCase sem aspas. Ao escrever SQL novo para essa tabela, confirmar com o usuário o nome exato antes de assumir snake_case "correto".
- JS: camelCase para variáveis/funções (`editingGame`, `currentCodeSize`, `saveGame()`), mantido consistente em toda `app.js`.
- IDs DOM: kebab-case prefixado por contexto (`edit-game-*` no editor, `review-*` na revisão, `play-*`/`solution-*` no player, `modal-*` para modais). Padrão estável, seguir ao adicionar novos campos.
- HTML inline: Tailwind utilitário, sem classes CSS customizadas exceto as poucas definidas em `<style>` no `index.html` (`.game-card`, `.bank-card`, `.history-row`, `.feedback-dot`, etc.) para efeitos visuais que Tailwind puro não cobre (gradientes complexos, flip 3D, pseudo-elementos).

## Decisões de design confirmadas no código (não reabrir sem pedido explícito)
- Repetição de cartas no código secreto está **desativada em todos os níveis** (`repeat: false` sempre) — apesar de texto desatualizado no editor sugerir o contrário nos níveis 3/4 (ver bugs_corrigidos_2026-06-24, seção "Inconsistência não corrigida").
- Card sem texto mas com imagem é válido — produto decidiu que carta pode ser 100% visual.
- "Marcar Vermelho" / "Retirar a Cor Vermelha" usam `<strong style="color:#b91c1c">` — é o único mecanismo de ênfase visual em regra/objetivo/enunciado. Não introduzir outro esquema de cor sem necessidade.
- O modelo "Código Secreto" é hoje o único modelo de jogo (`#model-choices` tem só uma opção), mas a estrutura já foi pensada para múltiplos modelos (`game.model` é um campo livre, `selectModel(modelName, el)` é genérico). Ao adicionar novo modelo no futuro, seguir esse padrão em vez de hardcode condicional disperso.
- Painel de caracteres especiais (Matemática/Química) vive só no modal de edição de carta (`#modal-card`), não em outros campos de texto (regra/objetivo/enunciado/explicação). Foi pedido especificamente para conteúdo de carta.
- Tamanho do código secreto (3-6 ou aleatório) é escolhido no MESMO modal de dificuldade, antes dos botões de nível — não é uma tela/etapa separada. Manter esse padrão de "um modal, duas seções" ao invés de dividir em telas sequenciais, a menos que o usuário peça explicitamente.

## Coisas a NÃO assumir sem confirmar com o usuário
- Não foi possível inspecionar diretamente o Supabase (dashboard/SQL editor) nesta sessão — todo conhecimento de schema vem de leitura do código cliente (`database.js`). Se precisar adicionar coluna nova, perguntar o nome exato de colunas existentes relacionadas antes de gerar SQL, especialmente para `disciplineinfo` (jsonb provável, mas tipo exato não confirmado).
- RLS policies não foram inspecionadas — só o comportamento inferido (`listarJogos` filtra por `user_id` no client, não necessariamente é enforced por RLS no servidor).
