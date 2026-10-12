import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// GitHub Pages serves the app under /offsetova-hypoteka/.
export default defineConfig({
  base: '/offsetova-hypoteka/',
  plugins: [react()],
  test: {
    // Engine tests run in node; UI tests opt in with a `// @vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: { provider: 'v8', include: ['src/engine/**'] },
  },
})
