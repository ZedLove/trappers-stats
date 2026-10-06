import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  base: '/trappers-stats/',
  plugins: [react()],
  test: {
    environment: 'node',
    passWithNoTests: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
