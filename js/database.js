// js/database.js
import { supabase } from './supabase.js'

/**
 * Remap: converte objeto cru do Supabase (snake_case) para camelCase do app.
 */
function remapJogo(jogo) {
    return {
        ...jogo,
        frontDesign: jogo.frontdesign,
        backDesign: jogo.backdesign,
        disciplineInfo: jogo.disciplineinfo
    }
}

/**
 * Camada de abstração para o banco de dados.
 * Se você mudar de banco no futuro, basta alterar este arquivo.
 */
export const dbService = {
    // --- JOGOS ---

    async listarJogos() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const { data, error } = await supabase
            .from('jogos')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data.map(remapJogo)
    },

    async salvarJogo(jogo) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Usuário não autenticado")

        const payload = {
            name: jogo.name,
            model: jogo.model,
            frontdesign: jogo.frontDesign || null,
            backdesign: jogo.backDesign || null,
            disciplineinfo: jogo.disciplineInfo || null,
            regra: jogo.regra || "",
            objetivo: jogo.objetivo || "",
            enunciado: jogo.enunciado || "",
            explicacao: jogo.explicacao || "",
            cards: jogo.cards || [],
            user_id: user.id
        }

        // Preserva share_code se o jogo já tinha um
        if (jogo.share_code) payload.share_code = jogo.share_code

        console.log("Enviando payload para o Supabase:", payload)

        const isNew = !jogo.id || String(jogo.id).startsWith('game-')
        if (!isNew) {
            payload.id = jogo.id
        }

        const { data, error } = await supabase
            .from('jogos')
            .upsert([payload])
            .select()

        if (error) {
            const errorMsg = `Erro Supabase (${error.code}): ${error.message}${error.hint ? ' - ' + error.hint : ''}`
            console.error("Erro detalhado:", error)
            alert(errorMsg)
            throw error
        }
        // FIX: remapeia retorno para camelCase, evitando que disciplineInfo/autores
        // fiquem undefined no state.games imediatamente após o save.
        return remapJogo(data[0])
    },

    async excluirJogo(id) {
        const { error } = await supabase
            .from('jogos')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    },

    // --- COMPARTILHAMENTO ---

    /**
     * Gera um código único de 6 chars para compartilhar o jogo publicamente.
     * Salva o share_code no banco e retorna o código gerado.
     */
    async gerarCodigoCompartilhamento(jogoId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Não autenticado")

        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

        const { error } = await supabase
            .from('jogos')
            .update({ share_code: code })
            .eq('id', jogoId)
            .eq('user_id', user.id)

        if (error) throw error
        return code
    },

    /**
     * Busca um jogo pelo share_code sem necessidade de autenticação.
     * Requer RLS policy: SELECT WHERE share_code IS NOT NULL.
     */
    async obterJogoPorCodigo(shareCode) {
        const { data, error } = await supabase
            .from('jogos')
            .select('*')
            .eq('share_code', shareCode)
            .single()

        if (error) throw error
        if (!data) throw new Error('Jogo não encontrado')
        return remapJogo(data)
    },

    /**
     * Salva resultado de uma partida pública na tabela public_plays.
     */
    async salvarResultadoPublico({ shareCode, playerName, score, attemptsUsed, won, difficultyLevel, codeSize }) {
        const { error } = await supabase
            .from('public_plays')
            .insert([{
                share_code: shareCode,
                player_name: playerName,
                score,
                attempts_used: attemptsUsed,
                won,
                difficulty_level: difficultyLevel,
                code_size: codeSize
            }])

        if (error) throw error
    },

    /**
     * Retorna o ranking de um jogo compartilhado (top 20, só vitórias).
     */
    async listarRankingJogo(shareCode) {
        const { data, error } = await supabase
            .from('public_plays')
            .select('*')
            .eq('share_code', shareCode)
            .eq('won', true)
            .order('score', { ascending: false })
            .order('played_at', { ascending: true })
            .limit(20)

        if (error) throw error
        return data || []
    },

    // --- USUÁRIOS / AUTH ---

    async login(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        
        if (error) throw error
        // Retornamos o usuário com o role extraído do metadata
        return {
            ...data.user,
            role: data.user.user_metadata.role || 'professor'
        }
    },

    async registrar(email, password, role) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: role
                }
            }
        })
        
        if (error) throw error
        return data.user
    },

    async logout() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },

    // --- STORAGE (IMAGENS) ---

    /**
     * Faz upload de um arquivo para o bucket 'imagens_jogos'
     * @param {File|Blob} file O arquivo a ser enviado
     * @param {string} path O caminho/nome do arquivo no bucket
     */
    async uploadImagem(file, path) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Usuário não autenticado para upload")

        // Sanitização básica do path
        const cleanPath = path.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').toLowerCase()

        console.log(`Tentando upload para: imagens_jogos/${cleanPath} como usuário: ${user.id}`);

        const { data, error } = await supabase.storage
            .from('imagens_jogos')
            .upload(cleanPath, file, {
                cacheControl: '3600',
                contentType: file.type || 'application/octet-stream'
            })
        
        if (error) {
            console.error("Erro detalhado no upload Supabase:", error)
            // Lança o erro com a mensagem do Supabase para o app capturar
            throw new Error(error.message || "Erro desconhecido no upload")
        }
        
        // Retorna a URL pública do arquivo
        const { data: { publicUrl } } = supabase.storage
            .from('imagens_jogos')
            .getPublicUrl(cleanPath)
            
        return publicUrl
    },

    /**
     * Lista todas as imagens do usuário no bucket
     * @param {string} userId ID do usuário logado
     */
    async listarImagensUsuario(userId) {
        const { data, error } = await supabase.storage
            .from('imagens_jogos')
            .list(userId, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'name', order: 'desc' }
            })
        
        if (error) throw error
        
        // Mapeia os arquivos para retornar suas URLs públicas
        return data.map(file => {
            const { data: { publicUrl } } = supabase.storage
                .from('imagens_jogos')
                .getPublicUrl(`${userId}/${file.name}`)
            return {
                name: file.name,
                url: publicUrl,
                created_at: file.created_at
            }
        })
    }
}
