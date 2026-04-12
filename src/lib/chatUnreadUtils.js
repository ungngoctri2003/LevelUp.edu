/** So sánh thời điểm ISO (ms). */
export function tms(iso) {
  if (!iso) return 0
  const x = new Date(iso).getTime()
  return Number.isNaN(x) ? 0 : x
}

/**
 * Có tin từ người khác sau mốc đọc của mình — người gửi tin cuối không thấy badge/list unread.
 * @param {{ sender_id: string, created_at: string } | null | undefined} lastMsg
 */
export function hasUnreadFromOthers(lastMsg, uid, lastReadIso) {
  if (!lastMsg?.created_at) return false
  if (lastMsg.sender_id === uid) return false
  return tms(lastMsg.created_at) > tms(lastReadIso)
}

export async function fetchLastDmMessage(sb, threadId) {
  const { data, error } = await sb
    .from('chat_dm_messages')
    .select('sender_id, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data
}

export async function fetchLastClassMessage(sb, classId) {
  const { data, error } = await sb
    .from('chat_class_messages')
    .select('sender_id, created_at')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data
}

export async function fetchLastCustomMessage(sb, conversationId) {
  const { data, error } = await sb
    .from('chat_custom_messages')
    .select('sender_id, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data
}
