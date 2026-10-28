import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { brand } from './src/config/brand';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'brand-html',
      transformIndexHtml: (html) =>
        html
          .replace(/%BRAND_TITLE%/g, esc(brand.title))
          .replace(/%BRAND_TAGLINE%/g, esc(brand.tagline))
          .replace(/%BRAND_THEME%/g, esc(brand.themeColor)),
    },
  ],
  server: { host: '0.0.0.0', port: 5173 },
  preview: { host: '0.0.0.0', port: 5173 },
});
