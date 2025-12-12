import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/thai-qr-extractor/',
  build: {
    outDir: 'build',
    sourcemap: false,
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
    include: ['src/**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'json-summary', 'html', 'cobertura'],
      thresholds: {
        branches: 60,
        functions: 60,
        lines: 60,
        statements: 60,
      },
      exclude: [
        'src/index.tsx',
        'src/reportWebVitals.ts',
        'src/**/__tests__/**',
        'src/**/*.d.ts',
        'src/setupTests.ts',
        'node_modules/**',
        'build/**',
      ],
    },
  },
})
