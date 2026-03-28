import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { inputAdmin, btnPrimaryAdmin, tableHeadAdmin } from '../../components/dashboard/dashboardStyles'
import { useAdminState } from '../../hooks/useAdminState'

const emptyNewClass = {
  name: '',
  subject: '',
  grade_label: '',
  schedule_summary: '',
  code: '',
}

export default function AdminTeacherClasses() {
  const {
    state,
    loading,
    error,
    createSchoolClass,
    updateSchoolClass,
    deleteSchoolClass,
    fetchClassEnrollments,
    addClassEnrollment,
    removeClassEnrollment,
  } = useAdminState()

  const [searchParams, setSearchParams] = useSearchParams()
  const teacherId = searchParams.get('gv') || ''

  const [newClass, setNewClass] = useState(emptyNewClass)
  const [editClassRow, setEditClassRow] = useState(null)
  const [enrollClass, setEnrollClass] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)
  const [addStudentId, setAddStudentId] = useState('')
  const [pullClassId, setPullClassId] = useState('')

  const classTeacher = useMemo(
    () => state.teachers.find((t) => t.id === teacherId) || null,
    [state.teachers, teacherId],
  )

  useEffect(() => {
    if (loading || !state.teachers.length) return
    if (!teacherId || !state.teachers.some((t) => t.id === teacherId)) {
      setSearchParams({ gv: state.teachers[0].id }, { replace: true })
    }
  }, [loading, state.teachers, teacherId, setSearchParams])

  const myClasses = useMemo(() => {
    if (!classTeacher?.id) return []
    return state.classes.filter((c) => c.teacher_id === classTeacher.id)
  }, [state.classes, classTeacher])

  const otherClasses = useMemo(() => {
    if (!classTeacher?.id) return []
    return state.classes.filter((c) => c.teacher_id !== classTeacher.id)
  }, [state.classes, classTeacher])

  const loadEnrollments = useCallback(
    async (classId) => {
      setEnrollmentsLoading(true)
      try {
        const rows = await fetchClassEnrollments(classId)
        setEnrollments(Array.isArray(rows) ? rows : [])
      } catch (err) {
        alert(err.message || 'Không tải được danh sách học viên')
        setEnrollments([])
      } finally {
        setEnrollmentsLoading(false)
      }
    },
    [fetchClassEnrollments],
  )

  useEffect(() => {
    if (enrollClass?.id != null) {
      loadEnrollments(enrollClass.id)
    } else {
      setEnrollments([])
    }
  }, [enrollClass?.id, loadEnrollments])

  const submitNewClass = async (e) => {
    e.preventDefault()
    if (!classTeacher?.id || !newClass.name.trim()) {
      alert('Chọn giáo viên và nhập tên lớp.')
      return
    }
    try {
      await createSchoolClass({
        teacher_id: classTeacher.id,
        name: newClass.name.trim(),
        subject: newClass.subject.trim(),
        grade_label: newClass.grade_label.trim(),
        schedule_summary: newClass.schedule_summary.trim(),
        code: newClass.code.trim() || null,
      })
      setNewClass(emptyNewClass)
    } catch (err) {
      alert(err.message)
    }
  }

  const saveEditClass = async (e) => {
    e.preventDefault()
    if (!editClassRow?.id) return
    try {
      await updateSchoolClass(editClassRow.id, {
        name: editClassRow.name.trim(),
        subject: editClassRow.subject.trim(),
        grade_label: editClassRow.grade_label.trim(),
        schedule_summary: editClassRow.schedule_summary?.trim() || null,
        code: editClassRow.code?.trim() || null,
        teacher_id: editClassRow.teacher_id,
      })
      setEditClassRow(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const pullClassToTeacher = async () => {
    const id = Number(pullClassId)
    if (!pullClassId || !Number.isFinite(id) || !classTeacher?.id) {
      alert('Chọn một lớp để gán cho giáo viên này.')
      return
    }
    try {
      await updateSchoolClass(id, { teacher_id: classTeacher.id })
      setPullClassId('')
    } catch (err) {
      alert(err.message)
    }
  }

  const studentsNotInClass = useMemo(() => {
    if (!enrollClass?.id) return state.students
    const inSet = new Set(enrollments.map((e) => e.student_id))
    return state.students.filter((s) => !inSet.has(s.id))
  }, [enrollClass, enrollments, state.students])

  const field = `${inputAdmin} mt-1 w-full`

  return (
    <div className="space-y-8">
      <PageHeader
        title="Lớp &amp; học viên"
        description="Gán lớp cho giáo viên, tạo hoặc chuyển lớp, quản lý danh sách học viên trong từng lớp."
        badge="Quản trị"
      />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          to="/admin/giao-vien"
          className="rounded-xl border border-white/15 px-3 py-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          ← Quản lý giáo viên
        </Link>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      {!loading && state.teachers.length === 0 && (
        <Panel title="Chưa có giáo viên">
          <p className="text-sm text-slate-400">Thêm giáo viên trước khi quản lý lớp.</p>
          <Link to="/admin/giao-vien" className={`${btnPrimaryAdmin} mt-4 inline-block text-center`}>
            Đến trang giáo viên
          </Link>
        </Panel>
      )}

      {classTeacher && (
        <>
          <Panel title="Giáo viên đang chọn" subtitle="Mọi thao tác bên dưới áp dụng cho giáo viên này.">
            <label className="mt-2 block max-w-xl text-sm text-slate-400">
              Chọn giáo viên
              <select
                value={teacherId}
                onChange={(e) => setSearchParams({ gv: e.target.value })}
                className={`${inputAdmin} mt-1 w-full`}
              >
                {state.teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.email}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-3 text-sm text-slate-500">
              Đang phụ trách <span className="font-medium text-slate-300">{myClasses.length}</span> lớp.
            </p>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Tạo lớp mới" subtitle={`Lớp sẽ gắn với ${classTeacher.name}.`}>
              <form onSubmit={submitNewClass} className="mt-4 space-y-3">
                <input
                  required
                  value={newClass.name}
                  onChange={(e) => setNewClass((n) => ({ ...n, name: e.target.value }))}
                  placeholder="Tên lớp *"
                  className={`${inputAdmin} w-full`}
                />
                <input
                  value={newClass.subject}
                  onChange={(e) => setNewClass((n) => ({ ...n, subject: e.target.value }))}
                  placeholder="Môn học"
                  className={`${inputAdmin} w-full`}
                />
                <input
                  value={newClass.grade_label}
                  onChange={(e) => setNewClass((n) => ({ ...n, grade_label: e.target.value }))}
                  placeholder="Khối / cấp"
                  className={`${inputAdmin} w-full`}
                />
                <input
                  value={newClass.schedule_summary}
                  onChange={(e) => setNewClass((n) => ({ ...n, schedule_summary: e.target.value }))}
                  placeholder="Lịch học (tóm tắt)"
                  className={`${inputAdmin} w-full`}
                />
                <input
                  value={newClass.code}
                  onChange={(e) => setNewClass((n) => ({ ...n, code: e.target.value }))}
                  placeholder="Mã lớp (tuỳ chọn, unique)"
                  className={`${inputAdmin} w-full`}
                />
                <button type="submit" className={btnPrimaryAdmin} disabled={loading}>
                  Thêm lớp
                </button>
              </form>
            </Panel>

            <Panel
              title="Chuyển lớp từ giáo viên khác"
              subtitle={`Gán lớp đang thuộc GV khác cho ${classTeacher.name}.`}
            >
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={pullClassId}
                  onChange={(e) => setPullClassId(e.target.value)}
                  className={`${inputAdmin} min-w-0 flex-1`}
                >
                  <option value="">— Chọn lớp —</option>
                  {otherClasses.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      #{c.id} {c.name} ({c.teacher_name})
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => pullClassToTeacher()} className={btnPrimaryAdmin}>
                  Gán lớp
                </button>
              </div>
              {otherClasses.length === 0 && (
                <p className="mt-3 text-xs text-slate-500">Không có lớp nào thuộc giáo viên khác.</p>
              )}
            </Panel>
          </div>

          <Panel title={`Lớp đang phụ trách (${myClasses.length})`}>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className={tableHeadAdmin}>
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Tên lớp</th>
                    <th className="px-4 py-3">Môn</th>
                    <th className="px-4 py-3">Khối</th>
                    <th className="px-4 py-3">HS</th>
                    <th className="px-4 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {myClasses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                        Chưa có lớp. Tạo mới hoặc chuyển lớp từ giáo viên khác.
                      </td>
                    </tr>
                  )}
                  {myClasses.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-xs text-fuchsia-300/90">{c.id}</td>
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3 text-slate-400">{c.subject}</td>
                      <td className="px-4 py-3 text-slate-400">{c.grade_label}</td>
                      <td className="px-4 py-3">{c.student_count}</td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="font-medium text-cyan-400 hover:text-cyan-300"
                            onClick={() =>
                              setEditClassRow({
                                id: c.id,
                                name: c.name,
                                subject: c.subject,
                                grade_label: c.grade_label,
                                schedule_summary: c.schedule_summary || '',
                                code: c.code || '',
                                teacher_id: c.teacher_id,
                              })
                            }
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="font-medium text-violet-400 hover:text-violet-300"
                            onClick={() => setEnrollClass(c)}
                          >
                            Học viên
                          </button>
                          <button
                            type="button"
                            className="font-medium text-red-400 hover:text-red-300"
                            onClick={() => deleteSchoolClass(c.id)}
                          >
                            Xóa lớp
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {editClassRow && (
            <Panel
              variant="highlight"
              title={`Sửa lớp #${editClassRow.id}`}
              subtitle="Cập nhật thông tin hoặc đổi giáo viên phụ trách."
            >
              <form onSubmit={saveEditClass} className="mt-4 max-w-xl space-y-3">
                <label className="block text-sm text-slate-400">
                  Tên lớp
                  <input
                    value={editClassRow.name}
                    onChange={(e) => setEditClassRow((r) => ({ ...r, name: e.target.value }))}
                    className={field}
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  Môn
                  <input
                    value={editClassRow.subject}
                    onChange={(e) => setEditClassRow((r) => ({ ...r, subject: e.target.value }))}
                    className={field}
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  Khối
                  <input
                    value={editClassRow.grade_label}
                    onChange={(e) => setEditClassRow((r) => ({ ...r, grade_label: e.target.value }))}
                    className={field}
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  Lịch học
                  <input
                    value={editClassRow.schedule_summary}
                    onChange={(e) => setEditClassRow((r) => ({ ...r, schedule_summary: e.target.value }))}
                    className={field}
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  Mã lớp
                  <input
                    value={editClassRow.code}
                    onChange={(e) => setEditClassRow((r) => ({ ...r, code: e.target.value }))}
                    className={field}
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  Giáo viên phụ trách
                  <select
                    value={editClassRow.teacher_id}
                    onChange={(e) => setEditClassRow((r) => ({ ...r, teacher_id: e.target.value }))}
                    className={field}
                  >
                    {state.teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button type="button" onClick={() => setEditClassRow(null)} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">
                    Hủy sửa lớp
                  </button>
                  <button type="submit" className={btnPrimaryAdmin}>
                    Lưu lớp
                  </button>
                </div>
              </form>
            </Panel>
          )}

          {enrollClass && (
            <Panel
              variant="highlight"
              title={`Học viên — «${enrollClass.name}» (#${enrollClass.id})`}
              subtitle="Thêm hoặc gỡ học viên khỏi lớp."
            >
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEnrollClass(null)}
                  className="rounded-xl border border-white/20 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200"
                >
                  Đóng phần học viên
                </button>
              </div>
              {enrollmentsLoading ? (
                <p className="mt-4 text-sm text-slate-500">Đang tải danh sách…</p>
              ) : (
                <>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      value={addStudentId}
                      onChange={(e) => setAddStudentId(e.target.value)}
                      className={`${inputAdmin} min-w-0 flex-1`}
                    >
                      <option value="">— Thêm học viên —</option>
                      {studentsNotInClass.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={btnPrimaryAdmin}
                      onClick={async () => {
                        if (!addStudentId) {
                          alert('Chọn học viên.')
                          return
                        }
                        try {
                          await addClassEnrollment(enrollClass.id, addStudentId)
                          await loadEnrollments(enrollClass.id)
                          setAddStudentId('')
                        } catch (err) {
                          alert(err.message)
                        }
                      }}
                    >
                      Thêm vào lớp
                    </button>
                  </div>
                  <ul className="mt-6 divide-y divide-white/10 text-sm">
                    {enrollments.length === 0 && (
                      <li className="py-3 text-slate-500">Chưa có học viên trong lớp.</li>
                    )}
                    {enrollments.map((e) => (
                      <li key={e.student_id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                        <span>
                          <span className="text-slate-200">{e.name}</span>
                          <span className="ml-2 text-xs text-slate-500">{e.email}</span>
                        </span>
                        <button
                          type="button"
                          className="text-xs text-red-400 hover:text-red-300"
                          onClick={async () => {
                            if (!confirm('Gỡ học viên khỏi lớp?')) return
                            try {
                              await removeClassEnrollment(enrollClass.id, e.student_id)
                              await loadEnrollments(enrollClass.id)
                            } catch (err) {
                              alert(err.message)
                            }
                          }}
                        >
                          Gỡ
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Panel>
          )}
        </>
      )}
    </div>
  )
}
