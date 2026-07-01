-- ============================================================
-- MADE — Migrations para features #4 e #5 (Link Público + Ranking)
-- Execute este SQL no painel do Supabase:
-- SQL Editor > New Query > Cole e execute
-- ============================================================

-- 1. Adiciona coluna share_code na tabela jogos
--    Única por jogo. NULL = não compartilhado.
ALTER TABLE jogos
    ADD COLUMN IF NOT EXISTS share_code TEXT UNIQUE;


-- 2. Cria tabela de partidas públicas (ranking)
CREATE TABLE IF NOT EXISTS public_plays (
    id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    share_code       TEXT        NOT NULL,
    player_name      TEXT        NOT NULL,
    score            INTEGER     NOT NULL DEFAULT 0,
    attempts_used    INTEGER     NOT NULL DEFAULT 0,
    won              BOOLEAN     NOT NULL DEFAULT false,
    difficulty_level INTEGER     NOT NULL DEFAULT 1,
    code_size        INTEGER     NOT NULL DEFAULT 4,
    played_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_plays_share_code ON public_plays(share_code);
CREATE INDEX IF NOT EXISTS idx_public_plays_ranking ON public_plays(share_code, won, score DESC, played_at ASC);


-- 3. RLS para jogos: permite leitura anônima de jogos compartilhados
--    (o professor já tem acesso via política existente com user_id)
CREATE POLICY "Public can read shared games"
    ON jogos
    FOR SELECT
    USING (share_code IS NOT NULL);

-- Nota: se já existir uma política de leitura que bloqueie anônimos,
-- pode ser necessário ajustar a política existente.
-- Verifique em: Authentication > Policies > tabela jogos


-- 4. RLS para public_plays: qualquer um pode inserir e ler
ALTER TABLE public_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert public plays"
    ON public_plays
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can read public plays"
    ON public_plays
    FOR SELECT
    USING (true);
