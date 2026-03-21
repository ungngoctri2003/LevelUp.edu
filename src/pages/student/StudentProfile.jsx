import { useState, useEffect } from 'react'
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

  const save = (e) => {
    e.preventDefault()
    updateProfile({ name: name.trim() || user?.name, phone: phone.trim() })
    setMsg('Đã cập nhật (lưu phiên đăng nhập).')
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Hồ sơ học viên</h2>
        <p className="text-sm text-slate-400">Thông tin hiển thị và gợi ý liên hệ (demo).</p>
      </div>

      <form onSubmit={save} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <div>
          <label className="text-sm font-medium text-slate-300">Họ và tên</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-sky-500/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Email</label>
          <input value={user?.email || ''} disabled className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300">Số điện thoại</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="090..."
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-sky-500/50 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-2.5 text-sm font-semibold text-white"
        >
          Lưu thay đổi
        </button>
        {msg && <p className="text-center text-sm text-emerald-400">{msg}</p>}
      </form>
    </div>
  )
}
