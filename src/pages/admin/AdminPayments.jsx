import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { ModalPortal } from '../../components/dashboard/ModalPortal'
import {
  btnPrimaryAdmin,
  inputAdmin,
  modalBackdrop,
  modalPanelAdmin,
  tableHeadAdmin,
  tableBodyAdmin,
  tableRowHover,
  tableShell,
} from '../../components/dashboard/dashboardStyles'
import { useAdminState } from '../../hooks/useAdminState'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'

const SOURCE_OPTIONS = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'bank_transfer', label: 'Chuyển khoản' },
  { value: 'momo', label: 'MoMo' },
  { value: 'vnpay', label: 'VNPAY' },
  { value: 'other', label: 'Khác' },
]

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'cancelled', label: 'Hủy' },
]

const PAYMENT_STATUS_BADGE =
  'inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium'

const paymentStatusBadgeClass = {
  paid:
    'border-emerald-500/35 bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-200',
  pending:
    'border-amber-500/35 bg-amber-500/15 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-200',
  cancelled:
    'border-slate-300 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-300',
}

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function formatCurrency(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    Number(amount),
  )
}

function partitionPayments(all) {
  const rows = all || []
  const classRows = rows.filter((r) => r.payment_kind === 'class' || (r.class_id != null && r.payment_kind !== 'course'))
  const courseRows = rows.filter((r) => r.payment_kind === 'course' || r.course_id != null)
  return { classRows, courseRows }
}

function summarize(rows) {
  const base = rows || []
  return {
    total: base.length,
    pending: base.filter((row) => row.payment_status === 'pending').length,
    paid: base.filter((row) => row.payment_status === 'paid').length,
    unlinked: base.filter((row) => !row.student_id).length,
  }
}

function courseDisplayTitle(row) {
  const raw = row.class_name || ''
  return raw.startsWith('Khóa học:') ? raw.replace(/^Khóa học:\s*/i, '').trim() || raw : raw
}

export default function AdminPayments() {
  const { state, loading, error, updatePayment } = useAdminState()
  const [paymentTab, setPaymentTab] = useState('class')
  const [classStatusFilter, setClassStatusFilter] = useState('all')
  const [classClassFilter, setClassClassFilter] = useState('all')
  const [classSourceFilter, setClassSourceFilter] = useState('all')
  const [courseStatusFilter, setCourseStatusFilter] = useState('all')
  const [courseCourseFilter, setCourseCourseFilter] = useState('all')
  const [courseSourceFilter, setCourseSourceFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const studentOptions = useMemo(
    () =>
      [...state.students].sort((a, b) => String(a.name).localeCompare(String(b.name), 'vi')),
    [state.students],
  )

  const { classRows: classPaymentsBase, courseRows: coursePaymentsBase } = useMemo(
    () => partitionPayments(state.payments),
    [state.payments],
  )

  const classOptions = useMemo(() => {
    const m = new Map()
    for (const row of classPaymentsBase) {
      m.set(row.class_id, row.class_name)
    }
    return [...m.entries()].map(([id, name]) => ({ id: String(id), name }))
  }, [classPaymentsBase])

  const courseOptions = useMemo(() => {
    const m = new Map()
    for (const row of coursePaymentsBase) {
      const cid = row.course_id
      if (cid == null) continue
      m.set(cid, courseDisplayTitle(row))
    }
    return [...m.entries()].map(([id, name]) => ({ id: String(id), name }))
  }, [coursePaymentsBase])

  const classPayments = useMemo(() => {
    return classPaymentsBase.filter((row) => {
      if (classStatusFilter !== 'all' && row.payment_status !== classStatusFilter) return false
      if (classClassFilter !== 'all' && String(row.class_id) !== classClassFilter) return false
      if (classSourceFilter !== 'all' && row.payment_source !== classSourceFilter) return false
      return true
    })
  }, [classPaymentsBase, classStatusFilter, classClassFilter, classSourceFilter])

  const coursePayments = useMemo(() => {
    return coursePaymentsBase.filter((row) => {
      if (courseStatusFilter !== 'all' && row.payment_status !== courseStatusFilter) return false
      if (courseCourseFilter !== 'all' && String(row.course_id) !== courseCourseFilter) return false
      if (courseSourceFilter !== 'all' && row.payment_source !== courseSourceFilter) return false
      return true
    })
  }, [coursePaymentsBase, courseStatusFilter, courseCourseFilter, courseSourceFilter])

  const summaryAll = useMemo(() => summarize(state.payments || []), [state.payments])
  const summaryClass = useMemo(() => summarize(classPaymentsBase), [classPaymentsBase])
  const summaryCourse = useMemo(() => summarize(coursePaymentsBase), [coursePaymentsBase])

  const openEditor = (row) => {
    setEditingId(row.id)
    setDraft({
      student_id: row.student_id || '',
      payment_source: row.payment_source || 'bank_transfer',
      payment_status: row.payment_status || 'pending',
      amount: row.amount ?? '',
      admin_note: row.admin_note || '',
    })
  }

  const save = async () => {
    if (!editingId || !draft) return
    if (draft.payment_status === 'paid' && !draft.student_id) {
      toast.warning('Cần gắn tài khoản học viên trước khi xác nhận đã thanh toán.')
      return
    }
    try {
      await updatePayment(editingId, {
        student_id: draft.student_id || null,
        payment_source: draft.payment_source,
        payment_status: draft.payment_status,
        amount: draft.amount === '' ? null : Number(draft.amount),
        admin_note: draft.admin_note,
      })
      toast.success('Đã cập nhật thanh toán.')
      setEditingId(null)
      setDraft(null)
    } catch (err) {
      toastActionError(err, 'Không cập nhật được thanh toán.')
    }
  }

  const editingRow = useMemo(
    () => (state.payments || []).find((row) => row.id === editingId) || null,
    [state.payments, editingId],
  )

  const isCoursePayment = editingRow?.payment_kind === 'course' || editingRow?.course_id != null

  const renderPaymentsTable = (rows, kind) => (
    <div className={tableShell}>
      <table className="w-full min-w-[940px] text-left text-sm">
        <thead className={tableHeadAdmin}>
          <tr>
            <th className="px-4 py-3">{kind === 'class' ? 'Lớp' : 'Khóa học'}</th>
            <th className="px-4 py-3">Học viên / liên hệ</th>
            <th className="px-4 py-3">Nguồn</th>
            <th className="px-4 py-3">Số tiền</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3">Thời gian</th>
            <th className="px-4 py-3">Thao tác</th>
          </tr>
        </thead>
        <tbody className={tableBodyAdmin}>
          {loading && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                Đang tải…
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                Chưa có yêu cầu thanh toán nào.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className={tableRowHover}>
              <td className="px-4 py-3 align-top">
                {kind === 'class' ? (
                  <>
                    <p className="font-medium text-gray-900 dark:text-white">{row.class_name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {row.class_subject} · {row.class_grade_label}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-900 dark:text-white">{courseDisplayTitle(row)}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Khóa catalog · ID #{row.course_id}</p>
                  </>
                )}
              </td>
              <td className="px-4 py-3 align-top">
                <p className="text-slate-900 dark:text-slate-200">{row.student_name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{row.student_email || 'Không có email'}</p>
                <p className="text-xs text-slate-600 dark:text-slate-500">{row.student_phone || 'Không có SĐT'}</p>
              </td>
              <td className="px-4 py-3 align-top text-slate-800 dark:text-slate-300">
                {SOURCE_OPTIONS.find((opt) => opt.value === row.payment_source)?.label || row.payment_source}
              </td>
              <td className="px-4 py-3 align-top font-medium text-slate-900 dark:text-slate-300">
                {formatCurrency(row.amount)}
              </td>
              <td className="px-4 py-3 align-top">
                <span
                  className={`${PAYMENT_STATUS_BADGE} ${
                    paymentStatusBadgeClass[row.payment_status] ||
                    'border-slate-300 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-300'
                  }`}
                >
                  {STATUS_OPTIONS.find((opt) => opt.value === row.payment_status)?.label || row.payment_status}
                </span>
                {kind === 'class' && row.already_enrolled && (
                  <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">Đã có trong lớp</p>
                )}
              </td>
              <td className="px-4 py-3 align-top text-xs text-slate-600 dark:text-slate-400">
                <p>Gửi: {formatDateTime(row.submitted_at)}</p>
                <p>Xác nhận: {formatDateTime(row.confirmed_at)}</p>
              </td>
              <td className="px-4 py-3 align-top">
                <button
                  type="button"
                  onClick={() => openEditor(row)}
                  className="font-medium text-cyan-700 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300"
                >
                  Xử lý
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title="Thanh toán — lớp học & khóa học"
        description="Hai luồng riêng: đăng ký lớp (ghi danh) và mua khóa học online (catalog). Gắn đúng tài khoản học viên trước khi xác nhận đã thanh toán."
        badge="Quản trị"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Panel padding className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">Tổng (cả hai)</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summaryAll.total}</p>
        </Panel>
        <Panel padding className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">Đang chờ (cả hai)</p>
          <p className="text-2xl font-semibold text-amber-200">{summaryAll.pending}</p>
        </Panel>
        <Panel padding className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">Đã xác nhận (cả hai)</p>
          <p className="text-2xl font-semibold text-emerald-200">{summaryAll.paid}</p>
        </Panel>
      </div>

      <Panel
        title={paymentTab === 'class' ? 'Thanh toán lớp học' : 'Thanh toán khóa học (catalog)'}
        subtitle={
          paymentTab === 'class'
            ? `${summaryClass.total} yêu cầu · ${summaryClass.pending} chờ · ${summaryClass.paid} đã xác nhận. Xác nhận thanh toán sẽ ghi danh học viên vào lớp khi đã gắn đúng tài khoản.`
            : `${summaryCourse.total} yêu cầu · ${summaryCourse.pending} chờ · ${summaryCourse.paid} đã xác nhận. Xác nhận thanh toán mở quyền xem khóa trên trang Khóa học cho học viên đã gắn.`
        }
      >
        <div
          className="mb-6 flex flex-wrap items-center gap-3"
          role="tablist"
          aria-label="Chọn loại thanh toán"
        >
          <div className="inline-flex gap-2 rounded-xl border border-gray-200 bg-slate-100 p-2 sm:gap-3 dark:border-white/10 dark:bg-black/30">
            <button
              type="button"
              role="tab"
              aria-selected={paymentTab === 'class'}
              id="payment-tab-class"
              aria-controls="payment-panel"
              onClick={() => setPaymentTab('class')}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors sm:min-w-[148px] ${
                paymentTab === 'class'
                  ? 'bg-linear-to-r from-emerald-600/90 to-teal-600/90 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              Lớp học
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={paymentTab === 'course'}
              id="payment-tab-course"
              aria-controls="payment-panel"
              onClick={() => setPaymentTab('course')}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors sm:min-w-[148px] ${
                paymentTab === 'course'
                  ? 'bg-linear-to-r from-cyan-600/90 to-fuchsia-600/90 text-white shadow-lg shadow-fuchsia-900/25'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              Khóa học
            </button>
          </div>
          <p className="text-xs text-slate-500">
            {paymentTab === 'class'
              ? 'Đang xem yêu cầu đăng ký / học phí lớp.'
              : 'Đang xem yêu cầu mua khóa học online (catalog).'}
          </p>
        </div>

        <div id="payment-panel" role="tabpanel" aria-labelledby={paymentTab === 'class' ? 'payment-tab-class' : 'payment-tab-course'}>
          {paymentTab === 'class' ? (
            <>
              <div className="mb-4 grid gap-3 lg:grid-cols-3">
                <label className="text-sm text-slate-400">
                  Trạng thái
                  <select
                    value={classStatusFilter}
                    onChange={(e) => setClassStatusFilter(e.target.value)}
                    className={`${inputAdmin} mt-1 w-full`}
                  >
                    <option value="all">Tất cả</option>
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-400">
                  Lớp
                  <select
                    value={classClassFilter}
                    onChange={(e) => setClassClassFilter(e.target.value)}
                    className={`${inputAdmin} mt-1 w-full`}
                  >
                    <option value="all">Tất cả</option>
                    {classOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-400">
                  Nguồn tiền
                  <select
                    value={classSourceFilter}
                    onChange={(e) => setClassSourceFilter(e.target.value)}
                    className={`${inputAdmin} mt-1 w-full`}
                  >
                    <option value="all">Tất cả</option>
                    {SOURCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {renderPaymentsTable(classPayments, 'class')}
            </>
          ) : (
            <>
              <div className="mb-4 grid gap-3 lg:grid-cols-3">
                <label className="text-sm text-slate-400">
                  Trạng thái
                  <select
                    value={courseStatusFilter}
                    onChange={(e) => setCourseStatusFilter(e.target.value)}
                    className={`${inputAdmin} mt-1 w-full`}
                  >
                    <option value="all">Tất cả</option>
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-400">
                  Khóa học
                  <select
                    value={courseCourseFilter}
                    onChange={(e) => setCourseCourseFilter(e.target.value)}
                    className={`${inputAdmin} mt-1 w-full`}
                  >
                    <option value="all">Tất cả</option>
                    {courseOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-400">
                  Nguồn tiền
                  <select
                    value={courseSourceFilter}
                    onChange={(e) => setCourseSourceFilter(e.target.value)}
                    className={`${inputAdmin} mt-1 w-full`}
                  >
                    <option value="all">Tất cả</option>
                    {SOURCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {renderPaymentsTable(coursePayments, 'course')}
            </>
          )}
        </div>
      </Panel>

      {editingRow && draft && (
        <ModalPortal>
        <div
          className={modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-edit-title"
          onClick={() => {
            setEditingId(null)
            setDraft(null)
          }}
        >
          <div
            className={`${modalPanelAdmin} max-w-5xl! w-full max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="payment-edit-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Xử lý yêu cầu #{editingRow.id}
              <span className="ml-2 text-sm font-normal text-slate-500">
                {isCoursePayment ? '(Khóa học)' : '(Lớp học)'}
              </span>
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {isCoursePayment
                ? 'Cập nhật trạng thái và gắn tài khoản học viên trước khi xác nhận đã thanh toán để mở khóa học catalog.'
                : 'Cập nhật trạng thái và gắn tài khoản học viên trước khi xác nhận đã thanh toán để ghi danh vào lớp.'}
            </p>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-black/20 dark:text-slate-300">
                <p className="font-medium text-gray-900 dark:text-white">
                  {isCoursePayment ? courseDisplayTitle(editingRow) : editingRow.class_name}
                </p>
                {!isCoursePayment && (
                  <p className="mt-1 text-slate-400">
                    {editingRow.class_subject} · {editingRow.class_grade_label}
                  </p>
                )}
                <p className="mt-1 text-slate-400">
                  {editingRow.student_name} · {editingRow.student_phone || 'Không có SĐT'}
                </p>
                <p className="mt-1 text-slate-500">{editingRow.note || 'Không có ghi chú từ học viên.'}</p>
              </div>

              <label className="block text-sm text-slate-400">
                Gắn tài khoản học viên
                <select
                  value={draft.student_id}
                  onChange={(e) => setDraft((cur) => ({ ...cur, student_id: e.target.value }))}
                  className={`${inputAdmin} mt-1 w-full`}
                >
                  <option value="">— Chưa gắn —</option>
                  {studentOptions.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} — {student.email}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="block text-sm text-slate-400">
                  Nguồn tiền
                  <select
                    value={draft.payment_source}
                    onChange={(e) => setDraft((cur) => ({ ...cur, payment_source: e.target.value }))}
                    className={`${inputAdmin} mt-1 w-full`}
                  >
                    {SOURCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm text-slate-400">
                  Trạng thái
                  <select
                    value={draft.payment_status}
                    onChange={(e) => setDraft((cur) => ({ ...cur, payment_status: e.target.value }))}
                    className={`${inputAdmin} mt-1 w-full`}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm text-slate-400">
                  Số tiền
                  <input
                    type="number"
                    min="0"
                    value={draft.amount}
                    onChange={(e) => setDraft((cur) => ({ ...cur, amount: e.target.value }))}
                    className={`${inputAdmin} mt-1 w-full`}
                  />
                </label>
              </div>

              <label className="block text-sm text-slate-400">
                Ghi chú nội bộ
                <textarea
                  rows={4}
                  value={draft.admin_note}
                  onChange={(e) => setDraft((cur) => ({ ...cur, admin_note: e.target.value }))}
                  className={`${inputAdmin} mt-1 w-full`}
                  placeholder="Ví dụ: đã đối soát giao dịch, xác nhận bằng biên lai giấy..."
                />
              </label>

              {draft.payment_status === 'paid' && !draft.student_id && (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  {isCoursePayment
                    ? 'Cần gắn đúng tài khoản học viên trước khi chuyển sang “Đã thanh toán”, để hệ thống ghi nhận quyền xem khóa.'
                    : 'Cần gắn đúng tài khoản học viên trước khi chuyển sang “Đã thanh toán”, để hệ thống tự ghi danh vào lớp.'}
                </p>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button type="button" onClick={save} className={btnPrimaryAdmin}>
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    setDraft(null)
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  )
}
