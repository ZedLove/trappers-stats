import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import adminPlugin from './src/admin/server/vite-plugin-admin.js'

// https://vite.dev/config/
export default defineConfig({
  base: '/trappers-stats/',
  plugins: [react(), adminPlugin()],
  test: {
    environment: 'node',
    passWithNoTests: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
