
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': JSON.stringify({
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
      API_KEY: process.env.API_KEY || '',
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
      GO_UPC_API_KEY: process.env.GO_UPC_API_KEY || '',
    })
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
