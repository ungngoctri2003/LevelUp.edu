import { Link } from 'react-router-dom'
import { mockTeacherClasses } from '../../data/dashboardData'

export default function TeacherClasses() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Lớp học của tôi</h2>
        <p className="text-sm text-slate-400">Danh sách lớp phụ trách và lịch học.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {mockTeacherClasses.map((c) => (
          <div key={c.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-white">{c.name}</h3>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">{c.id}</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {c.subject} · Khối {c.grade}
            </p>
            <p className="mt-3 text-sm text-slate-300">
              <span className="text-slate-500">Học sinh:</span> {c.students}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              <span className="text-slate-500">Lịch:</span> {c.schedule}
            </p>
            <Link
              to={`/giao-vien/lop-hoc/${c.id}`}
              className="mt-4 inline-block rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
            >
              Chi tiết lớp →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
