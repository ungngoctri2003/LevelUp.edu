import { useCallback, useEffect, useState } from 'react'
import { useAuthSession } from '../context/AuthSessionContext'
import { supabase } from '../lib/supabaseClient'

const PAGE = 80

/**
 * @param {{ kind: 'dm' | 'class' | 'group', id: string }} params
 */
export function useChatConversation({ kind, id }) {
  const { user } = useAuthSession()
  const uid = user?.id
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  const fetchMessages = useCallback(
    async ({ silent } = {}) => {
      if (!supabase || !uid || !kind || !id) {
        setMessages([])
        if (!silent) setLoading(false)
        return
      }
      if (!silent) setLoading(true)
      setError(null)
      try {
        if (kind === 'dm') {
          const { data, error: e } = await supabase
            .from('chat_dm_messages')
            .select('id, sender_id, body, created_at')
            .eq('thread_id', id)
            .order('created_at', { ascending: true })
            .limit(PAGE)
          if (e) throw e
          setMessages(data || [])
        } else if (kind === 'class') {
          const { data, error: e } = await supabase
            .from('chat_class_messages')
            .select('id, sender_id, body, created_at')
            .eq('class_id', Number(id))
            .order('created_at', { ascending: true })
            .limit(PAGE)
          if (e) throw e
          setMessages(data || [])
        } else if (kind === 'group') {
          const { data, error: e } = await supabase
            .from('chat_custom_messages')
            .select('id, sender_id, body, created_at')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true })
            .limit(PAGE)
          if (e) throw e
          setMessages(data || [])
        } else {
          setMessages([])
        }
      } catch (e) {
        setError(e?.message || 'Không tải tin nhắn')
        if (!silent) setMessages([])
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [kind, id, uid],
  )

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const markRead = useCallback(async () => {
    if (!supabase || !uid || !kind || !id) return
    const now = new Date().toISOString()
    try {
      if (kind === 'dm') {
        const { data: th } = await supabase
          .from('chat_dm_threads')
          .select('participant_low, participant_high')
          .eq('id', id)
          .maybeSingle()
        if (!th) return
        const patch =
          th.participant_low === uid ? { last_read_low: now } : { last_read_high: now }
        await supabase.from('chat_dm_threads').update(patch).eq('id', id)
      } else if (kind === 'class') {
        const cid = Number(id)
        await supabase.from('chat_class_read_state').upsert(
          { class_id: cid, user_id: uid, last_read_at: now },
          { onConflict: 'class_id,user_id' },
        )
      } else if (kind === 'group') {
        await supabase
          .from('chat_custom_conversation_members')
          .update({ last_read_at: now })
          .eq('conversation_id', id)
          .eq('user_id', uid)
      }
    } catch {
      /* ignore */
    }
  }, [kind, id, uid])

  useEffect(() => {
    if (!messages.length) return undefined
    const t = window.setTimeout(() => {
      markRead()
    }, 400)
    return () => window.clearTimeout(t)
  }, [messages, markRead])

  useEffect(() => {
    if (!supabase || !kind || !id) return undefined
    const table =
      kind === 'dm'
        ? 'chat_dm_messages'
        : kind === 'class'
          ? 'chat_class_messages'
          : 'chat_custom_messages'
    const filter =
      kind === 'dm'
        ? `thread_id=eq.${id}`
        : kind === 'class'
          ? `class_id=eq.${id}`
          : `conversation_id=eq.${id}`

    const channel = supabase
      .channel(`conv:${kind}:${id}`, { config: { broadcast: { self: false } } })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table, filter },
        () => fetchMessages({ silent: true }),
      )
      .subscribe((status) => {
        if (import.meta.env.DEV && status === 'CHANNEL_ERROR') {
          console.warn(
            `[chat] Realtime lỗi (${table}) — chạy migration 20260419_chat_realtime_publication.sql trên Supabase`,
          )
        }
      })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [kind, id, fetchMessages])

  const send = useCallback(
    async (body) => {
      const t = String(body || '').trim()
      if (!supabase || !uid || !kind || !id || !t) return { error: 'empty' }
      setSending(true)
      try {
        if (kind === 'dm') {
          const { error: e } = await supabase
            .from('chat_dm_messages')
            .insert({ thread_id: id, sender_id: uid, body: t })
          if (e) throw e
        } else if (kind === 'class') {
          const { error: e } = await supabase
            .from('chat_class_messages')
            .insert({ class_id: Number(id), sender_id: uid, body: t })
          if (e) throw e
        } else if (kind === 'group') {
          const { error: e } = await supabase
            .from('chat_custom_messages')
            .insert({ conversation_id: id, sender_id: uid, body: t })
          if (e) throw e
        }
        await fetchMessages({ silent: true })
        return { error: null }
      } catch (e) {
        return { error: e?.message || 'Không gửi được' }
      } finally {
        setSending(false)
      }
    },
    [kind, id, uid, fetchMessages],
  )

  return {
    messages,
    loading,
    sending,
    error,
    send,
    refetch: () => fetchMessages(),
    markRead,
  }
}
