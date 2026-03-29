import cors from 'cors'
import express from 'express'
import { supabaseEnv } from './env.js'
import meRoutes from './routes/me.js'
import publicRoutes from './routes/public.js'
import adminRoutes from './routes/admin.js'

const app = express()

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

export default app
