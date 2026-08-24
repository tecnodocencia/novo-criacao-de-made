-- ============================================================
-- MADE — Migration: gerenciamento de ranking pelo professor (dono do jogo)
-- Execute este SQL no painel do Supabase:
-- SQL Editor > New Query > Cole e execute
--
-- Contexto: a migration original (supabase-migrations.sql) criou a tabela
-- public_plays com RLS habilitado e políticas de INSERT/SELECT abertas para
-- qualquer um (anon incluso, necessário para o player público sem login em
-- play.html/js/play.js). Nenhuma política de DELETE foi criada até agora.
-- Com RLS habilitado e nenhuma política de DELETE, o Postgres NEGA delete
-- para todo mundo por padrão — inclusive para o professor autenticado dono
-- do jogo. Esta migration adiciona a política que faltava, permitindo que
-- SOMENTE o dono do jogo (jogos.user_id = auth.uid(), pelo mesmo share_code
-- da partida) apague linhas de public_plays daquele jogo — usado pelo novo
-- recurso "Gerenciar Ranking" no dashboard (js/core/dashboard.js).
-- ============================================================

CREATE POLICY "Owner can delete public plays of their games"
    ON public_plays
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM jogos
            WHERE jogos.share_code = public_plays.share_code
              AND jogos.user_id = auth.uid()
        )
    );

-- Nota importante: esta política depende de o professor autenticado conseguir
-- LER a própria linha em "jogos" dentro da subquery (para o EXISTS resolver).
-- Isso já deveria funcionar se a tabela "jogos" tiver uma política de SELECT
-- do tipo "auth.uid() = user_id" (mencionada como já existente na sessão de
-- 2026-07-01, mas nunca inspecionada diretamente no painel do Supabase).
-- Se, depois de rodar esta migration, o botão "Gerenciar Ranking" carregar a
-- lista normalmente mas a remoção/limpeza não tiver efeito (sem erro no
-- console, mas a linha continua no banco), o primeiro lugar a checar é:
-- Authentication > Policies > tabela "jogos" > política de SELECT para o
-- role "authenticated".
