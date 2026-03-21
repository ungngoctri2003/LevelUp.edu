import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminState } from '../../hooks/useAdminState'
import { appendAdminActivity } from '../../utils/adminStorage'

const emptyForm = {
  title: '',
  subject: 'Toán học',
  duration: 45,
  questions: 20,
  level: 'Lớp 10',
  assigned: false,
  published: true,
}

export default function AdminExams() {
  const { state, update } = useAdminState()
  const [form, setForm] = useState(emptyForm)

  const addExam = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const nextId = Math.max(0, ...state.exams.map((x) => Number(x.id) || 0)) + 1
    update((prev) => ({
      ...prev,
      exams: [
        ...prev.exams,
        {
          id: nextId,
          title: form.title.trim(),
          subject: form.subject,
          duration: Number(form.duration) || 45,
          questions: Number(form.questions) || 10,
          level: form.level,
          assigned: !!form.assigned,
          published: form.published !== false,
        },
      ],
    }))
    appendAdminActivity(`Tạo đề mới: ${form.title.trim()}`)
    setForm(emptyForm)
  }

  const toggle = (id, field) => {
    const ex = state.exams.find((x) => x.id === id)
    update((prev) => ({
      ...prev,
      exams: prev.exams.map((x) => {
        if (x.id !== id) return x
        if (field === 'published') {
          const cur = x.published !== false
          return { ...x, published: !cur }
        }
        return { ...x, assigned: !x.assigned }
      }),
    }))
    if (ex) {
      if (field === 'assigned') {
        appendAdminActivity(`${!ex.assigned ? 'Giao' : 'Thu hồi'} bài: ${ex.title}`)
      } else {
        const willShow = ex.published === false
        appendAdminActivity(`${willShow ? 'Hiện' : 'Ẩn'} đề công khai: ${ex.title}`)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Bài kiểm tra & đề</h2>
          <p className="text-sm text-slate-400">
            Quản lý đề hiển thị tại{' '}
            <Link to="/bai-kiem-tra" className="text-cyan-400 hover:text-cyan-300">
              /bai-kiem-tra
            </Link>
            . Tắt &quot;Hiển thị&quot; sẽ ẩn đề khỏi trang công khai.
          </p>
        </div>
      </div>

      <form onSubmit={addExam} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <h3 className="font-semibold text-white">Tạo đề mới</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm text-slate-400">
            Tên đề
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
              placeholder="VD: Kiểm tra 15 phút — Đạo hàm"
            />
          </label>
          <label className="text-sm text-slate-400">
            Môn
            <input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
            />
          </label>
          <label className="text-sm text-slate-400">
            Cấp
            <input
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
            />
          </label>
          <label className="text-sm text-slate-400">
            Thời gian (phút)
            <input
              type="number"
              min={5}
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
            />
          </label>
          <label className="text-sm text-slate-400">
            Số câu
            <input
              type="number"
              min={1}
              value={form.questions}
              onChange={(e) => setForm((f) => ({ ...f, questions: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-6 text-sm text-slate-300">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.assigned}
              onChange={(e) => setForm((f) => ({ ...f, assigned: e.target.checked }))}
              className="rounded border-white/30 bg-black/40 text-cyan-500"
            />
            Đã giao cho lớp
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.published !== false}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="rounded border-white/30 bg-black/40 text-cyan-500"
            />
            Hiển thị công khai
          </label>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Thêm đề
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Tên đề</th>
              <th className="px-4 py-3">Môn</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Số câu</th>
              <th className="px-4 py-3">Cấp</th>
              <th className="px-4 py-3">Đã giao</th>
              <th className="px-4 py-3">Công khai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {state.exams.map((e) => (
              <tr key={e.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{e.title}</td>
                <td className="px-4 py-3 text-slate-400">{e.subject}</td>
                <td className="px-4 py-3">{e.duration} phút</td>
                <td className="px-4 py-3">{e.questions}</td>
                <td className="px-4 py-3">{e.level}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(e.id, 'assigned')}
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      e.assigned ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {e.assigned ? 'Có' : 'Chưa'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(e.id, 'published')}
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      e.published !== false ? 'bg-cyan-500/20 text-cyan-200' : 'bg-red-500/15 text-red-300'
                    }`}
                  >
                    {e.published !== false ? 'Hiện' : 'Ẩn'}
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
