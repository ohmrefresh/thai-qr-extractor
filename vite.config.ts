import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { codecovVitePlugin } from "@codecov/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: "thai-qr-extractor",
      uploadToken: process.env.CODECOV_TOKEN,
    }),

  ],
  base: '/thai-qr-extractor/',
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate React and React DOM into their own chunk
          'react-vendor': ['react', 'react-dom'],
          // Group QR scanning libraries (loaded with QRScanner and FileUpload)
          'qr-scanner-libs': ['html5-qrcode', 'jsqr'],
          // QR generation library (loaded with QRGenerator)
          'qr-generator-lib': ['qrcode'],
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
