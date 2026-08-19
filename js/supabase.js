// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Substitua pelas suas credenciais do Supabase
const SUPABASE_URL = 'https://konypqczisjmzsudchan.supabase.co'
const SUPABASE_KEY = 'sb_publishable_D50R4q-jcKukbF1hVGUqfg__fnn3kvt'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Supabase processa o token de recuperação de senha da URL assim que o client é criado,
// antes mesmo do resto do app (partials HTML) terminar de carregar. Registramos a escuta
// aqui, no import mais cedo possível, e guardamos o resultado numa flag para o app checar
// depois que o DOM da tela de login já existir.
export let passwordRecoveryPending = false
supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') passwordRecoveryPending = true
})
