import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { inputAdmin, btnPrimaryAdmin } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { toast } from 'sonner'
import { DEFAULT_BENEFIT_ROWS } from '../../components/sections/benefitIcons.jsx'
import {
  AdmissionsEditor,
  BenefitRowsEditor,
  admissionsFromServer,
  admissionsToPayload,
  emptyAdmissionsForm,
  normalizeBenefitRows,
  normalizeTestimonialRows,
  TestimonialRowsEditor,
} from '../../components/admin/StructuredContentEditors.jsx'
import * as srv from '../../services/adminServerApi.js'

const DEFAULT_HERO = [
  { value: '50K+', label: 'Học viên' },
  { value: '500+', label: 'Bài giảng' },
  { value: '98%', label: 'Hài lòng' },
]

export default function AdminCmsLanding() {
  const { session } = useAuthSession()
  const token = session?.access_token
  const [loading, setLoading] = useState(true)
  const [hero, setHero] = useState(DEFAULT_HERO)
  const [benefits, setBenefits] = useState(() => normalizeBenefitRows(DEFAULT_BENEFIT_ROWS))
  const [testimonials, setTestimonials] = useState([])
  const [admissionsForm, setAdmissionsForm] = useState(() => emptyAdmissionsForm())
  const [videoTitle, setVideoTitle] = useState('')
  const [videoDesc, setVideoDesc] = useState('')
  const [videoEmbed, setVideoEmbed] = useState('')
  const [videoOverlayTitle, setVideoOverlayTitle] = useState('')
  const [videoOverlaySub, setVideoOverlaySub] = useState('')
  const [videoFeaturesText, setVideoFeaturesText] = useState('')
  const [videoPreviewBase, setVideoPreviewBase] = useState({})

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await srv.adminGetCmsLanding(token)
      const d = res.data || {}
      const hi = d.landing_hero_stats?.items
      if (Array.isArray(hi) && hi.length) {
        const padded = [...hi]
        while (padded.length < 3) padded.push({ value: '', label: '' })
        setHero(
          padded.slice(0, 3).map((x, i) => ({
            value: String(x.value ?? DEFAULT_HERO[i]?.value ?? ''),
            label: String(x.label ?? DEFAULT_HERO[i]?.label ?? ''),
          })),
        )
      } else {
        setHero(DEFAULT_HERO)
      }
      const rawBen = d.landing_benefits?.length ? d.landing_benefits : DEFAULT_BENEFIT_ROWS
      setBenefits(normalizeBenefitRows(rawBen))
      const vp = d.video_preview && typeof d.video_preview === 'object' ? d.video_preview : {}
      setVideoPreviewBase({ ...vp })
      setVideoTitle(vp.title || '')
      setVideoDesc(vp.description || '')
      setVideoEmbed(vp.embed_url || '')
      setVideoOverlayTitle(vp.overlay_title || '')
      setVideoOverlaySub(vp.overlay_subtitle || '')
      setVideoFeaturesText(Array.isArray(vp.features) ? vp.features.join('\n') : '')
      setTestimonials(normalizeTestimonialRows(d.testimonials?.length ? d.testimonials : []))
      setAdmissionsForm(admissionsFromServer(d.admissions_info))
    } catch (e) {
      if (import.meta.env.DEV) console.error('[AdminCmsLanding]', e)
      toast.error('Không tải được nội dung trang chủ. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const save = async (e) => {
    e.preventDefault()
    if (!token) return
    const landing_benefits = benefits
      .map((b) => ({
        icon: b.icon || 'video',
        title: String(b.title || '').trim(),
        description: String(b.description || '').trim(),
      }))
      .filter((b) => b.title || b.description)
    const testimonialsPayload = testimonials
      .map((t) => {
        const row = {
          name: String(t.name || '').trim(),
          initial: String(t.initial || '').trim(),
          quote: String(t.quote || '').trim(),
          color: t.color === 'purple' ? 'purple' : 'indigo',
        }
        if (t.id != null && Number.isFinite(Number(t.id))) row.id = Number(t.id)
        return row
      })
      .filter((t) => t.name || t.quote)
    const admissions_info = admissionsToPayload(admissionsForm)
    const features = videoFeaturesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const video_preview = {
      ...videoPreviewBase,
      title: videoTitle.trim(),
      description: videoDesc.trim(),
      embed_url: videoEmbed.trim() || null,
      overlay_title: videoOverlayTitle.trim(),
      overlay_subtitle: videoOverlaySub.trim(),
      features: features.length ? features : [],
    }
    try {
      await srv.adminPatchCmsLanding(token, {
        landing_hero_stats: { items: hero.map((h) => ({ value: h.value.trim(), label: h.label.trim() })) },
        landing_benefits,
        video_preview,
        testimonials: testimonialsPayload,
        admissions_info,
      })
      toast.success('Đã lưu nội dung trang chủ.')
      await load()
    } catch (e2) {
      if (import.meta.env.DEV) console.error('[AdminCmsLanding save]', e2)
      toast.error('Không lưu được. Vui lòng thử lại sau.')
    }
  }

  const field = `${inputAdmin} mt-1 w-full`

  return (
    <div className="space-y-8">
      <PageHeader
        title="CMS trang chủ"
        description="Chỉnh nội dung hiển thị công khai trực tiếp bằng các ô bên dưới."
        badge="CMS"
      >
        <button type="button" onClick={() => load()} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200">
          Tải lại
        </button>
      </PageHeader>

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <form onSubmit={save} className="space-y-8">
        <Panel title="Ba số liệu nổi bật" subtitle="Hiển thị dưới phần giới thiệu trên trang chủ">
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {hero.map((h, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Ô {i + 1}</p>
                <label className="block text-sm text-slate-400">
                  Giá trị
                  <input
                    value={h.value}
                    onChange={(e) => {
                      const next = [...hero]
                      next[i] = { ...next[i], value: e.target.value }
                      setHero(next)
                    }}
                    className={field}
                  />
                </label>
                <label className="mt-2 block text-sm text-slate-400">
                  Nhãn
                  <input
                    value={h.label}
                    onChange={(e) => {
                      const next = [...hero]
                      next[i] = { ...next[i], label: e.target.value }
                      setHero(next)
                    }}
                    className={field}
                  />
                </label>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Lợi ích khi học" subtitle="Từng thẻ trên trang chủ — chọn biểu tượng, tiêu đề và mô tả">
          <div className="mt-4">
            <BenefitRowsEditor items={benefits} onChange={setBenefits} fieldClass={field} />
          </div>
        </Panel>

        <Panel title="Khối video giới thiệu" subtitle="Tiêu đề, mô tả và liên kết video (YouTube hoặc trang nhúng tương thích)">
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-slate-400 sm:col-span-2">
              Tiêu đề (cột phải)
              <input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} className={field} />
            </label>
            <label className="block text-sm text-slate-400 sm:col-span-2">
              Mô tả
              <textarea rows={3} value={videoDesc} onChange={(e) => setVideoDesc(e.target.value)} className={field} />
            </label>
            <label className="block text-sm text-slate-400 sm:col-span-2">
              Liên kết video (YouTube hoặc trang nhúng)
              <input
                value={videoEmbed}
                onChange={(e) => setVideoEmbed(e.target.value)}
                className={field}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </label>
            <label className="block text-sm text-slate-400">
              Dòng chữ phụ khi chưa có video
              <input value={videoOverlayTitle} onChange={(e) => setVideoOverlayTitle(e.target.value)} className={field} />
            </label>
            <label className="block text-sm text-slate-400">
              Mô tả ngắn dưới dòng chữ phụ
              <input value={videoOverlaySub} onChange={(e) => setVideoOverlaySub(e.target.value)} className={field} />
            </label>
            <label className="block text-sm text-slate-400 sm:col-span-2">
              Gạch đầu dòng (mỗi dòng một ý)
              <textarea rows={5} value={videoFeaturesText} onChange={(e) => setVideoFeaturesText(e.target.value)} className={field} />
            </label>
          </div>
        </Panel>

        <Panel title="Đánh giá học viên" subtitle="Họ tên, chữ viết tắt trên avatar, màu và lời trích">
          <div className="mt-4">
            <TestimonialRowsEditor items={testimonials} onChange={setTestimonials} fieldClass={field} />
          </div>
        </Panel>

        <Panel title="Thông tin tuyển sinh" subtitle="Dùng trên trang Tuyển sinh — tiêu đề, hạn, điều kiện và các bước">
          <div className="mt-4">
            <AdmissionsEditor value={admissionsForm} onChange={setAdmissionsForm} fieldClass={field} />
          </div>
        </Panel>

        <button type="submit" className={btnPrimaryAdmin} disabled={!token || loading}>
          Lưu nội dung trang chủ
        </button>
      </form>
    </div>
  )
}
