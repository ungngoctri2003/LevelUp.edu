import { createServiceClient } from '../lib/supabase.js'
import { extractBearer } from './auth.js'

/**
 * Xác thực JWT, kiểm tra profiles.role = admin, gắn req.authUser và req.sbAdmin (service client).
 * CRUD quản trị cần SUPABASE_SERVICE_ROLE_KEY trên máy chủ (không đưa vào frontend).
 */
export async function requireAdmin(req, res, next) {
  const token = extractBearer(req)
  if (!token) {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.' })
  }
  const sb = createServiceClient()
  if (!sb) {
    return res.status(503).json({
      error:
        'Máy chủ ứng dụng chưa được cấu hình đầy đủ để lưu thao tác quản trị. Liên hệ quản trị hệ thống hoặc đảm bảo dịch vụ API đang chạy.',
    })
  }
  const {
    data: { user },
    error: authErr,
  } = await sb.auth.getUser(token)
  if (authErr || !user) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc hết hạn' })
  }
  const { data: prof, error: pErr } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (pErr) return res.status(500).json({ error: 'Không đọc được thông tin tài khoản. Thử lại sau.' })
  if (prof?.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ quản trị viên được thao tác' })
  }
  req.authUser = user
  req.sbAdmin = sb
  next()
}
