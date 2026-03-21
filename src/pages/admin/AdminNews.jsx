import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminState } from '../../hooks/useAdminState'
import { appendAdminActivity } from '../../utils/adminStorage'

export default function AdminNews() {
  const { state, update } = useAdminState()
  const items = state.news
  const [draft, setDraft] = useState({ title: '', category: 'Thông báo', excerpt: '' })

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
    setDraft({ title: '', category: 'Thông báo', excerpt: '' })
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Tin tức & thông báo</h2>
        <p className="text-sm text-slate-400">
          Quản lý bài hiển thị tại <Link className="text-cyan-400 hover:text-cyan-300" to="/tin-tuc">/tin-tuc</Link> — lưu cục bộ.
        </p>
      </div>

      <form onSubmit={add} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <h3 className="font-semibold text-white">Đăng tin mới</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Tiêu đề"
            className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
          />
          <select
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
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
          className="mt-3 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
        />
        <button
          type="submit"
          className="mt-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Thêm tin
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {items.map((n) => (
              <tr key={n.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs">{n.id}</td>
                <td className="px-4 py-3 max-w-xs truncate">{n.title}</td>
                <td className="px-4 py-3 text-slate-400">{n.category}</td>
                <td className="px-4 py-3 text-slate-400">{n.date}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => remove(n.id)} className="text-xs text-red-400 hover:text-red-300">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
