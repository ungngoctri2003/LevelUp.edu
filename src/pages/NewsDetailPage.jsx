import { Link, useParams } from 'react-router-dom'
import { usePublicContent } from '../hooks/usePublicContent'

export default function NewsDetailPage() {
  const { id } = useParams()
  const { news } = usePublicContent()
  const item = news.find((n) => String(n.id) === String(id))

  if (!item) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Không tìm thấy bài viết</h2>
        <Link to="/tin-tuc" className="mt-4 inline-block text-cyan-600 hover:text-fuchsia-600 dark:text-cyan-400 dark:hover:text-fuchsia-400">
          ← Quay lại tin tức
        </Link>
      </div>
    )
  }

  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <Link to="/tin-tuc" className="font-medium text-cyan-600 hover:text-fuchsia-600 dark:text-cyan-400 dark:hover:text-fuchsia-400">
          ← Quay lại tin tức
        </Link>
        <article className="mt-8 overflow-hidden rounded-2xl border border-transparent bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800/90">
          <div className="flex h-64 items-center justify-center bg-gradient-to-br from-fuchsia-100 via-cyan-50 to-violet-100 dark:from-fuchsia-950/50 dark:via-slate-800 dark:to-cyan-950/40">
            <span className="text-8xl text-fuchsia-200/80 dark:text-fuchsia-400/40">📰</span>
          </div>
          <div className="p-8 sm:p-10">
            <span className="text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400">{item.category}</span>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">{item.title}</h1>
            <p className="mt-4 text-gray-500 dark:text-slate-500">{item.date}</p>
            <div className="prose prose-lg mt-6 max-w-none space-y-4 text-lg text-gray-600 dark:text-slate-300">
              <p>{item.excerpt}</p>
              <p className="mt-4">
                LevelUp.edu cập nhật lịch khai giảng, chính sách học phí và ưu đãi theo từng đợt. Phụ huynh và học
                sinh nên đăng ký tư vấn sớm để được xếp lớp phù hợp trình độ và thời gian biểu.
              </p>
              <p className="mt-4">
                Mọi thắc mắc về khóa học, hình thức học trực tuyến hoặc hỗ trợ kỹ thuật, vui lòng liên hệ bộ phận
                chăm sóc khách hàng qua website hoặc hotline được công bố trên trang liên hệ.
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
