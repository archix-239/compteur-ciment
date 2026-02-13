import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  root: 'frontend',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './frontend/src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
