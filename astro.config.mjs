import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';
import path from 'node:path';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  adapter: vercel(),
  output: 'server',
  site: 'https://jorgecamposdocs.vercel.app',
  integrations: [react(), tailwind(), sitemap()],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
  },
});
