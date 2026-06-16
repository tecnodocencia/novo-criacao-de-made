// js/database.js
import { supabase } from './supabase.js'

/**
 * Camada de abstração para o banco de dados.
 * Se você mudar de banco no futuro, basta alterar este arquivo.
 */
export const dbService = {
    // --- JOGOS ---
    
    async listarJogos() {
        const { data, error } = await supabase
            .from('jogos')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (error) throw error
        return data
    },

    async salvarJogo(jogo) {
        // Se o jogo já tem um ID que não seja temporário, tentamos um upsert
        const isNew = !jogo.id || jogo.id.startsWith('game-')
        
        const payload = {
            ...jogo,
            // Garantimos que o ID seja tratado corretamente pelo Supabase se for novo
            id: isNew ? undefined : jogo.id 
        }

        const { data, error } = await supabase
            .from('jogos')
            .upsert([payload])
            .select()
        
        if (error) throw error
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
    }
}
