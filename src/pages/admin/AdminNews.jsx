import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { ModalPortal } from '../../components/dashboard/ModalPortal'
import {
  inputAdmin,
  modalBackdrop,
  modalPanelAdmin,
  btnPrimaryAdmin,
  tableHeadAdmin,
  tableBodyAdmin,
  tableRowHover,
  tableShell,
  modalTitle,
  btnSecondaryAdmin,
  labelAdmin,
} from '../../components/dashboard/dashboardStyles'
import { useAdminState } from '../../hooks/useAdminState'
import PageLoading from '../../components/ui/PageLoading.jsx'

const emptyDraft = { title: '', category: 'Thông báo', excerpt: '' }

export default function AdminNews() {
  const { state, loading, error, addNews, updateNews, deleteNews } = useAdminState()
  const items = state.news
  const [draft, setDraft] = useState(emptyDraft)
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState(emptyDraft)

  const add = async (e) => {
    e.preventDefault()
    if (!draft.title.trim()) return
    try {
      await addNews(draft)
      setDraft(emptyDraft)
    } catch (err) {
      toastActionError(err, 'Không đăng được tin.')
    }
  }

  const openEdit = (n) => {
    setEditModal(n.id)
    setEditForm({ title: n.title, category: n.category, excerpt: n.excerpt })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editForm.title.trim() || editModal == null) return
    try {
      await updateNews(editModal, {
        title: editForm.title.trim(),
        category: editForm.category,
        excerpt: editForm.excerpt || '',
        body: editForm.excerpt || '',
      })
      setEditModal(null)
    } catch (err) {
      toastActionError(err, 'Không lưu được tin.')
    }
  }

  const remove = async (id) => {
    if (!confirm('Xóa tin này?')) return
    const row = items.find((x) => x.id === id)
    try {
      await deleteNews(id, row?.title || '')
    } catch (err) {
      toastActionError(err, 'Không xóa được tin.')
    }
  }

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const field = `${inputAdmin} mt-1 w-full`

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tin tức & thông báo"
        description={
          <>
            Bài viết đăng tại đây sẽ xuất hiện trên{' '}
            <Link className="font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300" to="/tin-tuc">
              trang Tin tức
            </Link>
            .
          </>
        }
        badge="CMS"
      />

      {loading && <PageLoading variant="inline" />}

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
          <button type="submit" className={btnPrimaryAdmin} disabled={loading}>
            Thêm tin
          </button>
        </form>
      </Panel>

      <Panel noDivider padding={false} className="overflow-hidden">
        <div className={tableShell}>
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
            <tbody className={tableBodyAdmin}>
              {items.map((n) => (
                <tr key={n.id} className={tableRowHover}>
                  <td className="px-4 py-3 font-mono text-xs">{n.id}</td>
                  <td className="max-w-xs truncate px-4 py-3">{n.title}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{n.category}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{n.date}</td>
                  <td className="space-x-2 px-4 py-3">
                    <button type="button" onClick={() => openEdit(n)} className="text-xs text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300">
                      Sửa
                    </button>
                    <button type="button" onClick={() => remove(n.id)} className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
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
        <ModalPortal>
        <div className={modalBackdrop}>
          <form onSubmit={saveEdit} className={modalPanelAdmin}>
            <h3 className={modalTitle}>Sửa tin</h3>
            <label className={`mt-4 ${labelAdmin}`}>
              Tiêu đề
              <input
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                className={field}
              />
            </label>
            <label className={`mt-3 ${labelAdmin}`}>
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
            <label className={`mt-3 ${labelAdmin}`}>
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
                className={btnSecondaryAdmin}
              >
                Hủy
              </button>
              <button type="submit" className={btnPrimaryAdmin}>
                Lưu
              </button>
            </div>
          </form>
        </div>
        </ModalPortal>
      )}
    </div>
  )
}
