import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthSession } from '../context/AuthSessionContext'
import { supabase } from '../lib/supabaseClient'
import {
  fetchLastClassMessage,
  fetchLastCustomMessage,
  fetchLastDmMessage,
  hasUnreadFromOthers,
} from '../lib/chatUnreadUtils'

/**
 * Số hội thoại có tin từ người khác chưa đọc (người gửi tin cuối không tính).
 * @param {{ variant: 'student' | 'teacher' | 'admin' }} opts
 */
export function useChatUnreadCount({ variant }) {
  const { user } = useAuthSession()
  const uid = user?.id
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const compute = useCallback(
    async ({ silent } = {}) => {
      if (!supabase || !uid) {
        setUnreadCount(0)
        if (!silent) setLoading(false)
        return
      }
      if (!silent) setLoading(true)
      try {
        let n = 0

        const { data: dm, error: eDm } = await supabase
          .from('chat_dm_threads')
          .select('id, participant_low, participant_high, last_read_low, last_read_high')
          .or(`participant_low.eq.${uid},participant_high.eq.${uid}`)
        if (eDm) throw eDm
        const dmList = dm || []
        const dmLastMsgs = await Promise.all(dmList.map((t) => fetchLastDmMessage(supabase, t.id)))
        for (let i = 0; i < dmList.length; i++) {
          const row = dmList[i]
          const myRead = row.participant_low === uid ? row.last_read_low : row.last_read_high
          if (hasUnreadFromOthers(dmLastMsgs[i], uid, myRead)) n++
        }

        if (variant === 'student' || variant === 'teacher') {
          let classIds = []
          if (variant === 'student') {
            const { data: en, error: eEn } = await supabase
              .from('class_enrollments')
              .select('class_id')
              .eq('student_id', uid)
            if (eEn) throw eEn
            classIds = (en || []).map((r) => r.class_id)
          } else {
            const { data: cl, error: eCl } = await supabase
              .from('classes')
              .select('id')
              .eq('teacher_id', uid)
            if (eCl) throw eCl
            classIds = (cl || []).map((r) => r.id)
          }

          if (classIds.length > 0) {
            const { data: reads } = await supabase
              .from('chat_class_read_state')
              .select('class_id, last_read_at')
              .eq('user_id', uid)
              .in('class_id', classIds)
            const readMap = Object.fromEntries((reads || []).map((r) => [r.class_id, r.last_read_at]))
            const classLastMsgs = await Promise.all(classIds.map((id) => fetchLastClassMessage(supabase, id)))
            classIds.forEach((cid, i) => {
              if (hasUnreadFromOthers(classLastMsgs[i], uid, readMap[cid])) n++
            })
          }

          const { data: mem, error: eMem } = await supabase
            .from('chat_custom_conversation_members')
            .select('conversation_id, last_read_at')
            .eq('user_id', uid)
          if (eMem) throw eMem
          const cids = [...new Set((mem || []).map((m) => m.conversation_id).filter(Boolean))]
          if (cids.length > 0) {
            const { data: convs, error: eConv } = await supabase
              .from('chat_custom_conversations')
              .select('id')
              .in('id', cids)
            if (eConv) throw eConv
            const memMap = Object.fromEntries((mem || []).map((m) => [m.conversation_id, m.last_read_at]))
            const groupLastMsgs = await Promise.all(
              (convs || []).map((c) => fetchLastCustomMessage(supabase, c.id)),
            )
            ;(convs || []).forEach((c, i) => {
              if (hasUnreadFromOthers(groupLastMsgs[i], uid, memMap[c.id])) n++
            })
          }
        }

        setUnreadCount(n)
      } catch {
        setUnreadCount(0)
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [uid, variant],
  )

  useEffect(() => {
    compute()
  }, [compute])

  useEffect(() => {
    if (!supabase || !uid) return undefined
    const refetch = () => compute({ silent: true })

    const dmCh = supabase
      .channel(`chat_unread_dm:${uid}`)
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

    dmCh.subscribe()
    const channels = [dmCh]

    if (variant === 'student' || variant === 'teacher') {
      const cg = supabase
        .channel(`chat_unread_cg:${uid}`)
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
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_custom_conversation_members',
            filter: `user_id=eq.${uid}`,
          },
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
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'chat_custom_conversations' },
          refetch,
        )
      cg.subscribe()
      channels.push(cg)
    }

    return () => {
      for (const ch of channels) supabase.removeChannel(ch)
    }
  }, [uid, variant, compute])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') compute({ silent: true })
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [compute])

  return useMemo(
    () => ({
      unreadCount,
      loading,
      refetch: () => compute(),
    }),
    [unreadCount, loading, compute],
  )
}
