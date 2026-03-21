import { Link } from 'react-router-dom'
import { admissionsInfo } from '../data'

export default function AdmissionsPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Tuyển sinh
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-slate-400">
            Thông tin tuyển sinh và hướng dẫn đăng ký học tại LevelUp.edu
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-transparent bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800/90">
          <div className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-cyan-600 px-8 py-10 text-center text-white">
            <h2 className="text-2xl font-bold">{admissionsInfo.title}</h2>
            <p className="mt-2 text-cyan-100">Hạn đăng ký: {admissionsInfo.deadline}</p>
          </div>

          <div className="p-8 space-y-10">
            <section>
              <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Điều kiện tham gia</h3>
              <ul className="space-y-3">
                {admissionsInfo.requirements.map((req, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-slate-300">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-sm font-medium text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300">
                      {i + 1}
                    </span>
                    {req}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Các bước đăng ký</h3>
              <div className="space-y-6">
                {admissionsInfo.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-4 rounded-xl border border-gray-100 p-4 transition-colors hover:border-cyan-200 dark:border-slate-600 dark:hover:border-cyan-500/40"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 text-lg font-bold text-white">
                      {step.step}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{step.title}</h4>
                      <p className="mt-1 text-gray-600 dark:text-slate-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="pt-6">
              <Link
                to={{ pathname: '/', search: '?auth=register' }}
                className="block w-full rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 py-4 text-center font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition-opacity hover:opacity-95"
              >
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
