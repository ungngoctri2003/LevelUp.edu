import { useTheme } from '../../context/ThemeContext'

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
}

/**
 * Vòng loading dùng trong nút hoặc kết hợp PageLoading.
 */
export function LoadingSpinner({ size = 'md', className = '' }) {
  const { reduceMotion } = useTheme()
  const dim = sizeClasses[size] || sizeClasses.md
  const spin = reduceMotion ? '' : 'animate-spin'
  const pulse = reduceMotion ? 'animate-pulse opacity-80' : ''

  return (
    <span
      className={`inline-block shrink-0 rounded-full border-cyan-500/25 border-t-cyan-500 border-r-fuchsia-500/70 dark:border-cyan-400/20 dark:border-t-cyan-400 dark:border-r-fuchsia-400/60 ${dim} ${spin} ${pulse} ${className}`.trim()}
      aria-hidden
    />
  )
}

const defaultMessage = 'Đang tải…'

/**
 * Trạng thái tải thống nhất: full trang, hàng trong dashboard, hoặc khối căn giữa (grid/bảng).
 */
export default function PageLoading({
  variant = 'page',
  message = defaultMessage,
  className = '',
}) {
  if (variant === 'inline') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 ${className}`.trim()}
      >
        <LoadingSpinner size="md" />
        {message ? <span>{message}</span> : null}
      </div>
    )
  }

  if (variant === 'block') {
    return (
      <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-3 py-6 ${className}`.trim()}>
        <LoadingSpinner size="md" />
        {message ? <span className="text-sm text-slate-600 dark:text-slate-400">{message}</span> : null}
      </div>
    )
  }

  // page
  return (
    <div className={`relative py-24 ${className}`.trim()}>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-400/10 blur-3xl dark:bg-fuchsia-500/10"
        aria-hidden
      />
      <div
        role="status"
        aria-live="polite"
        className="relative flex flex-col items-center justify-center gap-4 text-center"
      >
        <LoadingSpinner size="lg" />
        {message ? <p className="text-base text-gray-600 dark:text-slate-400">{message}</p> : null}
      </div>
    </div>
  )
}
