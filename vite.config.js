import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiProxy = {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { ...apiProxy },
  },
  /** `vite preview` cũng cần proxy — nếu không, POST /api/* sẽ 404 (Cannot POST). */
  preview: {
    proxy: { ...apiProxy },
  },
})
