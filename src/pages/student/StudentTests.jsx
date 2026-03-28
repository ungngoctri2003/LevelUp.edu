import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import EmptyState from '../../components/dashboard/EmptyState'
import { btnPrimaryStudent, tableHeadAdmin } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { getMyExamAttempts } from '../../services/meApi.js'

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export default function StudentTests() {
  const { user, session } = useAuthSession()
  const [rows, setRows] = useState([])

  useEffect(() => {
    const token = session?.access_token
    if (!token || !user?.id) return
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await getMyExamAttempts(token, 100)
        if (cancelled) return
        setRows(data || [])
      } catch {
        if (!cancelled) setRows([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, session?.access_token])

  return (
    <div className="space-y-8">
      <PageHeader title="Kết quả kiểm tra" description="Lưu khi bạn nộp bài tại trang Bài kiểm tra (đã đăng nhập).">
        <Link to="/bai-kiem-tra" className={btnPrimaryStudent}>
          Làm bài mới
        </Link>
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState icon="📝" title="Chưa có bài làm" description="Làm bài kiểm tra công khai để điểm hiển thị tại đây.">
          <Link to="/bai-kiem-tra" className={btnPrimaryStudent}>
            Đi tới Bài kiểm tra
          </Link>
        </EmptyState>
      ) : (
        <Panel noDivider padding={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className={tableHeadAdmin}>
                <tr>
                  <th className="px-4 py-3">Đề</th>
                  <th className="px-4 py-3">Điểm</th>
                  <th className="px-4 py-3">Đúng / Tổng</th>
                  <th className="px-4 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-medium">{r.exams?.title || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-sky-300">
                      {r.score}/{r.max_score}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {r.correct_count ?? '—'}/{r.total_count ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(r.completed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  )
}
