import { useEffect, useState } from 'react'
import { getPublicCourses, getPublicExams, getPublicNews, subscribeAdmin } from '../utils/adminStorage'

/**
 * Khóa học / tin tức / đề thi hiển thị công khai (đồng bộ khi admin chỉnh).
 */
export function usePublicContent() {
  const [, bump] = useState(0)
  useEffect(() => subscribeAdmin(() => bump((n) => n + 1)), [])
  return {
    courses: getPublicCourses(),
    news: getPublicNews(),
    exams: getPublicExams(),
  }
}
