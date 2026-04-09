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

export default function StudentClassSchedule({ embedded = false, lockedClassId = '', publicSurface = false }) {
  const { session, user } = useAuthSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const [allRows, setAllRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('week')

  const filterClassId = lockedClassId || searchParams.get('lop') || ''
  const filterTuNgay = searchParams.get('tuNgay') || ''
  const filterDenNgay = searchParams.get('denNgay') || ''

  const setFilterClassId = (id) => {
    if (lockedClassId) return
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

  const ps = publicSurface
  const inputCls = ps
    ? 'mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-white/15 dark:bg-black/40 dark:text-white dark:placeholder:text-slate-500 [color-scheme:light] dark:[color-scheme:dark]'
    : 'mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white placeholder:text-slate-500 [color-scheme:dark]'

  const secH2 = ps
    ? 'text-sm font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400/90'
    : 'text-sm font-semibold uppercase tracking-wider text-sky-400/90'
  const introP = ps ? 'text-sm text-gray-600 dark:text-slate-400' : 'text-sm text-slate-400'
  const smallMuted = ps ? 'text-sm text-gray-600 dark:text-slate-500' : 'text-sm text-slate-500'
  const labelCls = ps ? 'block text-sm text-gray-600 dark:text-slate-400' : 'block text-sm text-slate-400'
  const statBox = ps
    ? 'rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5'
    : 'rounded-xl border border-white/10 bg-white/5 px-4 py-3'
  const statLbl = ps
    ? 'text-xs uppercase tracking-wide text-gray-500 dark:text-slate-500'
    : 'text-xs uppercase tracking-wide text-slate-500'
  const statVal = ps ? 'text-lg font-semibold text-gray-900 dark:text-white' : 'text-lg font-semibold text-white'
  const filterBadge = ps
    ? 'rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 dark:border-sky-500/30 dark:bg-sky-500/10'
    : 'rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3'
  const filterLbl = ps
    ? 'text-xs uppercase tracking-wide text-sky-800 dark:text-sky-200/80'
    : 'text-xs uppercase tracking-wide text-sky-200/80'
  const filterVal = ps ? 'text-lg font-semibold text-sky-900 dark:text-sky-100' : 'text-lg font-semibold text-sky-100'
  const filterHint = ps ? 'text-xs text-sky-800/90 dark:text-sky-200/70' : 'text-xs text-sky-200/70'
  const tabWrap = ps ? 'flex rounded-xl border border-gray-200 p-1 dark:border-white/15' : 'flex rounded-xl border border-white/15 p-1'
  const tabInactive = ps
    ? 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
    : 'text-slate-400 hover:text-white'
  const panelVar = ps ? 'public' : 'default'
  const dayCol = ps
    ? 'flex min-h-[140px] flex-col rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-black/20'
    : 'flex min-h-[140px] flex-col rounded-xl border border-white/10 bg-black/20 p-3'
  const dayHead = ps
    ? 'mb-2 border-b border-gray-200 pb-2 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:border-white/10 dark:text-sky-300/90'
    : 'mb-2 border-b border-white/10 pb-2 text-xs font-semibold uppercase tracking-wide text-sky-300/90'
  const slotCard = ps
    ? 'rounded-lg border border-gray-200 bg-white p-2 text-xs leading-snug dark:border-white/10 dark:bg-white/5'
    : 'rounded-lg border border-white/10 bg-white/5 p-2 text-xs leading-snug'
  const slotTime = ps ? 'font-mono text-[11px] text-sky-700 dark:text-sky-200/90' : 'font-mono text-[11px] text-sky-200/90'
  const slotClass = ps ? 'mt-1 font-medium text-gray-900 dark:text-slate-100' : 'mt-1 font-medium text-slate-100'
  const slotSub = ps ? 'mt-0.5 text-gray-600 dark:text-slate-500' : 'mt-0.5 text-slate-500'
  const slotLoc = ps ? 'mt-1 text-[11px] text-gray-500 dark:text-slate-400' : 'mt-1 text-[11px] text-slate-400'
  const listTableWrap = ps
    ? 'overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10'
    : 'overflow-x-auto rounded-xl border border-white/10'
  const listThead = ps
    ? 'border-b border-gray-200 text-xs uppercase text-gray-600 dark:border-white/10 dark:text-slate-400'
    : 'border-b border-white/10 text-xs uppercase text-slate-400'
  const listTbody = ps
    ? 'divide-y divide-gray-200 text-gray-800 dark:divide-white/5 dark:text-slate-200'
    : 'divide-y divide-white/5 text-slate-200'

  const isStudent = user?.dbRole === 'student'

  const hubLopHash = '/hoc-vien/khoa-hoc#student-section-lop'

  const body = (
    <>
      {loading && <p className={introP}>Đang tải…</p>}

      {!loading && !isStudent && (
        <p className={smallMuted}>Chỉ tài khoản học viên xem được lịch lớp.</p>
      )}

      {!loading && isStudent && allRows.length === 0 && (
        <Panel variant={panelVar} title="Chưa có lịch" subtitle="Hoặc bạn chưa được thêm vào lớp nào">
          <p className={introP}>
            Khi được ghi danh và giáo viên thêm buổi học, lịch sẽ hiển thị tại đây.{' '}
            <Link
              className={ps ? 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300' : 'text-sky-400 hover:text-sky-300'}
              to={embedded ? hubLopHash : '/hoc-vien/khoa-hoc'}
            >
              {embedded ? 'Lớp đã kích hoạt' : 'Học tập'}
            </Link>{' '}
            ·{' '}
            <Link
              className={ps ? 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300' : 'text-sky-400 hover:text-sky-300'}
              to="/lop-hoc"
            >
              Lớp học
            </Link>
            .
          </p>
        </Panel>
      )}

      {!loading && isStudent && allRows.length > 0 && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <div className={statBox}>
                <p className={statLbl}>Tổng buổi</p>
                <p className={statVal}>{stats.totalSlots}</p>
              </div>
              <div className={statBox}>
                <p className={statLbl}>Lớp của bạn</p>
                <p className={statVal}>{stats.classCount}</p>
              </div>
              {(filterClassId || dateRangeFilter.active) && (
                <div className={filterBadge}>
                  <p className={filterLbl}>Sau lọc</p>
                  <p className={filterVal}>{stats.visible} buổi</p>
                  {dateRangeFilter.active && dateFilterSummary && (
                    <p className={filterHint}>Ngày mốc: {dateFilterSummary}</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <label className={labelCls}>
                Lọc theo lớp
                {lockedClassId ? (
                  <p className={`${inputCls} sm:mt-1 sm:min-w-[200px]`}>
                    {classOptions.find((c) => String(c.id) === String(lockedClassId))?.name || `Lớp #${lockedClassId}`}
                  </p>
                ) : (
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
                )}
              </label>
              <div className="flex flex-wrap items-end gap-3">
                <label className={labelCls}>
                  Từ ngày (mốc bắt đầu)
                  <input
                    type="date"
                    value={filterTuNgay}
                    onChange={(e) => patchNgayParams(e.target.value, filterDenNgay)}
                    className={`${inputCls} sm:mt-1 sm:w-[11rem]`}
                  />
                </label>
                <label className={labelCls}>
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
                    className={
                      ps
                        ? 'rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-white/20 dark:text-slate-300 dark:hover:bg-white/10'
                        : 'rounded-xl border border-white/20 px-3 py-2 text-sm text-slate-300 hover:bg-white/10'
                    }
                  >
                    Bỏ lọc ngày
                  </button>
                )}
              </div>
              <div className={tabWrap}>
                <button
                  type="button"
                  onClick={() => setView('week')}
                  className={`${tabBtn} ${
                    view === 'week'
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/30'
                      : tabInactive
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
                      : tabInactive
                  }`}
                >
                  Bảng chi tiết
                </button>
              </div>
            </div>
          </div>

          {nonStandardSlots.length > 0 && (
            <p
              className={
                ps
                  ? 'rounded-xl border border-amber-400/40 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100'
                  : 'rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100'
              }
            >
              Có {nonStandardSlots.length} buổi dữ liệu cũ hoặc nhãn thứ không chuẩn — xem ở bảng chi tiết (dòng
              tô nhạt) hoặc cuối lưới tuần.
            </p>
          )}

          {view === 'week' && (
            <Panel
              variant={panelVar}
              title="Lưới theo tuần"
              subtitle={
                dateRangeFilter.active && dateFilterSummary
                  ? `Lọc ngày mốc: ${dateFilterSummary}. Mỗi ô = một thứ; trong ô sắp xếp theo giờ tăng dần.`
                  : 'Cột là thứ trong tuần; giờ theo lịch giáo viên đã nhập.'
              }
            >
              {sortedAndFiltered.length === 0 ? (
                <p className={`py-8 text-center text-sm ${ps ? 'text-gray-500 dark:text-slate-500' : 'text-slate-500'}`}>
                  Không có buổi hiển thị. Đổi lớp hoặc bỏ / nới khoảng ngày.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                  {WEEK_DAYS.map((d) => (
                    <div key={d} className={dayCol}>
                      <p className={dayHead}>{d}</p>
                      <ul className="flex flex-1 flex-col gap-2">
                        {byDay[d].length === 0 ? (
                          <li className={`text-xs ${ps ? 'text-gray-500 dark:text-slate-600' : 'text-slate-600'}`}>—</li>
                        ) : (
                          byDay[d].map((s) => (
                            <li key={s.id}>
                              <div className={slotCard}>
                                <p className={slotTime}>{s.time}</p>
                                {s.startsAt && formatAnchorDateVi(s.startsAt) && (
                                  <p className={`text-[10px] ${ps ? 'text-gray-500 dark:text-slate-500' : 'text-slate-500'}`}>
                                    Mốc {formatAnchorDateVi(s.startsAt)}
                                  </p>
                                )}
                                <p className={slotClass}>{s.className}</p>
                                <p className={slotSub}>
                                  {s.subject} · {s.grade}
                                </p>
                                <p className={slotLoc}>{s.locationLabel}</p>
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
                <div
                  className={
                    ps
                      ? 'mt-4 rounded-xl border border-amber-300/50 bg-amber-50/80 p-4 dark:border-amber-500/25 dark:bg-amber-500/5'
                      : 'mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4'
                  }
                >
                  <p
                    className={
                      ps
                        ? 'mb-2 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200/90'
                        : 'mb-2 text-xs font-semibold uppercase tracking-wide text-amber-200/90'
                    }
                  >
                    Buổi không nằm trong 7 cột
                  </p>
                  <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {nonStandardSlots.map((s) => (
                      <li
                        key={s.id}
                        className={
                          ps
                            ? 'min-w-[200px] flex-1 rounded-lg border border-gray-200 bg-white p-2 text-xs dark:border-white/10 dark:bg-black/30'
                            : 'min-w-[200px] flex-1 rounded-lg border border-white/10 bg-black/30 p-2 text-xs'
                        }
                      >
                        <span className={ps ? 'font-medium text-amber-800 dark:text-amber-100' : 'font-medium text-amber-100'}>
                          {s.day}
                        </span>
                        <span className="mx-1 text-slate-500">·</span>
                        <span className={ps ? 'font-mono text-sky-700 dark:text-sky-200/80' : 'font-mono text-sky-200/80'}>
                          {s.time}
                        </span>
                        <p className={ps ? 'mt-1 font-medium text-gray-900 dark:text-slate-200' : 'mt-1 font-medium text-slate-200'}>
                          {s.className}
                        </p>
                        <p className={ps ? 'text-[11px] text-gray-600 dark:text-slate-500' : 'text-[11px] text-slate-500'}>
                          {s.locationLabel}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>
          )}

          {view === 'list' && (
            <Panel
              variant={panelVar}
              title="Bảng chi tiết"
              subtitle={
                dateRangeFilter.active && dateFilterSummary
                  ? `Cùng bộ lọc ngày: ${dateFilterSummary}. Thứ, ngày mốc, khung giờ, lớp, hình thức.`
                  : 'Thứ, ngày mốc, khung giờ, lớp, môn, khối, hình thức.'
              }
            >
              <div className={listTableWrap}>
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className={listThead}>
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
                  <tbody className={listTbody}>
                    {sortedAndFiltered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className={`px-4 py-10 text-center ${ps ? 'text-gray-500 dark:text-slate-500' : 'text-slate-500'}`}
                        >
                          Không có dòng lịch. Đổi lọc lớp hoặc khoảng ngày.
                        </td>
                      </tr>
                    ) : (
                      sortedAndFiltered.map((s) => (
                        <tr
                          key={s.id}
                          className={`${ps ? 'hover:bg-gray-50 dark:hover:bg-white/[0.04]' : 'hover:bg-white/[0.04]'} ${s.legacy ? 'bg-amber-500/10' : ''}`}
                        >
                          <td
                            className={`px-4 py-3 font-medium ${ps ? 'text-sky-700 dark:text-sky-200/90' : 'text-sky-200/90'}`}
                          >
                            {s.day}
                          </td>
                          <td className={`px-4 py-3 ${ps ? 'text-gray-600 dark:text-slate-400' : 'text-slate-400'}`}>
                            {formatAnchorDateVi(s.startsAt) || '—'}
                          </td>
                          <td className={`px-4 py-3 font-mono text-xs ${ps ? 'text-gray-700 dark:text-slate-300' : 'text-slate-300'}`}>
                            {s.time}
                          </td>
                          <td className={`px-4 py-3 font-medium ${ps ? 'text-gray-900 dark:text-slate-200' : 'text-slate-200'}`}>
                            {s.className}
                          </td>
                          <td className={`px-4 py-3 ${ps ? 'text-gray-600 dark:text-slate-400' : 'text-slate-400'}`}>
                            {s.subject}
                          </td>
                          <td className={`px-4 py-3 ${ps ? 'text-gray-600 dark:text-slate-400' : 'text-slate-400'}`}>
                            {s.grade}
                          </td>
                          <td className={`px-4 py-3 ${ps ? 'text-gray-800 dark:text-slate-300' : 'text-slate-300'}`}>
                            {s.locationLabel}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {!embedded && (
            <p className="text-center text-sm">
              <Link to="/hoc-vien/khoa-hoc" className="font-medium text-sky-400 hover:text-sky-300">
                ← Về Học tập
              </Link>
            </p>
          )}
        </>
      )}
    </>
  )

  if (embedded) {
    return (
      <section id="student-section-lich-lop" className="space-y-6 scroll-mt-24">
        <div className="space-y-1">
          <h2 className={secH2}>Lịch lớp</h2>
          <p className={introP}>
            Buổi học các lớp đã ghi danh — lưới tuần hoặc bảng chi tiết; lọc theo lớp và khoảng ngày mốc.
          </p>
        </div>
        {body}
      </section>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Học viên"
        title="Lịch lớp"
        description="Buổi học các lớp bạn đã ghi danh — xem lưới tuần hoặc bảng chi tiết; lọc theo lớp và khoảng ngày mốc như trang giáo viên."
      />
      {body}
    </div>
  )
}
