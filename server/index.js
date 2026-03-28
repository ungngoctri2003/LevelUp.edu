import cors from 'cors'
import express from 'express'
import { supabaseEnv } from './env.js'
import meRoutes from './routes/me.js'
import publicRoutes from './routes/public.js'
import adminRoutes from './routes/admin.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) || true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '512kb' }))

app.get('/api/health', (_req, res) => {
  const { url, anonKey, serviceRoleKey } = supabaseEnv()
  res.json({
    ok: true,
    supabase: {
      urlConfigured: Boolean(url),
      anonKeyConfigured: Boolean(anonKey),
      serviceRoleConfigured: Boolean(serviceRoleKey),
      adminWriteReady: Boolean(url && serviceRoleKey),
    },
  })
})

app.use('/api/public', publicRoutes)
app.use('/api/me', meRoutes)
app.use('/api/admin', adminRoutes)

/** Tránh 404 HTML "Cannot POST ..." cho client JSON: trả JSON nếu lạc đường dưới /api. */
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Không tìm thấy địa chỉ API này.' })
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Lỗi máy chủ' })
})

const server = app.listen(PORT, () => {
  console.log(`[levelup-api] http://localhost:${PORT}`)
  console.log(`  health GET  /api/health`)
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
