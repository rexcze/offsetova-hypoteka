import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// GitHub Pages serves the app under /offsetova-hypoteka/.
export default defineConfig({
  base: '/offsetova-hypoteka/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    // Engine tests run in node; UI tests opt in with a `// @vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: { provider: 'v8', include: ['src/engine/**'] },
  },
})
