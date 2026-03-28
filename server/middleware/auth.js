import { createAnonClient, createUserClient } from '../lib/supabase.js'

/**
 * Gắn accessToken + supabase client (user hoặc anon nếu không có token).
 */
export function attachSupabaseUser(req, _res, next) {
  const accessToken = extractBearer(req)
  req.accessToken = accessToken
  req.supabaseUser = accessToken
    ? createUserClient(accessToken)
    : createAnonClient()
  next()
}

export function extractBearer(req) {
  const h = req.headers.authorization
  if (!h || typeof h !== 'string') return undefined
  const m = /^Bearer\s+(.+)$/i.exec(h.trim())
  return m ? m[1] : undefined
}

/**
 * Bắt buộc đăng nhập — JWT hợp lệ và resolve được user.
 */
export async function requireAuth(req, res, next) {
  const token = extractBearer(req)
  if (!token) {
    return res.status(401).json({ error: 'Thiếu Authorization Bearer token' })
  }
  const sb = createUserClient(token)
  if (!sb) {
    return res.status(503).json({ error: 'Cấu hình Supabase server chưa đủ' })
  }
  const {
    data: { user },
    error,
  } = await sb.auth.getUser()
  if (error || !user) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc hết hạn' })
  }
  req.authUser = user
  req.supabaseUser = sb
  next()
}
