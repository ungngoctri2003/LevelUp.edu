/**
 * Logo thương hiệu – file: /public/logo.png
 */
export default function Logo({ variant = 'navbar', className = '' }) {
  const sizeClasses = {
    navbar: 'h-9 w-auto max-h-10 sm:h-10 sm:max-h-11 lg:h-11',
    footer: 'h-10 w-auto max-h-12 sm:h-12',
    hero: 'h-24 w-auto max-h-28 sm:h-32 sm:max-h-36 md:h-40 md:max-h-44 lg:h-44 lg:max-h-48',
  }

  return (
    <img
      src="/logo.png"
      alt="LevelUp.edu – Nền tảng học trực tuyến"
      width={320}
      height={80}
      className={`object-contain object-left ${sizeClasses[variant] ?? sizeClasses.navbar} ${className}`}
      loading={variant === 'hero' ? 'eager' : 'lazy'}
      decoding="async"
    />
  )
}
