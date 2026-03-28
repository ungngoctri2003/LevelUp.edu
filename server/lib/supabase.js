import { createClient } from '@supabase/supabase-js'
import { supabaseEnv } from '../env.js'

let _warnedMissing = false

export function assertSupabaseConfig() {
  const { url, anonKey } = supabaseEnv()
  if (!url || !anonKey) {
    if (!_warnedMissing) {
      _warnedMissing = true
      console.warn(
        '[server] Missing SUPABASE_URL / SUPABASE_ANON_KEY (or VITE_* equivalents).',
      )
    }
    return null
  }
  return { url, anonKey }
}

/** Client theo quyền anonymous — đọc nội dung public (RLS). */
export function createAnonClient() {
  const c = assertSupabaseConfig()
  if (!c) return null
  return createClient(c.url, c.anonKey)
}

/**
 * Client gắn JWT người dùng — mọi query tuân RLS.
 * @param {string | undefined} accessToken
 */
export function createUserClient(accessToken) {
  const c = assertSupabaseConfig()
  if (!c) return null
  const headers = {}
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  return createClient(c.url, c.anonKey, {
    global: { headers },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Chỉ dùng server-side (ví dụ form tuyển sinh công khai). Bypass RLS. */
export function createServiceClient() {
  const { url, serviceRoleKey } = supabaseEnv()
  if (!url || !serviceRoleKey) return null
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
