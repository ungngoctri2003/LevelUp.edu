import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { inputAdmin, btnPrimaryAdmin, tableHeadAdmin } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { toast } from 'sonner'
import * as srv from '../../services/adminServerApi.js'

const LANDING_TEACHER_LABELS = {
  name: 'Tên',
  bio: 'Giới thiệu',
  initial: 'Chữ cái đại diện',
  color_token: 'Màu (indigo | purple)',
  avatar_url: 'Ảnh URL',
  user_id: 'ID tài khoản đăng nhập (tuỳ chọn)',
  sort_order: 'Thứ tự hiển thị',
}

const emptyDraft = {
  name: '',
  bio: '',
  initial: '',
  color_token: 'indigo',
  avatar_url: '',
  user_id: '',
  sort_order: 0,
}

export default function AdminLandingTeachers() {
  const { session } = useAuthSession()
  const token = session?.access_token
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState(emptyDraft)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState(emptyDraft)

  const load = useCallback(async () => {
    if (!token) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await srv.adminListPublicTeachers(token)
      setRows(res.data || [])
    } catch (e) {
      if (import.meta.env.DEV) console.error('[AdminLandingTeachers]', e)
      toast.error('Không tải được danh sách. Vui lòng thử lại sau.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const add = async (e) => {
    e.preventDefault()
    if (!token || !draft.name.trim()) return
    try {
      await srv.adminCreatePublicTeacher(token, {
        name: draft.name.trim(),
        bio: draft.bio.trim() || null,
        initial: draft.initial.trim() || null,
        color_token: draft.color_token.trim() || 'indigo',
        avatar_url: draft.avatar_url.trim() || undefined,
        user_id: draft.user_id.trim() || null,
        sort_order: Number(draft.sort_order) || 0,
      })
      setDraft(emptyDraft)
      await load()
    } catch (e2) {
      if (import.meta.env.DEV) console.error('[AdminLandingTeachers add]', e2)
      toast.error('Không thêm được. Vui lòng thử lại sau.')
    }
  }

  const openEdit = (r) => {
    setEditId(r.id)
    setEditForm({
      name: r.name || '',
      bio: r.bio || '',
      initial: r.initial || '',
      color_token: r.color_token || 'indigo',
      avatar_url: r.avatar_url || '',
      user_id: r.user_id || '',
      sort_order: r.sort_order ?? 0,
    })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!token || editId == null) return
    try {
      await srv.adminPatchPublicTeacher(token, editId, {
        name: editForm.name.trim(),
        bio: editForm.bio.trim() || null,
        initial: editForm.initial.trim() || null,
        color_token: editForm.color_token.trim() || 'indigo',
        avatar_url: editForm.avatar_url.trim() || null,
        user_id: editForm.user_id.trim() || null,
        sort_order: Number(editForm.sort_order) || 0,
      })
      setEditId(null)
      await load()
    } catch (e2) {
      if (import.meta.env.DEV) console.error('[AdminLandingTeachers save]', e2)
      toast.error('Không lưu được. Vui lòng thử lại sau.')
    }
  }

  const remove = async (r) => {
    if (!token || !confirm(`Xóa "${r.name}" khỏi trang chủ?`)) return
    try {
      await srv.adminDeletePublicTeacherApi(token, r.id, r.name)
      await load()
    } catch (e2) {
      if (import.meta.env.DEV) console.error('[AdminLandingTeachers remove]', e2)
      toast.error('Không xóa được. Vui lòng thử lại sau.')
    }
  }

  const field = `${inputAdmin} mt-1 w-full`

  return (
    <div className="space-y-8">
      <PageHeader
        title="Đội ngũ trang chủ"
        description={
          <>
            Thẻ hiển thị tại{' '}
            <Link className="font-medium text-cyan-400 hover:text-cyan-300" to="/">
              trang chủ
            </Link>
            .
          </>
        }
        badge="CMS"
      />

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <Panel title="Thêm thẻ giáo viên" subtitle="Có thể chỉ nhập thông tin hiển thị, không cần gắn tài khoản đăng nhập.">
        <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm text-slate-400 sm:col-span-2 lg:col-span-1">
            Tên *
            <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className={field} required />
          </label>
          <label className="block text-sm text-slate-400 sm:col-span-2">
            Bio
            <input value={draft.bio} onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))} className={field} />
          </label>
          <label className="block text-sm text-slate-400">
            Chữ cái đại diện
            <input value={draft.initial} onChange={(e) => setDraft((d) => ({ ...d, initial: e.target.value }))} className={field} />
          </label>
          <label className="block text-sm text-slate-400">
            Màu (indigo | purple)
            <input value={draft.color_token} onChange={(e) => setDraft((d) => ({ ...d, color_token: e.target.value }))} className={field} />
          </label>
          <label className="block text-sm text-slate-400 sm:col-span-2">
            Ảnh URL
            <input value={draft.avatar_url} onChange={(e) => setDraft((d) => ({ ...d, avatar_url: e.target.value }))} className={field} />
          </label>
          <label className="block text-sm text-slate-400 sm:col-span-2">
            Liên kết tài khoản (tuỳ chọn)
            <input value={draft.user_id} onChange={(e) => setDraft((d) => ({ ...d, user_id: e.target.value }))} className={field} />
          </label>
          <label className="block text-sm text-slate-400">
            Thứ tự hiển thị
            <input
              type="number"
              value={draft.sort_order}
              onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
              className={field}
            />
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <button type="submit" className={btnPrimaryAdmin} disabled={!token}>
              Thêm
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
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Thứ tự</th>
                <th className="px-4 py-3"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-mono text-slate-500">{r.id}</td>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">{r.sort_order}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => openEdit(r)} className="mr-2 text-cyan-400 hover:text-cyan-300">
                      Sửa
                    </button>
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

      {editId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4" role="dialog">
          <form onSubmit={saveEdit} className="my-8 w-full max-w-lg space-y-3 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">Sửa thẻ giáo viên</h3>
            {['name', 'bio', 'initial', 'color_token', 'avatar_url', 'user_id'].map((k) => (
              <label key={k} className="block text-sm text-slate-400">
                {LANDING_TEACHER_LABELS[k]}
                <input
                  value={editForm[k]}
                  onChange={(e) => setEditForm((f) => ({ ...f, [k]: e.target.value }))}
                  className={field}
                />
              </label>
            ))}
            <label className="block text-sm text-slate-400">
              {LANDING_TEACHER_LABELS.sort_order}
              <input
                type="number"
                value={editForm.sort_order}
                onChange={(e) => setEditForm((f) => ({ ...f, sort_order: e.target.value }))}
                className={field}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditId(null)} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-300">
                Huỷ
              </button>
              <button type="submit" className={btnPrimaryAdmin}>
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
