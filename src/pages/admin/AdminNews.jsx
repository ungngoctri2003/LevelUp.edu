import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import {
  inputAdmin,
  modalBackdrop,
  modalPanelAdmin,
  btnPrimaryAdmin,
  tableHeadAdmin,
} from '../../components/dashboard/dashboardStyles'
import { useAdminState } from '../../hooks/useAdminState'
import { appendAdminActivity } from '../../utils/adminStorage'

const emptyDraft = { title: '', category: 'Thông báo', excerpt: '' }

export default function AdminNews() {
  const { state, update } = useAdminState()
  const items = state.news
  const [draft, setDraft] = useState(emptyDraft)
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState(emptyDraft)

  const add = (e) => {
    e.preventDefault()
    if (!draft.title.trim()) return
    const nextId = Math.max(0, ...items.map((x) => Number(x.id) || 0)) + 1
    update((prev) => ({
      ...prev,
      news: [
        {
          id: nextId,
          title: draft.title.trim(),
          date: new Date().toLocaleDateString('vi-VN'),
          excerpt: draft.excerpt || 'Nội dung sẽ được biên tập sau.',
          category: draft.category,
        },
        ...prev.news,
      ],
    }))
    appendAdminActivity(`Đăng tin mới: ${draft.title.trim()}`)
    setDraft(emptyDraft)
  }

  const openEdit = (n) => {
    setEditModal(n.id)
    setEditForm({ title: n.title, category: n.category, excerpt: n.excerpt })
  }

  const saveEdit = (e) => {
    e.preventDefault()
    if (!editForm.title.trim() || editModal == null) return
    update((prev) => ({
      ...prev,
      news: prev.news.map((x) =>
        x.id === editModal
          ? {
              ...x,
              title: editForm.title.trim(),
              category: editForm.category,
              excerpt: editForm.excerpt || x.excerpt,
            }
          : x,
      ),
    }))
    appendAdminActivity(`Sửa tin: ${editForm.title.trim()}`)
    setEditModal(null)
  }

  const remove = (id) => {
    if (!confirm('Xóa tin này?')) return
    const row = items.find((x) => x.id === id)
    update((prev) => ({
      ...prev,
      news: prev.news.filter((x) => x.id !== id),
    }))
    if (row) appendAdminActivity(`Xóa tin: ${row.title}`)
  }

  const field = `${inputAdmin} mt-1 w-full`

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tin tức & thông báo"
        description={
          <>
            CRUD đầy đủ — hiển thị tại{' '}
            <Link className="font-medium text-cyan-400 hover:text-cyan-300" to="/tin-tuc">
              /tin-tuc
            </Link>
            .
          </>
        }
        badge="CMS"
      />

      <Panel title="Đăng tin mới" subtitle="Tin sẽ xuất hiện trên trang Tin tức công khai.">
        <form onSubmit={add} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Tiêu đề"
              className={inputAdmin}
            />
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              className={inputAdmin}
            >
              <option>Sự kiện</option>
              <option>Hướng dẫn</option>
              <option>Thông báo</option>
              <option>Cập nhật</option>
            </select>
          </div>
          <textarea
            value={draft.excerpt}
            onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
            placeholder="Mô tả ngắn / đoạn lead"
            rows={3}
            className={`${inputAdmin} w-full`}
          />
          <button type="submit" className={btnPrimaryAdmin}>
            Thêm tin
          </button>
        </form>
      </Panel>

      <Panel noDivider padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className={tableHeadAdmin}>
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {items.map((n) => (
              <tr key={n.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs">{n.id}</td>
                <td className="px-4 py-3 max-w-xs truncate">{n.title}</td>
                <td className="px-4 py-3 text-slate-400">{n.category}</td>
                <td className="px-4 py-3 text-slate-400">{n.date}</td>
                <td className="px-4 py-3 space-x-2">
                  <button type="button" onClick={() => openEdit(n)} className="text-xs text-cyan-400 hover:text-cyan-300">
                    Sửa
                  </button>
                  <button type="button" onClick={() => remove(n.id)} className="text-xs text-red-400 hover:text-red-300">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Panel>

      {editModal != null && (
        <div className={modalBackdrop}>
          <form onSubmit={saveEdit} className={modalPanelAdmin}>
            <h3 className="text-lg font-semibold text-white">Sửa tin</h3>
            <label className="mt-4 block text-sm text-slate-400">
              Tiêu đề
              <input
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                className={field}
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Danh mục
              <select
                value={editForm.category}
                onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                className={field}
              >
                <option>Sự kiện</option>
                <option>Hướng dẫn</option>
                <option>Thông báo</option>
                <option>Cập nhật</option>
              </select>
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Mô tả / lead
              <textarea
                value={editForm.excerpt}
                onChange={(e) => setEditForm((f) => ({ ...f, excerpt: e.target.value }))}
                rows={4}
                className={field}
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                Hủy
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
