import { Link, useParams } from 'react-router-dom'
import { mockTeacherClasses } from '../../data/dashboardData'
import { teacherClassRosters } from '../../data/studentBusinessData'

export default function TeacherClassDetail() {
  const { classId } = useParams()
  const cls = mockTeacherClasses.find((c) => c.id === classId)
  const roster = teacherClassRosters[classId || ''] || []

  if (!cls) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">Không tìm thấy lớp.</p>
        <Link to="/giao-vien/lop-hoc" className="text-emerald-400 hover:text-emerald-300">
          ← Quay lại danh sách
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/giao-vien/lop-hoc" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Danh sách lớp
        </Link>
        <h2 className="mt-2 text-xl font-bold text-white">{cls.name}</h2>
        <p className="mt-1 text-sm text-slate-400">
          {cls.subject} · Khối {cls.grade} · {cls.schedule}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <h3 className="font-semibold text-white">Học sinh trong lớp ({roster.length})</h3>
        <p className="mt-1 text-xs text-slate-500">
          Dữ liệu mẫu — đồng bộ với danh sách học viên admin (mock).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2 pr-4">Mã</th>
                <th className="py-2 pr-4">Họ tên</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Điểm TB</th>
                <th className="py-2">Có mặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {roster.map((s) => (
                <tr key={s.id}>
                  <td className="py-3 font-mono text-xs text-emerald-300">{s.id}</td>
                  <td className="py-3">{s.name}</td>
                  <td className="py-3 text-slate-400">{s.email}</td>
                  <td className="py-3">{s.avgScore}</td>
                  <td className="py-3 text-slate-400">{s.attendance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/giao-vien/bai-tap"
          className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
        >
          Giao bài cho lớp
        </Link>
        <Link
          to="/giao-vien/cham-diem"
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/20"
        >
          Chấm điểm
        </Link>
      </div>
    </div>
  )
}
