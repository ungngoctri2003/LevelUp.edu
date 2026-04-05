import './env.js'
import app from './app.js'

const PORT = Number(process.env.PORT) || 3001

const server = app.listen(PORT, () => {
  console.log(`[levelup-api] http://localhost:${PORT}`)
  console.log(`  health GET  /api/health`)
  console.log(`  me     GET  /api/me/class-lesson-posts (Bearer — học viên)`)
  console.log(`  admin  POST /api/admin/users/student | /api/admin/users/teacher`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n[levelup-api] Port ${PORT} đã có tiến trình khác đang dùng (EADDRINUSE).\n` +
        `  • Đóng terminal đang chạy "npm run server" hoặc "dev:stack" trước đó.\n` +
        `  • Hoặc tìm và tắt tiến trình (PowerShell):\n` +
        `      netstat -ano | findstr :${PORT}\n` +
        `      taskkill /PID <PID_ở_cột_cuối> /F\n` +
        `  • Hoặc đổi port: set PORT=3002 (và cập nhật proxy Vite trỏ cùng port).\n`,
    )
    process.exit(1)
  }
  throw err
})
