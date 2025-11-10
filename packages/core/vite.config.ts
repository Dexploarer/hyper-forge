import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'three'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react': path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, '../../node_modules/react/jsx-runtime')
      // Remove three alias - let Bun/Vite resolve it naturally
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'three/addons/controls/OrbitControls.js',
      'three/examples/jsm/loaders/GLTFLoader.js'
    ],
    esbuildOptions: {
      resolveExtensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx']
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React vendor chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          // Three.js vendor chunk (large)
          if (id.includes('node_modules/three') || 
              id.includes('node_modules/@react-three') ||
              id.includes('node_modules/@pixiv')) {
            return 'three-vendor'
          }
          // UI libraries chunk
          if (id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/@xyflow')) {
            return 'ui-vendor'
          }
          // Other vendor code
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
        chunkSizeWarningLimit: 1000,
      },
    },
    // Remove console.logs in production (esbuild handles this)
    minify: 'esbuild',
    // Note: To remove console.logs, add this to esbuild config if needed
    // For now, esbuild minify is faster and sufficient
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3004',
        changeOrigin: true,
      },
      '/assets': {
        target: 'http://localhost:3004',
        changeOrigin: true,
      }
    }
  }
})
