import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import EmptyState from '../../components/dashboard/EmptyState'
import { btnPrimaryStudent, tableHeadAdmin } from '../../components/dashboard/dashboardStyles'
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
    <div className="space-y-8">
      <PageHeader
        title="Kết quả kiểm tra"
        description="Lưu khi bạn nộp bài tại trang Bài kiểm tra (đã đăng nhập học viên)."
      >
        <Link to="/bai-kiem-tra" className={btnPrimaryStudent}>
          Làm bài mới
        </Link>
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          icon="📝"
          title="Chưa có bài làm"
          description="Làm bài kiểm tra công khai để điểm và lịch sử hiển thị tại đây."
        >
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
                {rows.map((r, i) => (
                  <tr key={`${r.examId}-${i}`} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-medium">{r.title}</td>
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
        </Panel>
      )}
    </div>
  )
}
