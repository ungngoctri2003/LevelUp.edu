import { Link } from 'react-router-dom'
import { news } from '../data'

export default function NewsPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Tin tức
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-gray-600 dark:text-slate-400">
            Cập nhật tin tức mới nhất từ LevelUp.edu
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {news.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-transparent bg-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800/90"
            >
              <div className="flex h-48 items-center justify-center bg-gradient-to-br from-fuchsia-100 via-cyan-50 to-violet-100 dark:from-fuchsia-950/50 dark:via-slate-800 dark:to-cyan-950/40">
                <span className="text-6xl text-fuchsia-200/80 dark:text-fuchsia-400/40">📰</span>
              </div>
              <div className="p-6">
                <span className="text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400">{item.category}</span>
                <h3 className="mt-2 text-xl font-semibold text-gray-900 transition-colors group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-400">
                  {item.title}
                </h3>
                <p className="mt-3 line-clamp-2 text-gray-600 dark:text-slate-400">{item.excerpt}</p>
                <p className="mt-4 text-sm text-gray-500 dark:text-slate-500">{item.date}</p>
                <Link
                  to={`/tin-tuc/${item.id}`}
                  className="mt-4 inline-block font-medium text-cyan-600 hover:text-fuchsia-600 dark:text-cyan-400 dark:hover:text-fuchsia-400"
                >
                  Đọc tiếp →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
