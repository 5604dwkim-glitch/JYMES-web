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
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor_react';
            }
            if (id.includes('exceljs') || id.includes('xlsx') || id.includes('file-saver') || id.includes('jszip')) {
              return 'vendor_excel';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor_chart';
            }
            if (id.includes('firebase')) {
              return 'vendor_firebase';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
