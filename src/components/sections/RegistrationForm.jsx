import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Reveal } from '../motion/Reveal'
import { courses } from '../../data'

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  courseInterest: '',
}

export default function RegistrationForm() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!form.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên'
    }
    if (!form.email.trim()) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email không hợp lệ'
    }
    if (!form.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9\s+\-()]{10,}$/.test(form.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ'
    }
    if (!form.courseInterest) {
      newErrors.courseInterest = 'Vui lòng chọn khóa học quan tâm'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    console.log('Registration form data:', form)
    setSubmitted(true)
    setForm(initialForm)
    setErrors({})
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <section id="registration" className="bg-gray-50 py-24 dark:bg-slate-900 sm:py-32">
      <div className="mx-auto max-w-2xl px-6">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xl dark:border-slate-700 dark:bg-slate-800"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
              >
                <svg
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Đăng ký thành công!
              </h3>
              <p className="mt-4 text-gray-600 dark:text-slate-400">
                Cảm ơn bạn đã đăng ký. Chúng tôi sẽ liên hệ sớm nhất.
              </p>
              <motion.button
                type="button"
                onClick={() => setSubmitted(false)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="mt-8 rounded-xl border border-gray-300 bg-white px-8 py-3 font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
              >
                Đăng ký thêm
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Reveal className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
                  Đăng ký học thử miễn phí
                </h2>
                <p className="mt-6 text-lg text-gray-600 dark:text-slate-400">
                  Điền form bên dưới để nhận tư vấn và trải nghiệm khóa học
                </p>
              </Reveal>
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="mt-12 rounded-2xl border border-slate-200 bg-white p-10 shadow-xl shadow-gray-200/50 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none"
              >
                <div className="space-y-6">
                  {['fullName', 'email', 'phone'].map((field) => (
                    <motion.div
                      key={field}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35 }}
                    >
                      <label
                        htmlFor={field}
                        className="block text-sm font-medium text-gray-700 dark:text-slate-300"
                      >
                        {field === 'fullName' && 'Họ và tên'}
                        {field === 'email' && 'Email'}
                        {field === 'phone' && 'Số điện thoại'}
                      </label>
                      <input
                        type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                        id={field}
                        name={field}
                        value={form[field]}
                        onChange={handleChange}
                        className="mt-2 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                        placeholder={
                          field === 'fullName'
                            ? 'Nguyễn Văn A'
                            : field === 'email'
                              ? 'email@example.com'
                              : '0901234567'
                        }
                      />
                      {errors[field] && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-1 text-sm text-red-600"
                        >
                          {errors[field]}
                        </motion.p>
                      )}
                    </motion.div>
                  ))}
                  <div>
                    <label
                      htmlFor="courseInterest"
                      className="block text-sm font-medium text-gray-700 dark:text-slate-300"
                    >
                      Khóa học quan tâm
                    </label>
                    <select
                      id="courseInterest"
                      name="courseInterest"
                      value={form.courseInterest}
                      onChange={handleChange}
                      className="mt-2 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">-- Chọn khóa học --</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.title}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                    {errors.courseInterest && (
                      <p className="mt-1 text-sm text-red-600">{errors.courseInterest}</p>
                    )}
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="mt-10">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition-all hover:from-cyan-600 hover:to-fuchsia-700"
                  >
                    Đăng ký ngay
                  </button>
                </motion.div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
