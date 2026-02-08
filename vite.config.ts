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
      telemetry: false
    }),
  ],
  base: '/thai-qr-extractor/',
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core - always needed
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // QR Generation library - heavy, lazy loaded
          if (id.includes('node_modules/qrcode')) {
            return 'qr-generator-lib';
          }
          // Camera QR scanner - very heavy, only loaded when camera is used
          if (id.includes('node_modules/html5-qrcode')) {
            return 'qr-camera-lib';
          }
          // File upload QR scanner - lightweight, loaded with FileUpload
          if (id.includes('node_modules/jsqr')) {
            return 'qr-file-lib';
          }
          // Sonner toast library
          if (id.includes('node_modules/sonner')) {
            return 'ui-vendor';
          }
        },
      },
    },
    // Minification options for smaller bundles
    esbuild: {
      drop: ['console', 'debugger'],
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
