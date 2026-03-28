import { useCallback, useEffect, useState } from 'react'
import { fetchPublicCatalog, fetchPublicCms } from '../services/publicApi.js'

const emptyCms = {
  testimonials: [],
  videoPreview: {},
  admissionsInfo: {},
}

/**
 * Nội dung công khai từ API + CMS (testimonials, video, tuyển sinh).
 */
export function usePublicContent() {
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
      })
    } catch (e) {
      setError(e.message || 'Không tải được dữ liệu')
      setCms(emptyCms)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return {
    courses,
    exams,
    news,
    teachers,
    subjects,
    lessons,
    testimonials: cms.testimonials,
    videoPreview: cms.videoPreview,
    admissionsInfo: cms.admissionsInfo,
    loading,
    error,
    refresh: load,
  }
}
