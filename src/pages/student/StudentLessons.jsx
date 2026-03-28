import { Link } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { usePublicContent } from '../../hooks/usePublicContent'
import { buildLessonsBySubject } from '../../services/publicApi.js'
import { useMemo } from 'react'

export default function StudentLessons() {
  const { subjects, lessons, loading } = usePublicContent()
  const lessonsBySubject = useMemo(() => buildLessonsBySubject(subjects, lessons), [subjects, lessons])
  const first = lessonsBySubject[0]
  const sample = first?.lessons?.slice(0, 4) || []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bài giảng đang học"
        description="Gợi ý từ API công khai — liên kết tới chi tiết bài giảng."
      />

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <Panel title={`Tiếp tục — ${first?.name || 'Bài giảng'}`} subtitle="Các bài đầu tiên theo môn đầu danh sách.">
        <ul className="space-y-2">
          {sample.map((l) => (
            <li
              key={l.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm transition hover:border-sky-500/25 hover:bg-white/5"
            >
              <span className="min-w-0 font-medium text-slate-200">{l.title}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400">{l.duration}</span>
                <Link
                  to={`/bai-giang/${l.id}`}
                  className="rounded-lg bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/30"
                >
                  Xem
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <Link
          to="/bai-giang"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:opacity-95"
        >
          Mở thư viện bài giảng đầy đủ
        </Link>
      </Panel>
    </div>
  )
}
