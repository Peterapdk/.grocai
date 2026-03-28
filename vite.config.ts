
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill process.env for at undgå crash i browseren, men tillad erstatning under build
    'process.env': process.env
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
