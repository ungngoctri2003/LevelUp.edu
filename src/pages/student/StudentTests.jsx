import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuthSession } from '../../context/AuthSessionContext'
import { getTestResults } from '../../utils/userBusinessStorage'

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export default function StudentTests() {
  const { user } = useAuthSession()
  const email = user?.email || ''

  const rows = useMemo(() => getTestResults(email), [email])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Kết quả kiểm tra</h2>
          <p className="text-sm text-slate-400">Lưu khi bạn nộp bài tại trang Bài kiểm tra (đã đăng nhập học viên).</p>
        </div>
        <Link
          to="/bai-kiem-tra"
          className="rounded-xl bg-gradient-to-r from-sky-500 to-fuchsia-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
        >
          Làm bài mới
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-slate-400">
          Chưa có bài nào. Hãy làm bài ở mục <Link className="text-sky-400 underline" to="/bai-kiem-tra">Bài kiểm tra</Link>.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Đề</th>
                <th className="px-4 py-3">Điểm</th>
                <th className="px-4 py-3">Đúng / Tổng</th>
                <th className="px-4 py-3">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {rows.map((r, i) => (
                <tr key={`${r.examId}-${i}`} className="hover:bg-white/5">
                  <td className="px-4 py-3">{r.title}</td>
                  <td className="px-4 py-3 font-semibold text-sky-300">
                    {r.score}/{r.maxScore}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {r.correct}/{r.total}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(r.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
