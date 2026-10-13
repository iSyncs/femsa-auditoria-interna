import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // El navegador sólo habla con /api; Vite lo reenvía al backend (sin credenciales en el cliente)
    proxy: { '/api': 'http://localhost:4000' },
  },
})
