import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthSession } from '../../context/AuthSessionContext'
import { useUnifiedChatInbox } from '../../hooks/useUnifiedChatInbox'
import { useChatConversation } from '../../hooks/useChatConversation'
import { supabase } from '../../lib/supabaseClient'
import { MoreVertical } from 'lucide-react'
import NewConversationModal from '../../components/messaging/NewConversationModal'
import PageLoading from '../../components/ui/PageLoading.jsx'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/Popover.jsx'
import { btnPrimaryAdmin, btnPrimaryStudent, btnPrimaryTeacher } from '../../components/dashboard/dashboardStyles'

function formatShortTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  if (sameDay) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
}

/** Dưới mỗi bubble: ngày/tháng/năm + giờ (vi-VN). */
function formatMessageDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Avatar giống Messenger: nền gradient chữ cái đầu */
function MessengerAvatar({ name, className = 'size-14 text-lg' }) {
  const label = (name || '?').trim() || '?'
  const initials =
    label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  return (
    <div
      title={label}
      className={`flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#0084ff] to-[#006edf] font-semibold text-white shadow-sm dark:from-[#2374ee] dark:to-[#1857b8] ${className}`}
      aria-hidden
    >
      {initials.slice(0, 2)}
    </div>
  )
}

function SendIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} aria-hidden>
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}

/**
 * @param {{ kind: 'dm' | 'class' | 'group', id: string, uid: string }} args
 * @returns {Promise<{ id: string, label: string, sub?: string }[]>}
 */
async function fetchChatMemberList(kind, id, uid) {
  if (!supabase || !uid) return []
  if (kind === 'dm') {
    const { data: th, error } = await supabase
      .from('chat_dm_threads')
      .select('participant_low, participant_high')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!th) throw new Error('Không tìm thấy hội thoại')
    const ids = [th.participant_low, th.participant_high]
    const { data: profs, error: e2 } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', ids)
    if (e2) throw e2
    const map = {}
    for (const p of profs || []) {
      map[p.id] = p.full_name?.trim() || p.email || p.id
    }
    return ids.map((pid) => ({
      id: pid,
      label: pid === uid ? 'Bạn' : map[pid] || 'Thành viên',
    }))
  }
  if (kind === 'group') {
    const { data: mem, error } = await supabase
      .from('chat_custom_conversation_members')
      .select('user_id')
      .eq('conversation_id', id)
    if (error) throw error
    const ids = [...new Set((mem || []).map((m) => m.user_id).filter(Boolean))]
    if (!ids.length) return []
    const { data: profs, error: e2 } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', ids)
    if (e2) throw e2
    const map = {}
    for (const p of profs || []) {
      map[p.id] = p.full_name?.trim() || p.email || p.id
    }
    return ids
      .map((pid) => ({
        id: pid,
        label: pid === uid ? 'Bạn' : map[pid] || 'Thành viên',
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'))
  }
  if (kind === 'class') {
    const cid = Number(id)
    if (!Number.isFinite(cid)) throw new Error('Lớp không hợp lệ')
    const { data: cls, error } = await supabase.from('classes').select('teacher_id').eq('id', cid).maybeSingle()
    if (error) throw error
    if (!cls?.teacher_id) throw new Error('Không tìm thấy lớp')
    const { data: en, error: e2 } = await supabase.from('class_enrollments').select('student_id').eq('class_id', cid)
    if (e2) throw e2
    const ids = [...new Set([cls.teacher_id, ...(en || []).map((r) => r.student_id)].filter(Boolean))]
    const { data: profs, error: e3 } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', ids)
    if (e3) throw e3
    const map = {}
    for (const p of profs || []) {
      map[p.id] = p.full_name?.trim() || p.email || p.id
    }
    const rows = ids.map((pid) => {
      const isTeacher = pid === cls.teacher_id
      return {
        id: pid,
        label: pid === uid ? 'Bạn' : map[pid] || 'Thành viên',
        sub: isTeacher ? 'Giáo viên' : 'Học viên',
      }
    })
    rows.sort((a, b) => {
      const ta = a.sub === 'Giáo viên' ? 0 : 1
      const tb = b.sub === 'Giáo viên' ? 0 : 1
      if (ta !== tb) return ta - tb
      return a.label.localeCompare(b.label, 'vi')
    })
    return rows
  }
  return []
}

/**
 * @param {{ kind: 'dm' | 'class' | 'group', conversationId: string, uid: string, onConversationRemoved: () => void }} props
 */
function ThreadConversationMenu({ kind, conversationId, uid, onConversationRemoved }) {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState('actions')
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleOpenChange = (next) => {
    setOpen(next)
    if (!next) {
      setPanel('actions')
      setMembersError(null)
    }
  }

  const openMembersPanel = () => {
    setPanel('members')
    setMembersLoading(true)
    setMembersError(null)
    setMembers([])
    fetchChatMemberList(kind, conversationId, uid)
      .then(setMembers)
      .catch((e) => {
        setMembersError(e?.message || 'Không tải được danh sách')
        setMembers([])
      })
      .finally(() => setMembersLoading(false))
  }

  const handleDelete = async () => {
    if (kind === 'class' || !supabase || !uid) return
    const msg =
      kind === 'dm'
        ? 'Xóa hội thoại này? Toàn bộ tin nhắn sẽ bị xóa cho cả hai người.'
        : 'Rời nhóm chat này? Bạn sẽ không còn thấy hội thoại trong danh sách.'
    if (!confirm(msg)) return
    setDeleting(true)
    try {
      if (kind === 'dm') {
        const { error } = await supabase.from('chat_dm_threads').delete().eq('id', conversationId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('chat_custom_conversation_members')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', uid)
        if (error) throw error
      }
      toast.success(kind === 'dm' ? 'Đã xóa hội thoại.' : 'Đã rời nhóm.')
      handleOpenChange(false)
      onConversationRemoved()
    } catch (e) {
      toast.error(e?.message || 'Thao tác thất bại')
    } finally {
      setDeleting(false)
    }
  }

  const showDelete = kind === 'dm' || kind === 'group'

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#65676b] hover:bg-black/5 dark:text-[#b0b3b8] dark:hover:bg-white/10"
          aria-label="Tùy chọn hội thoại"
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <MoreVertical className="size-5" strokeWidth={2} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(100vw-2rem,280px)] p-0" sideOffset={8}>
        {panel === 'actions' ? (
          <div className="py-1">
            <button
              type="button"
              className="flex w-full px-3 py-2.5 text-left text-[15px] text-[#050505] hover:bg-black/5 dark:text-[#e4e6eb] dark:hover:bg-white/10"
              onClick={openMembersPanel}
            >
              Thông tin thành viên
            </button>
            {showDelete ? (
              <button
                type="button"
                disabled={deleting}
                className="flex w-full px-3 py-2.5 text-left text-[15px] text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                onClick={handleDelete}
              >
                {kind === 'dm' ? 'Xóa đoạn chat' : 'Rời nhóm'}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="flex max-h-72 flex-col">
            <div className="flex items-center gap-1 border-b border-[#e4e6eb] px-2 py-2 dark:border-white/10">
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-full text-[#65676b] hover:bg-black/5 dark:text-[#b0b3b8] dark:hover:bg-white/10"
                onClick={() => setPanel('actions')}
                aria-label="Quay lại menu"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-[#050505] dark:text-[#e4e6eb]">Thành viên</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {membersLoading && (
                <div className="flex justify-center py-6">
                  <PageLoading variant="inline" />
                </div>
              )}
              {membersError && !membersLoading && (
                <p className="px-1 py-2 text-sm text-red-600 dark:text-red-400">{membersError}</p>
              )}
              {!membersLoading &&
                !membersError &&
                members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-black/4 dark:hover:bg-white/5">
                    <MessengerAvatar name={m.label} className="size-9 shrink-0 text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] text-[#050505] dark:text-[#e4e6eb]">{m.label}</p>
                      {m.sub ? (
                        <p className="truncate text-xs text-[#65676b] dark:text-[#b0b3b8]">{m.sub}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              {!membersLoading && !membersError && members.length === 0 && (
                <p className="py-4 text-center text-sm text-[#65676b] dark:text-[#b0b3b8]">Chưa có dữ liệu.</p>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

/**
 * @param {{ kind: string, id: string, onBack: () => void, basePath: string, title: string, subtitle?: string, onConversationRemoved: () => void }} props
 */
function ThreadPanel({ kind, id, onBack, basePath, title, subtitle, onConversationRemoved }) {
  const { user } = useAuthSession()
  const uid = user?.id
  const { messages, loading, sending, error, send } = useChatConversation({ kind, id })
  const [draft, setDraft] = useState('')
  const [senderNames, setSenderNames] = useState({})
  const fetchedSenderIdsRef = useRef(new Set())
  const messagesScrollRef = useRef(null)

  useEffect(() => {
    setSenderNames({})
    fetchedSenderIdsRef.current = new Set()
  }, [kind, id])

  useEffect(() => {
    if (!supabase || !messages.length || (kind !== 'class' && kind !== 'group')) return
    const ids = [...new Set(messages.map((m) => m.sender_id).filter(Boolean))]
    const need = ids.filter((sid) => sid && sid !== uid && !fetchedSenderIdsRef.current.has(sid))
    if (!need.length) return
    let cancelled = false
    need.forEach((sid) => fetchedSenderIdsRef.current.add(sid))
    ;(async () => {
      const { data, error: qErr } = await supabase.from('profiles').select('id, full_name').in('id', need)
      if (cancelled || qErr) {
        need.forEach((sid) => fetchedSenderIdsRef.current.delete(sid))
        return
      }
      setSenderNames((prev) => {
        const next = { ...prev }
        for (const row of data || []) {
          next[row.id] = row.full_name?.trim() || '?'
        }
        return next
      })
    })()
    return () => {
      cancelled = true
    }
  }, [messages, kind, uid])

  useEffect(() => {
    if (loading) return
    const el = messagesScrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [loading, messages])

  const submit = async (e) => {
    e.preventDefault()
    const t = draft.trim()
    if (!t) return
    const { error: err } = await send(t)
    if (err) toast.error(err)
    else setDraft('')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dadde1] bg-white shadow-sm dark:border-white/10 dark:bg-[#242526]">
      {/* Header kiểu Messenger */}
      <header className="flex shrink-0 items-center gap-3 border-b border-[#e4e6eb] px-3 py-2.5 dark:border-white/10 dark:bg-[#242526]">
        <Link
          to={basePath}
          className="inline-flex size-10 items-center justify-center rounded-full text-[#0084ff] hover:bg-black/5 dark:text-[#4599ff] dark:hover:bg-white/10 md:hidden"
          aria-label="Danh sách hội thoại"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </Link>
        <button
          type="button"
          className="hidden size-10 items-center justify-center rounded-full text-[#65676b] hover:bg-black/5 dark:text-[#b0b3b8] dark:hover:bg-white/10 md:inline-flex"
          onClick={onBack}
          aria-label="Quay lại"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <MessengerAvatar name={title} className="size-10 shrink-0 text-sm" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-[#050505] dark:text-[#e4e6eb]">{title}</h3>
          {subtitle ? (
            <p className="truncate text-xs text-[#65676b] dark:text-[#b0b3b8]">{subtitle}</p>
          ) : null}
        </div>
        {uid ? (
          <ThreadConversationMenu
            kind={kind}
            conversationId={id}
            uid={uid}
            onConversationRemoved={onConversationRemoved}
          />
        ) : null}
      </header>

      {error && (
        <p className="shrink-0 px-4 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Vùng tin nhắn: nền xám nhạt giống thread Messenger */}
      <div
        ref={messagesScrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#f0f2f5] px-3 py-4 dark:bg-[#18191a]"
      >
        {loading && <PageLoading variant="inline" />}
        {!loading &&
          messages.map((m, idx) => {
            const mine = m.sender_id === uid
            const prev = messages[idx - 1]
            const next = messages[idx + 1]
            const samePrev = prev && prev.sender_id === m.sender_id
            const sameNext = next && next.sender_id === m.sender_id
            const marginT = samePrev ? 'mt-0.5' : 'mt-2'
            const bubbleBase = mine
              ? 'rounded-[18px] bg-[#0084ff] text-white dark:bg-[#2374ee]'
              : 'rounded-[18px] bg-[#e4e6eb] text-[#050505] dark:bg-[#3e4042] dark:text-[#e4e6eb]'
            const bubbleTail = mine
              ? `${samePrev ? 'rounded-tr-md' : ''} ${sameNext ? 'rounded-br-md' : 'rounded-br-sm'}`.trim()
              : `${samePrev ? 'rounded-tl-md' : ''} ${sameNext ? 'rounded-bl-md' : 'rounded-bl-sm'}`.trim()
            const avatarName = mine
              ? user?.name || user?.email || 'Bạn'
              : kind === 'dm'
                ? title
                : senderNames[m.sender_id] || '?'
            const showSenderLabel = !samePrev
            return (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${marginT} ${mine ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <MessengerAvatar name={avatarName} className="size-8 shrink-0 text-[10px]" />
                <div
                  className={`flex min-w-0 max-w-[78%] flex-col gap-0.5 ${mine ? 'items-end' : 'items-start'}`}
                >
                  {showSenderLabel ? (
                    <span
                      className={`max-w-full truncate px-1 text-[12px] font-semibold text-[#65676b] dark:text-[#b0b3b8] ${
                        mine ? 'text-right' : 'text-left'
                      }`}
                    >
                      {avatarName}
                    </span>
                  ) : null}
                  <div
                    className={`w-fit max-w-full px-3 py-1.5 text-[15px] leading-snug shadow-[0_1px_0.5px_rgba(0,0,0,0.08)] ${bubbleBase} ${bubbleTail}`}
                  >
                  <p className="whitespace-pre-wrap wrap-break-word">{m.body}</p>
                  <time
                    dateTime={m.created_at}
                    className={`mt-0.5 block text-right text-[11px] tabular-nums ${
                      mine ? 'text-white/70' : 'text-[#65676b] dark:text-[#b0b3b8]'
                    }`}
                  >
                    {formatMessageDateTime(m.created_at)}
                  </time>
                  </div>
                </div>
              </div>
            )
          })}
        {!loading && messages.length === 0 && (
          <p className="py-12 text-center text-sm text-[#65676b] dark:text-[#b0b3b8]">Chưa có tin nhắn.</p>
        )}
      </div>

      {/* Composer: ô bo tròn + nút gửi tròn */}
      <form
        onSubmit={submit}
        className="shrink-0 border-t border-[#e4e6eb] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-[#242526]"
      >
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1 rounded-full bg-[#f0f2f5] px-4 py-2 dark:bg-[#3a3b3c]">
            <input
              className="w-full border-0 bg-transparent text-[15px] text-[#050505] outline-none ring-0 placeholder:text-[#65676b] dark:text-[#e4e6eb] dark:placeholder:text-[#b0b3b8]"
              placeholder="Aa"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={8000}
              aria-label="Nhập tin nhắn"
            />
          </div>
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0084ff] text-white shadow-sm transition-opacity hover:bg-[#006edf] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#2374ee] dark:hover:bg-[#1857b8]"
            aria-label="Gửi"
          >
            <SendIcon className="size-5 translate-x-px" />
          </button>
        </div>
      </form>
    </div>
  )
}

/**
 * @param {{ variant: 'student' | 'teacher' | 'admin', basePath: string }} props
 */
export default function ChatHubPage({ variant, basePath }) {
  const { kind, id } = useParams()
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const inbox = useUnifiedChatInbox({ variant })

  useEffect(() => {
    if (kind === 'staff' && id) {
      navigate(`${basePath}/dm/${encodeURIComponent(id)}`, { replace: true })
    }
  }, [kind, id, basePath, navigate])

  const active = useMemo(() => {
    if (!kind || !id) return null
    if (kind === 'staff') return { kind: 'dm', id }
    if (!['dm', 'class', 'group'].includes(kind)) return null
    return { kind, id }
  }, [kind, id])

  const activeMeta = useMemo(() => {
    if (!active) return null
    const row = inbox.items.find(
      (i) => i.kind === active.kind && String(i.id) === String(active.id),
    )
    return row || { title: 'Hội thoại', subtitle: '' }
  }, [active, inbox.items])

  const title = 'Tin nhắn'
  const newChatBtn =
    variant === 'admin' ? btnPrimaryAdmin : variant === 'teacher' ? btnPrimaryTeacher : btnPrimaryStudent

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#050505] dark:text-white">{title}</h2>
          <p className="text-[15px] text-[#65676b] dark:text-[#b0b3b8]">Trao đổi với lớp và cá nhân.</p>
        </div>
        <button type="button" className={newChatBtn} onClick={() => setModalOpen(true)}>
          Đoạn chat mới
        </button>
      </div>

      <NewConversationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        variant={variant}
        basePath={basePath}
        navigate={(path) => navigate(path)}
      />

      {/* Tràn ngang gần hết cột nội dung (vượt max-width 72rem), không kéo full chiều cao màn hình */}
      <div className="relative left-1/2 min-w-0 w-[calc(100vw-2rem)] max-w-none -translate-x-1/2 lg:w-[calc(100vw-272px-4rem)]">
        <div className="grid h-[min(75vh,720px)] min-h-[min(75vh,720px)] gap-0 overflow-hidden rounded-xl border border-[#dadde1] bg-[#f0f2f5] shadow-md dark:border-white/10 dark:bg-[#18191a] md:grid-cols-[minmax(0,360px)_1fr] md:gap-px md:bg-[#dadde1] dark:md:bg-white/10">
        <div
          className={`flex min-h-0 flex-col bg-white dark:bg-[#242526] ${
            active ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="border-b border-[#e4e6eb] px-3 py-3 dark:border-white/10">
            <div className="flex items-center gap-2 rounded-full bg-[#f0f2f5] px-3 py-2 dark:bg-[#3a3b3c]">
              <svg
                className="size-4 shrink-0 text-[#65676b] dark:text-[#b0b3b8]"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input
                type="search"
                readOnly
                tabIndex={-1}
                className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-[#050505] outline-none placeholder:text-[#65676b] dark:text-[#e4e6eb] dark:placeholder:text-[#b0b3b8]"
                placeholder="Tìm kiếm hội thoại"
                aria-label="Tìm kiếm hội thoại (sắp có)"
              />
            </div>
          </div>
          {inbox.error && <p className="p-4 text-sm text-red-600 dark:text-red-400">{inbox.error}</p>}
          {inbox.loading && (
            <div className="flex flex-1 items-center justify-center p-8">
              <PageLoading variant="inline" />
            </div>
          )}
          {!inbox.loading && (
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {inbox.items.length === 0 && (
                <li className="px-4 py-12 text-center text-[15px] text-[#65676b] dark:text-[#b0b3b8]">
                  Chưa có hội thoại.
                </li>
              )}
              {inbox.items.map((row) => {
                const href = `${basePath}/${row.kind}/${row.id}`
                const isActive =
                  active && active.kind === row.kind && String(active.id) === String(row.id)
                const unread = Boolean(row.unread)
                const listUnread = unread && !isActive
                return (
                  <li key={`${row.kind}-${row.id}`}>
                    <Link
                      to={href}
                      className={`flex gap-3 border-l-[3px] py-2.5 pl-[9px] pr-3 transition-colors hover:bg-black/4 dark:hover:bg-white/5 ${
                        listUnread
                          ? 'border-[#0084ff] bg-[#e8f3ff] dark:border-[#4599ff] dark:bg-[#1a2a3d]'
                          : 'border-transparent'
                      } ${isActive ? 'bg-[#e7f3ff] dark:bg-[#263951]' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className="relative shrink-0">
                        <MessengerAvatar name={row.title} />
                        {listUnread ? (
                          <span
                            className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[#e8f3ff] bg-[#0084ff] dark:border-[#1a2a3d] dark:bg-[#4599ff]"
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={`truncate text-[15px] text-[#050505] dark:text-[#e4e6eb] ${
                              listUnread ? 'font-bold' : 'font-semibold'
                            }`}
                          >
                            {row.title}
                          </p>
                          <time
                            className={`shrink-0 text-xs tabular-nums ${
                              listUnread
                                ? 'font-semibold text-[#0084ff] dark:text-[#4599ff]'
                                : 'text-[#65676b] dark:text-[#b0b3b8]'
                            }`}
                            dateTime={row.updatedAt}
                          >
                            {formatShortTime(row.updatedAt)}
                          </time>
                        </div>
                        <p
                          className={`truncate text-[13px] ${
                            listUnread
                              ? 'font-medium text-[#050505] dark:text-[#e4e6eb]'
                              : 'text-[#65676b] dark:text-[#b0b3b8]'
                          }`}
                        >
                          {row.subtitle}
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div
          className={`min-h-0 min-w-0 bg-white dark:bg-[#242526] ${active ? 'flex min-h-0 flex-col' : 'hidden min-h-[min(75vh,720px)] md:flex md:min-h-0 md:flex-col'}`}
        >
          {active ? (
            <ThreadPanel
              kind={active.kind}
              id={active.id}
              basePath={basePath}
              title={activeMeta?.title ?? 'Hội thoại'}
              subtitle={activeMeta?.subtitle ?? ''}
              onBack={() => navigate(basePath)}
              onConversationRemoved={() => {
                navigate(basePath)
                inbox.refetch()
              }}
            />
          ) : (
            <div className="flex min-h-[min(75vh,720px)] flex-col items-center justify-center gap-4 px-6 text-center md:min-h-0 md:flex-1">
              <div className="flex size-24 items-center justify-center rounded-full bg-linear-to-br from-[#0084ff] to-[#006edf] text-4xl text-white shadow-lg dark:from-[#2374ee] dark:to-[#1857b8]">
                <svg viewBox="0 0 24 24" className="size-12" fill="currentColor" aria-hidden>
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                </svg>
              </div>
              <p className="max-w-sm text-[15px] text-[#65676b] dark:text-[#b0b3b8]">
                Chọn một hội thoại ở cột bên trái hoặc bắt đầu đoạn chat mới.
              </p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}
