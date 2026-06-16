// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Substitua pelas suas credenciais do Supabase
const SUPABASE_URL = 'https://konypqczisjmzsudchan.supabase.co'
const SUPABASE_KEY = 'sb_publishable_D50R4q-jcKukbF1hVGUqfg__fnn3kvt'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
