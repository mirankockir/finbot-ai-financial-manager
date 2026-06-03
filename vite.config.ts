import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true, // Allow all hosts in development (for the Cloud Run iframe proxy)
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
