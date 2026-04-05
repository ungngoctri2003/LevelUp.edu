import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { useAuthSession } from '../../context/AuthSessionContext'
import { getMyClassSchedule } from '../../services/meApi.js'
import {
  WEEK_DAYS,
  parseTimeStartMinutes,
  toDateInputValue,
} from '../../lib/teacherScheduleFormat.js'
import { PUBLIC_ACTION_ERROR } from '../../lib/publicUserMessages.js'
import { toast } from 'sonner'

function daySortKeyFromRow(row) {
  const i = WEEK_DAYS.indexOf(row.day)
  return i >= 0 ? i : 98
}

function startMinutesOfDay(row) {
  if (row.startsAt) {
    const d = new Date(row.startsAt)
    if (!Number.isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes()
  }
  return parseTimeStartMinutes(row.time)
}

function formatAnchorDateVi(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('vi-VN')
}

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

const tabBtn =
  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 sm:py-2.5 sm:text-base'

export default function StudentClassSchedule() {
  const { session, user } = useAuthSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const [allRows, setAllRows] = useState([])
  const [loading, setLoading] = useState(true)
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

  const load = useCallback(async () => {
    const token = session?.access_token
    if (!token || user?.dbRole !== 'student') {
      setAllRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await getMyClassSchedule(token)
      const list = Array.isArray(data) ? data : []
      setAllRows(list)
    } catch (e) {
      if (import.meta.env.DEV) console.error('[StudentClassSchedule]', e)
      toast.error(PUBLIC_ACTION_ERROR)
      setAllRows([])
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, user?.dbRole])

  useEffect(() => {
    load()
  }, [load])

  const classOptions = useMemo(() => {
    const m = new Map()
    for (const r of allRows) {
      if (!m.has(r.classId)) m.set(r.classId, { id: r.classId, name: r.className })
    }
    return [...m.values()].sort((a, b) => String(a.name).localeCompare(String(b.name), 'vi'))
  }, [allRows])

  const sortedBase = useMemo(() => {
    let rows = [...allRows]
    if (filterClassId) rows = rows.filter((s) => s.classId === filterClassId)
    rows.sort((a, b) => {
      const da = daySortKeyFromRow(a)
      const db = daySortKeyFromRow(b)
      if (da !== db) return da - db
      const ma = startMinutesOfDay(a)
      const mb = startMinutesOfDay(b)
      if (ma !== mb) return ma - mb
      const ca = String(a.className).localeCompare(String(b.className), 'vi')
      if (ca !== 0) return ca
      return a.sortTimestamp - b.sortTimestamp
    })
    return rows
  }, [allRows, filterClassId])

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
    const classIds = new Set(allRows.map((s) => s.classId))
    return {
      totalSlots: allRows.length,
      classCount: classIds.size,
      visible: sortedAndFiltered.length,
    }
  }, [allRows, sortedAndFiltered])

  const dateFilterSummary = useMemo(() => {
    if (!dateRangeFilter.active) return null
    const { fromKey, toKey } = dateRangeFilter
    if (fromKey && toKey) return `${formatYmdKeyVi(fromKey)} – ${formatYmdKeyVi(toKey)}`
    if (fromKey) return `từ ${formatYmdKeyVi(fromKey)}`
    return `đến ${formatYmdKeyVi(toKey)}`
  }, [dateRangeFilter])

  const inputCls =
    'mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white placeholder:text-slate-500 [color-scheme:dark]'

  const isStudent = user?.dbRole === 'student'

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Học viên"
        title="Lịch lớp"
        description="Buổi học các lớp bạn đã ghi danh — xem lưới tuần hoặc bảng chi tiết; lọc theo lớp và khoảng ngày mốc như trang giáo viên."
      />

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      {!loading && !isStudent && (
        <p className="text-sm text-slate-500">Chỉ tài khoản học viên xem được lịch lớp.</p>
      )}

      {!loading && isStudent && allRows.length === 0 && (
        <Panel title="Chưa có lịch" subtitle="Hoặc bạn chưa được thêm vào lớp nào">
          <p className="text-sm text-slate-400">
            Khi được ghi danh và giáo viên thêm buổi học, lịch sẽ hiển thị tại đây.{' '}
            <Link className="text-sky-400 hover:text-sky-300" to="/hoc-vien/khoa-hoc">
              Học tập
            </Link>{' '}
            ·{' '}
            <Link className="text-sky-400 hover:text-sky-300" to="/bai-giang">
              Bài giảng
            </Link>
            .
          </p>
        </Panel>
      )}

      {!loading && isStudent && allRows.length > 0 && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Tổng buổi</p>
                <p className="text-lg font-semibold text-white">{stats.totalSlots}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Lớp của bạn</p>
                <p className="text-lg font-semibold text-white">{stats.classCount}</p>
              </div>
              {(filterClassId || dateRangeFilter.active) && (
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-sky-200/80">Sau lọc</p>
                  <p className="text-lg font-semibold text-sky-100">{stats.visible} buổi</p>
                  {dateRangeFilter.active && dateFilterSummary && (
                    <p className="text-xs text-sky-200/70">Ngày mốc: {dateFilterSummary}</p>
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
                  {classOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap items-end gap-3">
                <label className="block text-sm text-slate-400">
                  Từ ngày (mốc bắt đầu)
                  <input
                    type="date"
                    value={filterTuNgay}
                    onChange={(e) => patchNgayParams(e.target.value, filterDenNgay)}
                    className={`${inputCls} sm:mt-1 sm:w-[11rem]`}
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  Đến ngày
                  <input
                    type="date"
                    value={filterDenNgay}
                    onChange={(e) => patchNgayParams(filterTuNgay, e.target.value)}
                    className={`${inputCls} sm:mt-1 sm:w-[11rem]`}
                  />
                </label>
                {dateRangeFilter.active && (
                  <button
                    type="button"
                    onClick={() => patchNgayParams('', '')}
                    className="rounded-xl border border-white/20 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
                  >
                    Bỏ lọc ngày
                  </button>
                )}
              </div>
              <div className="flex rounded-xl border border-white/15 p-1">
                <button
                  type="button"
                  onClick={() => setView('week')}
                  className={`${tabBtn} ${
                    view === 'week'
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lưới tuần
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={`${tabBtn} ${
                    view === 'list'
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bảng chi tiết
                </button>
              </div>
            </div>
          </div>

          {nonStandardSlots.length > 0 && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Có {nonStandardSlots.length} buổi dữ liệu cũ hoặc nhãn thứ không chuẩn — xem ở bảng chi tiết (dòng
              tô nhạt) hoặc cuối lưới tuần.
            </p>
          )}

          {view === 'week' && (
            <Panel
              title="Lưới theo tuần"
              subtitle={
                dateRangeFilter.active && dateFilterSummary
                  ? `Lọc ngày mốc: ${dateFilterSummary}. Mỗi ô = một thứ; trong ô sắp xếp theo giờ tăng dần.`
                  : 'Cột là thứ trong tuần; giờ theo lịch giáo viên đã nhập.'
              }
            >
              {sortedAndFiltered.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Không có buổi hiển thị. Đổi lớp hoặc bỏ / nới khoảng ngày.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                  {WEEK_DAYS.map((d) => (
                    <div
                      key={d}
                      className="flex min-h-[140px] flex-col rounded-xl border border-white/10 bg-black/20 p-3"
                    >
                      <p className="mb-2 border-b border-white/10 pb-2 text-xs font-semibold uppercase tracking-wide text-sky-300/90">
                        {d}
                      </p>
                      <ul className="flex flex-1 flex-col gap-2">
                        {byDay[d].length === 0 ? (
                          <li className="text-xs text-slate-600">—</li>
                        ) : (
                          byDay[d].map((s) => (
                            <li key={s.id}>
                              <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-xs leading-snug">
                                <p className="font-mono text-[11px] text-sky-200/90">{s.time}</p>
                                {s.startsAt && formatAnchorDateVi(s.startsAt) && (
                                  <p className="text-[10px] text-slate-500">
                                    Mốc {formatAnchorDateVi(s.startsAt)}
                                  </p>
                                )}
                                <p className="mt-1 font-medium text-slate-100">{s.className}</p>
                                <p className="mt-0.5 text-slate-500">
                                  {s.subject} · {s.grade}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-400">{s.locationLabel}</p>
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
                    Buổi không nằm trong 7 cột
                  </p>
                  <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {nonStandardSlots.map((s) => (
                      <li
                        key={s.id}
                        className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-black/30 p-2 text-xs"
                      >
                        <span className="font-medium text-amber-100">{s.day}</span>
                        <span className="mx-1 text-slate-500">·</span>
                        <span className="font-mono text-sky-200/80">{s.time}</span>
                        <p className="mt-1 font-medium text-slate-200">{s.className}</p>
                        <p className="text-[11px] text-slate-500">{s.locationLabel}</p>
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
                  ? `Cùng bộ lọc ngày: ${dateFilterSummary}. Thứ, ngày mốc, khung giờ, lớp, hình thức.`
                  : 'Thứ, ngày mốc, khung giờ, lớp, môn, khối, hình thức.'
              }
            >
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Thứ</th>
                      <th className="px-4 py-3">Ngày mốc</th>
                      <th className="px-4 py-3">Khung giờ</th>
                      <th className="px-4 py-3">Lớp</th>
                      <th className="px-4 py-3">Môn</th>
                      <th className="px-4 py-3">Khối</th>
                      <th className="px-4 py-3">Hình thức</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {sortedAndFiltered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                          Không có dòng lịch. Đổi lọc lớp hoặc khoảng ngày.
                        </td>
                      </tr>
                    ) : (
                      sortedAndFiltered.map((s) => (
                        <tr
                          key={s.id}
                          className={`hover:bg-white/[0.04] ${s.legacy ? 'bg-amber-500/10' : ''}`}
                        >
                          <td className="px-4 py-3 font-medium text-sky-200/90">{s.day}</td>
                          <td className="px-4 py-3 text-slate-400">
                            {formatAnchorDateVi(s.startsAt) || '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-300">{s.time}</td>
                          <td className="px-4 py-3 font-medium text-slate-200">{s.className}</td>
                          <td className="px-4 py-3 text-slate-400">{s.subject}</td>
                          <td className="px-4 py-3 text-slate-400">{s.grade}</td>
                          <td className="px-4 py-3 text-slate-300">{s.locationLabel}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          <p className="text-center text-sm">
            <Link to="/hoc-vien/khoa-hoc" className="font-medium text-sky-400 hover:text-sky-300">
              ← Về Học tập
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
