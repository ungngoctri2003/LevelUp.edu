import { useState, useEffect } from 'react'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import {
  inputAdmin,
  inputTeacher,
  btnPrimaryAdmin,
  btnPrimaryTeacher,
} from '../../components/dashboard/dashboardStyles'
import { toast } from 'sonner'
import { useAuthSession } from '../../context/AuthSessionContext'

const disabledInput =
  'mt-1.5 w-full cursor-not-allowed rounded-xl border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400'

const variants = {
  admin: {
    title: 'Hồ sơ quản trị',
    description: 'Thông tin hiển thị trên hệ thống và cách liên hệ hỗ trợ.',
    panelSubtitle: 'Cập nhật tên và số điện thoại — email cố định theo tài khoản.',
    input: inputAdmin,
    btn: btnPrimaryAdmin,
  },
  teacher: {
    title: 'Hồ sơ giáo viên',
    description: 'Thông tin hiển thị trên hệ thống và cách liên hệ hỗ trợ.',
    panelSubtitle: 'Cập nhật tên và số điện thoại — email cố định theo tài khoản.',
    input: inputTeacher,
    btn: btnPrimaryTeacher,
  },
}

/**
 * Trang hồ sơ cá nhân cho quản trị / giáo viên — cùng luồng với học viên (tên, SĐT; email chỉ đọc).
 * @param {{ variant: 'admin' | 'teacher' }} props
 */
export default function StaffProfilePage({ variant }) {
  const cfg = variants[variant] || variants.admin
  const { user, updateProfile } = useAuthSession()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')

  useEffect(() => {
    setName(user?.name || '')
    setPhone(user?.phone || '')
  }, [user?.name, user?.phone])

  const save = async (e) => {
    e.preventDefault()
    await updateProfile({ name: name.trim() || user?.name, phone: phone.trim() })
    toast.success('Đã lưu thông tin hồ sơ.')
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <PageHeader title={cfg.title} description={cfg.description} />

      <Panel title="Thông tin cá nhân" subtitle={cfg.panelSubtitle}>
        <form onSubmit={save} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Họ và tên</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={`${cfg.input} mt-1.5 w-full`} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input value={user?.email || ''} disabled className={disabledInput} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Số điện thoại</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="090..."
              className={`${cfg.input} mt-1.5 w-full`}
            />
          </div>
          <button type="submit" className={`${cfg.btn} w-full py-3`}>
            Lưu thay đổi
          </button>
        </form>
      </Panel>
    </div>
  )
}
