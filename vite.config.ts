import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { SEO_PAGES } from './src/seo/content';
import { renderPage, renderSitemap } from './src/seo/render';

let building = false;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'poople-static-seo',
    configResolved(config) { building = config.command === 'build'; },
    configureServer(server) {
      server.middlewares.use('/sitemap.xml', (_request, response) => {
        response.setHeader('Content-Type', 'application/xml');
        response.end(renderSitemap());
      });
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        const requestedPath = new URL(context.originalUrl ?? context.path, 'http://localhost').pathname;
        const path = requestedPath.replace(/index\.html$/, '').replace(/\/?$/, '/');
        const page = SEO_PAGES.find(page => page.path === path) ?? SEO_PAGES[0];
        return renderPage(html, page);
      },
    },
    async closeBundle() {
      if (!building) return;
      const directory = resolve('dist');
      const template = await readFile(resolve(directory, 'index.html'), 'utf8');
      for (const page of SEO_PAGES) {
        const target = resolve(directory, `.${page.path}`);
        await mkdir(target, { recursive: true });
        await writeFile(resolve(target, 'index.html'), renderPage(template, page));
      }
      await writeFile(resolve(directory, 'sitemap.xml'), renderSitemap());
    },
  }],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
