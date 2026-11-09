import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
              return 'vendor_react';
            }
            if (/[\\/]node_modules[\\/](exceljs|file-saver|jszip)[\\/]/.test(id)) {
              return 'vendor_excel';
            }
            if (/[\\/]node_modules[\\/](chart\.js|react-chartjs-2|@kurkle)[\\/]/.test(id)) {
              return 'vendor_chart';
            }
            if (/[\\/]node_modules[\\/](firebase|@firebase)[\\/]/.test(id)) {
              return 'vendor_firebase';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
