import { useState, useEffect } from 'react'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { inputStudent, btnPrimaryStudent } from '../../components/dashboard/dashboardStyles'
import { toast } from 'sonner'
import { useAuthSession } from '../../context/AuthSessionContext'

export default function StudentProfile() {
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
      <PageHeader title="Hồ sơ học viên" description="Thông tin hiển thị trên hệ thống và cách liên hệ hỗ trợ." />

      <Panel title="Thông tin cá nhân" subtitle="Cập nhật tên và số điện thoại — email cố định theo tài khoản.">
        <form onSubmit={save} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Họ và tên</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputStudent} mt-1.5 w-full shadow-inner`} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              value={user?.email || ''}
              disabled
              className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Số điện thoại</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="090..."
              className={`${inputStudent} mt-1.5 w-full shadow-inner`}
            />
          </div>
          <button type="submit" className={`${btnPrimaryStudent} w-full py-3`}>
            Lưu thay đổi
          </button>
        </form>
      </Panel>
    </div>
  )
}
