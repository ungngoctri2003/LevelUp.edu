import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { useAuthSession } from '../../context/AuthSessionContext'
import { supabase } from '../../lib/supabaseClient.js'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import {
  LessonSectionBlocksEditor,
  LinesTextarea,
  linesToStringArray,
  normalizeLessonSections,
  stringArrayToLines,
} from '../../components/admin/StructuredContentEditors.jsx'
import { inputTeacher } from '../../components/dashboard/dashboardStyles'
import PageLoading from '../../components/ui/PageLoading.jsx'

const field = `${inputTeacher} mt-1 w-full`

export default function TeacherLessonPostDetail() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { session } = useAuthSession()

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

  const normalizeDetailsEmbed = (raw) => {
    if (raw == null) return null
    return Array.isArray(raw) ? raw[0] ?? null : raw
  }

  const tokenRef = useRef(session?.access_token)
  tokenRef.current = session?.access_token

  useEffect(() => {
    if (!supabase || !tokenRef.current || !idValid) {
      setPostRow(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const { data: post, error: pErr } = await supabase
          .from('teacher_lesson_posts')
          .select(
            'id, title, class_id, duration_display, classes(name), teacher_lesson_post_details(*)',
          )
          .eq('id', idNum)
          .maybeSingle()
        if (cancelled) return
        if (pErr) throw new Error(pErr.message)
        if (!post) {
          setPostRow(null)
          return
        }
        setPostRow({
          id: post.id,
          title: post.title,
          className: post.classes?.name || `Lớp ${post.class_id}`,
          duration_display: post.duration_display,
        })
        const d = normalizeDetailsEmbed(post.teacher_lesson_post_details)
        setDetailForm({
          summary: d?.summary || '',
          teacher_name: d?.teacher_name || '',
          youtube_url: d?.youtube_url != null ? String(d.youtube_url) : '',
          outlineText: stringArrayToLines(Array.isArray(d?.outline) ? d.outline : []),
          sectionBlocks: normalizeLessonSections(d?.sections),
          practiceHintsText: stringArrayToLines(Array.isArray(d?.practice_hints) ? d.practice_hints : []),
        })
      } catch (e) {
        if (cancelled) return
        if (import.meta.env.DEV) console.error('[TeacherLessonPostDetail load]', e)
        toastActionError(e, 'Không đọc được chi tiết bài giảng.')
        setPostRow(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [postId, idValid, hasSession])

  const saveDetail = async (e) => {
    e.preventDefault()
    if (!supabase || !idValid) return
    const outline = linesToStringArray(detailForm.outlineText)
    const sections = detailForm.sectionBlocks.filter((s) => s.heading.trim() || s.body.trim())
    const practice_hints = linesToStringArray(detailForm.practiceHintsText)
    const youtubePayload =
      typeof detailForm.youtube_url === 'string' ? detailForm.youtube_url.trim() : detailForm.youtube_url
    try {
      const { error } = await supabase.from('teacher_lesson_post_details').upsert(
        {
          post_id: idNum,
          summary: detailForm.summary,
          teacher_name: detailForm.teacher_name,
          youtube_url: youtubePayload || null,
          outline,
          sections,
          resources: [],
          practice_hints,
        },
        { onConflict: 'post_id' },
      )
      if (error) throw new Error(error.message)
      toast.success('Đã lưu chi tiết bài giảng.')
      navigate('/giao-vien/bai-giang')
    } catch (e2) {
      toastActionError(e2, 'Không lưu được chi tiết bài giảng.')
    }
  }

  if (!idValid) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">ID bài giảng không hợp lệ.</p>
        <Link to="/giao-vien/bai-giang" className="text-emerald-400 hover:text-emerald-300">
          ← Quay lại danh sách
        </Link>
      </div>
    )
  }

  if (!loading && !postRow) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">Không tìm thấy bài giảng hoặc bạn không có quyền.</p>
        <Link to="/giao-vien/bai-giang" className="text-emerald-400 hover:text-emerald-300">
          ← Quay lại danh sách
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Soạn nội dung bài giảng"
        description={`Lớp: ${postRow?.className ?? '—'} — cùng cấu trúc với trang quản trị bài giảng trực tuyến.`}
      />

      {loading && <PageLoading variant="inline" />}

      {!loading && postRow && (
        <Panel
          title={`${postRow.title}`}
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
                placeholder="https://www.youtube.com/watch?v=…"
                value={detailForm.youtube_url}
                onChange={(e) => setDetailForm((f) => ({ ...f, youtube_url: e.target.value }))}
                className={field}
              />
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
                to="/giao-vien/bai-giang"
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-300"
              >
                Hủy
              </Link>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Lưu chi tiết
              </button>
            </div>
          </form>
        </Panel>
      )}
    </div>
  )
}
