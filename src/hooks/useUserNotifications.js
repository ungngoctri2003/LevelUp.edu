import { useCallback, useEffect, useState } from 'react'
import { useAuthSession } from '../context/AuthSessionContext'
import { supabase } from '../lib/supabaseClient'

const LIST_LIMIT = 20

/**
 * Danh sách thông báo của user đăng nhập (Supabase RLS).
 * Badge unread dùng count riêng; Realtime refetch khi bảng thay đổi (cần bật replication trên Supabase).
 */
export function useUserNotifications() {
  const { user } = useAuthSession()
  const uid = user?.id
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNotifications = useCallback(async ({ silent } = {}) => {
    if (!supabase || !uid) {
      setItems([])
      setUnreadCount(0)
      if (!silent) setLoading(false)
      return
    }
    if (!silent) setLoading(true)
    setError(null)
    try {
      const [listRes, countRes] = await Promise.all([
        supabase
          .from('user_notifications')
          .select('id, title, body, link_path, kind, read_at, created_at')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(LIST_LIMIT),
        supabase
          .from('user_notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .is('read_at', null),
      ])
      if (listRes.error) throw listRes.error
      if (countRes.error) throw countRes.error
      setItems(listRes.data || [])
      setUnreadCount(countRes.count ?? 0)
    } catch (e) {
      setError(e?.message || 'Không tải được thông báo')
      if (!silent) {
        setItems([])
        setUnreadCount(0)
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [uid])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!supabase || !uid) return undefined
    const channel = supabase
      .channel(`user_notifications:${uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${uid}`,
        },
        () => {
          fetchNotifications({ silent: true })
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [uid, fetchNotifications])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchNotifications({ silent: true })
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [fetchNotifications])

  const markRead = useCallback(
    async (id) => {
      if (!supabase || !uid) return
      const readAt = new Date().toISOString()
      const { error: e } = await supabase
        .from('user_notifications')
        .update({ read_at: readAt })
        .eq('id', id)
        .eq('user_id', uid)
      if (e) return
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read_at: readAt } : x)))
      await fetchNotifications({ silent: true })
    },
    [uid, fetchNotifications],
  )

  const markAllRead = useCallback(async () => {
    if (!supabase || !uid) return
    const readAt = new Date().toISOString()
    const { error: e } = await supabase
      .from('user_notifications')
      .update({ read_at: readAt })
      .eq('user_id', uid)
      .is('read_at', null)
    if (!e) await fetchNotifications({ silent: true })
  }, [uid, fetchNotifications])

  return {
    items,
    loading,
    error,
    unreadCount,
    markRead,
    markAllRead,
    refetch: () => fetchNotifications(),
  }
}
