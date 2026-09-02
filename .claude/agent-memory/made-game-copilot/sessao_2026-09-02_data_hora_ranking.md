---
name: sessao-2026-09-02-data-hora-ranking
description: Adicionada exibição de data/hora (dd/mm/aaaa hh:mm) nas duas telas de ranking — confirmado que played_at já existia e já era capturado, só faltava exibir com hora
metadata:
  type: project
---

Pedido: mostrar data e horário no ranking, tanto no admin (dashboard) quanto na
exibição dos jogadores (player público). Ver [[sessao_2026-08-24]] para o contexto
completo de `public_plays` e do recurso "Gerenciar Ranking" implementado antes.

**Descoberta:** a coluna `played_at` em `public_plays` já existe e já é capturada
automaticamente (default do Postgres, provavelmente `default now()` — não é setada
explicitamente em `dbService.salvarResultadoPublico()` em `js/database.js`, só
usada em `.order('played_at', ...)`). Não foi necessária nenhuma migration SQL —
só faltava EXIBIR a hora (o admin já mostrava a data, sem hora; o player público
não mostrava nem data nem hora).

**Mudanças:**
- `js/play.js`: nova função `formatDateTimeBR(dateStr)` logo após `escapeHtml()`
  (linha ~55). Usada em `showRanking()` — adicionada uma linha extra
  `<p>${formatDateTimeBR(play.played_at)}</p>` abaixo da linha de tentativas/nível/cartas
  de cada jogador na lista de ranking pública.
- `js/core/dashboard.js`: mesma função `formatDateTimeBR()` duplicada localmente
  (módulo separado, sem import compartilhado entre os dois — consistente com o
  padrão já existente de duplicação entre player público/autenticado, ver
  [[arquivos_modulos]]) antes de `export const dashboardMethods`. Usada em
  `refreshRankingManageList()`: a linha que antes era
  `${new Date(r.played_at).toLocaleDateString('pt-BR')}` virou uma linha própria
  com `formatDateTimeBR(r.played_at)` (data+hora), separada da linha de
  score/tentativas/nível.
- Formato: `dd/mm/aaaa hh:mm` via `toLocaleDateString('pt-BR')` +
  `toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})` concatenados
  (evita a vírgula que `toLocaleString('pt-BR', {...})` insere entre data e hora).

**Validação:** `node --check` em `js/play.js` e `js/core/dashboard.js` — sem
build step no projeto (Tailwind/Supabase via CDN), essa é a validação de sintaxe
disponível. Não foi possível testar em navegador real nesta sessão.

**Why:** pedido direto do usuário, escopo restrito (só exibir data/hora, sem
filtros/ordenação novos).
**How to apply:** se no futuro quiser exibir `played_at` em algum outro lugar do
ranking (ex. player autenticado, que hoje NÃO tem tela de ranking — só o público
tem), reusar o mesmo padrão `formatDateTimeBR()` em vez de reinventar o formato.
