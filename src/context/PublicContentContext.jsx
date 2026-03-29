import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { PUBLIC_LOAD_ERROR } from '../lib/publicUserMessages.js'
import { fetchPublicCatalog, fetchPublicCms } from '../services/publicApi.js'

const emptyCms = {
  testimonials: [],
  videoPreview: {},
  admissionsInfo: {},
  heroStats: null,
  landingBenefits: [],
}

const PublicContentContext = createContext(null)

/**
 * Một lần tải catalog + CMS cho toàn app — tránh mỗi section trang chủ gọi API riêng (gây lag).
 */
export function PublicContentProvider({ children }) {
  const [courses, setCourses] = useState([])
  const [exams, setExams] = useState([])
  const [news, setNews] = useState([])
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [lessons, setLessons] = useState([])
  const [cms, setCms] = useState(emptyCms)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [cat, c] = await Promise.all([fetchPublicCatalog(), fetchPublicCms()])
      setCourses(cat.courses)
      setExams(cat.exams)
      setNews(cat.news)
      setTeachers(cat.teachers)
      setSubjects(cat.subjects)
      setLessons(cat.lessons)
      setCms({
        testimonials: Array.isArray(c.testimonials) ? c.testimonials : [],
        videoPreview: c.video_preview && typeof c.video_preview === 'object' ? c.video_preview : {},
        admissionsInfo: c.admissions_info && typeof c.admissions_info === 'object' ? c.admissions_info : {},
        heroStats: c.landing_hero_stats && typeof c.landing_hero_stats === 'object' ? c.landing_hero_stats : null,
        landingBenefits: Array.isArray(c.landing_benefits) ? c.landing_benefits : [],
      })
    } catch (e) {
      if (import.meta.env.DEV) console.error('[PublicContent]', e)
      setError(PUBLIC_LOAD_ERROR)
      setCms(emptyCms)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const value = useMemo(
    () => ({
      courses,
      exams,
      news,
      teachers,
      subjects,
      lessons,
      testimonials: cms.testimonials,
      videoPreview: cms.videoPreview,
      admissionsInfo: cms.admissionsInfo,
      heroStats: cms.heroStats,
      landingBenefits: cms.landingBenefits,
      loading,
      error,
      refresh: load,
    }),
    [courses, exams, news, teachers, subjects, lessons, cms, loading, error, load],
  )

  return <PublicContentContext.Provider value={value}>{children}</PublicContentContext.Provider>
}

export function usePublicContent() {
  const ctx = useContext(PublicContentContext)
  if (!ctx) {
    throw new Error('usePublicContent cần nằm trong PublicContentProvider')
  }
  return ctx
}
