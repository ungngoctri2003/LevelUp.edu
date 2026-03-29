import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuthSession } from './AuthSessionContext.jsx'
import * as api from '../services/adminApi.js'
import * as srv from '../services/adminServerApi.js'

function computeDashboardStats(s) {
  const activeStudents = s.students.filter(
    (x) => x.status === 'active' || x.status === 'trial',
  ).length
  const approvedTeachers = s.teachers.filter((t) => t.status === 'approved').length
  const activeCourses = s.courses.filter((c) => c.visible !== false).length
  const pendingAdmissions = s.admissions.filter((a) => a.status === 'new' || a.status === 'reviewing').length
  return {
    totalStudents: activeStudents,
    totalTeachers: approvedTeachers,
    activeCourses,
    monthlyRevenue: s.settings?.monthlyRevenue ?? 0,
    pendingAdmissions,
    openTickets: s.settings?.openTickets ?? 0,
  }
}

export const AdminDataContext = createContext(null)

export function AdminDataProvider({ children }) {
  const { user, session } = useAuthSession()
  const accessToken = session?.access_token
  const [state, setState] = useState({
    courses: [],
    exams: [],
    news: [],
    admissions: [],
    activity: [],
    students: [],
    teachers: [],
    classes: [],
    subjects: [],
    settings: { monthlyRevenue: 0, openTickets: 0 },
  })
  const [attemptCounts, setAttemptCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!supabase || !user?.id) return
    setLoading(true)
    setError(null)
    try {
      const loadRoster = async () => {
        if (accessToken) {
          try {
            const [stRes, teRes, cntRes, clRes] = await Promise.all([
              srv.adminListStudents(accessToken),
              srv.adminListTeachers(accessToken),
              srv.adminListExamAttemptCounts(accessToken),
              srv.adminListClasses(accessToken),
            ])
            return {
              students: stRes.data,
              teachers: teRes.data,
              counts: cntRes.data,
              classes: clRes.data,
            }
          } catch {
            /* API tắt / thiếu service role — fallback RLS trên trình duyệt */
            const [students, teachers, counts, classes] = await Promise.all([
              api.fetchStudentsAdmin(supabase),
              api.fetchTeachersAdmin(supabase),
              api.fetchAttemptCounts(supabase),
              api.fetchClassesAdmin(supabase),
            ])
            return { students, teachers, counts, classes }
          }
        }
        const [students, teachers, counts, classes] = await Promise.all([
          api.fetchStudentsAdmin(supabase),
          api.fetchTeachersAdmin(supabase),
          api.fetchAttemptCounts(supabase),
          api.fetchClassesAdmin(supabase),
        ])
        return { students, teachers, counts, classes }
      }

      const [
        subjects,
        courses,
        exams,
        news,
        admissions,
        activity,
        roster,
        settings,
      ] = await Promise.all([
        api.fetchSubjects(supabase),
        api.fetchCoursesAdmin(supabase),
        api.fetchExamsAdmin(supabase),
        api.fetchNewsAdmin(supabase),
        api.fetchAdmissionsAdmin(supabase),
        api.fetchActivityAdmin(supabase),
        loadRoster(),
        api.fetchAdminSettings(supabase),
      ])

      const { students, teachers, counts, classes } = roster
      setAttemptCounts(counts)
      setState({
        courses,
        exams,
        news,
        admissions,
        activity,
        students,
        teachers,
        classes: classes || [],
        subjects,
        settings,
      })
    } catch (e) {
      setError(e.message || 'Lỗi tải dữ liệu admin')
    } finally {
      setLoading(false)
    }
  }, [user?.id, accessToken])

  useEffect(() => {
    refresh()
  }, [refresh])

  const ctx = useMemo(() => {
    const t = accessToken

    return {
      state,
      loading,
      error,
      refresh,
      attemptCounts,
      computeDashboardStats: () => computeDashboardStats(state),

      async addCourse(payload) {
        await srv.adminCreateCourse(t, payload)
        await refresh()
      },
      async updateCourse(id, patch) {
        await srv.adminPatchCourse(t, id, patch)
        await refresh()
      },
      async deleteCourse(id, title) {
        await srv.adminDeleteCourseApi(t, id, title)
        await refresh()
      },

      async addExam(row) {
        await srv.adminCreateExam(t, row)
        await refresh()
      },
      async updateExam(id, row) {
        await srv.adminPatchExam(t, id, row)
        await refresh()
      },
      async deleteExam(id, title) {
        await srv.adminDeleteExamApi(t, id, title)
        await refresh()
      },

      async addNews(row) {
        await srv.adminCreateNews(t, row)
        await refresh()
      },
      async updateNews(id, row) {
        await srv.adminPatchNews(t, id, row)
        await refresh()
      },
      async deleteNews(id, title) {
        await srv.adminDeleteNewsApi(t, id, title)
        await refresh()
      },

      async addAdmission(row) {
        await srv.adminCreateAdmission(t, row)
        await refresh()
      },
      async setAdmissionStatus(id, status) {
        await srv.adminPatchAdmissionStatus(t, id, status)
        await refresh()
      },
      async deleteAdmission(id) {
        await srv.adminDeleteAdmissionApi(t, id)
        await refresh()
      },

      async updateStudent(profileId, row) {
        await srv.adminPatchStudent(t, profileId, row)
        await refresh()
      },
      async setStudentSuspended(profileId, suspended) {
        await srv.adminPostStudentAccount(t, profileId, suspended ? 'inactive' : 'active')
        await srv.adminPostStudentProfileStatus(t, profileId, suspended ? 'inactive' : 'active')
        await refresh()
      },
      async removeStudent(profileId) {
        if (!confirm('Vô hiệu hóa tài khoản học viên này?')) return
        await srv.adminPostStudentAccount(t, profileId, 'suspended')
        await refresh()
      },

      async toggleStudentActive(profileId, makeActive) {
        await srv.adminPostStudentToggleLearning(t, profileId, makeActive)
        await refresh()
      },

      async createStudentUser(payload) {
        await srv.adminCreateStudentUser(t, payload)
        await refresh()
      },

      async createTeacherUser(payload) {
        await srv.adminCreateTeacherUser(t, payload)
        await refresh()
      },

      async updateTeacher(profileId, row) {
        await srv.adminPatchTeacher(t, profileId, row)
        await refresh()
      },
      async setTeacherApproval(profileId, status) {
        await srv.adminPostTeacherApproval(t, profileId, status)
        await refresh()
      },
      async removeTeacher(profileId) {
        if (!confirm('Đặt trạng thái giáo viên tạm khóa?')) return
        await srv.adminPostTeacherApproval(t, profileId, 'suspended')
        await refresh()
      },

      async createSchoolClass(body) {
        await srv.adminCreateSchoolClass(t, body)
        await refresh()
      },
      async updateSchoolClass(id, patch) {
        await srv.adminPatchSchoolClass(t, id, patch)
        await refresh()
      },
      async deleteSchoolClass(id) {
        if (!confirm('Xóa lớp này? Toàn bộ đăng ký, lịch, bài tập liên quan sẽ bị xóa theo.')) return
        await srv.adminDeleteSchoolClass(t, id)
        await refresh()
      },
      async fetchClassEnrollments(classId) {
        if (t) {
          const res = await srv.adminListClassEnrollments(t, classId)
          return res.data
        }
        return api.fetchClassEnrollmentsAdmin(supabase, classId)
      },
      async addClassEnrollment(classId, studentId) {
        await srv.adminPostClassEnrollment(t, classId, studentId)
        await refresh()
      },
      async removeClassEnrollment(classId, studentId) {
        await srv.adminDeleteClassEnrollment(t, classId, studentId)
        await refresh()
      },

      async saveDashboardSettings(partial) {
        await srv.adminPatchDashboardSettings(t, partial)
        await refresh()
      },

      appendAdminActivity: async (action, type = 'admin') => {
        await srv.adminPostActivity(t, action, type)
        await refresh()
      },
    }
  }, [state, loading, error, refresh, attemptCounts, accessToken])

  return <AdminDataContext.Provider value={ctx}>{children}</AdminDataContext.Provider>
}
