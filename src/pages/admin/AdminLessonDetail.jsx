import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { inputAdmin, btnPrimaryAdmin, btnSecondaryAdmin } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { useAdminState } from '../../hooks/useAdminState'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import {
  LessonSectionBlocksEditor,
  LinesTextarea,
  linesToStringArray,
  normalizeLessonSections,
  stringArrayToLines,
} from '../../components/admin/StructuredContentEditors.jsx'
import * as srv from '../../services/adminServerApi.js'

export default function AdminLessonDetail() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const { session } = useAuthSession()
  const token = session?.access_token
  const { state: adminState } = useAdminState()
  const sortedCatalogCourses = useMemo(() => {
    const list = adminState.courses || []
    return [...list].sort((a, b) => {
      const sa = String(a.subject || '')
      const sb = String(b.subject || '')
      if (sa !== sb) return sa.localeCompare(sb, 'vi')
      return String(a.title || '').localeCompare(String(b.title || ''), 'vi')
    })
  }, [adminState.courses])

  const [lessonRow, setLessonRow] = useState(null)
  const [courseSelectId, setCourseSelectId] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailForm, setDetailForm] = useState({
    summary: '',
    teacher_name: '',
    youtube_url: '',
    outlineText: '',
    sectionBlocks: [{ heading: '', body: '' }],
    practiceHintsText: '',
  })

  const idNum = Number(lessonId)
  const idValid = Number.isFinite(idNum)
  /** Chỉ true/false — tránh tải lại form mỗi khi JWT refresh (access_token đổi chuỗi). */
  const hasSession = Boolean(session?.access_token)
  const tokenRef = useRef(token)
  tokenRef.current = session?.access_token

  useEffect(() => {
    const t = tokenRef.current
    const nid = Number(lessonId)
    const ok = Number.isFinite(nid)
    if (!t || !ok) {
      setLessonRow(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const [listRes, detRes] = await Promise.all([
          srv.adminListLessons(t),
          srv.adminGetLessonDetails(t, nid),
        ])
        if (cancelled) return
        const row = (listRes.data || []).find((r) => Number(r.id) === nid)
        setLessonRow(row || null)
        if (row?.course_id != null) setCourseSelectId(String(row.course_id))
        else setCourseSelectId('')
        const d = detRes?.data ?? {}
        setDetailForm({
          summary: d.summary || '',
          teacher_name: d.teacher_name || '',
          youtube_url: d.youtube_url != null ? String(d.youtube_url) : '',
          outlineText: stringArrayToLines(Array.isArray(d.outline) ? d.outline : []),
          sectionBlocks: normalizeLessonSections(d.sections),
          practiceHintsText: stringArrayToLines(Array.isArray(d.practice_hints) ? d.practice_hints : []),
        })
      } catch (e) {
        if (cancelled) return
        if (import.meta.env.DEV) console.error('[AdminLessonDetail load]', e)
        toastActionError(e, 'Không đọc được chi tiết bài giảng.')
        setLessonRow(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [lessonId, hasSession])

  const saveCourseMeta = async () => {
    if (!token || !idValid) return
    const cid = Number(courseSelectId)
    if (!Number.isFinite(cid)) {
      toast.warning('Chọn khóa học hợp lệ.')
      return
    }
    if (Number(lessonRow?.course_id) === cid) {
      toast.info('Khóa học không đổi.')
      return
    }
    try {
      await srv.adminPatchLesson(token, idNum, { course_id: cid })
      const listRes = await srv.adminListLessons(token)
      const row = (listRes.data || []).find((r) => Number(r.id) === idNum)
      if (row) setLessonRow(row)
      toast.success('Đã cập nhật khóa học.')
    } catch (e2) {
      toastActionError(e2, 'Không cập nhật được khóa học.')
    }
  }

  const saveDetail = async (e) => {
    e.preventDefault()
    if (!token || !idValid) return
    const outline = linesToStringArray(detailForm.outlineText)
    const sections = detailForm.sectionBlocks.filter((s) => s.heading.trim() || s.body.trim())
    const practice_hints = linesToStringArray(detailForm.practiceHintsText)
    const youtubePayload =
      typeof detailForm.youtube_url === 'string' ? detailForm.youtube_url.trim() : detailForm.youtube_url
    try {
      const res = await srv.adminPutLessonDetails(token, idNum, {
        summary: detailForm.summary,
        teacher_name: detailForm.teacher_name,
        youtube_url: youtubePayload,
        outline,
        sections,
        resources: [],
        practice_hints,
      })
      const saved = res?.data
      if (youtubePayload && (!saved || !(saved.youtube_url != null && String(saved.youtube_url).trim()))) {
        toast.warning('Không lưu được link video. Vui lòng thử lại hoặc liên hệ quản trị hệ thống.')
      } else {
        toast.success('Đã lưu chi tiết bài giảng.')
      }
      navigate('/admin/bai-giang-noi-dung')
    } catch (e2) {
      toastActionError(e2, 'Không lưu được chi tiết bài giảng.')
    }
  }

  const field = `${inputAdmin} mt-1 w-full`

  if (!idValid) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">ID bài giảng không hợp lệ.</p>
        <Link to="/admin/bai-giang-noi-dung" className="text-cyan-400 hover:text-cyan-300">
          ← Quay lại danh sách
        </Link>
      </div>
    )
  }

  if (!loading && !lessonRow) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">Không tìm thấy bài giảng.</p>
        <Link to="/admin/bai-giang-noi-dung" className="text-cyan-400 hover:text-cyan-300">
          ← Quay lại danh sách
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Chi tiết bài giảng"
        description={
          <>
            Nội dung hiển thị tại{' '}
            <Link className="font-medium text-cyan-400 hover:text-cyan-300" to="/bai-giang">
              Bài giảng
            </Link>{' '}
            và trang chi tiết công khai.
          </>
        }
        badge="CMS"
      />

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      {!loading && lessonRow && (
        <Panel title={`Bài #${lessonRow.id} — ${lessonRow.title}`} subtitle="Tóm tắt, video và dàn ý trên trang bài giảng">
          <div className="mt-4 flex flex-wrap items-end gap-3 border-b border-gray-200 pb-5 dark:border-white/10">
            <label className="block min-w-[min(100%,280px)] flex-1 text-sm text-slate-400">
              Khóa học
              <select
                value={courseSelectId}
                onChange={(e) => setCourseSelectId(e.target.value)}
                className={field}
                disabled={sortedCatalogCourses.length === 0}
              >
                {sortedCatalogCourses.length === 0 ? (
                  <option value="">— Chưa có khóa —</option>
                ) : (
                  sortedCatalogCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.subject} — {c.title}
                    </option>
                  ))
                )}
              </select>
            </label>
            <button
              type="button"
              onClick={saveCourseMeta}
              className={btnSecondaryAdmin}
              disabled={!token || sortedCatalogCourses.length === 0}
            >
              Lưu khóa
            </button>
          </div>
          <form onSubmit={saveDetail} className="mt-4 space-y-5">
            <label className="block text-sm text-slate-400">
              Tóm tắt
              <textarea
                rows={3}
                value={detailForm.summary}
                onChange={(e) => setDetailForm((f) => ({ ...f, summary: e.target.value }))}
                className={field}
              />
            </label>
            <label className="block text-sm text-slate-400">
              Tên giảng viên (hiển thị)
              <input
                value={detailForm.teacher_name}
                onChange={(e) => setDetailForm((f) => ({ ...f, teacher_name: e.target.value }))}
                className={field}
              />
            </label>
            <label className="block text-sm text-slate-400">
              Link video YouTube
              <input
                type="text"
                inputMode="url"
                autoComplete="off"
                placeholder="https://www.youtube.com/watch?v=… hoặc https://youtu.be/…"
                value={detailForm.youtube_url}
                onChange={(e) => setDetailForm((f) => ({ ...f, youtube_url: e.target.value }))}
                className={field}
              />
              <span className="mt-1 block text-xs text-slate-500">
                Dán link bài phát trên YouTube — video sẽ hiển thị trên trang chi tiết bài giảng công khai.
              </span>
            </label>
            <LinesTextarea
              label="Dàn ý (outline)"
              hint="Mỗi dòng là một ý trong danh sách dàn ý trên trang chi tiết bài giảng."
              value={detailForm.outlineText}
              onChange={(outlineText) => setDetailForm((f) => ({ ...f, outlineText }))}
              rows={6}
              inputClassName={field}
            />
            <div className="border-t border-gray-200 dark:border-white/10 pt-4">
              <LessonSectionBlocksEditor
                blocks={detailForm.sectionBlocks}
                onChange={(sectionBlocks) => setDetailForm((f) => ({ ...f, sectionBlocks }))}
                fieldClass={field}
              />
            </div>
            <div className="border-t border-gray-200 dark:border-white/10 pt-4">
              <LinesTextarea
                label="Gợi ý luyện tập"
                hint="Mỗi dòng là một câu hỏi / bài tập gợi ý."
                value={detailForm.practiceHintsText}
                onChange={(practiceHintsText) => setDetailForm((f) => ({ ...f, practiceHintsText }))}
                rows={5}
                inputClassName={field}
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Link
                to="/admin/bai-giang-noi-dung"
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
              >
                Hủy
              </Link>
              <button type="submit" className={btnPrimaryAdmin}>
                Lưu chi tiết
              </button>
            </div>
          </form>
        </Panel>
      )}
    </div>
  )
}
