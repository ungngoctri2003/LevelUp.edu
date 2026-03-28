import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

/**
 * Supabase browser client. Null if env is missing (e.g. CI without secrets).
 * @type {import('@supabase/supabase-js').SupabaseClient | null}
 */
export const supabase =
  typeof url === 'string' &&
  url.length > 0 &&
  typeof key === 'string' &&
  key.length > 0
    ? createClient(url, key)
    : null

if (import.meta.env.DEV && !supabase) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY — add them to .env.local',
  )
}
