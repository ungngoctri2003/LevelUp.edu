import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './pages/Layout'
import HomePage from './pages/HomePage'
import LessonsPage from './pages/LessonsPage'
import LessonDetailPage from './pages/LessonDetailPage'
import TestsPage from './pages/TestsPage'
import AdmissionsPage from './pages/AdmissionsPage'
import NewsPage from './pages/NewsPage'
import NewsDetailPage from './pages/NewsDetailPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminStudents from './pages/admin/AdminStudents'
import AdminTeachers from './pages/admin/AdminTeachers'
import AdminTeacherClasses from './pages/admin/AdminTeacherClasses'
import AdminCourses from './pages/admin/AdminCourses'
import AdminNews from './pages/admin/AdminNews'
import AdminExams from './pages/admin/AdminExams'
import AdminAdmissions from './pages/admin/AdminAdmissions'
import AdminLessons from './pages/admin/AdminLessons'
import AdminLessonDetail from './pages/admin/AdminLessonDetail'
import AdminLandingTeachers from './pages/admin/AdminLandingTeachers'
import AdminLeads from './pages/admin/AdminLeads'
import TeacherLayout from './pages/teacher/TeacherLayout'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherClasses from './pages/teacher/TeacherClasses'
import TeacherLessons from './pages/teacher/TeacherLessons'
import TeacherSchedule from './pages/teacher/TeacherSchedule'
import TeacherAssignments from './pages/teacher/TeacherAssignments'
import TeacherGrading from './pages/teacher/TeacherGrading'
import TeacherStudents from './pages/teacher/TeacherStudents'
import TeacherClassDetail from './pages/teacher/TeacherClassDetail'
import StudentLayout from './pages/student/StudentLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentLearningHub from './pages/student/StudentLearningHub'
import StudentWorkHub from './pages/student/StudentWorkHub'
import StudentProfile from './pages/student/StudentProfile'
import { DialogflowMessenger } from './components/DialogflowMessenger'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="dang-nhap" element={<Navigate to="/?auth=login" replace />} />
          <Route path="dang-ky" element={<Navigate to="/?auth=register" replace />} />
          <Route path="quen-mat-khau" element={<Navigate to="/?auth=forgot" replace />} />
          <Route path="dat-lai-mat-khau" element={<ResetPasswordPage />} />
          <Route path="bai-giang/:lessonId" element={<LessonDetailPage />} />
          <Route path="bai-giang" element={<LessonsPage />} />
          <Route path="bai-kiem-tra" element={<TestsPage />} />
          <Route path="tuyen-sinh" element={<AdmissionsPage />} />
          <Route path="tin-tuc" element={<NewsPage />} />
          <Route path="tin-tuc/:id" element={<NewsDetailPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="hoc-vien" element={<AdminStudents />} />
          <Route path="giao-vien" element={<AdminTeachers />} />
          <Route path="lop-hoc" element={<AdminTeacherClasses />} />
          <Route path="khoa-hoc" element={<AdminCourses />} />
          <Route path="tin-tuc" element={<AdminNews />} />
          <Route path="bai-kiem-tra" element={<AdminExams />} />
          <Route path="tuyen-sinh" element={<AdminAdmissions />} />
          <Route path="mon-hoc" element={<Navigate to="/admin/khoa-hoc" replace />} />
          <Route path="bai-giang-noi-dung" element={<AdminLessons />} />
          <Route path="bai-giang-noi-dung/:lessonId" element={<AdminLessonDetail />} />
          <Route path="doi-ngu-trang-chu" element={<AdminLandingTeachers />} />
          <Route path="lead-dang-ky" element={<AdminLeads />} />
          <Route path="cms-trang-chu" element={<Navigate to="/admin" replace />} />
        </Route>

        <Route path="/giao-vien" element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="lop-hoc" element={<TeacherClasses />} />
          <Route path="lop-hoc/:classId" element={<TeacherClassDetail />} />
          <Route path="bai-giang" element={<TeacherLessons />} />
          <Route path="lich" element={<TeacherSchedule />} />
          <Route path="bai-tap" element={<TeacherAssignments />} />
          <Route path="cham-diem" element={<TeacherGrading />} />
          <Route path="hoc-sinh" element={<TeacherStudents />} />
        </Route>

        <Route path="/hoc-vien" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="khoa-hoc" element={<StudentLearningHub />} />
          <Route path="bai-giang" element={<Navigate to="/hoc-vien/khoa-hoc#student-section-bai-giang" replace />} />
          <Route path="bai-tap" element={<StudentWorkHub />} />
          <Route path="bai-kiem-tra" element={<Navigate to="/hoc-vien/bai-tap#student-section-kiem-tra" replace />} />
          <Route path="ho-so" element={<StudentProfile />} />
        </Route>
      </Routes>
      <DialogflowMessenger />
    </BrowserRouter>
  )
}

export default App
