import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { inputAdmin, btnPrimaryAdmin, tableHeadAdmin } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import * as srv from '../../services/adminServerApi.js'

export default function AdminLessons() {
  const { session } = useAuthSession()
  const token = session?.access_token
  const [subjects, setSubjects] = useState([])
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState({
    subject_id: '',
    title: '',
    duration_minutes: '',
    level_label: '',
    sort_order: 0,
  })
  const loadAll = useCallback(async () => {
    if (!token) {
      setSubjects([])
      setLessons([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [subRes, lesRes] = await Promise.all([
        srv.adminListSubjectsApi(token),
        srv.adminListLessons(token),
      ])
      setSubjects(subRes.data || [])
      setLessons(lesRes.data || [])
    } catch (e) {
      if (import.meta.env.DEV) console.error('[AdminLessons load]', e)
      toast.error('Không tải được danh sách bài giảng. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const firstSid = subjects[0]?.id

  const add = async (e) => {
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
      await loadAll()
    } catch (e2) {
      toastActionError(e2, 'Không thêm được bài giảng.')
    }
  }

  const remove = async (row) => {
    if (!token || !confirm(`Xóa bài "${row.title}"?`)) return
    try {
      await srv.adminDeleteLessonApi(token, row.id, row.title)
      await loadAll()
    } catch (e2) {
      toastActionError(e2, 'Không xóa được bài giảng.')
    }
  }

  const field = `${inputAdmin} mt-1 w-full`

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bài giảng & chi tiết"
        description={
          <>
            Nội dung hiển thị tại{' '}
            <Link className="font-medium text-cyan-400 hover:text-cyan-300" to="/bai-giang" placeholder='Bài giảng'>
              Bài giảng
            </Link>{' '}
            và trang chi tiết.
          </>
        }
        badge="CMS"
      />

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <Panel title="Thêm bài giảng" subtitle="Tạo bài mới kèm nội dung trống để chỉnh sau">
        <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      <Panel title="Danh sách" noDivider padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
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
            <tbody className="divide-y divide-white/5 text-slate-200">
              {lessons.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.03]">
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
                    <button type="button" onClick={() => remove(r)} className="text-red-400 hover:text-red-300">
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
