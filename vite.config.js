import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { BRAND } from './src/brand.js';

/** Fills the %BRAND_*% placeholders in index.html from src/brand.js. */
function brandHtml() {
  return {
    name: 'brand-html',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html
          .replaceAll('%BRAND_NAME%', BRAND.name)
          .replaceAll('%BRAND_TAGLINE%', BRAND.tagline)
          .replaceAll('%BRAND_DESCRIPTION%', BRAND.description),
    },
  };
}

/**
 * Preloads the font files the first screen is set in. They are
 * self-hosted and hashed, so their URLs are only known once the bundle exists.
 * Arriving alongside the JavaScript, they are ready before React paints and
 * the oversized headline never reflows from a fallback face.
 */
function preloadFonts() {
  const CRITICAL = /^assets\/((archivo|bricolage)-latin-(?!ext-)|jersey-display-)[\w-]+\.woff2$/;
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html, ctx) =>
        Object.keys(ctx.bundle ?? {})
          .filter((file) => CRITICAL.test(file))
          .map((file) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${file}`, crossorigin: '' },
            injectTo: 'head',
          })),
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), brandHtml(), preloadFonts()],

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
    // Fonts must stay separate files: inlined as data URIs they would block the
    // stylesheet and could not be preloaded.
    assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined),
    // three.js is a single ~525 kB chunk by design: it is never on the critical
    // path (loaded on idle, skipped on weak devices), so the default 500 kB
    // warning would only be noise.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Three.js is only needed by the 3D models, and React by everything:
        // keeping them in separate chunks lets the browser cache them independently.
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
