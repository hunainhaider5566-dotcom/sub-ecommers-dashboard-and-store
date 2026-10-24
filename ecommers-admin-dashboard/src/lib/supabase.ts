import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''
export const isSupabaseConfigured = url.startsWith('https://') && Boolean(key) && !key.includes('YOUR_SUPABASE')
export const supabase = isSupabaseConfigured ? createClient<Database>(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } }) : null
export function getSupabase() { if (!supabase) throw new Error('Supabase is not configured. Copy .env.example to .env.local and provide the browser-safe project key.'); return supabase }
