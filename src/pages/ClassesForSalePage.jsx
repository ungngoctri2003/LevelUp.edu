import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Reveal } from '../components/motion/Reveal'
import { useAuthSession } from '../context/AuthSessionContext'
import { usePublicContent } from '../hooks/usePublicContent'
import { getMyClasses, getMyPayments } from '../services/meApi.js'

function classRowState(classId, myClasses, myPayments) {
  const cid = Number(classId)
  const enrolled = (myClasses || []).some((c) => Number(c.class_id) === cid)
  if (enrolled) return { kind: 'enrolled' }

  const paymentsForClass = (myPayments || []).filter((p) => Number(p.class_id) === cid)
  const pending = paymentsForClass.find((p) => p.payment_status === 'pending')
  if (pending) return { kind: 'pending' }
  const paid = paymentsForClass.find((p) => p.payment_status === 'paid')
  if (paid) return { kind: 'paid' }

  return { kind: 'open' }
}

export default function ClassesForSalePage() {
  const { profile, session } = useAuthSession()
  const { saleClasses, loading, error } = usePublicContent()
  const [myClasses, setMyClasses] = useState([])
  const [myPayments, setMyPayments] = useState([])

  const isStudent = profile?.role === 'student'

  const loadStudentContext = useCallback(async () => {
    const token = session?.access_token
    if (!token || profile?.role !== 'student') {
      setMyClasses([])
      setMyPayments([])
      return
    }
    try {
      const [cRes, pRes] = await Promise.all([getMyClasses(token), getMyPayments(token)])
      setMyClasses(Array.isArray(cRes?.data) ? cRes.data : [])
      setMyPayments(Array.isArray(pRes?.data) ? pRes.data : [])
    } catch {
      setMyClasses([])
      setMyPayments([])
    }
  }, [session?.access_token, profile?.role])

  useEffect(() => {
    loadStudentContext()
  }, [loadStudentContext])

  useEffect(() => {
    if (error && !saleClasses.length) toast.error(error)
  }, [error, saleClasses.length])

  const grid = useMemo(() => {
    return (saleClasses || []).map((row) => {
      const state = isStudent ? classRowState(row.id, myClasses, myPayments) : { kind: 'open' }
      return { row, state }
    })
  }, [saleClasses, isStudent, myClasses, myPayments])

  const showFatalError = error && !saleClasses.length

  if (loading && !saleClasses.length) {
    return (
      <div className="py-24 text-center text-gray-600 dark:text-slate-400">Đang tải danh sách lớp…</div>
    )
  }

  if (showFatalError) {
    return (
      <div className="py-24 text-center text-gray-600 dark:text-slate-400">
        Hiện không tải được dữ liệu. Vui lòng thử tải lại trang.
      </div>
    )
  }

  const cardLinkClass =
    'group relative block h-full overflow-hidden rounded-2xl border bg-white text-left shadow-lg transition-shadow hover:shadow-2xl dark:bg-slate-800/80'

  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">Lớp học</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-slate-400">
            Bấm vào một lớp để xem chi tiết trên trang lớp; học viên có thể đăng ký / thanh toán tại đó. Sau khi ghi danh,
            bạn xem bài giảng và lịch ngay trên cùng trang.
          </p>
        </Reveal>

        {saleClasses.length === 0 ? (
          <p className="py-8 text-center text-gray-600 dark:text-slate-400">
            Hiện chưa có lớp mở bán hoặc dữ liệu đang cập nhật.
          </p>
        ) : (
          <>
            <h2 className="mb-6 text-center text-xl font-bold text-gray-900 dark:text-white">Lớp đang mở đăng ký</h2>
            <p className="mb-8 text-center text-sm text-gray-600 dark:text-slate-400">
              Xem lịch và học phí — bấm vào thẻ lớp để mở trang lớp.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map(({ row, state }) => {
                const fee =
                  row.tuition_fee != null && Number.isFinite(Number(row.tuition_fee))
                    ? `${Number(row.tuition_fee).toLocaleString('vi-VN')}đ`
                    : 'Liên hệ'
                const badge =
                  state.kind === 'enrolled' ? (
                    <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                      Đã ghi danh
                    </span>
                  ) : state.kind === 'pending' ? (
                    <span className="rounded-full border border-amber-400/50 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                      Đang chờ xác nhận
                    </span>
                  ) : state.kind === 'paid' ? (
                    <span className="rounded-full border border-sky-400/50 bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-200">
                      Đã thanh toán
                    </span>
                  ) : null

                const cardInner = (
                  <>
                    <div className="relative h-1.5 overflow-hidden bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500">
                      <motion.div
                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                      />
                    </div>
                    <div className="p-6 sm:p-7">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                          {row.subject}
                        </span>
                        {badge}
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{row.name}</h2>
                      {row.code ? (
                        <p className="mt-1 font-mono text-xs text-gray-500 dark:text-slate-500">Mã: {row.code}</p>
                      ) : null}
                      <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                        <span className="font-medium text-gray-800 dark:text-slate-200">Khối:</span> {row.grade_label}
                      </p>
                      {row.schedule_summary ? (
                        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                          <span className="font-medium text-gray-800 dark:text-slate-200">Lịch:</span> {row.schedule_summary}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                        <span className="font-medium text-gray-800 dark:text-slate-200">Giáo viên:</span> {row.teacher_name}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Học phí: {fee}</p>
                      {row.sales_note ? (
                        <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                          {row.sales_note}
                        </p>
                      ) : null}
                      <div className="mt-4">
                        {state.kind === 'enrolled' ? (
                          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            Vào lớp →
                          </span>
                        ) : state.kind === 'pending' || state.kind === 'paid' ? (
                          <p className="text-sm text-gray-500 dark:text-slate-500">
                            {state.kind === 'paid'
                              ? 'Trung tâm sẽ hoàn tất ghi danh sau khi đối soát.'
                              : 'Vui lòng chờ trung tâm xác nhận thanh toán.'}
                          </p>
                        ) : (
                          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            Xem lớp &amp; đăng ký →
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )

                const borderClass =
                  state.kind === 'open'
                    ? 'border-emerald-200/60 hover:border-emerald-400/50 dark:border-emerald-500/20'
                    : 'border-gray-200 dark:border-slate-700'

                return (
                  <motion.div key={row.id} whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }} className="h-full">
                    <Link
                      to={`/lop-hoc/${encodeURIComponent(String(row.id))}`}
                      className={`${cardLinkClass} ${borderClass}`}
                    >
                      {cardInner}
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
