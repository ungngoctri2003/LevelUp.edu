import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuthSession } from '../../context/AuthSessionContext'
import { supabase } from '../../lib/supabaseClient'
import { ModalPortal } from '../dashboard/ModalPortal'
import {
  btnPrimaryAdmin,
  btnPrimaryStudent,
  btnPrimaryTeacher,
  inputAdmin,
  modalBackdrop,
  modalPanelAdmin,
} from '../dashboard/dashboardStyles'

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   variant: 'student' | 'teacher' | 'admin',
 *   basePath: string,
 *   navigate: (path: string) => void,
 * }} props
 */
export default function NewConversationModal({ open, onClose, variant, basePath, navigate }) {
  const { user } = useAuthSession()
  const uid = user?.id
  const primaryBtn =
    variant === 'admin' ? btnPrimaryAdmin : variant === 'teacher' ? btnPrimaryTeacher : btnPrimaryStudent
  const [step, setStep] = useState('type')
  const [loading, setLoading] = useState(false)

  const [classes, setClasses] = useState([])
  const [rosterByClass, setRosterByClass] = useState({})
  const [studentRoster, setStudentRoster] = useState([])

  const [pickClassId, setPickClassId] = useState('')
  const [groupTitle, setGroupTitle] = useState('')
  const [selectedMembers, setSelectedMembers] = useState(() => new Set())

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  const reset = useCallback(() => {
    setStep('type')
    setPickClassId('')
    setGroupTitle('')
    setSelectedMembers(new Set())
    setStudentRoster([])
    setSearchQuery('')
    setSearchResults([])
  }, [])

  useEffect(() => {
    if (!open) {
      reset()
      return
    }
    if (!supabase || !uid) return
    if (variant !== 'student' && variant !== 'teacher') return
    let cancelled = false
    ;(async () => {
      try {
        if (variant === 'student') {
          const { data: en, error } = await supabase
            .from('class_enrollments')
            .select('class_id, classes(id, name)')
            .eq('student_id', uid)
          if (error) throw error
          const clsList = (en || []).map((r) => ({
            id: r.class_id,
            name: r.classes?.name || `Lớp ${r.class_id}`,
          }))
          const seen = new Set()
          if (!cancelled)
            setClasses(clsList.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true))))
        }
        if (variant === 'teacher') {
          const { data: cl, error: cErr } = await supabase
            .from('classes')
            .select('id, name')
            .eq('teacher_id', uid)
            .order('name', { ascending: true })
          if (cErr) throw cErr
          if (!cancelled) setClasses(cl || [])

          const classIds = (cl || []).map((c) => c.id)
          const byClass = {}
          if (classIds.length > 0) {
            const { data: ens, error: eErr } = await supabase
              .from('class_enrollments')
              .select('class_id, student_id, profiles(id, full_name, email)')
              .in('class_id', classIds)
            if (eErr) throw eErr
            for (const e of ens || []) {
              const sid = e.student_id
              const pr = e.profiles
              const label = pr?.full_name?.trim() || pr?.email || sid
              if (!byClass[e.class_id]) byClass[e.class_id] = []
              byClass[e.class_id].push({ id: sid, label })
            }
          }
          if (!cancelled) setRosterByClass(byClass)
        }
      } catch (e) {
        if (!cancelled) toast.error(e?.message || 'Không tải danh sách lớp')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, variant, uid, reset])

  const rosterForPick = useMemo(() => {
    if (!pickClassId) return []
    if (variant === 'student') return studentRoster
    return rosterByClass[Number(pickClassId)] || []
  }, [pickClassId, rosterByClass, studentRoster, variant])

  useEffect(() => {
    if (!open || variant !== 'student' || !pickClassId || !supabase || !uid) {
      setStudentRoster([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const cid = Number(pickClassId)
        const { data: cl, error: cErr } = await supabase
          .from('classes')
          .select('teacher_id')
          .eq('id', cid)
          .maybeSingle()
        if (cErr) throw cErr
        const { data: ens, error: eErr } = await supabase
          .from('class_enrollments')
          .select('student_id, profiles(id, full_name, email)')
          .eq('class_id', cid)
        if (eErr) throw eErr
        const rows = []
        const tid = cl?.teacher_id
        if (tid && tid !== uid) {
          const { data: tp } = await supabase.from('profiles').select('full_name, email').eq('id', tid).maybeSingle()
          rows.push({
            id: tid,
            label: tp?.full_name?.trim() || tp?.email || 'Giáo viên',
          })
        }
        for (const e of ens || []) {
          const sid = e.student_id
          if (sid === uid) continue
          const pr = e.profiles
          rows.push({
            id: sid,
            label: pr?.full_name?.trim() || pr?.email || sid,
          })
        }
        if (!cancelled) setStudentRoster(rows)
      } catch {
        if (!cancelled) setStudentRoster([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, variant, pickClassId, uid])

  useEffect(() => {
    if (!open || step !== 'search_user' || !supabase) {
      return undefined
    }
    const q = searchQuery.trim()
    if (q.length < 2) {
      setSearchResults([])
      return undefined
    }
    setSearchLoading(true)
    const t = window.setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('search_users_for_chat', {
          p_query: q,
          p_limit: 20,
        })
        if (error) throw error
        setSearchResults(data || [])
      } catch (e) {
        toast.error(e?.message || 'Không tìm được')
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 320)
    return () => window.clearTimeout(t)
  }, [open, step, searchQuery, supabase])

  const openDirectWithUser = async (otherId) => {
    if (!supabase || !uid) return
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('ensure_direct_thread', {
        p_other_user: otherId,
      })
      if (error) throw error
      onClose()
      reset()
      navigate(`${basePath}/dm/${data}`)
    } catch (e) {
      toast.error(e?.message || 'Không tạo được cuộc trò chuyện')
    } finally {
      setLoading(false)
    }
  }

  const startGroup = () => {
    setStep('pick_class')
  }

  const toggleMember = (mid) => {
    setSelectedMembers((prev) => {
      const n = new Set(prev)
      if (n.has(mid)) n.delete(mid)
      else n.add(mid)
      return n
    })
  }

  const createGroup = async () => {
    if (!supabase || !uid || !pickClassId) return
    const mids = [...selectedMembers]
    if (mids.length < 1) {
      toast.error('Chọn ít nhất một thành viên cùng với bạn')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('create_custom_group_chat', {
        p_class_id: Number(pickClassId),
        p_title: groupTitle.trim() || 'Nhóm',
        p_member_ids: mids,
      })
      if (error) throw error
      onClose()
      reset()
      navigate(`${basePath}/group/${data}`)
    } catch (e) {
      toast.error(e?.message || 'Không tạo được nhóm')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <ModalPortal>
      <div
        className={modalBackdrop}
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className={`${modalPanelAdmin} max-h-[85vh] w-full max-w-lg overflow-y-auto`}>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Đoạn chat mới</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Tìm người trong hệ thống hoặc tạo nhóm trong lớp.
          </p>

          {step === 'type' && (
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                className={primaryBtn}
                onClick={() => setStep('search_user')}
                disabled={loading}
              >
                Nhắn riêng
              </button>
              {(variant === 'student' || variant === 'teacher') && (
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800 dark:border-white/15 dark:text-white"
                  onClick={startGroup}
                  disabled={loading}
                >
                  Nhóm trong lớp
                </button>
              )}
              <button
                type="button"
                className="mt-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                onClick={onClose}
              >
                Đóng
              </button>
            </div>
          )}

          {step === 'search_user' && (
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Tìm theo tên hoặc email (ít nhất 2 ký tự)
              </label>
              <input
                className={inputAdmin}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ví dụ: nguyen hoặc @gmail"
                autoFocus
                autoComplete="off"
              />
              {searchLoading && <p className="text-sm text-slate-500">Đang tìm…</p>}
              <ul className="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/10">
                {searchResults.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-white/10"
                      disabled={loading}
                      onClick={() => openDirectWithUser(r.id)}
                    >
                      <span className="font-medium text-slate-900 dark:text-white">{r.full_name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{r.email}</span>
                      {r.role ? (
                        <span className="mt-0.5 block text-[10px] uppercase text-slate-400">{r.role}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
              {searchQuery.trim().length >= 2 && !searchLoading && searchResults.length === 0 && (
                <p className="text-sm text-slate-500">Không có kết quả.</p>
              )}
              <button
                type="button"
                className="text-sm text-violet-600 dark:text-violet-400"
                onClick={() => setStep('type')}
              >
                ← Quay lại
              </button>
            </div>
          )}

          {step === 'pick_class' && (
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Lớp</label>
              <select
                className={inputAdmin}
                value={pickClassId}
                onChange={(e) => {
                  setPickClassId(e.target.value)
                  setSelectedMembers(new Set())
                }}
              >
                <option value="">— Chọn lớp —</option>
                {classes.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              {variant === 'student' && classes.length === 0 && (
                <p className="text-sm text-slate-500">Bạn chưa ghi danh lớp nào.</p>
              )}
              {variant === 'teacher' && classes.length === 0 && (
                <p className="text-sm text-slate-500">Bạn chưa có lớp phụ trách.</p>
              )}
              {pickClassId && (
                <>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Tên nhóm (tuỳ chọn)
                  </label>
                  <input
                    className={inputAdmin}
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    placeholder="Ví dụ: Nhóm ôn tập"
                  />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Chọn thành viên (bạn đã được thêm tự động)
                  </p>
                  <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-white/10">
                    {rosterForPick.map((r) => (
                      <li key={r.id}>
                        <label className="flex cursor-pointer items-center gap-2 px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-white/5">
                          <input
                            type="checkbox"
                            checked={selectedMembers.has(r.id)}
                            onChange={() => toggleMember(r.id)}
                          />
                          {r.label}
                        </label>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className={primaryBtn} disabled={loading} onClick={createGroup}>
                    Tạo nhóm
                  </button>
                </>
              )}
              <button
                type="button"
                className="text-sm text-emerald-600 dark:text-emerald-400"
                onClick={() => setStep('type')}
              >
                ← Quay lại
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  )
}
