import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { inputAdmin, btnPrimaryAdmin, tableHeadAdmin } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import * as srv from '../../services/adminServerApi.js'

export default function AdminSubjects() {
  const { session } = useAuthSession()
  const token = session?.access_token
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState({ name: '', slug: '', icon_label: '📘', sort_order: 0 })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', slug: '', icon_label: '', sort_order: 0 })

  const load = useCallback(async () => {
    if (!token) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await srv.adminListSubjectsApi(token)
      setRows(res.data || [])
    } catch (e) {
      if (import.meta.env.DEV) console.error('[AdminSubjects]', e)
      toast.error('Không tải được danh sách môn. Vui lòng thử lại sau.')
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
      await srv.adminCreateSubject(token, {
        name: draft.name.trim(),
        slug: draft.slug.trim() || undefined,
        icon_label: draft.icon_label.trim() || null,
        sort_order: Number(draft.sort_order) || 0,
      })
      setDraft({ name: '', slug: '', icon_label: '📘', sort_order: 0 })
      await load()
    } catch (e2) {
      toastActionError(e2, 'Không thêm được môn.')
    }
  }

  const openEdit = (r) => {
    setEditId(r.id)
    setEditForm({
      name: r.name,
      slug: r.slug,
      icon_label: r.icon_label || '',
      sort_order: r.sort_order ?? 0,
    })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!token || editId == null) return
    try {
      await srv.adminPatchSubject(token, editId, {
        name: editForm.name.trim(),
        slug: editForm.slug.trim(),
        icon_label: editForm.icon_label.trim() || null,
        sort_order: Number(editForm.sort_order) || 0,
      })
      setEditId(null)
      await load()
    } catch (e2) {
      toastActionError(e2, 'Không lưu được môn.')
    }
  }

  const remove = async (r) => {
    if (!token || !confirm(`Xóa môn "${r.name}"? (Có thể xóa luôn bài giảng liên quan.)`)) return
    try {
      await srv.adminDeleteSubjectApi(token, r.id, r.name)
      await load()
    } catch (e2) {
      toastActionError(e2, 'Không xóa được môn.')
    }
  }

  const field = `${inputAdmin} mt-1 w-full`

  return (
    <div className="space-y-8">
      <PageHeader title="Môn học" description="Slug dùng cho URL nhóm bài giảng; icon hiển thị dạng emoji hoặc ký tự ngắn." badge="Catalog" />

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <Panel title="Thêm môn" subtitle="Bảng public.subjects">
        <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm text-slate-400">
            Tên *
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className={field}
              required
            />
          </label>
          <label className="block text-sm text-slate-400">
            Slug (tuỳ chọn)
            <input
              value={draft.slug}
              onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
              className={field}
              placeholder="toan-thpt"
            />
          </label>
          <label className="block text-sm text-slate-400">
            Icon
            <input
              value={draft.icon_label}
              onChange={(e) => setDraft((d) => ({ ...d, icon_label: e.target.value }))}
              className={field}
            />
          </label>
          <label className="block text-sm text-slate-400">
            Thứ tự
            <input
              type="number"
              value={draft.sort_order}
              onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
              className={field}
            />
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <button type="submit" className={btnPrimaryAdmin} disabled={!token}>
              Thêm môn
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Danh sách" noDivider padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={tableHeadAdmin}>
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Sort</th>
                <th className="px-4 py-3"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-mono text-slate-500">{r.id}</td>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-slate-400">{r.slug}</td>
                  <td className="px-4 py-3">{r.icon_label || '—'}</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-white">Sửa môn #{editId}</h3>
            <label className="block text-sm text-slate-400">
              Tên
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className={field}
              />
            </label>
            <label className="block text-sm text-slate-400">
              Slug
              <input
                value={editForm.slug}
                onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                className={field}
              />
            </label>
            <label className="block text-sm text-slate-400">
              Icon
              <input
                value={editForm.icon_label}
                onChange={(e) => setEditForm((f) => ({ ...f, icon_label: e.target.value }))}
                className={field}
              />
            </label>
            <label className="block text-sm text-slate-400">
              Thứ tự
              <input
                type="number"
                value={editForm.sort_order}
                onChange={(e) => setEditForm((f) => ({ ...f, sort_order: e.target.value }))}
                className={field}
              />
            </label>
            <div className="flex justify-end gap-2">
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
