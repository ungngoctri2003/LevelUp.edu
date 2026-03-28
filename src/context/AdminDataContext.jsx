import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuthSession } from './AuthSessionContext.jsx'
import * as api from '../services/adminApi.js'

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

const AdminDataContext = createContext(null)

export function AdminDataProvider({ children }) {
  const { user } = useAuthSession()
  const [state, setState] = useState({
    courses: [],
    exams: [],
    news: [],
    admissions: [],
    activity: [],
    students: [],
    teachers: [],
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
      const [
        subjects,
        courses,
        exams,
        news,
        admissions,
        activity,
        students,
        teachers,
        settings,
        counts,
      ] = await Promise.all([
        api.fetchSubjects(supabase),
        api.fetchCoursesAdmin(supabase),
        api.fetchExamsAdmin(supabase),
        api.fetchNewsAdmin(supabase),
        api.fetchAdmissionsAdmin(supabase),
        api.fetchActivityAdmin(supabase),
        api.fetchStudentsAdmin(supabase),
        api.fetchTeachersAdmin(supabase),
        api.fetchAdminSettings(supabase),
        api.fetchAttemptCounts(supabase),
      ])
      setAttemptCounts(counts)
      setState({
        courses,
        exams,
        news,
        admissions,
        activity,
        students,
        teachers,
        subjects,
        settings,
      })
    } catch (e) {
      setError(e.message || 'Lỗi tải dữ liệu admin')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  const ctx = useMemo(() => {
    const u = { id: user?.id, email: user?.email }

    return {
      state,
      loading,
      error,
      refresh,
      attemptCounts,
      computeDashboardStats: () => computeDashboardStats(state),

      async addCourse(payload) {
        await api.adminInsertCourse(supabase, { ...payload, user: u })
        await refresh()
      },
      async updateCourse(id, patch) {
        await api.adminUpdateCourse(supabase, id, patch, u)
        await refresh()
      },
      async deleteCourse(id, title) {
        await api.adminDeleteCourse(supabase, id, title, u)
        await refresh()
      },

      async addExam(row) {
        await api.adminInsertExam(supabase, row, u)
        await refresh()
      },
      async updateExam(id, row) {
        await api.adminUpdateExam(supabase, id, row, u)
        await refresh()
      },
      async deleteExam(id, title) {
        await api.adminDeleteExam(supabase, id, title, u)
        await refresh()
      },

      async addNews(row) {
        await api.adminInsertNews(supabase, row, u)
        await refresh()
      },
      async updateNews(id, row) {
        await api.adminUpdateNews(supabase, id, row, u)
        await refresh()
      },
      async deleteNews(id, title) {
        await api.adminDeleteNews(supabase, id, title, u)
        await refresh()
      },

      async addAdmission(row) {
        await api.adminInsertAdmission(supabase, row, u)
        await refresh()
      },
      async setAdmissionStatus(id, status) {
        await api.adminUpdateAdmissionStatus(supabase, id, status, u)
        await refresh()
      },
      async deleteAdmission(id) {
        await api.adminDeleteAdmission(supabase, id, u)
        await refresh()
      },

      async updateStudent(profileId, row) {
        await api.adminUpdateStudent(supabase, profileId, row, u)
        await refresh()
      },
      async setStudentSuspended(profileId, suspended) {
        await api.adminSetStudentAccountStatus(
          supabase,
          profileId,
          suspended ? 'inactive' : 'active',
          u,
        )
        await supabase
          .from('student_profiles')
          .update({ status: suspended ? 'inactive' : 'active' })
          .eq('user_id', profileId)
        await refresh()
      },
      async removeStudent(profileId) {
        if (!confirm('Vô hiệu hóa tài khoản học viên này?')) return
        await api.adminSetStudentAccountStatus(supabase, profileId, 'suspended', u)
        await refresh()
      },

      async toggleStudentActive(profileId, makeActive) {
        await api.adminToggleStudentActive(supabase, profileId, makeActive, u)
        await refresh()
      },

      async updateTeacher(profileId, row) {
        await api.adminUpdateTeacher(supabase, profileId, row, u)
        await refresh()
      },
      async setTeacherApproval(profileId, status) {
        await api.adminSetTeacherApproval(supabase, profileId, status, u)
        await refresh()
      },
      async removeTeacher(profileId) {
        if (!confirm('Đặt trạng thái giáo viên tạm khóa?')) return
        await api.adminSetTeacherApproval(supabase, profileId, 'suspended', u)
        await refresh()
      },

      async saveDashboardSettings(partial) {
        await api.upsertAdminStats(supabase, partial, u)
        await refresh()
      },

      appendAdminActivity: async (action, type = 'admin') => {
        await api.logAdminActivity(supabase, action, type, user?.email, user?.id)
        await refresh()
      },
    }
  }, [state, loading, error, refresh, attemptCounts, user])

  return <AdminDataContext.Provider value={ctx}>{children}</AdminDataContext.Provider>
}

export function useAdminData() {
  const c = useContext(AdminDataContext)
  if (!c) throw new Error('useAdminData trong AdminDataProvider')
  return c
}
