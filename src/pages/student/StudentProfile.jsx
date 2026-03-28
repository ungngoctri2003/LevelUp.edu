import { useState, useEffect } from 'react'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { useAuthSession } from '../../context/AuthSessionContext'

export default function StudentProfile() {
  const { user, updateProfile } = useAuthSession()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')

  useEffect(() => {
    setName(user?.name || '')
    setPhone(user?.phone || '')
  }, [user?.name, user?.phone])
  const [msg, setMsg] = useState('')

  const save = async (e) => {
    e.preventDefault()
    await updateProfile({ name: name.trim() || user?.name, phone: phone.trim() })
    setMsg('Đã cập nhật hồ sơ trên Supabase.')
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <PageHeader title="Hồ sơ học viên" description="Thông tin hiển thị trên hệ thống và cách liên hệ hỗ trợ." />

      <Panel title="Thông tin cá nhân" subtitle="Cập nhật tên và số điện thoại — email cố định theo tài khoản.">
        <form onSubmit={save} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-300">Họ và tên</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-white shadow-inner shadow-black/20 focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300">Email</label>
            <input
              value={user?.email || ''}
              disabled
              className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300">Số điện thoại</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="090..."
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-white shadow-inner shadow-black/20 focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:opacity-95"
          >
            Lưu thay đổi
          </button>
          {msg && <p className="text-center text-sm font-medium text-emerald-400">{msg}</p>}
        </form>
      </Panel>
    </div>
  )
}
