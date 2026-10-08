import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/thai-qr-extractor/',
  build: {
    outDir: 'build',
    sourcemap: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // React core - always needed
            { name: 'react-vendor', test: /node_modules[\\/]react/ },
            // QR Generation library - heavy, lazy loaded
            { name: 'qr-generator-lib', test: /node_modules[\\/]qrcode/ },
            // Camera QR scanner - very heavy, only loaded when camera is used
            { name: 'qr-camera-lib', test: /node_modules[\\/]html5-qrcode/ },
            // File upload QR scanner - lightweight, loaded with FileUpload
            { name: 'qr-file-lib', test: /node_modules[\\/]jsqr/ },
            // Sonner toast library
            { name: 'ui-vendor', test: /node_modules[\\/]sonner/ },
          ],
        },
      },
    },
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
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'test-report.junit.xml',
    },
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
        'src/**/__tests__/**',
        'src/**/*.d.ts',
        'src/setupTests.ts',
        'src/**/index.ts',
        'src/App.css',
        'node_modules/**',
        'build/**',
      ],
    },
  },
})
