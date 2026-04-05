/**
 * Chuẩn hóa `next` sau đăng nhập: chỉ path nội bộ, tránh open redirect, khớp role.
 * @param {string | null | undefined} raw
 * @param {'admin' | 'teacher' | 'user' | null | undefined} role
 * @returns {string | null} path + query + hash an toàn hoặc null
 */
export function safePostAuthPath(raw, role) {
  if (raw == null || typeof raw !== 'string') return null
  let p = raw.trim()
  if (!p) return null
  try {
    p = decodeURIComponent(p)
  } catch {
    return null
  }
  p = p.trim()
  if (!p.startsWith('/') || p.startsWith('//')) return null
  if (p.includes('://')) return null
  if (/\s/.test(p)) return null
  if (p.length > 512) return null

  const q = p.indexOf('?')
  const pathPart = q >= 0 ? p.slice(0, q) : p
  const hashIdx = pathPart.indexOf('#')
  const pathname = hashIdx >= 0 ? pathPart.slice(0, hashIdx) : pathPart
  if (!pathname || pathname.includes('..')) return null

  const r = role || 'user'

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (r !== 'admin') return null
  }
  if (pathname === '/giao-vien' || pathname.startsWith('/giao-vien/')) {
    if (r !== 'teacher') return null
  }
  if (pathname === '/hoc-vien' || pathname.startsWith('/hoc-vien/')) {
    if (r !== 'user') return null
  }

  return p
}
