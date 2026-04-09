/**
 * Chuyển URL YouTube (watch, youtu.be, embed, shorts, live, music…) hoặc mã video thuần
 * thành URL embed an toàn cho iframe. Trả về null nếu không nhận dạng được.
 */
export function toYouTubeEmbedUrl(input) {
  if (input == null || typeof input !== 'string') return null
  let s = input.trim().replace(/^['"]|['"]$/g, '')
  if (!s) return null

  const embed = s.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/i)
  if (embed) return `https://www.youtube.com/embed/${embed[1]}`

  const nocookie = s.match(/youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{6,})/i)
  if (nocookie) return `https://www.youtube-nocookie.com/embed/${nocookie[1]}`

  const shortu = s.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/i)
  if (shortu) return `https://www.youtube.com/embed/${shortu[1]}`

  const shorts = s.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/i)
  if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`

  const live = s.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{6,})/i)
  if (live) return `https://www.youtube.com/embed/${live[1]}`

  const v = s.match(/[?&#]v=([a-zA-Z0-9_-]{6,})/i)
  if (v) return `https://www.youtube.com/embed/${v[1]}`

  /** Mã video dán riêng (chuẩn YouTube = 11 ký tự). */
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) {
    return `https://www.youtube.com/embed/${s}`
  }

  return null
}

/** Link mở tab mới khi không nhúng iframe được (URL lạ hoặc cần đăng nhập YouTube). */
export function youTubeWatchUrlOrNull(input) {
  if (input == null || typeof input !== 'string') return null
  const s = input.trim().replace(/^['"]|['"]$/g, '')
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  if (/^\/\//.test(s)) return `https:${s}`
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return `https://www.youtube.com/watch?v=${s}`
  return `https://${s.replace(/^\/+/, '')}`
}
