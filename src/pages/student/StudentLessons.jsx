import { Link } from 'react-router-dom'
import { lessonsBySubject } from '../../data'

export default function StudentLessons() {
  const first = lessonsBySubject[0]
  const sample = first?.lessons?.slice(0, 4) || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Bài giảng đang học</h2>
        <p className="text-sm text-slate-400">Gợi ý từ khóa bạn đã đăng ký — mở trang Bài giảng để xem đầy đủ.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <h3 className="font-medium text-white">Tiếp tục — {first?.name || 'Bài giảng'}</h3>
        <ul className="mt-4 space-y-2">
          {sample.map((l) => (
            <li
              key={l.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm"
            >
              <span className="text-slate-200">{l.title}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-slate-500">{l.duration}</span>
                <Link
                  to={`/bai-giang/${l.id}`}
                  className="rounded-lg bg-white/10 px-2 py-1 text-xs font-medium text-cyan-300 hover:bg-white/20"
                >
                  Xem
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <Link
          to="/bai-giang"
          className="mt-4 inline-block rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Mở trang Bài giảng đầy đủ
        </Link>
      </div>
    </div>
  )
}
