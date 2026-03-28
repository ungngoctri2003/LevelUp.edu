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

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Lỗi máy chủ' })
})

app.listen(PORT, () => {
  console.log(`[levelup-api] http://localhost:${PORT}  (health: /api/health)`)
})
