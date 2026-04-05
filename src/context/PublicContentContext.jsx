import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { PUBLIC_LOAD_ERROR } from '../lib/publicUserMessages.js'
import { fetchPublicCatalog } from '../services/publicApi.js'

const PublicContentContext = createContext(null)

/**
 * Một lần tải catalog công khai (khóa, tin, đề, …). Nội dung landing trang chủ lấy từ `src/data.ts`.
 */
export function PublicContentProvider({ children }) {
  const [courses, setCourses] = useState([])
  const [exams, setExams] = useState([])
  const [news, setNews] = useState([])
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const cat = await fetchPublicCatalog()
      setCourses(cat.courses)
      setExams(cat.exams)
      setNews(cat.news)
      setTeachers(cat.teachers)
      setSubjects(cat.subjects)
      setLessons(cat.lessons)
    } catch (e) {
      if (import.meta.env.DEV) console.error('[PublicContent]', e)
      setError(PUBLIC_LOAD_ERROR)
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
      loading,
      error,
      refresh: load,
    }),
    [courses, exams, news, teachers, subjects, lessons, loading, error, load],
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
