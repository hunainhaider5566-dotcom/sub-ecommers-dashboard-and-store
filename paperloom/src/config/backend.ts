import { isSupabaseConfigured } from '../lib/supabase'

export type CatalogMode = 'supabase' | 'demo' | 'unconfigured'

export function getCatalogMode(): CatalogMode {
  if (import.meta.env.VITE_CATALOG_MODE?.trim().toLowerCase() === 'demo') return 'demo'
  return isSupabaseConfigured ? 'supabase' : 'unconfigured'
}
