# Memória — MADE Game Copilot

- [Mapa de arquivos e módulos](arquivos_modulos.md) — ATUALIZADO 2026-08-19: arquitetura modular (js/core/*, js/games/codigo-secreto/*) + player público standalone (play.html/js/play.js)
- [Estrutura de dados de um jogo Código Secreto](formato_dados_jogo.md) — schema Supabase, mapeamento camelCase/snake_case, formato de cards
- [Funções centrais do player autenticado](funcoes_centrais.md) — fluxo editor → revisão → testar → player, nomes a preservar (arquivo mudou, nomes não)
- [Bugs corrigidos na sessão 2026-06-24](bugs_corrigidos_2026-06-24.md) — shuffleArray, autores undefined, escape de HTML, etc.
- [Convenções e decisões de design](convencoes_decisoes.md) — coisas a não contradizer sem necessidade
- [Sessão 2026-07-01: 5 melhorias implementadas](sessao_2026-07-01.md) — fix autor/remap, chars especiais (abas), overflow player, link público, ranking standalone
- [Sessão 2026-08-19: 7 fixes no player público](sessao_2026-08-19.md) — frontDesign ausente, carta sumindo do banco, listener duplicado, ranking (colocação+ordinal), Parabéns, autores, freeze pós-vitória (root cause confirmada via Playwright)
- [Feature: controle de fonte A-/A+ no player público](feature_controle_fonte_player_publico.md) — escala via CSS var --play-font-scale, cobre rem do Tailwind + overrides para text-[Npx] e inline styles, 5 níveis persistidos em localStorage
- [Sessão 2026-08-24: troca unificada + gerenciar ranking](sessao_2026-08-24.md) — applyReplaySwap() compartilhado em model.js (decisão arquitetural), remoção UI Repetição, acentos em play.js/play.html, novo modal Gerenciar Ranking no dashboard + migration SQL pendente
- [Sessão 2026-09-02: data/hora no ranking](sessao_2026-09-02_data_hora_ranking.md) — played_at já existia (default do Postgres), só faltava exibir com hora; formatDateTimeBR() em play.js e dashboard.js
