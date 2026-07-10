import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const SITE_URL = (process.env.VITE_SITE_URL || 'https://flighthero.net').replace(/\/$/, '');

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-site-url',
      transformIndexHtml(html) {
        return html.replaceAll('__SITE_URL__', SITE_URL);
      },
    },
  ],
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    port: 5173,
  },
});
