/**
 * Chuyển URL YouTube (watch, youtu.be, embed, shorts) thành URL embed an toàn cho iframe.
 * Trả về null nếu không nhận dạng được.
 */
export function toYouTubeEmbedUrl(input) {
  if (input == null || typeof input !== 'string') return null
  const s = input.trim()
  if (!s) return null

  const embed = s.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/i)
  if (embed) return `https://www.youtube.com/embed/${embed[1]}`

  const shortu = s.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/i)
  if (shortu) return `https://www.youtube.com/embed/${shortu[1]}`

  const shorts = s.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/i)
  if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`

  const v = s.match(/[?&]v=([a-zA-Z0-9_-]{6,})/i)
  if (v) return `https://www.youtube.com/embed/${v[1]}`

  return null
}
