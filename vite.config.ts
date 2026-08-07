import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_', '17TRACK_', 'TRACK17_'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: process.platform === 'darwin' ? 'open' : true,
    proxy: {
      '/api/17track': {
        target: 'https://api.17track.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/17track/, ''),
      },
      '/api/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/nominatim/, ''),
        headers: {
          'User-Agent': 'TrackPkgVisualizer/1.0 (package-tracking-app)',
        },
      },
    },
  },
});
