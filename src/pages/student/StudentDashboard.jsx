import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import StatCard from '../../components/dashboard/StatCard'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { useAuthSession } from '../../context/AuthSessionContext'
import { getMyCourseProgress, getMyExamAttempts } from '../../services/meApi.js'

export default function StudentDashboard() {
  const { user, session } = useAuthSession()
  const [stats, setStats] = useState({
    testCount: 0,
    lastScore: '—',
    avgDisplay: '—',
    avgProgress: 0,
  })

  useEffect(() => {
    const token = session?.access_token
    if (!token || !user?.id) return
    let cancelled = false
    ;(async () => {
      let attempts = []
      let prog = []
      try {
        const [aRes, pRes] = await Promise.all([
          getMyExamAttempts(token, 120),
          getMyCourseProgress(token),
        ])
        if (cancelled) return
        attempts = aRes.data || []
        prog = pRes.data || []
      } catch {
        if (cancelled) return
      }
      const testCount = attempts.length
      const last = attempts[0]
      const avg =
        attempts.length > 0
          ? attempts.reduce((s, t) => s + (Number(t.score) / Number(t.max_score)) * 10, 0) / attempts.length
          : null
      const avgProgress =
        prog.length > 0 ? prog.reduce((s, r) => s + Number(r.progress_pct || 0), 0) / prog.length : 0
      setStats({
        testCount,
        lastScore: last ? `${last.score}/${last.max_score}` : '—',
        avgDisplay: avg != null ? avg.toFixed(1) : '—',
        avgProgress: Math.round(avgProgress),
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
        <StatCard accent="student" label="Tiến độ TB (khóa)" value={`${stats.avgProgress}%`} />
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
            <span className="text-slate-300">Học tập — khóa học &amp; bài giảng</span>
            <Link to="/hoc-vien/khoa-hoc" className="rounded-lg bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/25">
              Mở →
            </Link>
          </li>
          <li className="flex items-center justify-between gap-2 border-b border-white/5 py-3">
            <span className="text-slate-300">Bài tập &amp; kiểm tra</span>
            <Link to="/hoc-vien/bai-tap" className="rounded-lg bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/25">
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
