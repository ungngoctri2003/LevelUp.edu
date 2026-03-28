import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePublicContent } from '../hooks/usePublicContent'
import { postAdmissionApplication } from '../services/publicApi.js'

export default function AdmissionsPage() {
  const { admissionsInfo } = usePublicContent()
  const info = admissionsInfo || {}
  const requirements = Array.isArray(info.requirements) ? info.requirements : []
  const steps = Array.isArray(info.steps) ? info.steps : []

  const [form, setForm] = useState({ student_name: '', parent_phone: '', grade_label: 'Lớp 10', notes: '' })
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      await postAdmissionApplication({
        student_name: form.student_name.trim(),
        parent_phone: form.parent_phone.trim(),
        grade_label: form.grade_label.trim(),
        notes: form.notes.trim() || undefined,
      })
      setSent(true)
    } catch (e2) {
      setErr(e2.message || 'Không gửi được — kiểm tra server có SUPABASE_SERVICE_ROLE_KEY.')
    }
  }

  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">Tuyển sinh</h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-slate-400">
            Thông tin từ CSDL (system_settings) và form gửi hồ sơ trực tuyến.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-transparent bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800/90">
          <div className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-cyan-600 px-8 py-10 text-center text-white">
            <h2 className="text-2xl font-bold">{info.title || 'Tuyển sinh'}</h2>
            <p className="mt-2 text-cyan-100">Hạn đăng ký: {info.deadline || '—'}</p>
          </div>

          <div className="space-y-10 p-8">
            <section>
              <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Điều kiện tham gia</h3>
              <ul className="space-y-3">
                {requirements.map((req, i) => (
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
                {steps.map((step, i) => (
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

            <section className="rounded-xl border border-gray-200 p-6 dark:border-slate-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gửi hồ sơ nhanh</h3>
              {sent ? (
                <p className="mt-3 text-green-600 dark:text-green-400">Đã gửi — chúng tôi sẽ liên hệ sớm.</p>
              ) : (
                <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
                  {err && <p className="sm:col-span-2 text-sm text-red-600">{err}</p>}
                  <input
                    required
                    placeholder="Họ tên học sinh"
                    value={form.student_name}
                    onChange={(e) => setForm((f) => ({ ...f, student_name: e.target.value }))}
                    className="rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                  <input
                    required
                    placeholder="SĐT phụ huynh"
                    value={form.parent_phone}
                    onChange={(e) => setForm((f) => ({ ...f, parent_phone: e.target.value }))}
                    className="rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                  <input
                    placeholder="Khối / lớp"
                    value={form.grade_label}
                    onChange={(e) => setForm((f) => ({ ...f, grade_label: e.target.value }))}
                    className="rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                  <input
                    placeholder="Ghi chú (tùy chọn)"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-2 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 py-3 font-semibold text-white"
                  >
                    Gửi hồ sơ
                  </button>
                </form>
              )}
            </section>

            <div className="pt-2">
              <Link
                to={{ pathname: '/', search: '?auth=register' }}
                className="block w-full rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 py-4 text-center font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition-opacity hover:opacity-95"
              >
                Đăng ký tài khoản học viên
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
