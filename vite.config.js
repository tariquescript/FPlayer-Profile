import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,
    // In dev the app talks to the local gateway through this proxy, so the same
    // relative /api paths work in development and production.
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },

  build: {
    target: 'es2022',
    cssMinify: 'lightningcss',
    reportCompressedSize: false,
    // three.js is a single ~525 kB chunk by design: it is never on the critical
    // path (loaded on idle, skipped on weak devices), so the default 500 kB
    // warning would only be noise.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Three.js is only needed by the hero, and React by everything: keeping
        // them in separate chunks lets the browser cache them independently.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('three')) return 'three';
          if (id.includes('react-router')) return 'router';
          if (id.includes('react')) return 'react';
          return undefined;
        },
      },
    },
  },
});
