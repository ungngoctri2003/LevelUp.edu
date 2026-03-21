import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../Logo'

const socialLinks = [
  {
    name: 'Facebook',
    href: '#',
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: '#',
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: 'Zalo',
    href: '#',
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 16.56c-.235.134-.658.234-.902.234-.317 0-.433-.067-.658-.267-.469-.4-1.002-1.335-1.47-1.802-.268-.267-.401-.267-.669-.067-.2.133-1.002.934-1.336 1.268-.2.2-.334.267-.534.067-.133-.2-.334-.6-.467-.868-.134-.267-.067-.4.133-.534.2-.133.4-.334.6-.534.2-.2.267-.334.4-.534.133-.2.067-.4-.067-.534-.134-.133-.401-.4-.6-.6-.2-.2-.4-.467-.534-.6-.133-.134-.2-.334-.067-.467.134-.134 1.003-1.202 1.336-1.602.2-.2.334-.334.467-.334.133 0 .267 0 .334.134.067.133.2.267.334.4.134.133.2.267.334.4.133.133.267.2.401.067.133-.134.267-.267.4-.4.134-.134.267-.2.401-.134.133.067.267.134.334.267.067.134.067.334.067.467-.067.534-.4 1.068-.534 1.602-.134.534-.134 1.068.133 1.468.2.267.601.601.802.868.2.267.334.401.534.534.2.133.2.334.134.534z" />
      </svg>
    ),
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 dark:border-t dark:border-slate-800 dark:bg-black">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={containerVariants}
        className="mx-auto max-w-7xl px-6 py-16 lg:py-20"
      >
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={itemVariants}>
            <Link to="/" className="inline-block transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg">
              <Logo variant="footer" className="max-w-[220px]" />
            </Link>
            <p className="mt-4 text-gray-400 leading-relaxed">
              Nền tảng học trực tuyến đa môn — video chất lượng, AI hỗ trợ và đội ngũ giáo viên giàu kinh nghiệm.
            </p>
          </motion.div>
          <motion.div variants={itemVariants}>
            <h4 className="font-semibold text-white">Liên kết</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li>
                <Link
                  to="/bai-giang"
                  className="rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                >
                  Bài giảng
                </Link>
              </li>
              <li>
                <Link
                  to="/bai-kiem-tra"
                  className="rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                >
                  Bài kiểm tra
                </Link>
              </li>
              <li>
                <Link
                  to="/tuyen-sinh"
                  className="rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                >
                  Tuyển sinh
                </Link>
              </li>
              <li>
                <Link
                  to="/tin-tuc"
                  className="rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                >
                  Tin tức
                </Link>
              </li>
            </ul>
          </motion.div>
          <motion.div variants={itemVariants}>
            <h4 className="font-semibold text-white">Liên hệ</h4>
            <ul className="mt-4 space-y-3 text-sm text-gray-400">
              <li>📧 contact@levelup.edu.vn</li>
              <li>📞 1900 1234 56</li>
              <li>📍 123 Đường ABC, Quận 1, TP.HCM</li>
            </ul>
          </motion.div>
          <motion.div variants={itemVariants}>
            <h4 className="font-semibold text-white">Kết nối với chúng tôi</h4>
            <div className="mt-4 flex gap-5">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-gray-400 transition-colors duration-300 hover:text-white"
                  aria-label={link.name}
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 border-t border-gray-800 pt-8 text-center text-sm text-gray-500"
        >
          <p>© {new Date().getFullYear()} LevelUp.edu. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </footer>
  )
}
