import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { inputAdmin, btnPrimaryAdmin } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
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

export default function AdminTeacherLessonPostDetail() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { session } = useAuthSession()
  const token = session?.access_token

  const [postRow, setPostRow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailForm, setDetailForm] = useState({
    summary: '',
    teacher_name: '',
    youtube_url: '',
    outlineText: '',
    sectionBlocks: [{ heading: '', body: '' }],
    practiceHintsText: '',
  })

  const idNum = Number(postId)
  const idValid = Number.isFinite(idNum)
  const hasSession = Boolean(session?.access_token)
  const tokenRef = useRef(token)
  tokenRef.current = session?.access_token

  useEffect(() => {
    const t = tokenRef.current
    const nid = Number(postId)
    const ok = Number.isFinite(nid)
    if (!t || !ok) {
      setPostRow(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const detRes = await srv.adminGetTeacherLessonPostDetails(t, nid)
        if (cancelled) return
        const payload = detRes?.data ?? {}
        const post = payload.post
        const d = payload.details ?? {}
        setPostRow(post || null)
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
        if (import.meta.env.DEV) console.error('[AdminTeacherLessonPostDetail load]', e)
        toastActionError(e, 'Không đọc được chi tiết bài giảng lớp.')
        setPostRow(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [postId, hasSession])

  const saveDetail = async (e) => {
    e.preventDefault()
    if (!token || !idValid) return
    const outline = linesToStringArray(detailForm.outlineText)
    const sections = detailForm.sectionBlocks.filter((s) => s.heading.trim() || s.body.trim())
    const practice_hints = linesToStringArray(detailForm.practiceHintsText)
    const youtubePayload =
      typeof detailForm.youtube_url === 'string' ? detailForm.youtube_url.trim() : detailForm.youtube_url
    try {
      const res = await srv.adminPutTeacherLessonPostDetails(token, idNum, {
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
        toast.warning('Không lưu được link video. Vui lòng thử lại.')
      } else {
        toast.success('Đã lưu chi tiết bài giảng lớp.')
      }
      navigate('/admin/bai-giang-noi-dung?tab=lop')
    } catch (e2) {
      toastActionError(e2, 'Không lưu được chi tiết bài giảng lớp.')
    }
  }

  const field = `${inputAdmin} mt-1 w-full`

  if (!idValid) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">ID bài giảng không hợp lệ.</p>
        <Link to="/admin/bai-giang-noi-dung?tab=lop" className="text-cyan-400 hover:text-cyan-300">
          ← Quay lại danh sách
        </Link>
      </div>
    )
  }

  if (!loading && !postRow) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">Không tìm thấy bài giảng lớp.</p>
        <Link to="/admin/bai-giang-noi-dung?tab=lop" className="text-cyan-400 hover:text-cyan-300">
          ← Quay lại danh sách
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Chi tiết bài giảng lớp"
        description={
          <>
            Cùng cấu trúc với bài{' '}
            <Link className="font-medium text-cyan-400 hover:text-cyan-300" to="/admin/bai-giang-noi-dung">
              trực tuyến
            </Link>
            ; hiển thị cho học viên tại{' '}
            <Link className="font-medium text-cyan-400 hover:text-cyan-300" to="/bai-giang">
              Bài giảng
            </Link>{' '}
            (tab Lớp của tôi).
          </>
        }
        badge="Lớp học"
      />

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      {!loading && postRow && (
        <Panel
          title={`Bài #${postRow.id} — ${postRow.title}`}
          subtitle="Tóm tắt, video YouTube, dàn ý, mục nội dung và gợi ý luyện tập"
        >
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
                Video nhúng trên trang chi tiết bài giảng lớp (học viên đã ghi danh).
              </span>
            </label>
            <LinesTextarea
              label="Dàn ý (outline)"
              hint="Mỗi dòng là một ý trong danh sách dàn ý."
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
                to="/admin/bai-giang-noi-dung?tab=lop"
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
