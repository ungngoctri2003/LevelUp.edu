import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthSession } from '../context/AuthSessionContext'
import { supabase } from '../lib/supabaseClient'
import {
  fetchLastClassMessage,
  fetchLastCustomMessage,
  fetchLastDmMessage,
  hasUnreadFromOthers,
} from '../lib/chatUnreadUtils'

function maxDate(a, b) {
  const ta = a ? new Date(a).getTime() : 0
  const tb = b ? new Date(b).getTime() : 0
  return ta >= tb ? a : b
}

async function fetchProfileMap(sb, ids) {
  const u = [...new Set((ids || []).filter(Boolean))]
  if (u.length === 0) return {}
  const { data, error } = await sb.from('profiles').select('id, full_name, email').in('id', u)
  if (error) throw error
  const m = {}
  for (const p of data || []) {
    m[p.id] = p.full_name?.trim() || p.email || p.id
  }
  return m
}

/**
 * @param {{ variant: 'student' | 'teacher' | 'admin' }} opts
 */
export function useUnifiedChatInbox(opts) {
  const { variant } = opts
  const { user } = useAuthSession()
  const uid = user?.id
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(
    async ({ silent } = {}) => {
      if (!supabase || !uid) {
        setItems([])
        if (!silent) setLoading(false)
        return
      }
      if (!silent) setLoading(true)
      setError(null)
      try {
        const out = []

        const { data: dm, error: e2 } = await supabase
          .from('chat_dm_threads')
          .select('id, participant_low, participant_high, updated_at, last_read_low, last_read_high')
          .or(`participant_low.eq.${uid},participant_high.eq.${uid}`)
          .order('updated_at', { ascending: false })
        if (e2) throw e2
        const dmList = dm || []
        const dmIds = dmList.flatMap((t) => [t.participant_low, t.participant_high])
        const dmap = await fetchProfileMap(supabase, dmIds)
        const dmLastMsgs = await Promise.all(dmList.map((t) => fetchLastDmMessage(supabase, t.id)))
        dmList.forEach((t, i) => {
          const other = t.participant_low === uid ? t.participant_high : t.participant_low
          const myRead = t.participant_low === uid ? t.last_read_low : t.last_read_high
          out.push({
            kind: 'dm',
            id: t.id,
            title: dmap[other] || 'Tin nhắn',
            subtitle: 'Nhắn riêng',
            updatedAt: t.updated_at,
            unread: hasUnreadFromOthers(dmLastMsgs[i], uid, myRead),
          })
        })

        if (variant === 'student' || variant === 'teacher') {
          let classRows = []
          if (variant === 'student') {
            const { data: en, error: e3 } = await supabase
              .from('class_enrollments')
              .select('class_id, classes(id, name)')
              .eq('student_id', uid)
            if (e3) throw e3
            classRows = (en || []).map((r) => ({
              id: r.class_id,
              name: r.classes?.name || `Lớp ${r.class_id}`,
            }))
          } else {
            const { data: cl, error: e3 } = await supabase
              .from('classes')
              .select('id, name')
              .eq('teacher_id', uid)
              .order('id', { ascending: true })
            if (e3) throw e3
            classRows = (cl || []).map((c) => ({ id: c.id, name: c.name }))
          }
          const classLastMsgs = await Promise.all(classRows.map((c) => fetchLastClassMessage(supabase, c.id)))
          let classReadMap = {}
          if (classRows.length > 0) {
            const { data: reads, error: eRead } = await supabase
              .from('chat_class_read_state')
              .select('class_id, last_read_at')
              .eq('user_id', uid)
              .in(
                'class_id',
                classRows.map((c) => c.id),
              )
            if (eRead) throw eRead
            classReadMap = Object.fromEntries((reads || []).map((r) => [r.class_id, r.last_read_at]))
          }
          classRows.forEach((c, i) => {
            const last = classLastMsgs[i]
            const updatedAt = maxDate(last?.created_at, null) || new Date(0).toISOString()
            out.push({
              kind: 'class',
              id: String(c.id),
              title: c.name,
              subtitle: 'Chat lớp',
              updatedAt,
              unread: hasUnreadFromOthers(last, uid, classReadMap[c.id]),
            })
          })
        }

        if (variant === 'student' || variant === 'teacher') {
          const { data: mem, error: e4 } = await supabase
            .from('chat_custom_conversation_members')
            .select('conversation_id, last_read_at')
            .eq('user_id', uid)
          if (e4) throw e4
          const cids = [...new Set((mem || []).map((m) => m.conversation_id).filter(Boolean))]
          if (cids.length > 0) {
            const memReadMap = Object.fromEntries((mem || []).map((m) => [m.conversation_id, m.last_read_at]))
            const { data: convs, error: e4b } = await supabase
              .from('chat_custom_conversations')
              .select('id, title, updated_at')
              .in('id', cids)
            if (e4b) throw e4b
            const convList = convs || []
            const groupLastMsgs = await Promise.all(convList.map((c) => fetchLastCustomMessage(supabase, c.id)))
            convList.forEach((conv, i) => {
              out.push({
                kind: 'group',
                id: conv.id,
                title: conv.title?.trim() || 'Nhóm',
                subtitle: 'Nhóm trong lớp',
                updatedAt: conv.updated_at,
                unread: hasUnreadFromOthers(groupLastMsgs[i], uid, memReadMap[conv.id]),
              })
            })
          }
        }

        out.sort((a, b) => {
          const ta = new Date(a.updatedAt || 0).getTime()
          const tb = new Date(b.updatedAt || 0).getTime()
          return tb - ta
        })
        setItems(out)
      } catch (e) {
        setError(e?.message || 'Không tải được danh sách chat')
        if (!silent) setItems([])
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [uid, variant],
  )

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!supabase || !uid) return undefined
    const refetch = () => load({ silent: true })

    const dmCh = supabase
      .channel(`inbox_dm:${uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_dm_threads', filter: `participant_low=eq.${uid}` },
        refetch,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_dm_threads', filter: `participant_high=eq.${uid}` },
        refetch,
      )

    const channels = [
      dmCh.subscribe((status) => {
        if (import.meta.env.DEV && status === 'CHANNEL_ERROR') {
          console.warn('[chat inbox] Realtime DM channel error — bật publication trên Supabase (migration 20260419)')
        }
      }),
    ]

    if (variant === 'student' || variant === 'teacher') {
      const classAndGroup = supabase
        .channel(`inbox_class_group:${uid}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_class_messages' },
          refetch,
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_custom_messages' },
          refetch,
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_custom_conversation_members',
            filter: `user_id=eq.${uid}`,
          },
          refetch,
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'chat_custom_conversations' },
          refetch,
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_class_read_state',
            filter: `user_id=eq.${uid}`,
          },
          refetch,
        )

      channels.push(classAndGroup.subscribe())
    }

    return () => {
      for (const c of channels) supabase.removeChannel(c)
    }
  }, [uid, variant, load])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') load({ silent: true })
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [load])

  return useMemo(
    () => ({
      items,
      loading,
      error,
      refetch: () => load(),
    }),
    [items, loading, error, load],
  )
}
