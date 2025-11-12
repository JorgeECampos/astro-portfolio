import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';
import path from 'node:path';

export default defineConfig({
  adapter: vercel(),
  output: 'server',
  integrations: [react(), tailwind()],
  site: 'https://astro-portfolio.vercel.app',
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
  },
});
