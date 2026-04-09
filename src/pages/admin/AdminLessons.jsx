import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import {
  inputAdmin,
  btnPrimaryAdmin,
  tableHeadAdmin,
  tableBodyAdmin,
  tableRowHover,
  tableShell,
  modalBackdrop,
  modalPanelAdmin,
  labelAdmin,
  btnSecondaryAdmin,
} from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import * as srv from '../../services/adminServerApi.js'

const classEmptyDraft = { class_id: '', title: '', duration_display: '45 phút' }

const tabBtn =
  'rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors sm:px-5 sm:py-3 sm:text-base'

export default function AdminLessons() {
  const { session } = useAuthSession()
  const token = session?.access_token
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'lop' ? 'lop' : 'online'

  const setTab = (next) => {
    if (next === 'lop') setSearchParams({ tab: 'lop' }, { replace: true })
    else setSearchParams({}, { replace: true })
  }

  // --- Trực tuyến (lessons) ---
  const [subjects, setSubjects] = useState([])
  const [lessons, setLessons] = useState([])
  const [onlineLoading, setOnlineLoading] = useState(true)
  const [draft, setDraft] = useState({
    subject_id: '',
    title: '',
    duration_minutes: '',
    level_label: '',
    sort_order: 0,
  })

  const loadOnline = useCallback(async () => {
    if (!token) {
      setSubjects([])
      setLessons([])
      setOnlineLoading(false)
      return
    }
    setOnlineLoading(true)
    try {
      const [subRes, lesRes] = await Promise.all([
        srv.adminListSubjectsApi(token),
        srv.adminListLessons(token),
      ])
      setSubjects(subRes.data || [])
      setLessons(lesRes.data || [])
    } catch (e) {
      if (import.meta.env.DEV) console.error('[AdminLessons online]', e)
      toast.error('Không tải được danh sách bài giảng trực tuyến.')
    } finally {
      setOnlineLoading(false)
    }
  }, [token])

  // --- Trong lớp (teacher_lesson_posts) ---
  const [posts, setPosts] = useState([])
  const [classes, setClasses] = useState([])
  const [lopLoading, setLopLoading] = useState(false)
  const [classDraft, setClassDraft] = useState(classEmptyDraft)
  const [editing, setEditing] = useState(null)

  const loadLop = useCallback(async () => {
    if (!token) {
      setPosts([])
      setClasses([])
      setLopLoading(false)
      return
    }
    setLopLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([
        srv.adminListTeacherLessonPosts(token),
        srv.adminListClasses(token),
      ])
      setPosts(pRes.data || [])
      setClasses(cRes.data || [])
    } catch (e) {
      if (import.meta.env.DEV) console.error('[AdminLessons lop]', e)
      toast.error('Không tải được danh sách bài giảng lớp.')
    } finally {
      setLopLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadOnline()
  }, [loadOnline])

  useEffect(() => {
    if (tab === 'lop') loadLop()
  }, [tab, loadLop])

  const firstSid = subjects[0]?.id
  const firstClassId = classes[0]?.id

  const addOnline = async (e) => {
    e.preventDefault()
    if (!token || !draft.title.trim()) return
    const sid = Number(draft.subject_id) || Number(firstSid)
    if (!Number.isFinite(sid)) {
      toast.warning('Chưa có môn — hãy tạo môn trước.')
      return
    }
    try {
      await srv.adminCreateLesson(token, {
        subject_id: sid,
        title: draft.title.trim(),
        duration_minutes: draft.duration_minutes === '' ? null : Number(draft.duration_minutes),
        level_label: draft.level_label.trim() || null,
        sort_order: Number(draft.sort_order) || 0,
      })
      setDraft((d) => ({ ...d, title: '', duration_minutes: '', level_label: '' }))
      await loadOnline()
    } catch (e2) {
      toastActionError(e2, 'Không thêm được bài giảng.')
    }
  }

  const removeOnline = async (row) => {
    if (!token || !confirm(`Xóa bài "${row.title}"?`)) return
    try {
      await srv.adminDeleteLessonApi(token, row.id, row.title)
      await loadOnline()
    } catch (e2) {
      toastActionError(e2, 'Không xóa được bài giảng.')
    }
  }

  const addLop = async (e) => {
    e.preventDefault()
    if (!token) return
    const cid = Number(classDraft.class_id) || Number(firstClassId)
    if (!Number.isFinite(cid)) {
      toast.warning('Chưa có lớp nào — tạo lớp ở mục Lớp & học viên trước.')
      return
    }
    if (!classDraft.title.trim()) return
    try {
      await srv.adminCreateTeacherLessonPost(token, {
        class_id: cid,
        title: classDraft.title.trim(),
        duration_display: classDraft.duration_display.trim() || null,
      })
      setClassDraft(classEmptyDraft)
      toast.success('Đã thêm bài giảng lớp.')
      await loadLop()
    } catch (e2) {
      toastActionError(e2, 'Không thêm được bài giảng.')
    }
  }

  const saveEditLop = async (e) => {
    e.preventDefault()
    if (!token || !editing) return
    if (!editing.title.trim()) return
    try {
      await srv.adminPatchTeacherLessonPost(token, editing.id, {
        class_id: Number(editing.class_id),
        title: editing.title.trim(),
        duration_display: editing.duration_display?.trim() || null,
      })
      setEditing(null)
      toast.success('Đã cập nhật.')
      await loadLop()
    } catch (e2) {
      toastActionError(e2, 'Không cập nhật được.')
    }
  }

  const removeLop = async (row) => {
    if (!token || !confirm(`Xóa bài "${row.title}"?`)) return
    try {
      await srv.adminDeleteTeacherLessonPostApi(token, row.id, row.title)
      toast.success('Đã xóa.')
      await loadLop()
    } catch (e2) {
      toastActionError(e2, 'Không xóa được.')
    }
  }

  const field = `${inputAdmin} mt-1 w-full`

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bài giảng"
        description={
          <>
            <strong className="text-slate-700 dark:text-slate-300">Trực tuyến</strong> — thư viện công khai tại{' '}
            <Link className="font-medium text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300" to="/bai-giang">
              /bai-giang
            </Link>
            . <strong className="text-slate-700 dark:text-slate-300">Trong lớp</strong> — bài giáo viên đăng cho lớp (học viên xem tab
            &quot;Lớp của tôi&quot;).
          </>
        }
        badge="CMS"
      />

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 dark:border-white/10">
        <button
          type="button"
          onClick={() => setTab('online')}
          className={`${tabBtn} ${
            tab === 'online'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30'
              : 'border border-gray-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
          }`}
        >
          Trực tuyến
        </button>
        <button
          type="button"
          onClick={() => setTab('lop')}
          className={`${tabBtn} ${
            tab === 'lop'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'border border-gray-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
          }`}
        >
          Trong lớp
        </button>
      </div>

      {tab === 'online' && (
        <>
          {onlineLoading && <p className="text-sm text-slate-400">Đang tải…</p>}

          <Panel title="Thêm bài giảng trực tuyến" subtitle="Tạo bài mới kèm nội dung trống để chỉnh sau">
            <form onSubmit={addOnline} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm text-slate-400 sm:col-span-2 lg:col-span-1">
                Môn *
                <select
                  value={draft.subject_id || String(firstSid || '')}
                  onChange={(e) => setDraft((d) => ({ ...d, subject_id: e.target.value }))}
                  className={field}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-400 sm:col-span-2">
                Tiêu đề *
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  className={field}
                  required
                />
              </label>
              <label className="block text-sm text-slate-400">
                Phút
                <input
                  type="number"
                  value={draft.duration_minutes}
                  onChange={(e) => setDraft((d) => ({ ...d, duration_minutes: e.target.value }))}
                  className={field}
                />
              </label>
              <label className="block text-sm text-slate-400">
                Cấp / nhãn
                <input
                  value={draft.level_label}
                  onChange={(e) => setDraft((d) => ({ ...d, level_label: e.target.value }))}
                  className={field}
                  placeholder="Lớp 10"
                />
              </label>
              <label className="block text-sm text-slate-400">
                Sort
                <input
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
                  className={field}
                />
              </label>
              <div className="flex items-end sm:col-span-2 lg:col-span-3">
                <button type="submit" className={btnPrimaryAdmin} disabled={!token}>
                  Thêm bài
                </button>
              </div>
            </form>
          </Panel>

          <Panel title="Danh sách bài trực tuyến" noDivider padding={false} className="overflow-hidden">
            <div className={tableShell}>
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className={tableHeadAdmin}>
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Môn</th>
                    <th className="px-4 py-3">Tiêu đề</th>
                    <th className="px-4 py-3">Phút</th>
                    <th className="px-4 py-3"> </th>
                  </tr>
                </thead>
                <tbody className={tableBodyAdmin}>
                  {lessons.map((r) => (
                    <tr key={r.id} className={tableRowHover}>
                      <td className="px-4 py-3 font-mono text-slate-500">{r.id}</td>
                      <td className="px-4 py-3 text-slate-400">{r.subjects?.name || '—'}</td>
                      <td className="px-4 py-3 font-medium">{r.title}</td>
                      <td className="px-4 py-3">{r.duration_minutes ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/bai-giang-noi-dung/${r.id}`}
                          className="mr-2 inline-block text-cyan-400 hover:text-cyan-300"
                        >
                          Chi tiết
                        </Link>
                        <button type="button" onClick={() => removeOnline(r)} className="text-red-400 hover:text-red-300">
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {tab === 'lop' && (
        <>
          {lopLoading && <p className="text-sm text-slate-400">Đang tải…</p>}

          <Panel title="Thêm bài giảng lớp" subtitle="Chọn lớp có sẵn — thường do giáo viên chủ nhiệm đăng">
            <form onSubmit={addLop} className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-slate-400 sm:col-span-2">
                Lớp *
                <select
                  value={classDraft.class_id || String(firstClassId || '')}
                  onChange={(e) => setClassDraft((d) => ({ ...d, class_id: e.target.value }))}
                  className={field}
                >
                  {classes.length === 0 ? (
                    <option value="">— Chưa có lớp —</option>
                  ) : (
                    classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.code ? ` (${c.code})` : ''} — GV: {c.teacher_name || '—'}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className="block text-sm text-slate-400 sm:col-span-2">
                Tiêu đề *
                <input
                  value={classDraft.title}
                  onChange={(e) => setClassDraft((d) => ({ ...d, title: e.target.value }))}
                  className={field}
                  required
                />
              </label>
              <label className="block text-sm text-slate-400">
                Thời lượng hiển thị
                <input
                  value={classDraft.duration_display}
                  onChange={(e) => setClassDraft((d) => ({ ...d, duration_display: e.target.value }))}
                  className={field}
                  placeholder="45 phút"
                />
              </label>
              <p className="text-xs text-slate-500 sm:col-span-2">
                Sau khi thêm bài, mở <strong className="text-slate-400">Chi tiết</strong> để soạn tóm tắt, video,
                dàn ý và các mục (giống bài trực tuyến).
              </p>
              <div className="flex items-end sm:col-span-2">
                <button type="submit" className={btnPrimaryAdmin} disabled={!token || classes.length === 0}>
                  Thêm bài
                </button>
              </div>
            </form>
          </Panel>

          <Panel title="Bài giảng trong lớp" noDivider padding={false} className="overflow-hidden">
            <div className={tableShell}>
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className={tableHeadAdmin}>
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Tiêu đề</th>
                    <th className="max-w-[180px] px-4 py-3">Tóm tắt</th>
                    <th className="px-4 py-3">Lớp</th>
                    <th className="px-4 py-3">Giáo viên</th>
                    <th className="px-4 py-3">Thời lượng</th>
                    <th className="px-4 py-3">Lượt xem</th>
                    <th className="px-4 py-3">Cập nhật</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className={tableBodyAdmin}>
                  {posts.map((r) => (
                    <tr key={r.id} className={tableRowHover}>
                      <td className="px-4 py-3 font-mono text-slate-500">{r.id}</td>
                      <td className="max-w-[200px] px-4 py-3 font-medium">{r.title}</td>
                      <td className="max-w-[180px] px-4 py-3 text-xs leading-snug text-slate-500">
                        {r.content_preview || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {r.class_name}
                        {r.class_code ? (
                          <span className="block text-xs text-slate-500">({r.class_code})</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{r.teacher_name}</td>
                      <td className="px-4 py-3">{r.duration_display || '—'}</td>
                      <td className="px-4 py-3">{r.view_count}</td>
                      <td className="px-4 py-3 text-slate-500">{r.updated_label}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/bai-giang-noi-dung/lop/${r.id}`}
                          className="mr-2 inline-block text-cyan-400 hover:text-cyan-300"
                        >
                          Chi tiết
                        </Link>
                        <Link
                          to={`/bai-giang/lop/${r.id}`}
                          className="mr-2 inline-block text-slate-400 hover:text-slate-300"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Xem HV
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({
                              id: r.id,
                              class_id: String(r.class_id),
                              title: r.title,
                              duration_display: r.duration_display || '45 phút',
                            })
                          }
                          className="mr-2 text-cyan-400 hover:text-cyan-300"
                        >
                          Sửa
                        </button>
                        <button type="button" onClick={() => removeLop(r)} className="text-red-400 hover:text-red-300">
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!lopLoading && posts.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-500">Chưa có bài giảng lớp nào.</p>
            )}
          </Panel>

          {editing && (
            <div className={`${modalBackdrop} max-h-[100dvh] overflow-y-auto`}>
              <form onSubmit={saveEditLop} className={`${modalPanelAdmin} my-auto max-w-lg`}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sửa bài giảng lớp</h3>
                <label className={`mt-4 ${labelAdmin}`}>
                  Lớp
                  <select
                    value={editing.class_id}
                    onChange={(e) => setEditing((x) => (x ? { ...x, class_id: e.target.value } : x))}
                    className={field}
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name} — {c.teacher_name || '—'}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`mt-3 ${labelAdmin}`}>
                  Tiêu đề
                  <input
                    value={editing.title}
                    onChange={(e) => setEditing((x) => (x ? { ...x, title: e.target.value } : x))}
                    className={field}
                  />
                </label>
                <label className={`mt-3 ${labelAdmin}`}>
                  Thời lượng hiển thị
                  <input
                    value={editing.duration_display}
                    onChange={(e) => setEditing((x) => (x ? { ...x, duration_display: e.target.value } : x))}
                    className={field}
                  />
                </label>
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" onClick={() => setEditing(null)} className={btnSecondaryAdmin}>
                    Hủy
                  </button>
                  <button type="submit" className={btnPrimaryAdmin}>
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  )
}
