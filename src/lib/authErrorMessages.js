/**
 * Thông báo lỗi xác thực bằng tiếng Việt, cụ thể — không hiển thị nguyên văn tiếng Anh từ Supabase.
 * @typedef {'login' | 'register' | 'resetEmail' | 'updatePassword'} AuthErrorScene
 */

const BY_CODE = {
  invalid_credentials:
    'Email hoặc mật khẩu không đúng. Kiểm tra lại chính tả và phím viết hoa, hoặc dùng Quên mật khẩu nếu bạn không nhớ mật khẩu.',
  email_not_confirmed:
    'Tài khoản chưa xác nhận email. Mở hộp thư (cả thư mục spam), bấm link xác nhận, sau đó đăng nhập lại.',
  user_already_exists:
    'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng Quên mật khẩu để đặt lại mật khẩu nếu cần.',
  email_exists:
    'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng Quên mật khẩu để đặt lại mật khẩu nếu cần.',
  weak_password:
    'Mật khẩu chưa đạt yêu cầu. Dùng ít nhất 6 ký tự; nên kết hợp chữ và số.',
  signup_disabled: 'Hệ thống tạm không mở đăng ký tài khoản mới. Vui lòng liên hệ trung tâm để được hỗ trợ.',
  over_request_rate_limit: 'Bạn thao tác quá nhanh. Đợi vài phút rồi thử lại.',
  over_email_send_rate_limit: 'Đã gửi quá nhiều email. Đợi vài phút rồi thử lại.',
  same_password: 'Mật khẩu mới không được trùng mật khẩu cũ. Hãy chọn mật khẩu khác.',
  session_expired:
    'Phiên đặt lại mật khẩu đã hết hạn. Vui lòng gửi lại email đặt lại mật khẩu từ màn hình đăng nhập và mở link mới.',
  session_not_found:
    'Liên kết đặt lại mật khẩu không còn hiệu lực. Gửi lại email từ màn hình đăng nhập.',
  user_banned: 'Tài khoản không thể đăng nhập. Vui lòng liên hệ hỗ trợ.',
  provider_email_needs_verification: 'Cần xác nhận email trước khi tiếp tục. Kiểm tra hộp thư của bạn.',
  email_address_invalid: 'Địa chỉ email không hợp lệ. Vui lòng kiểm tra và nhập lại.',
  captcha_failed: 'Xác minh bảo mật không thành công. Tải lại trang và thử lại.',
  validation_failed: 'Thông tin gửi lên chưa hợp lệ. Kiểm tra các ô bắt buộc và thử lại.',
}

function fallbackMessage(scene) {
  switch (scene) {
    case 'login':
      return 'Không đăng nhập được. Kiểm tra email và mật khẩu, hoặc dùng Quên mật khẩu.'
    case 'register':
      return 'Không đăng ký được. Kiểm tra họ tên, email, mật khẩu và thử lại.'
    case 'resetEmail':
      return 'Chưa gửi được email đặt lại mật khẩu. Kiểm tra địa chỉ email và thử lại sau ít phút.'
    case 'updatePassword':
      return 'Chưa đổi được mật khẩu. Thử lại hoặc gửi lại yêu cầu đặt lại mật khẩu từ màn hình đăng nhập.'
    default:
      return 'Có lỗi xảy ra khi xác thực. Vui lòng thử lại.'
  }
}

/**
 * @param {unknown} error
 * @param {AuthErrorScene} [scene]
 */
export function authErrorMessageForUser(error, scene = 'login') {
  if (!error || typeof error !== 'object') return fallbackMessage(scene)

  const err = /** @type {{ message?: string; code?: string }} */ (error)
  const code = typeof err.code === 'string' ? err.code : ''
  const raw = String(err.message || '')
  const lower = raw.toLowerCase()

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed')) {
    return 'Không kết nối được máy chủ. Kiểm tra Internet và thử lại.'
  }

  if (code && BY_CODE[code]) return BY_CODE[code]

  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return BY_CODE.invalid_credentials
  }
  if (lower.includes('email not confirmed')) {
    return BY_CODE.email_not_confirmed
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return BY_CODE.user_already_exists
  }
  if (lower.includes('password should be at least') || lower.includes('password is too short')) {
    return BY_CODE.weak_password
  }
  if (lower.includes('same password') || lower.includes('different from the old password')) {
    return BY_CODE.same_password
  }

  if (import.meta.env.DEV && raw) {
    console.warn('[auth] Unmapped error (consider adding to authErrorMessages.js):', code || '(no code)', raw)
  }

  return fallbackMessage(scene)
}
