// js/database.js
import { supabase } from './supabase.js'

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
            .eq('user_id', user.id) // Filtra para mostrar apenas os jogos do usuário logado
            .order('created_at', { ascending: false })
        
        if (error) throw error
        
        // Mapeamento de volta para camelCase para manter compatibilidade com o app.js
        return data.map(jogo => ({
            ...jogo,
            frontDesign: jogo.frontdesign,
            backDesign: jogo.backdesign,
            disciplineInfo: jogo.disciplineinfo
        }))
    },

    async salvarJogo(jogo) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Usuário não autenticado")

        // Mapeamento EXATO para as colunas do seu banco
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

        console.log("Enviando payload para o Supabase:", payload);

        // Se o jogo já tem um ID que não seja temporário
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
        return data[0]
    },

    async excluirJogo(id) {
        const { error } = await supabase
            .from('jogos')
            .delete()
            .eq('id', id)
        
        if (error) throw error
        return true
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
