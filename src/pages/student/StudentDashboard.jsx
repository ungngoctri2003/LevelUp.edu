import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import StatCard from '../../components/dashboard/StatCard'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { useAuthSession } from '../../context/AuthSessionContext'
import { getMyClasses, getMyExamAttempts, getMyPayments } from '../../services/meApi.js'

export default function StudentDashboard() {
  const { user, session } = useAuthSession()
  const [stats, setStats] = useState({
    activeClasses: 0,
    pendingPayments: 0,
    testCount: 0,
    lastScore: '—',
    avgDisplay: '—',
  })

  useEffect(() => {
    const token = session?.access_token
    if (!token || !user?.id) return
    let cancelled = false
    ;(async () => {
      let attempts = []
      let classes = []
      let payments = []
      try {
        const [aRes, cRes, pRes] = await Promise.all([
          getMyExamAttempts(token, 120),
          getMyClasses(token),
          getMyPayments(token),
        ])
        if (cancelled) return
        attempts = aRes.data || []
        classes = cRes.data || []
        payments = pRes.data || []
      } catch {
        if (cancelled) return
      }
      const testCount = attempts.length
      const last = attempts[0]
      const avg =
        attempts.length > 0
          ? attempts.reduce((s, t) => s + (Number(t.score) / Number(t.max_score)) * 10, 0) / attempts.length
          : null
      setStats({
        activeClasses: classes.length,
        pendingPayments: payments.filter((row) => row.payment_status !== 'paid' || !row.enrolled_at).length,
        testCount,
        lastScore: last ? `${last.score}/${last.max_score}` : '—',
        avgDisplay: avg != null ? avg.toFixed(1) : '—',
      })
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, session?.access_token])

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Học viên"
        title="Tổng quan học tập"
        description="Theo dõi tiến độ khóa học và kết quả các bài kiểm tra của bạn."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard accent="student" label="Lớp đã kích hoạt" value={String(stats.activeClasses)} hint={`Chờ xác nhận: ${stats.pendingPayments}`} />
        <StatCard accent="student" label="Bài kiểm tra đã làm" value={String(stats.testCount)} />
        <StatCard
          accent="student"
          label="Điểm TB (ước)"
          value={stats.avgDisplay}
          hint={`Lần gần nhất: ${stats.lastScore}`}
        />
      </div>

      <Panel title="Việc cần làm" subtitle="Gợi ý bước tiếp theo.">
        <ul className="space-y-0 text-sm">
          <li className="flex items-center justify-between gap-2 border-b border-white/5 py-3 first:pt-0">
            <span className="text-slate-300">Khóa học đã đăng ký (catalog)</span>
            <Link
              to="/hoc-vien/khoa-hoc-da-dang-ky"
              className="rounded-lg bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/25"
            >
              Mở →
            </Link>
          </li>
          <li className="flex items-center justify-between gap-2 border-b border-white/5 py-3">
            <span className="text-slate-300">Trạng thái thanh toán lớp</span>
            <Link
              to="/hoc-vien/khoa-hoc#student-section-thanh-toan"
              className="rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
            >
              Mở →
            </Link>
          </li>
          <li className="flex items-center justify-between gap-2 border-b border-white/5 py-3">
            <span className="text-slate-300">Danh mục khóa công khai (trang chủ)</span>
            <Link to="/bai-giang" className="rounded-lg bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/25">
              Mở →
            </Link>
          </li>
          <li className="flex items-center justify-between gap-2 border-b border-white/5 py-3">
            <span className="text-slate-300">Lớp mở bán — đăng ký &amp; thanh toán</span>
            <Link
              to="/lop-hoc"
              className="rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
            >
              Mở →
            </Link>
          </li>
          <li className="flex items-center justify-between gap-2 border-b border-white/5 py-3">
            <span className="text-slate-300">Lớp học của tôi — lớp đã kích hoạt, lịch, bài tập &amp; kiểm tra</span>
            <Link to="/hoc-vien/khoa-hoc" className="rounded-lg bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/25">
              Mở →
            </Link>
          </li>
          <li className="flex items-center justify-between gap-2 py-3 last:pb-0">
            <span className="text-slate-300">Cập nhật hồ sơ</span>
            <Link to="/hoc-vien/ho-so" className="rounded-lg bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/25">
              Mở →
            </Link>
          </li>
        </ul>
      </Panel>
    </div>
  )
}
