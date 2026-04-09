import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PUBLIC_SUBMIT_ERROR } from '../lib/publicUserMessages.js'
import { postMyPayment } from '../services/meApi.js'
import { useAuthModal } from '../context/AuthModalContext'
import { useAuthSession } from '../context/AuthSessionContext'

/**
 * Popup gửi yêu cầu thanh toán đăng ký lớp (theo học phí niêm yết).
 */
export default function ClassPaymentModal({
  open,
  onClose,
  classId,
  classTitle,
  tuitionFee,
  onSubmitted,
}) {
  const { user, profile, session } = useAuthSession()
  const { openLogin, openRegister } = useAuthModal()

  const [paymentForm, setPaymentForm] = useState({
    payment_source: 'bank_transfer',
    student_phone: '',
    note: '',
  })
  const [paymentSent, setPaymentSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isLoggedStudent = !!session?.access_token && user?.dbRole === 'student'

  const classIdNum = Number(classId)
  const priceNum = tuitionFee != null && Number.isFinite(Number(tuitionFee)) ? Number(tuitionFee) : null
  const hasListedPrice = priceNum != null && priceNum >= 0

  useEffect(() => {
    if (!open) return
    setPaymentSent(false)
    setSubmitting(false)
    setPaymentForm((p) => ({
      ...p,
      student_phone: profile?.phone || '',
    }))
  }, [open, profile?.phone])

  const submitPayment = async (e) => {
    e.preventDefault()
    if (!Number.isFinite(classIdNum)) {
      toast.error('Không xác định được lớp học.')
      return
    }
    if (!hasListedPrice) {
      toast.error('Lớp này chưa có học phí niêm yết trên hệ thống. Vui lòng liên hệ trung tâm.')
      return
    }
    if (!session?.access_token || !isLoggedStudent) {
      toast.error('Vui lòng đăng nhập tài khoản học viên để gửi yêu cầu thanh toán.')
      return
    }
    setSubmitting(true)
    try {
      await postMyPayment(session.access_token, {
        class_id: classIdNum,
        payment_source: paymentForm.payment_source,
        student_phone: paymentForm.student_phone.trim(),
        note: paymentForm.note.trim() || null,
      })
      setPaymentSent(true)
      toast.success('Đã ghi nhận yêu cầu thanh toán. Sau khi được xác nhận, bạn sẽ được ghi danh vào lớp.')
      onSubmitted?.()
    } catch (e2) {
      if (import.meta.env.DEV) console.error('[ClassPaymentModal]', e2)
      toast.error(e2?.message || PUBLIC_SUBMIT_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  const priceLabel = useMemo(() => {
    if (!hasListedPrice) return null
    return `${priceNum.toLocaleString('vi-VN')}đ`
  }, [hasListedPrice, priceNum])

  const body = useMemo(() => {
    if (!open) return null

    if (!hasListedPrice) {
      return (
        <div className="space-y-3 text-sm text-gray-600 dark:text-slate-400">
          <p>
            Lớp này <strong className="text-gray-900 dark:text-slate-200">chưa có học phí niêm yết</strong> trên hệ thống — không thể gửi yêu cầu thanh toán trực tuyến từ đây.
          </p>
          <p>Vui lòng liên hệ trung tâm để được báo giá và hướng dẫn thanh toán.</p>
        </div>
      )
    }

    if (!session?.access_token) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Học phí: <span className="font-semibold text-gray-900 dark:text-slate-200">{priceLabel}</span>
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/35 dark:text-amber-100">
            <p className="font-medium text-amber-950 dark:text-amber-50">Cần tài khoản học viên</p>
            <p className="mt-1.5 leading-relaxed">
              Để gửi yêu cầu thanh toán và được ghi danh sau khi xác nhận, vui lòng{' '}
              <strong className="text-amber-950 dark:text-white">đăng nhập</strong> hoặc{' '}
              <strong className="text-amber-950 dark:text-white">đăng ký</strong> tài khoản học viên, rồi thao tác lại từ đây.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openLogin()}
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-800 dark:text-emerald-200"
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => openRegister()}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              Đăng ký học viên
            </button>
          </div>
        </div>
      )
    }

    if (user?.dbRole && user.dbRole !== 'student') {
      return (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Chỉ tài khoản học viên mới gửi được yêu cầu thanh toán lớp học. Vui lòng đăng nhập bằng tài khoản học viên.
        </p>
      )
    }

    if (paymentSent) {
      return (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          Yêu cầu đã gửi. Trung tâm sẽ đối soát thanh toán; khi được xác nhận, bạn sẽ thấy lớp trong khu học viên.
        </p>
      )
    }

    return (
      <form onSubmit={submitPayment} className="grid gap-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-200">
          <p className="font-medium text-gray-900 dark:text-white">Đăng ký lớp — thanh toán</p>
          <p className="mt-1">
            Học phí niêm yết:{' '}
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">{priceLabel}</span>
          </p>
        </div>

        <input
          required
          placeholder="Số điện thoại liên hệ"
          value={paymentForm.student_phone}
          onChange={(e) => setPaymentForm((p) => ({ ...p, student_phone: e.target.value }))}
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
        <select
          value={paymentForm.payment_source}
          onChange={(e) => setPaymentForm((p) => ({ ...p, payment_source: e.target.value }))}
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        >
          <option value="bank_transfer">Chuyển khoản</option>
          <option value="cash">Tiền mặt</option>
          <option value="momo">MoMo</option>
          <option value="vnpay">VNPAY</option>
        </select>
        <textarea
          rows={3}
          placeholder="Ghi chú thêm"
          value={paymentForm.note}
          onChange={(e) => setPaymentForm((p) => ({ ...p, note: e.target.value }))}
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Đang gửi…' : 'Gửi yêu cầu thanh toán'}
        </button>
      </form>
    )
  }, [
    open,
    hasListedPrice,
    priceLabel,
    session?.access_token,
    user?.dbRole,
    isLoggedStudent,
    paymentSent,
    paymentForm,
    submitting,
    openLogin,
    openRegister,
  ])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="class-pay-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-600 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
          aria-label="Đóng"
        >
          ✕
        </button>
        <h2 id="class-pay-title" className="pr-10 text-xl font-bold text-gray-900 dark:text-white">
          Thanh toán để đăng ký lớp
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
          Lớp: <span className="font-semibold text-gray-900 dark:text-slate-200">{classTitle}</span>
        </p>
        <p className="mt-3 text-sm text-gray-600 dark:text-slate-400">
          Sau khi thanh toán được xác nhận, bạn sẽ được ghi danh và có thể học trong khu học viên.
        </p>
        <div className="mt-6">{body}</div>
      </div>
    </div>
  )
}
