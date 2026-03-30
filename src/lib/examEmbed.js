/**
 * Nhúng bài tương tác từ web (Genially, …). Chỉ chấp nhận HTTPS và hostname trong allowlist.
 */

const ALLOW_SUFFIX = ['.genially.com', '.learningapps.org']
const ALLOW_EXACT = new Set(['genially.com', 'learningapps.org', 'view.genially.com', 'www.genially.com'])

export function isAllowedEmbedHost(hostname) {
  const h = String(hostname || '')
    .toLowerCase()
    .trim()
  if (!h) return false
  if (ALLOW_EXACT.has(h)) return true
  for (const suf of ALLOW_SUFFIX) {
    if (h.endsWith(suf)) return true
  }
  return false
}

/**
 * @param {string} raw — URL Genially hoặc đoạn HTML có &lt;iframe src="..."&gt;
 * @returns {string|null} URL https hợp lệ
 */
export function parseEmbedFromPaste(raw) {
  if (raw == null || typeof raw !== 'string') return null
  const s = raw.trim()
  if (!s) return null

  const tryUrl = (u) => {
    try {
      const url = new URL(u)
      if (url.protocol !== 'https:') return null
      if (!isAllowedEmbedHost(url.hostname)) return null
      return url.href
    } catch {
      return null
    }
  }

  const direct = tryUrl(s)
  if (direct) return direct

  const m = s.match(/<iframe[^>]+src=["']([^"']+)["']/i)
  if (m?.[1]) return tryUrl(m[1].trim())

  return null
}

/**
 * @param {string|null|undefined} src
 * @returns {string}
 */
export function assertValidEmbedSrc(src) {
  const u = parseEmbedFromPaste(typeof src === 'string' ? src : '')
  if (!u) {
    throw new Error('Link nhúng không hợp lệ. Chỉ hỗ trợ HTTPS từ Genially / LearningApps (dán URL hoặc mã iframe).')
  }
  return u
}
