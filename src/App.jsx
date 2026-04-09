import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import Layout from './pages/Layout'
import HomePage from './pages/HomePage'
import LessonsPage from './pages/LessonsPage'
import CourseDetailPage from './pages/CourseDetailPage'
import ClassesForSalePage from './pages/ClassesForSalePage'
import EnrolledClassHubPage from './pages/EnrolledClassHubPage'
import LessonDetailPage from './pages/LessonDetailPage'
import ClassLessonPostDetailPage from './pages/ClassLessonPostDetailPage'
import TestsPage from './pages/TestsPage'
import NewsPage from './pages/NewsPage'
import NewsDetailPage from './pages/NewsDetailPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminStudents from './pages/admin/AdminStudents'
import AdminTeachers from './pages/admin/AdminTeachers'
import AdminTeacherClasses from './pages/admin/AdminTeacherClasses'
import AdminPayments from './pages/admin/AdminPayments'
import AdminCourses from './pages/admin/AdminCourses'
import AdminNews from './pages/admin/AdminNews'
import AdminExams from './pages/admin/AdminExams'
import AdminLessons from './pages/admin/AdminLessons'
import AdminLessonDetail from './pages/admin/AdminLessonDetail'
import AdminTeacherLessonPostDetail from './pages/admin/AdminTeacherLessonPostDetail'
import AdminLandingTeachers from './pages/admin/AdminLandingTeachers'
import TeacherLayout from './pages/teacher/TeacherLayout'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherClasses from './pages/teacher/TeacherClasses'
import TeacherLessons from './pages/teacher/TeacherLessons'
import TeacherLessonPostDetail from './pages/teacher/TeacherLessonPostDetail'
import TeacherSchedule from './pages/teacher/TeacherSchedule'
import TeacherAssignments from './pages/teacher/TeacherAssignments'
import TeacherGrading from './pages/teacher/TeacherGrading'
import TeacherStudents from './pages/teacher/TeacherStudents'
import TeacherClassDetail from './pages/teacher/TeacherClassDetail'
import StudentLayout from './pages/student/StudentLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentLearningHub from './pages/student/StudentLearningHub'
import StudentRegisteredCoursesPage from './pages/student/StudentRegisteredCoursesPage'
import StudentProfile from './pages/student/StudentProfile'
import StaffProfilePage from './pages/dashboard/StaffProfilePage'
import AuthModal from './components/AuthModal'
import AuthSearchParamsSync from './components/AuthSearchParamsSync'
import { DialogflowMessenger } from './components/DialogflowMessenger'
import { AuthModalProvider } from './context/AuthModalContext'

function AdminRedirectOldClassLessonPost() {
  const { postId } = useParams()
  return <Navigate to={`/admin/bai-giang-noi-dung/lop/${encodeURIComponent(postId)}`} replace />
}

function App() {
  return (
    <BrowserRouter>
      <AuthModalProvider>
        <AuthSearchParamsSync />
        <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="dang-nhap" element={<Navigate to="/?auth=login" replace />} />
          <Route path="dang-ky" element={<Navigate to="/?auth=register" replace />} />
          <Route path="quen-mat-khau" element={<Navigate to="/?auth=forgot" replace />} />
          <Route path="dat-lai-mat-khau" element={<ResetPasswordPage />} />
          <Route path="bai-giang/khoa/:courseId" element={<CourseDetailPage />} />
          <Route path="bai-giang/lop/:postId" element={<ClassLessonPostDetailPage />} />
          <Route path="bai-giang/:lessonId" element={<LessonDetailPage />} />
          <Route path="bai-giang" element={<LessonsPage />} />
          <Route path="lop-hoc/:classId" element={<EnrolledClassHubPage />} />
          <Route path="lop-hoc" element={<ClassesForSalePage />} />
          <Route path="bai-kiem-tra" element={<TestsPage />} />
          <Route path="dang-ky-lop" element={<Navigate to="/lop-hoc" replace />} />
          <Route path="tuyen-sinh" element={<Navigate to="/bai-giang" replace />} />
          <Route path="tin-tuc" element={<NewsPage />} />
          <Route path="tin-tuc/:id" element={<NewsDetailPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="hoc-vien" element={<AdminStudents />} />
          <Route path="giao-vien" element={<AdminTeachers />} />
          <Route path="lop-hoc" element={<AdminTeacherClasses />} />
          <Route path="thanh-toan" element={<AdminPayments />} />
          <Route path="khoa-hoc" element={<AdminCourses />} />
          <Route path="tin-tuc" element={<AdminNews />} />
          <Route path="bai-kiem-tra" element={<AdminExams />} />
          <Route path="tuyen-sinh" element={<Navigate to="/admin/thanh-toan" replace />} />
          <Route path="mon-hoc" element={<Navigate to="/admin/khoa-hoc" replace />} />
          <Route path="bai-giang-noi-dung/lop/:postId" element={<AdminTeacherLessonPostDetail />} />
          <Route path="bai-giang-noi-dung/:lessonId" element={<AdminLessonDetail />} />
          <Route path="bai-giang-noi-dung" element={<AdminLessons />} />
          <Route path="bai-giang-lop" element={<Navigate to="/admin/bai-giang-noi-dung?tab=lop" replace />} />
          <Route path="bai-giang-lop/:postId" element={<AdminRedirectOldClassLessonPost />} />
          <Route path="doi-ngu-trang-chu" element={<AdminLandingTeachers />} />
          <Route path="lead-dang-ky" element={<Navigate to="/admin/thanh-toan" replace />} />
          <Route path="cms-trang-chu" element={<Navigate to="/admin" replace />} />
          <Route path="ho-so" element={<StaffProfilePage variant="admin" />} />
        </Route>

        <Route path="/giao-vien" element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="lop-hoc" element={<TeacherClasses />} />
          <Route path="lop-hoc/:classId" element={<TeacherClassDetail />} />
          <Route path="bai-giang/:postId" element={<TeacherLessonPostDetail />} />
          <Route path="bai-giang" element={<TeacherLessons />} />
          <Route path="lich" element={<TeacherSchedule />} />
          <Route path="bai-tap" element={<TeacherAssignments />} />
          <Route path="cham-diem" element={<TeacherGrading />} />
          <Route path="hoc-sinh" element={<TeacherStudents />} />
          <Route path="ho-so" element={<StaffProfilePage variant="teacher" />} />
        </Route>

        <Route path="/hoc-vien" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="khoa-hoc" element={<StudentLearningHub />} />
          <Route path="khoa-hoc-da-dang-ky" element={<StudentRegisteredCoursesPage />} />
          <Route path="lich-lop" element={<Navigate to="/hoc-vien/khoa-hoc#student-section-lich-lop" replace />} />
          <Route path="bai-giang" element={<Navigate to="/hoc-vien/khoa-hoc#student-section-bai-giang" replace />} />
          <Route path="bai-tap" element={<Navigate to="/hoc-vien/khoa-hoc#student-section-bai-tap" replace />} />
          <Route path="bai-kiem-tra" element={<Navigate to="/hoc-vien/khoa-hoc#student-section-kiem-tra" replace />} />
          <Route path="thanh-toan-lop" element={<Navigate to="/hoc-vien/khoa-hoc#student-section-thanh-toan" replace />} />
          <Route path="ho-so" element={<StudentProfile />} />
        </Route>
      </Routes>
        <AuthModal />
        <DialogflowMessenger />
      </AuthModalProvider>
    </BrowserRouter>
  )
}

export default App
