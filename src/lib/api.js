/**
 * Gọi API backend (Express). Dev: Vite proxy /api → server :3001.
 * Production: đặt VITE_API_BASE_URL (vd. https://api.example.com) hoặc để rỗng để dùng cùng origin.
 */
const base =
  typeof import.meta.env.VITE_API_BASE_URL === 'string' && import.meta.env.VITE_API_BASE_URL.length
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
    : ''

/**
 * @param {string} path - bắt đầu bằng /api/...
 * @param {RequestInit} [init]
 */
export async function apiFetch(path, init = {}) {
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const headers = new Headers(init.headers)
  if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(url, { ...init, headers })
  const text = await res.text()
  let json = null
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = { raw: text }
    }
  }
  if (!res.ok) {
    const msg = json?.error || res.statusText || 'Request failed'
    const err = new Error(msg)
    err.status = res.status
    err.body = json
    throw err
  }
  return json
}

/** @param {string} accessToken - JWT Supabase */
export function authHeaders(accessToken) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}
