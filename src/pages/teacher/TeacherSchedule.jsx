import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { ModalPortal } from '../../components/dashboard/ModalPortal'
import { useTeacherState } from '../../hooks/useTeacherState'
import {
  inputTeacher,
  modalBackdrop,
  modalPanelTeacher,
  labelAdmin,
  btnPrimaryTeacher,
  tableShell,
  tableHeadTeacher,
  tableBodyTeacher,
  tableRowHover,
} from '../../components/dashboard/dashboardStyles'
import AppDatePicker from '../../components/ui/AppDatePicker.jsx'
import AppTimePicker from '../../components/ui/AppTimePicker.jsx'
import PageLoading from '../../components/ui/PageLoading.jsx'
import AppDateRangePicker from '../../components/ui/AppDateRangePicker.jsx'
import {
  WEEK_DAYS,
  defaultNewSlotFormValues,
  localDateFromParts,
  normalizeDeliveryMode,
  parseTimeStartMinutes,
  toDateInputValue,
  toTimeInputValue,
} from '../../lib/teacherScheduleFormat.js'

function daySortKeyFromRow(row) {
  const i = WEEK_DAYS.indexOf(row.day)
  return i >= 0 ? i : 98
}

function formatAnchorDateVi(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('vi-VN')
}

/** Phút từ 0h trong ngày (bắt đầu buổi) — dùng sắp xếp tăng dần trong cùng một cột thứ */
function startMinutesOfDay(row) {
  if (row.startsAt) {
    const d = new Date(row.startsAt)
    if (!Number.isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes()
  }
  return parseTimeStartMinutes(row.time)
}

/** YYYY-MM-DD theo giờ local của mốc bắt đầu buổi (để lọc theo ngày) */
function rowAnchorDateKey(row) {
  if (!row.startsAt) return null
  const d = new Date(row.startsAt)
  if (Number.isNaN(d.getTime())) return null
  return toDateInputValue(d)
}

function formatYmdKeyVi(ymd) {
  if (!ymd) return ''
  const [y, mo, d] = ymd.split('-').map(Number)
  if (!y || !mo || !d) return ymd
  const dt = new Date(y, mo - 1, d)
  return dt.toLocaleDateString('vi-VN')
}

export default function TeacherSchedule() {
  const { state, loading, error, addScheduleSlot, updateScheduleSlot, deleteScheduleSlot } = useTeacherState()
  const [searchParams, setSearchParams] = useSearchParams()
  const [form, setForm] = useState(() => defaultNewSlotFormValues())
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [view, setView] = useState('week')

  const filterClassId = searchParams.get('lop') || ''
  const filterTuNgay = searchParams.get('tuNgay') || ''
  const filterDenNgay = searchParams.get('denNgay') || ''

  const setFilterClassId = (id) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (!id) next.delete('lop')
        else next.set('lop', id)
        return next
      },
      { replace: true },
    )
  }

  const patchNgayParams = (tuNgay, denNgay) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (tuNgay) next.set('tuNgay', tuNgay)
        else next.delete('tuNgay')
        if (denNgay) next.set('denNgay', denNgay)
        else next.delete('denNgay')
        return next
      },
      { replace: true },
    )
  }

  const dateRangeFilter = useMemo(() => {
    let fromKey = filterTuNgay.trim() || null
    let toKey = filterDenNgay.trim() || null
    if (fromKey && toKey && fromKey > toKey) {
      ;[fromKey, toKey] = [toKey, fromKey]
    }
    const active = Boolean(fromKey || toKey)
    return { fromKey, toKey, active }
  }, [filterTuNgay, filterDenNgay])

  const sortedBase = useMemo(() => {
    let rows = [...state.schedule]
    if (filterClassId) rows = rows.filter((s) => s.classId === filterClassId)
    rows.sort((a, b) => {
      const da = daySortKeyFromRow(a)
      const db = daySortKeyFromRow(b)
      if (da !== db) return da - db
      const ma = startMinutesOfDay(a)
      const mb = startMinutesOfDay(b)
      if (ma !== mb) return ma - mb
      return a.sortTimestamp - b.sortTimestamp
    })
    return rows
  }, [state.schedule, filterClassId])

  const sortedAndFiltered = useMemo(() => {
    const { fromKey, toKey } = dateRangeFilter
    if (!fromKey && !toKey) return sortedBase
    return sortedBase.filter((row) => {
      const key = rowAnchorDateKey(row)
      if (key == null) return false
      if (fromKey && key < fromKey) return false
      if (toKey && key > toKey) return false
      return true
    })
  }, [sortedBase, dateRangeFilter])

  const nonStandardSlots = useMemo(
    () =>
      sortedAndFiltered.filter(
        (s) => !WEEK_DAYS.includes(s.day) || s.day === '—',
      ),
    [sortedAndFiltered],
  )

  const byDay = useMemo(() => {
    const map = Object.fromEntries(WEEK_DAYS.map((d) => [d, []]))
    for (const s of sortedAndFiltered) {
      if (map[s.day] != null) map[s.day].push(s)
    }
    for (const d of WEEK_DAYS) {
      map[d].sort((a, b) => {
        const ma = startMinutesOfDay(a)
        const mb = startMinutesOfDay(b)
        if (ma !== mb) return ma - mb
        return a.sortTimestamp - b.sortTimestamp
      })
    }
    return map
  }, [sortedAndFiltered])

  const stats = useMemo(() => {
    const classIds = new Set(state.schedule.map((s) => s.classId))
    return {
      totalSlots: state.schedule.length,
      classCount: classIds.size,
      visible: sortedAndFiltered.length,
    }
  }, [state.schedule, sortedAndFiltered])

  const dateFilterSummary = useMemo(() => {
    if (!dateRangeFilter.active) return null
    const { fromKey, toKey } = dateRangeFilter
    if (fromKey && toKey) return `${formatYmdKeyVi(fromKey)} – ${formatYmdKeyVi(toKey)}`
    if (fromKey) return `từ ${formatYmdKeyVi(fromKey)}`
    return `đến ${formatYmdKeyVi(toKey)}`
  }, [dateRangeFilter])

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const openForm = () => {
    setEditingId(null)
    setForm(defaultNewSlotFormValues())
    setShowForm(true)
  }

  const openForEdit = (s) => {
    setEditingId(s.id)
    const dm = normalizeDeliveryMode(s.deliveryMode)
    if (s.startsAt) {
      const start = new Date(s.startsAt)
      let end = s.endsAt ? new Date(s.endsAt) : null
      if (!end || Number.isNaN(end.getTime())) {
        end = new Date(start.getTime() + 90 * 60000)
      }
      setForm({
        classId: s.classId,
        startDate: toDateInputValue(start),
        startTime: toTimeInputValue(start),
        endDate: toDateInputValue(end),
        endTime: toTimeInputValue(end),
        deliveryMode: dm,
      })
    } else {
      toast.info('Buổi cũ chưa có mốc ngày giờ — chọn đầy đủ ngày giờ bắt đầu và kết thúc.')
      setForm({
        ...defaultNewSlotFormValues(),
        classId: s.classId,
        deliveryMode: dm,
      })
    }
    setShowForm(true)
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.classId || !form.startDate || !form.startTime || !form.endDate || !form.endTime) {
      toast.error('Chọn đủ lớp, ngày giờ bắt đầu và ngày giờ kết thúc.')
      return
    }
    const start = localDateFromParts(form.startDate, form.startTime)
    const end = localDateFromParts(form.endDate, form.endTime)
    if (!start || !end) {
      toast.error('Ngày giờ không hợp lệ.')
      return
    }
    if (end.getTime() <= start.getTime()) {
      toast.error('Giờ kết thúc phải sau giờ bắt đầu.')
      return
    }
    try {
      if (editingId) {
        await updateScheduleSlot(editingId, {
          classIdStr: form.classId,
          startsAtIso: start.toISOString(),
          endsAtIso: end.toISOString(),
          deliveryMode: form.deliveryMode,
        })
        toast.success('Đã cập nhật buổi học.')
      } else {
        await addScheduleSlot(form.classId, {
          startsAtIso: start.toISOString(),
          endsAtIso: end.toISOString(),
          deliveryMode: form.deliveryMode,
        })
        toast.success('Đã thêm buổi học.')
      }
      setForm(defaultNewSlotFormValues())
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      toastActionError(err, editingId ? 'Không cập nhật được buổi học.' : 'Không thêm được buổi học.')
    }
  }

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const inputCls = `${inputTeacher} mt-1 w-full`

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Giáo viên"
        title="Lịch dạy"
        description="Thêm hoặc sửa buổi từ lưới / bảng. Chọn ngày và giờ bắt đầu & kết thúc; thứ trên lưới theo ngày bắt đầu. Hình thức: Học Online hoặc Học Offline."
      >
        <button
          type="button"
          onClick={openForm}
          className="rounded-xl border border-dashed border-emerald-500/50 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-500/20"
        >
          + Thêm buổi
        </button>
      </PageHeader>

      {loading && <PageLoading variant="inline" />}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Tổng buổi</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalSlots}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Lớp có lịch</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.classCount}</p>
          </div>
          {(filterClassId || dateRangeFilter.active) && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-200/80">Sau lọc</p>
              <p className="text-lg font-semibold text-emerald-100">{stats.visible} buổi</p>
              {dateRangeFilter.active && dateFilterSummary && (
                <p className="text-xs text-emerald-200/70">Ngày mốc buổi: {dateFilterSummary}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="block text-sm text-slate-400">
            Lọc theo lớp
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className={`${inputCls} sm:mt-1 sm:min-w-[200px]`}
            >
              <option value="">Tất cả lớp</option>
              {state.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-400">
            Khoảng ngày (mốc bắt đầu buổi)
            <div className="sm:mt-1">
              <AppDateRangePicker
                from={filterTuNgay}
                to={filterDenNgay}
                onChange={({ from, to }) => patchNgayParams(from, to)}
                placeholder="Từ — đến ngày"
                triggerClassName="w-full min-w-[12rem] border-white/15 bg-black/40 text-white hover:border-cyan-500/40 focus:border-cyan-500/50 focus:ring-cyan-500/20 sm:w-[min(100%,22rem)]"
              />
            </div>
          </label>
          <div className="flex rounded-xl border border-white/15 p-1">
            <button
              type="button"
              onClick={() => setView('week')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'week' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lưới tuần
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'list' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bảng chi tiết
            </button>
          </div>
        </div>
      </div>

      {nonStandardSlots.length > 0 && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Có {nonStandardSlots.length} buổi dữ liệu cũ hoặc thứ không chuẩn — xem kỹ ở bảng chi tiết (dòng tô nhạt).
        </p>
      )}

      {view === 'week' && (
        <Panel
          title="Lưới theo tuần"
          subtitle={
            dateRangeFilter.active && dateFilterSummary
              ? `Lọc theo ngày mốc buổi: ${dateFilterSummary}. Cột = thứ; trong ô sắp xếp theo giờ tăng dần.`
              : 'Cột = thứ trong tuần; giờ lấy từ ngày bạn đã chọn khi tạo buổi.'
          }
        >
          {sortedAndFiltered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Không có buổi hiển thị. Thêm buổi, đổi lớp, hoặc bỏ / nới khoảng ngày.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {WEEK_DAYS.map((d) => (
                <div
                  key={d}
                  className="flex min-h-[140px] flex-col rounded-xl border border-white/10 bg-black/20 p-3"
                >
                  <p className="mb-2 border-b border-white/10 pb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
                    {d}
                  </p>
                  <ul className="flex flex-1 flex-col gap-2">
                    {byDay[d].length === 0 ? (
                      <li className="text-xs text-slate-600">—</li>
                    ) : (
                      byDay[d].map((s) => (
                        <li key={s.id}>
                          <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-xs leading-snug">
                            <p className="font-mono text-[11px] text-emerald-200/90">{s.time}</p>
                            {s.startsAt && formatAnchorDateVi(s.startsAt) && (
                              <p className="text-[10px] text-slate-500">Mốc {formatAnchorDateVi(s.startsAt)}</p>
                            )}
                            <Link
                              to={`/giao-vien/lop-hoc/${encodeURIComponent(s.classId)}`}
                              className="mt-1 block font-medium text-slate-100 hover:text-emerald-300"
                            >
                              {s.className}
                            </Link>
                            <p className="mt-0.5 text-slate-500">
                              {s.subject} · {s.grade}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">{s.locationLabel}</p>
                            <div className="mt-2 flex flex-wrap gap-2 border-t border-gray-200 dark:border-white/10 pt-2">
                              <button
                                type="button"
                                onClick={() => openForEdit(s)}
                                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm('Xóa buổi này?')) return
                                  try {
                                    await deleteScheduleSlot(s.id)
                                  } catch (err) {
                                    toastActionError(err, 'Không xóa được buổi học.')
                                  }
                                }}
                                className="text-[11px] text-red-400 hover:text-red-300"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {nonStandardSlots.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-200/90">
                Buổi không vào đúng 7 cột
              </p>
              <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {nonStandardSlots.map((s) => (
                  <li
                    key={s.id}
                    className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-black/30 p-2 text-xs"
                  >
                    <span className="font-medium text-amber-100">{s.day}</span>
                    <span className="mx-1 text-slate-500">·</span>
                    <span className="font-mono text-emerald-200/80">{s.time}</span>
                    <Link
                      to={`/giao-vien/lop-hoc/${encodeURIComponent(s.classId)}`}
                      className="mt-1 block text-slate-200 hover:text-emerald-300"
                    >
                      {s.className}
                    </Link>
                    <p className="text-[11px] text-slate-500">{s.locationLabel}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openForEdit(s)}
                        className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Xóa buổi này?')) return
                          try {
                            await deleteScheduleSlot(s.id)
                          } catch (err) {
                            toastActionError(err, 'Không xóa được buổi học.')
                          }
                        }}
                        className="text-[11px] text-red-400 hover:text-red-300"
                      >
                        Xóa
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      )}

      {view === 'list' && (
        <Panel
          title="Bảng chi tiết"
          subtitle={
            dateRangeFilter.active && dateFilterSummary
              ? `Cùng bộ lọc ngày: ${dateFilterSummary}. Thứ, ngày mốc, khung giờ, hình thức.`
              : 'Thứ (từ ngày đã chọn), khung giờ, hình thức.'
          }
        >
          <div className={tableShell}>
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className={tableHeadTeacher}>
                <tr>
                  <th className="px-4 py-3">Thứ</th>
                  <th className="px-4 py-3">Ngày mốc</th>
                  <th className="px-4 py-3">Khung giờ</th>
                  <th className="px-4 py-3">Lớp</th>
                  <th className="px-4 py-3">Môn</th>
                  <th className="px-4 py-3">Khối</th>
                  <th className="px-4 py-3">Hình thức</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className={tableBodyTeacher}>
                {sortedAndFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-600 dark:text-slate-500">
                      Không có dòng lịch. Thêm buổi hoặc đổi lọc lớp / khoảng ngày.
                    </td>
                  </tr>
                ) : (
                  sortedAndFiltered.map((s) => (
                    <tr
                      key={s.id}
                      className={`${tableRowHover} ${s.legacy ? 'bg-amber-100/80 dark:bg-amber-500/10' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-emerald-800 dark:text-emerald-200/90">{s.day}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {formatAnchorDateVi(s.startsAt) || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{s.time}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/giao-vien/lop-hoc/${encodeURIComponent(s.classId)}`}
                          className="font-medium text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                        >
                          {s.className}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.subject}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.grade}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.locationLabel}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => openForEdit(s)}
                            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm('Xóa buổi này khỏi lịch?')) return
                              try {
                                await deleteScheduleSlot(s.id)
                              } catch (err) {
                                toastActionError(err, 'Không xóa được buổi học.')
                              }
                            }}
                            className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {showForm && (
        <ModalPortal>
        <div className={modalBackdrop}>
          <form onSubmit={save} className={`${modalPanelTeacher} max-w-lg`}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editingId ? 'Sửa buổi học' : 'Thêm buổi học'}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {editingId
                ? 'Cập nhật lớp, ngày giờ hoặc hình thức. Lưu để áp dụng cho lịch của bạn và học viên.'
                : 'Dùng lịch (date picker) chọn ngày, chọn giờ riêng. Thứ trên lưới = thứ của ngày bắt đầu. Hình thức: Học Online hoặc Học Offline.'}
            </p>
            <label className={`mt-4 ${labelAdmin}`}>
              Lớp
              <select
                value={form.classId}
                onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                className={inputCls}
              >
                <option value="">— Chọn —</option>
                {state.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-3 space-y-1">
              <p className="text-sm text-slate-400">Bắt đầu</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs text-slate-500">
                  Ngày
                  <div className="mt-1">
                    <AppDatePicker
                      value={form.startDate}
                      onChange={(v) => setForm((f) => ({ ...f, startDate: v }))}
                      placeholder="Chọn ngày"
                      triggerClassName={`${inputTeacher} w-full border-white/15 bg-black/40 text-white hover:border-cyan-500/40 focus:border-cyan-500/50 focus:ring-cyan-500/20`}
                    />
                  </div>
                </label>
                <label className="block text-xs text-slate-500">
                  Giờ
                  <div className="mt-1">
                    <AppTimePicker
                      value={form.startTime}
                      onChange={(v) => setForm((f) => ({ ...f, startTime: v }))}
                      required
                    />
                  </div>
                </label>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-sm text-slate-400">Kết thúc</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs text-slate-500">
                  Ngày
                  <div className="mt-1">
                    <AppDatePicker
                      value={form.endDate}
                      onChange={(v) => setForm((f) => ({ ...f, endDate: v }))}
                      placeholder="Chọn ngày"
                      triggerClassName={`${inputTeacher} w-full border-white/15 bg-black/40 text-white hover:border-cyan-500/40 focus:border-cyan-500/50 focus:ring-cyan-500/20`}
                    />
                  </div>
                </label>
                <label className="block text-xs text-slate-500">
                  Giờ
                  <div className="mt-1">
                    <AppTimePicker
                      value={form.endTime}
                      onChange={(v) => setForm((f) => ({ ...f, endTime: v }))}
                      required
                    />
                  </div>
                </label>
              </div>
            </div>
            <fieldset className="mt-4 space-y-2">
              <legend className="text-sm text-slate-400">Hình thức</legend>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
                <input
                  type="radio"
                  name={editingId ? `deliveryMode-${editingId}` : 'deliveryMode-new'}
                  value="online"
                  checked={form.deliveryMode === 'online'}
                  onChange={() => setForm((f) => ({ ...f, deliveryMode: 'online' }))}
                  className="text-emerald-500"
                />
                Học Online
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
                <input
                  type="radio"
                  name={editingId ? `deliveryMode-${editingId}` : 'deliveryMode-new'}
                  value="offline"
                  checked={form.deliveryMode === 'offline'}
                  onChange={() => setForm((f) => ({ ...f, deliveryMode: 'offline' }))}
                  className="text-emerald-500"
                />
                Học Offline
              </label>
            </fieldset>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:text-slate-300 dark:hover:bg-white/5"
              >
                Hủy
              </button>
              <button type="submit" className={btnPrimaryTeacher}>
                {editingId ? 'Cập nhật' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
        </ModalPortal>
      )}
    </div>
  )
}
