import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import PageHeader from '../../components/dashboard/PageHeader'
import PageLoading from '../../components/ui/PageLoading.jsx'
import AdminRevenueChart from '../../components/admin/AdminRevenueChart'
import AdminStudentStatusChart from '../../components/admin/stats/AdminStudentStatusChart'
import AdminTeacherApprovalChart from '../../components/admin/stats/AdminTeacherApprovalChart'
import AdminTopClassesChart from '../../components/admin/stats/AdminTopClassesChart'
import AdminPaymentStatusChart from '../../components/admin/stats/AdminPaymentStatusChart'
import AdminExamAttemptBucketsChart from '../../components/admin/stats/AdminExamAttemptBucketsChart'
import AdminCoursesVisibilityChart from '../../components/admin/stats/AdminCoursesVisibilityChart'
import AdminCoursesBySubjectChart from '../../components/admin/stats/AdminCoursesBySubjectChart'
import AdminClassesBySubjectChart from '../../components/admin/stats/AdminClassesBySubjectChart'
import AdminExamsMetricsChart from '../../components/admin/stats/AdminExamsMetricsChart'
import AdminExamsBySubjectChart from '../../components/admin/stats/AdminExamsBySubjectChart'
import AdminStudentSourceChart from '../../components/admin/stats/AdminStudentSourceChart'
import AdminPaymentSourceChart from '../../components/admin/stats/AdminPaymentSourceChart'
import AdminTeacherClassLoadChart from '../../components/admin/stats/AdminTeacherClassLoadChart'
import { useAdminState } from '../../hooks/useAdminState'

export default function AdminStatsPage() {
  const { state, loading, error, refresh, attemptCounts } = useAdminState()
  const totalStudents = useMemo(() => (state.students || []).length, [state.students])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Phân tích"
        title="Thống kê hệ thống"
        description="Biểu đồ tổng hợp từ dữ liệu vận hành: học viên, giáo viên, lớp, khóa, đề thi, thanh toán."
      >
        <button
          type="button"
          onClick={() => refresh()}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
        >
          Tải lại dữ liệu
        </button>
      </PageHeader>

      {loading && <PageLoading variant="inline" />}

      {!loading && (
        <>
          <AdminRevenueChart payments={state.payments || []} />

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminStudentStatusChart students={state.students || []} />
            <AdminTeacherApprovalChart teachers={state.teachers || []} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminPaymentStatusChart payments={state.payments || []} />
            <AdminExamAttemptBucketsChart attemptCounts={attemptCounts} totalStudents={totalStudents} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminCoursesVisibilityChart courses={state.courses || []} />
            <AdminCoursesBySubjectChart courses={state.courses || []} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminClassesBySubjectChart classes={state.classes || []} />
            <AdminTeacherClassLoadChart teachers={state.teachers || []} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminExamsMetricsChart exams={state.exams || []} />
            <AdminExamsBySubjectChart exams={state.exams || []} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminStudentSourceChart students={state.students || []} />
            <AdminPaymentSourceChart payments={state.payments || []} />
          </div>

          <AdminTopClassesChart classes={state.classes || []} limit={10} />
        </>
      )}
    </div>
  )
}
