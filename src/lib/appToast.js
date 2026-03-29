import { toast } from 'sonner'

export { toast }

/**
 * Lỗi thao tác / API: ghi log khi dev, hiển thị toast tiếng Việt (không lộ message thô từ server).
 */
export function toastActionError(err, message = 'Không thực hiện được. Vui lòng thử lại.') {
  if (import.meta.env.DEV && err) console.error(err)
  toast.error(message)
}
