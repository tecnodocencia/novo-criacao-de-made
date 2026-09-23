-- ============================================================
-- MADE — Migration: status de rascunho (auto-save do editor)
-- Execute este SQL no painel do Supabase:
-- SQL Editor > New Query > Cole e execute
--
-- Contexto: o editor do "Código Secreto" passou a salvar automaticamente
-- (debounced) a cada alteração, em vez de só quando o professor clica em
-- "Salvar Jogo". Isso significa que um jogo pode existir no banco mesmo que
-- o professor tenha abandonado a criação no meio do caminho. Esta coluna
-- marca esse estado para que o dashboard (js/core/dashboard.js) possa exibir
-- um badge "RASCUNHO" nesses jogos incompletos.
--
-- IMPORTANTE (ordem das duas instruções abaixo não é arbitrária):
-- 1) ADD COLUMN ... DEFAULT true — a partir de agora, qualquer INSERT que não
--    informe is_draft explicitamente (não deveria acontecer no app, que
--    sempre envia o campo, mas serve de rede de segurança) nasce como
--    rascunho.
-- 2) UPDATE ... SET is_draft = false — roda logo em seguida, uma única vez,
--    e reclassifica todas as linhas que JÁ EXISTIAM no banco antes desta
--    migration como "não-rascunho". Esses jogos foram todos criados sob o
--    fluxo antigo (sem conceito de rascunho/auto-save) e portanto já estão
--    completos/publicados — não devem aparecer retroativamente como
--    "RASCUNHO" só porque a coluna é nova. A ordem importa: se o UPDATE
--    rodasse antes do ADD COLUMN, a coluna não existiria ainda.
-- ============================================================

ALTER TABLE jogos
    ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT true;

-- Backfill único: jogos que já existiam antes desta migration nunca passaram
-- pelo fluxo de auto-save/rascunho — tratá-los como publicados/finalizados.
UPDATE jogos SET is_draft = false WHERE is_draft IS NULL OR is_draft = true;
